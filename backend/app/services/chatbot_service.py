from datetime import datetime, date

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from starlette.concurrency import run_in_threadpool

from app.config import settings
from app.ai.rag.indexer import index_repository_vulnerabilities
from app.ai.rag.retriever import retrieve_context
from app.ai.prompts.chat_prompt import build_system_prompt
from app.services.llm_service import ask_llm


async def _get_today_usage(db, user_id: ObjectId) -> int:
    doc = await db.rag_usage.find_one({"user_id": user_id, "date": date.today().isoformat()})
    return doc["count"] if doc else 0


async def _try_reserve_usage(db, user_id: ObjectId) -> int | None:
    today = date.today().isoformat()

    await db.rag_usage.update_one(
        {"user_id": user_id, "date": today},
        {"$setOnInsert": {"user_id": user_id, "date": today, "count": 0}},
        upsert=True,
    )

    result = await db.rag_usage.find_one_and_update(
        {"user_id": user_id, "date": today, "count": {"$lt": settings.RAG_DAILY_LIMIT}},
        {"$inc": {"count": 1}},
        return_document=True,
    )
    return result["count"] if result else None


async def _release_usage(db, user_id: ObjectId) -> None:
    today = date.today().isoformat()
    await db.rag_usage.update_one(
        {"user_id": user_id, "date": today, "count": {"$gt": 0}},
        {"$inc": {"count": -1}},
    )


async def create_session(db, user, scan_id: str):
    try:
        scan_oid = ObjectId(scan_id)
    except InvalidId:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "scan_id inválido")

    scan = await db.scans.find_one({"_id": scan_oid})
    if not scan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Scan no encontrado")

    session = {
        "user_id": user["_id"],
        "repository_id": scan["repository_id"],
        "scan_id": str(scan["_id"]),
        "title": f"Chat sobre {scan_id}",
        "status": "active",
        "context_mode": "scan",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.chat_sessions.insert_one(session)
    session["_id"] = result.inserted_id

    await index_repository_vulnerabilities(db, session["repository_id"], session["scan_id"])

    return session


async def send_message(db, user, session_id: str, question: str):
    try:
        session_oid = ObjectId(session_id)
    except InvalidId:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "session_id inválido")

    session = await db.chat_sessions.find_one({"_id": session_oid})
    if not session or session["user_id"] != user["_id"]:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Sesión no encontrada")

    new_count = await _try_reserve_usage(db, user["_id"])
    if new_count is None:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Alcanzaste el límite diario de {settings.RAG_DAILY_LIMIT} consultas al asistente",
        )

    cursor = db.chat_messages.find(
        {"session_id": session["_id"]}
    ).sort("created_at", -1).limit(8)
    previous = await cursor.to_list(length=8)
    previous.reverse()
    history = [
        {"role": m["role"], "content": m["content"]}
        for m in previous
        if m["role"] in ("user", "assistant")
    ]

    await db.chat_messages.insert_one({
        "session_id": session["_id"], "role": "user", "content": question,
        "tokens_used": None, "rag_chunks_used": None, "created_at": datetime.utcnow(),
    })

    chunks = await retrieve_context(db, session["repository_id"], session["scan_id"], question)
    system_prompt = build_system_prompt(chunks)

    try:
        answer, tokens_used = await run_in_threadpool(ask_llm, system_prompt, question, history)
    except Exception:
        await _release_usage(db, user["_id"])
        error_message = (
            "Diay, algo se rompió de este lado tratando de responder. "
            "Intentá de nuevo en un toque."
        )
        await db.chat_messages.insert_one({
            "session_id": session["_id"], "role": "assistant", "content": error_message,
            "tokens_used": None, "rag_chunks_used": [c["id"] for c in chunks],
            "created_at": datetime.utcnow(),
        })
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            "No se pudo obtener respuesta del asistente, intentá de nuevo",
        )

    await db.chat_messages.insert_one({
        "session_id": session["_id"], "role": "assistant", "content": answer,
        "tokens_used": tokens_used, "rag_chunks_used": [c["id"] for c in chunks],
        "created_at": datetime.utcnow(),
    })

    return {
        "answer": answer,
        "rag_chunks_used": [c["id"] for c in chunks],
        "messages_left": max(settings.RAG_DAILY_LIMIT - new_count, 0),
        "tokens_used": tokens_used,
    }
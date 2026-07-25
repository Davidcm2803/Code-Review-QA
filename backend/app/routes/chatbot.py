from fastapi import APIRouter, Depends
from bson import ObjectId

from app.core.deps import get_current_user
from app.database.connection import get_db
from app.database.schemas.chat import CreateSessionRequest, SendMessageRequest
from app.services import chatbot_service

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])


@router.post("/sessions")
async def create_session(payload: CreateSessionRequest, user=Depends(get_current_user), db=Depends(get_db)):
    session = await chatbot_service.create_session(db, user, payload.scan_id)
    return {
        "_id": str(session["_id"]),
        "user_id": str(session["user_id"]),
        "repository_id": str(session["repository_id"]),
        "scan_id": str(session["scan_id"]),
        "title": session["title"],
        "status": session["status"],
        "context_mode": session["context_mode"],
    }


@router.get("/sessions")
async def list_sessions(scan_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    sessions = await db.chat_sessions.find(
        {"user_id": user["_id"], "scan_id": scan_id}
    ).sort("created_at", -1).to_list(length=None)
    for s in sessions:
        for k in ("_id", "user_id", "repository_id", "scan_id"):
            s[k] = str(s[k])
    return sessions


@router.get("/sessions/{session_id}/messages")
async def get_messages(session_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    session = await db.chat_sessions.find_one({"_id": ObjectId(session_id)})
    if not session or session["user_id"] != user["_id"]:
        return []
    messages = await db.chat_messages.find(
        {"session_id": ObjectId(session_id)}
    ).sort("created_at", 1).to_list(length=None)
    for m in messages:
        m["_id"] = str(m["_id"])
        m["session_id"] = str(m["session_id"])
    return messages


@router.post("/sessions/{session_id}/messages")
async def send_message(session_id: str, payload: SendMessageRequest, user=Depends(get_current_user), db=Depends(get_db)):
    return await chatbot_service.send_message(db, user, session_id, payload.question)
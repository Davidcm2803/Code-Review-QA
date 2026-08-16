from bson import ObjectId
from app.ai.rag.embeddings import embed_batch
from app.core.logger import logger


def _vulnerability_to_text(v: dict) -> str:
    parts = [
        f"Título: {v.get('title', '')}",
        f"Severidad: {v.get('severity', '')}",
        f"Archivo: {v.get('file_path', '')} (líneas {v.get('line_start')}-{v.get('line_end')})",
        f"Descripción: {v.get('description', '')}",
    ]
    if v.get("vulnerable_code"):
        parts.append(f"Código vulnerable: {v['vulnerable_code']}")
    if v.get("remediation_recommendation"):
        parts.append(f"Remediación sugerida: {v['remediation_recommendation']}")
    return "\n".join(parts)


async def index_repository_vulnerabilities(db, repository_id: ObjectId, scan_id: str) -> int:
    existing = await db.code_embeddings.count_documents(
        {"repository_id": repository_id, "scan_id": scan_id}
    )
    if existing > 0:
        return 0

    vulns = await db.vulnerabilities.find({"scan_id": scan_id}).to_list(length=None)
    if not vulns:
        return 0

    texts = [_vulnerability_to_text(v) for v in vulns]
    vectors = await embed_batch(texts)

    docs = [
        {
            "repository_id": repository_id,
            "scan_id": scan_id,
            "file_path": v.get("file_path", "desconocido"),
            "chunk_index": i,
            "chunk_text": texts[i],
            "embedding": vec,
            "model_used": "all-MiniLM-L6-v2",
            "vulnerability_id": v["_id"],
            "created_at": v.get("created_at"),
        }
        for i, (v, vec) in enumerate(zip(vulns, vectors))
    ]

    await db.code_embeddings.insert_many(docs)
    logger.info(f"Indexadas {len(docs)} vulnerabilidades para repo {repository_id} scan {scan_id}")
    return len(docs)
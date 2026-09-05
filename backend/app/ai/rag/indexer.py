from bson import ObjectId
from app.ai.rag.embeddings import embed_batch
from app.core.logger import logger


MAX_CHUNK_CHARS = 800

EMBED_BATCH_SIZE = 15


def _truncate(text: str, max_chars: int = MAX_CHUNK_CHARS) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "... [truncado]"


def _vulnerability_to_text(v: dict) -> str:
    parts = [
        f"Título: {v.get('title', '')}",
        f"Severidad: {v.get('severity', '')}",
        f"Archivo: {v.get('file_path', '')} (líneas {v.get('line_start')}-{v.get('line_end')})",
        f"Descripción: {_truncate(v.get('description', ''), 300)}",
    ]
    if v.get("vulnerable_code"):
        parts.append(f"Código vulnerable: {_truncate(v['vulnerable_code'], 300)}")
    if v.get("remediation_recommendation"):
        parts.append(f"Remediación sugerida: {_truncate(v['remediation_recommendation'], 300)}")
    return _truncate("\n".join(parts), MAX_CHUNK_CHARS)


def _chunk_list(items: list, size: int):
    for i in range(0, len(items), size):
        yield items[i:i + size]


async def index_repository_vulnerabilities(db, repository_id: ObjectId, scan_id: str) -> int:
    existing = await db.code_embeddings.count_documents(
        {"repository_id": repository_id, "scan_id": scan_id}
    )
    if existing > 0:
        return 0

    vulns = await db.vulnerabilities.find({"scan_id": scan_id}).to_list(length=None)
    if not vulns:
        return 0

    total_indexed = 0

    for batch in _chunk_list(vulns, EMBED_BATCH_SIZE):
        texts = [_vulnerability_to_text(v) for v in batch]
        vectors = await embed_batch(texts)

        docs = [
            {
                "repository_id": repository_id,
                "scan_id": scan_id,
                "file_path": v.get("file_path", "desconocido"),
                "chunk_index": total_indexed + i,
                "chunk_text": texts[i],
                "embedding": vec,
                "model_used": "all-MiniLM-L6-v2",
                "vulnerability_id": v["_id"],
                "created_at": v.get("created_at"),
            }
            for i, (v, vec) in enumerate(zip(batch, vectors))
        ]

        await db.code_embeddings.insert_many(docs)
        total_indexed += len(docs)

    logger.info(f"Indexadas {total_indexed} vulnerabilidades para repo {repository_id} scan {scan_id}")
    return total_indexed
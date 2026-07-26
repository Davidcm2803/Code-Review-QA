import numpy as np
from bson import ObjectId
from app.ai.rag.embeddings import embed_text


async def retrieve_context(
    db, repository_id: ObjectId, scan_id: str, query: str, top_k: int = 10
) -> list[dict]:
    chunks = await db.code_embeddings.find(
        {"repository_id": repository_id, "scan_id": scan_id}
    ).to_list(length=None)
    if not chunks:
        return []

    query_vec = np.array(await embed_text(query))
    matrix = np.array([c["embedding"] for c in chunks])
    scores = matrix @ query_vec

    top_indices = np.argsort(scores)[::-1][:top_k]
    return [
        {
            "id": str(chunks[i]["_id"]),
            "file_path": chunks[i]["file_path"],
            "chunk_text": chunks[i]["chunk_text"],
            "score": float(scores[i]),
        }
        for i in top_indices
    ]
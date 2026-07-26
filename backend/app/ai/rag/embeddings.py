from functools import lru_cache
from sentence_transformers import SentenceTransformer
from starlette.concurrency import run_in_threadpool
from app.config import settings
from app.core.logger import logger


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    logger.info(f"Cargando modelo de embeddings: {settings.EMBEDDING_MODEL}")
    return SentenceTransformer(settings.EMBEDDING_MODEL)


def _encode_text(text: str) -> list[float]:
    model = get_embedding_model()
    return model.encode(text, normalize_embeddings=True).tolist()


def _encode_batch(texts: list[str]) -> list[list[float]]:
    model = get_embedding_model()
    return model.encode(texts, normalize_embeddings=True).tolist()


async def embed_text(text: str) -> list[float]:
    return await run_in_threadpool(_encode_text, text)


async def embed_batch(texts: list[str]) -> list[list[float]]:
    return await run_in_threadpool(_encode_batch, texts)
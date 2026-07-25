from functools import lru_cache
from sentence_transformers import SentenceTransformer
from app.config import settings
from app.core.logger import logger


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    logger.info(f"Cargando modelo de embeddings: {settings.EMBEDDING_MODEL}")
    return SentenceTransformer(settings.EMBEDDING_MODEL)


def embed_text(text: str) -> list[float]:
    model = get_embedding_model()
    return model.encode(text, normalize_embeddings=True).tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    model = get_embedding_model()
    return model.encode(texts, normalize_embeddings=True).tolist()
from groq import Groq
from app.config import settings
from app.core.logger import logger

_client: Groq | None = None


def get_groq_client() -> Groq:
    global _client
    if _client is None:
        if not settings.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY no está configurada en el .env")
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def ask_llm(system_prompt: str, question: str) -> tuple[str, int]:
    client = get_groq_client()
    try:
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
            temperature=0.2,
            max_tokens=800,
        )
    except Exception as e:
        logger.error(f"Error llamando a Groq: {e}")
        raise

    answer = completion.choices[0].message.content
    tokens_used = completion.usage.total_tokens if completion.usage else 0
    return answer, tokens_used
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


def ask_llm(system_prompt: str, question: str, history: list[dict] | None = None) -> tuple[str, int]:
    client = get_groq_client()
    messages = [{"role": "system", "content": system_prompt}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": question})

    try:
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages,
            temperature=1.05, # que tan robot suena la ia o no
            max_tokens=1500,
        )
    except Exception as e:
        logger.error(f"Error llamando a Groq: {e}")
        raise

    choice = completion.choices[0]
    answer = choice.message.content
    tokens_used = completion.usage.total_tokens if completion.usage else 0

    if choice.finish_reason == "length":
        logger.warning(
            f"Groq's response cut off due to max_tokens (session context: "
            f"question={question[:80]!r}, tokens_used={tokens_used})"
        )
        answer = (
            answer
            + "\n\n_(The response was cut off due to the token limit — "
            "ask me to continue or ask a more specific question.)_"
        )

    return answer, tokens_used
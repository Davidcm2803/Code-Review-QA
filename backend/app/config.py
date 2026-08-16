from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    # MongoDB
    MONGO_URI: str = "mongodb://mongo:27017"
    MONGO_DB: str = "ai_secure_qa"

    # JWT
    SECRET_KEY: str = "changeme"

    # CORS
    CORS_ORIGIN: str = "http://localhost:5173"

    # Groq / RAG
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    RAG_DAILY_LIMIT: int = 10
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # Runner sandbox DAST ataque con Nuclei
    RUNNER_URL: str = "http://runner:9000"
    RUNNER_TIMEOUT: int = 280

    class Config:
        env_file = ".env"


settings = Settings()
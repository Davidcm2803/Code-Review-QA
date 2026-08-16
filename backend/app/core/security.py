from datetime import datetime, timedelta, timezone
from app.config import settings
from jose import jwt

SECRET_KEY = settings.SECRET_KEY
ALGORITHM  = "HS256"
EXPIRE_MIN = 60 * 24 * 7  

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=EXPIRE_MIN)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_token(token: str) -> str:
    """Devuelve el user_id o lanza JWTError."""
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload["sub"]
from datetime import datetime, timezone
from bson import ObjectId
from passlib.context import CryptContext
from fastapi import HTTPException, status

from app.core.security import create_access_token
from app.database.schemas.auth import RegisterRequest, LoginRequest, OAuthRequest, UserOut, AuthResponse

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash(password: str) -> str:
    return pwd_context.hash(password)


def _verify(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _serialize(user: dict) -> UserOut:
    return UserOut(
        id         = str(user["_id"]),
        email      = user["email"],
        name       = user.get("name", ""),
        role       = user.get("role", "user"),
        photo      = user.get("photo"),
        created_at = user.get("created_at", datetime.now(timezone.utc)),
    )


#Register

async def register_user(payload: RegisterRequest, db) -> AuthResponse:
    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta con ese email",
        )

    now  = datetime.now(timezone.utc)
    doc  = {
        "_id":           ObjectId(),
        "email":         payload.email,
        "password_hash": _hash(payload.password),
        "name":          payload.name,
        "role":          "user",
        "photo":         None,
        "provider":      "local",
        "created_at":    now,
        "updated_at":    now,
    }
    await db.users.insert_one(doc)

    token = create_access_token(str(doc["_id"]))
    return AuthResponse(token=token, user=_serialize(doc))


#Login

async def login_user(payload: LoginRequest, db) -> AuthResponse:
    user = await db.users.find_one({"email": payload.email})

    if not user or not user.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
    if not _verify(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    token = create_access_token(str(user["_id"]))
    return AuthResponse(token=token, user=_serialize(user))


# OAuth Firebase

async def oauth_user(payload: OAuthRequest, db) -> AuthResponse:
    now  = datetime.now(timezone.utc)
    user = await db.users.find_one({"email": payload.email})

    if user:
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "firebase_uid": payload.uid,
                "photo":        payload.photo,
                "name":         payload.name or user.get("name", ""),
                "provider":     payload.provider,
                "updated_at":   now,
            }},
        )
        user = await db.users.find_one({"_id": user["_id"]})
    else:
        doc = {
            "_id":          ObjectId(),
            "email":        payload.email,
            "password_hash": None,          
            "name":         payload.name or payload.email.split("@")[0],
            "role":         "user",
            "photo":        payload.photo,
            "provider":     payload.provider,
            "firebase_uid": payload.uid,
            "created_at":   now,
            "updated_at":   now,
        }
        await db.users.insert_one(doc)
        user = doc

    token = create_access_token(str(user["_id"]))
    return AuthResponse(token=token, user=_serialize(user))
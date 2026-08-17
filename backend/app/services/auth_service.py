import os
import uuid
from datetime import datetime, timezone
from bson import ObjectId
from passlib.context import CryptContext
from fastapi import HTTPException, status, UploadFile

from app.core.security import create_access_token
from app.database.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    OAuthRequest,
    UserOut,
    AuthResponse,
    UpdateProfileRequest,
    ChangePasswordRequest,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

AVATAR_DIR = "static/avatars"
os.makedirs(AVATAR_DIR, exist_ok=True)


def _hash(password: str) -> str:
    return pwd_context.hash(password)


def _verify(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _serialize(user: dict) -> UserOut:
    return UserOut(
        id           = str(user["_id"]),
        email        = user["email"],
        name         = user.get("name", ""),
        role         = user.get("role", "user"),
        photo        = user.get("photo"),
        provider     = user.get("provider", "local"),
        has_password = bool(user.get("password_hash")),
        created_at   = user.get("created_at", datetime.now(timezone.utc)),
    )


# Register

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


# Login

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
    now = datetime.now(timezone.utc)

    # Matchear primero por firebase_uid 
    user = await db.users.find_one({"firebase_uid": payload.uid})
    if not user:
        user = await db.users.find_one({"email": payload.email})

    if user:
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "firebase_uid": payload.uid,
                "photo":        payload.photo,
                "name":         payload.name or user.get("name", ""),
                "email":        payload.email,  # sincroniza con el email real de Firebase
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


async def update_profile(user: dict, payload: UpdateProfileRequest, db) -> UserOut:
    updates = {}
    if payload.name is not None:
        updates["name"] = payload.name
    if payload.email is not None and payload.email != user["email"]:
        # El email de cuentas OAuth lo controla Google/GitHub, no nuestra app
        if user.get("provider") != "local":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No podés cambiar el email de una cuenta conectada con Google/GitHub",
            )
        existing = await db.users.find_one({"email": payload.email})
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ese email ya está en uso")
        updates["email"] = payload.email

    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one({"_id": user["_id"]}, {"$set": updates})
        user = await db.users.find_one({"_id": user["_id"]})

    return _serialize(user)


async def change_password(user: dict, payload: ChangePasswordRequest, db) -> None:
    has_password = bool(user.get("password_hash"))

    if has_password:
        if not payload.current_password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debes ingresar tu contraseña actual")
        if not _verify(payload.current_password, user["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Contraseña actual incorrecta")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": _hash(payload.new_password), "updated_at": datetime.now(timezone.utc)}},
    )


async def upload_avatar(user: dict, file: UploadFile, db) -> str:
    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    if ext not in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Formato de imagen no soportado")

    contents = await file.read()
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La imagen no puede superar 2MB")

    filename = f"{user['_id']}_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(AVATAR_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    photo_url = f"/static/avatars/{filename}"
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"photo": photo_url, "updated_at": datetime.now(timezone.utc)}},
    )
    return photo_url



async def delete_account(user: dict, db) -> None:
    user_id = user["_id"]

    scan_ids = [
        doc["_id"]
        async for doc in db.scans.find({"user_id": user_id}, {"_id": 1})
    ]

    if scan_ids:
        await db.vulnerabilities.delete_many({"scan_id": {"$in": scan_ids}})
        await db.scan_events.delete_many({"scan_id": {"$in": scan_ids}})
        await db.code_embeddings.delete_many({"scan_id": {"$in": scan_ids}})

        session_ids = [
            doc["_id"]
            async for doc in db.chat_sessions.find({"scan_id": {"$in": scan_ids}}, {"_id": 1})
        ]
        if session_ids:
            await db.chat_messages.delete_many({"session_id": {"$in": session_ids}})
        await db.chat_sessions.delete_many({"scan_id": {"$in": scan_ids}})

        await db.scans.delete_many({"user_id": user_id})

    await db.repositories.delete_many({"user_id": user_id})
    await db.rag_usage.delete_many({"user_id": user_id})

    await db.users.delete_one({"_id": user_id})
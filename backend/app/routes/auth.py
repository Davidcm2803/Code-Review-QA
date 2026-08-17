from fastapi import APIRouter, Depends, UploadFile, File

from app.database.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    OAuthRequest,
    AuthResponse,
    UserOut,
    UpdateProfileRequest,
    ChangePasswordRequest,
)
from app.services.auth_service import (
    register_user,
    login_user,
    oauth_user,
    update_profile,
    change_password,
    upload_avatar,
    delete_account,
)
from app.core.deps import get_current_user
from app.database.connection import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


# Registro con email, login con password: hashea la contraseña con bcrypt y devuelve JWT + usuario
@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(payload: RegisterRequest, db=Depends(get_db)):
    return await register_user(payload, db)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db=Depends(get_db)):
    return await login_user(payload, db)


# Login y registro con Firebase
@router.post("/oauth", response_model=AuthResponse)
async def oauth(payload: OAuthRequest, db=Depends(get_db)):
    return await oauth_user(payload, db)


@router.get("/me", response_model=UserOut)
async def me(current_user=Depends(get_current_user)):
    return UserOut(
        id           = str(current_user["_id"]),
        email        = current_user["email"],
        name         = current_user.get("name", ""),
        role         = current_user.get("role", "user"),
        photo        = current_user.get("photo"),
        provider     = current_user.get("provider", "local"),
        has_password = bool(current_user.get("password_hash")),
        created_at   = current_user["created_at"],
    )


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: UpdateProfileRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    return await update_profile(current_user, payload, db)


@router.post("/change-password", status_code=204)
async def change_my_password(
    payload: ChangePasswordRequest,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    await change_password(current_user, payload, db)


@router.post("/me/avatar", response_model=UserOut)
async def upload_my_avatar(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    await upload_avatar(current_user, file, db)
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return UserOut(
        id           = str(updated["_id"]),
        email        = updated["email"],
        name         = updated.get("name", ""),
        role         = updated.get("role", "user"),
        photo        = updated.get("photo"),
        provider     = updated.get("provider", "local"),
        has_password = bool(updated.get("password_hash")),
        created_at   = updated["created_at"],
    )


@router.delete("/me", status_code=204)
async def delete_me(current_user=Depends(get_current_user), db=Depends(get_db)):
    await delete_account(current_user, db)
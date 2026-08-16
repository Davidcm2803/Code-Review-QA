from fastapi import APIRouter, Depends

from app.database.schemas.auth import RegisterRequest, LoginRequest, OAuthRequest, AuthResponse, UserOut
from app.services.auth_service import register_user, login_user, oauth_user
from app.core.deps import get_current_user
from app.database.connection import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

#Registro con email, login con password hashea la contraseña con bcrypt y devuelve JWT + usuario
@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(payload: RegisterRequest, db=Depends(get_db)):
    return await register_user(payload, db)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db=Depends(get_db)):
    return await login_user(payload, db)

#Login y registro con Firebase
@router.post("/oauth", response_model=AuthResponse)
async def oauth(payload: OAuthRequest, db=Depends(get_db)):
    return await oauth_user(payload, db)

#Devuelve el perfil del usuario autenticado necesita  Bearer token en el header
@router.get("/me", response_model=UserOut)
async def me(current_user=Depends(get_current_user)):
    return UserOut(
        id         = str(current_user["_id"]),
        email      = current_user["email"],
        name       = current_user.get("name", ""),
        role       = current_user.get("role", "user"),
        photo      = current_user.get("photo"),
        created_at = current_user["created_at"],
    )
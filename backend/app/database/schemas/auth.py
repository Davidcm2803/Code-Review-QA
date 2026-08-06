from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OAuthRequest(BaseModel):
    uid: str
    email: EmailStr
    name: Optional[str] = None
    photo: Optional[str] = None
    provider: Literal["google", "github"]


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    photo: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    token: str
    user: UserOut
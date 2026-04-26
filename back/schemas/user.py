# schemas.py
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

# ---------- MODELE DE BASE ----------
class UserBase(BaseModel):
    nom: str
    email: EmailStr  # vérifie que c'est bien un email

# ---------- MODELE POUR LA CREATION ----------
class UserCreate(UserBase):
    password: str  # mot de passe en clair (sera hashé dans CRUD)

# ---------- MODELE POUR LA REPONSE ----------
class UserOut(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True  # nécessaire pour convertir un objet SQLAlchemy en JSONa

# --------- MODELE POUR LA MISE A JOUR ----------
class UserUpdate(BaseModel):
    nom: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
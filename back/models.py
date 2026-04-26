from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime
from uuid import uuid4

# -----------------------
# USER  (inchangé, sauf ajout de la relation history)
# -----------------------
class User(Base):
    __tablename__ = "users"

    id            = Column(String, primary_key=True, default=lambda: uuid.uuid4())
    nom           = Column(String, nullable=False)
    email         = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at    = Column(DateTime, default=datetime.utcnow)

    # ← NOUVEAU : relation vers l'historique
    history = relationship("ImageHistory", back_populates="user", cascade="all, delete-orphan")


# -----------------------
# IMAGE HISTORY  ← NOUVEAU
# -----------------------
class ImageHistory(Base):
    __tablename__ = "image_history"

    id            = Column(String, primary_key=True, default=lambda: uuid.uuid4())
    user_id       = Column(String, ForeignKey("users.id"), nullable=False)

    # image originale uploadée
    original_url  = Column(String, nullable=False)
    original_path = Column(String, nullable=False)

    # image résultante après traitement (None si pas encore traitée)
    result_url    = Column(String, nullable=True)
    result_path   = Column(String, nullable=True)

    # miniature stockée dans Supabase Storage
    thumbnail_url = Column(String, nullable=True)

    # métadonnées
    file_name     = Column(String, nullable=False)
    width         = Column(Integer, nullable=True)
    height        = Column(Integer, nullable=True)
    file_size     = Column(Integer, nullable=True)   # octets

    # traitement appliqué : "noise" | "blur" | "edge" | "convolution" | "adjustment"
    feature       = Column(String, nullable=True)

    # paramètres sérialisés JSON (pour rejouer ou afficher)
    params_json   = Column(Text, nullable=True)

    created_at    = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="history")
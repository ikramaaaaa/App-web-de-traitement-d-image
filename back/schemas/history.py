# schemas/history.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# ── Création d'une entrée (appelé en interne par les routes traitement) ──
class HistoryCreate(BaseModel):
    original_url:  str
    original_path: str
    result_url:    Optional[str] = None
    result_path:   Optional[str] = None
    thumbnail_url: Optional[str] = None
    file_name:     str
    width:         Optional[int] = None
    height:        Optional[int] = None
    file_size:     Optional[int] = None
    feature:       Optional[str] = None
    params_json:   Optional[str] = None  # JSON sérialisé


# ── Mise à jour du résultat après traitement ──
class HistoryUpdate(BaseModel):
    result_url:    Optional[str] = None
    result_path:   Optional[str] = None
    thumbnail_url: Optional[str] = None
    feature:       Optional[str] = None
    params_json:   Optional[str] = None


# ── Réponse envoyée au frontend ──
class HistoryOut(BaseModel):
    id:            UUID
    user_id:       UUID
    original_url:  str
    result_url:    Optional[str]
    thumbnail_url: Optional[str]
    file_name:     str
    width:         Optional[int]
    height:        Optional[int]
    file_size:     Optional[int]
    feature:       Optional[str]
    params_json:   Optional[str]
    created_at:    datetime

    class Config:
        from_attributes = True


# ── Liste paginée ──
class HistoryListOut(BaseModel):
    images: List[HistoryOut]
    total:  int
    page:   int
    limit:  int
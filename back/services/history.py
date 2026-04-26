# services/history.py
import json
import io
from PIL import Image as PILImage
from sqlalchemy.orm import Session
from models import ImageHistory
from schemas.history import HistoryCreate, HistoryUpdate
from supabase_client import supabase   # le client Supabase déjà configuré


# ─────────────────────────────────────────
# HELPERS SUPABASE STORAGE
# ─────────────────────────────────────────

BUCKET = "imagelab"   # nom de bucket Supabase Storage


def _generate_thumbnail(image_bytes: bytes, max_size: int = 300) -> bytes:
    """Génère une miniature JPEG de l'image en mémoire."""
    img = PILImage.open(io.BytesIO(image_bytes))
    img.thumbnail((max_size, max_size))
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="JPEG", quality=75)
    return buf.getvalue()


def upload_thumbnail_to_supabase(image_bytes: bytes, file_name: str, user_id: str) -> tuple[str, str]:
    """
    Génère et upload une miniature dans Supabase Storage.
    Retourne (public_url, storage_path).
    """
    thumb_bytes = _generate_thumbnail(image_bytes)
    path = f"thumbnails/{user_id}/{file_name}_thumb.jpg"

    supabase.storage.from_(BUCKET).upload(
        path,
        thumb_bytes,
        {"content-type": "image/jpeg", "upsert": "true"}
    )

    public_url = supabase.storage.from_(BUCKET).get_public_url(path)
    return public_url, path


# def upload_result_to_supabase(result_bytes: bytes, file_name: str, user_id: str) -> tuple[str, str]:
#     """
#     Upload l'image résultante (après traitement) dans Supabase Storage.
#     Retourne (public_url, storage_path).
#     """
#     path = f"results/{user_id}/{file_name}"

#     supabase.storage.from_(BUCKET).upload(
#         path,
#         result_bytes,
#         {"content-type": "image/png", "upsert": "true"}
#     )

#     public_url = supabase.storage.from_(BUCKET).get_public_url(path)
#     return public_url, path
def upload_result_to_supabase(file_bytes, file_name, user_id):
    path = f"results/{user_id}/{file_name}"

    supabase.storage.from_(BUCKET).upload(
        path,
        file_bytes,
        {"content-type": "image/png", "upsert": "true"}
    )

    url = supabase.storage.from_(BUCKET).get_public_url(path)
    return url, path

# ─────────────────────────────────────────
# CRUD  IMAGE HISTORY
# ─────────────────────────────────────────

# def create_history_entry(db: Session, user_id: str, data: HistoryCreate) -> ImageHistory:
#     """Crée une entrée d'historique juste après l'upload de l'image originale."""
#     entry = ImageHistory(
#         user_id       = user_id,
#         original_url  = data.original_url,
#         original_path = data.original_path,
#         result_url    = data.result_url,
#         result_path   = data.result_path,
#         thumbnail_url = data.thumbnail_url,
#         file_name     = data.file_name,
#         width         = data.width,
#         height        = data.height,
#         file_size     = data.file_size,
#         feature       = data.feature,
#         params_json   = data.params_json,
#     )
#     db.add(entry)
#     db.commit()
#     db.refresh(entry)
#     return entry
def create_history_entry(db, user_id, data):
    from models import ImageHistory

    entry = ImageHistory(
        user_id=user_id,
        original_url=data.get("original_url"),
        original_path=data.get("original_path"),
        result_url=data.get("result_url"),
        result_path=data.get("result_path"),
        thumbnail_url=data.get("thumbnail_url"),
        file_name=data.get("file_name"),
        width=data.get("width"),
        height=data.get("height"),
        file_size=data.get("file_size"),
        feature=data.get("feature"),
        params_json=json.dumps(data.get("params_json")) if data.get("params_json") else None,
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def update_history_result(db: Session, history_id: str, user_id: str, data: HistoryUpdate) -> ImageHistory | None:
    """
    Met à jour une entrée existante avec l'image résultante et les paramètres du traitement.
    Appelé après chaque opération (noise, blur, etc.).
    """
    entry = db.query(ImageHistory).filter(
        ImageHistory.id      == history_id,
        ImageHistory.user_id == user_id
    ).first()

    if not entry:
        return None

    if data.result_url    is not None: entry.result_url    = data.result_url
    if data.result_path   is not None: entry.result_path   = data.result_path
    if data.thumbnail_url is not None: entry.thumbnail_url = data.thumbnail_url
    if data.feature       is not None: entry.feature       = data.feature
    if data.params_json   is not None: entry.params_json   = data.params_json

    db.commit()
    db.refresh(entry)
    return entry


def get_user_history(
    db: Session,
    user_id: str,
    page: int = 1,
    limit: int = 20
) -> dict:
    """Retourne l'historique paginé d'un utilisateur, du plus récent au plus ancien."""
    query = db.query(ImageHistory).filter(ImageHistory.user_id == user_id)
    total  = query.count()
    items  = query.order_by(ImageHistory.created_at.desc()) \
                  .offset((page - 1) * limit) \
                  .limit(limit) \
                  .all()

    return {"images": items, "total": total, "page": page, "limit": limit}


def get_history_entry(db: Session, history_id: str, user_id: str) -> ImageHistory | None:
    return db.query(ImageHistory).filter(
        ImageHistory.id      == history_id,
        ImageHistory.user_id == user_id
    ).first()


def delete_history_entry(db: Session, history_id: str, user_id: str) -> bool:
    """Supprime l'entrée DB et les fichiers Supabase Storage associés."""
    entry = get_history_entry(db, history_id, user_id)
    if not entry:
        return False

    # Supprimer les fichiers dans Supabase Storage
    paths_to_delete = []
    if entry.original_path: paths_to_delete.append(entry.original_path)
    if entry.result_path:   paths_to_delete.append(entry.result_path)
    if entry.thumbnail_url:
        # extraire le path depuis l'URL publique
        thumb_path = f"thumbnails/{user_id}/{entry.file_name}_thumb.jpg"
        paths_to_delete.append(thumb_path)

    if paths_to_delete:
        try:
            supabase.storage.from_(BUCKET).remove(paths_to_delete)
        except Exception as e:
            print(f"Erreur suppression Storage : {e}")  # non bloquant

    db.delete(entry)
    db.commit()
    return True
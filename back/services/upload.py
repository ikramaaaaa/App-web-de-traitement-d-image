# services/upload.py
import uuid
from fastapi import UploadFile
from supabase_client import supabase, STORAGE_BUCKET


def upload_image(file: UploadFile) -> dict:
    """
    Upload un fichier image vers Supabase Storage.
    Retourne { file_url, file_path }.
    Utilisé par routers/image.py et routers/history.py.
    """
    # Lire le contenu du fichier
    file_bytes = file.file.read()

    # Construire un chemin unique pour éviter les collisions
    ext       = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "png"
    unique_id = uuid.uuid4().hex
    file_path = f"uploads/{unique_id}.{ext}"

    # Détecter le content-type
    content_type = file.content_type or "image/png"

    # Upload vers Supabase Storage
    supabase.storage.from_(STORAGE_BUCKET).upload(
        file_path,
        file_bytes,
        {"content-type": content_type, "upsert": "true"},
    )

    # Récupérer l'URL publique
    file_url = supabase.storage.from_(STORAGE_BUCKET).get_public_url(file_path)

    return {
        "file_url":  file_url,
        "file_path": file_path,
    }
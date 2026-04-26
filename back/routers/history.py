# routers/history.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import json
import uuid
from dependencies import get_db, get_current_user
from schemas.history import HistoryCreate, HistoryUpdate, HistoryOut, HistoryListOut
from services import history as history_service
from services.upload import upload_image   # fonction pour uploader les images

router = APIRouter(prefix="/history", tags=["History"])


# ──────────────────────────────────────────────
# POST /history/upload
# Upload l'image originale et crée une entrée historique
# ──────────────────────────────────────────────
@router.post("/upload", response_model=HistoryOut)
async def upload_and_create_history(
    file:         UploadFile = File(...),
    width:        int        = Form(None),
    height:       int        = Form(None),
    db:           Session    = Depends(get_db),
    current_user             = Depends(get_current_user),
):
    # 1. Lire le contenu du fichier
    file_bytes = await file.read()
    file.file.seek(0)  

    # 2. Uploader l'image originale dans Supabase Storage
    result = upload_image(file)   # retourne { file_url, file_path }

    # 3. Générer + uploader la miniature
    try:
        thumb_url, _ = history_service.upload_thumbnail_to_supabase(
            file_bytes, file.filename, current_user.id
        )
    except Exception:
        thumb_url = result["file_url"]   # fallback : utiliser l'original

    # 4. Créer l'entrée en base
    data = HistoryCreate(
        original_url  = result["file_url"],
        original_path = result["file_path"],
        thumbnail_url = thumb_url,
        file_name     = file.filename,
        width         = width,
        height        = height,
        file_size     = len(file_bytes),
    )

    entry = history_service.create_history_entry(db, current_user.id, data)
    return entry




@router.post("/save")
async def save_processed_image(
    original_file: UploadFile = File(...),
    result_file: UploadFile = File(...),

    file_name: str = Form("image.png"),
    feature: str = Form(None),
    width: int = Form(None),
    height: int = Form(None),
    params: str = Form(None),

    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    try:
        # ─────────────────────────────
        # 1. READ FILES
        # ─────────────────────────────
        original_bytes = await original_file.read()
        result_bytes = await result_file.read()

        # ─────────────────────────────
        # 2. PARSE PARAMS
        # ─────────────────────────────
        params_json = None
        if params:
            try:
                params_json = json.loads(params)
            except:
                params_json = {"raw": params}

        # ─────────────────────────────
        # 3. UPLOAD ORIGINAL
        # ─────────────────────────────
        orig_name = f"orig_{uuid.uuid4()}_{file_name}"
        original_url, original_path = history_service.upload_result_to_supabase(
            original_bytes,
            orig_name,
            current_user.id
        )

        # ─────────────────────────────
        # 4. UPLOAD RESULT
        # ─────────────────────────────
        res_name = f"res_{uuid.uuid4()}_{file_name}"
        result_url, result_path = history_service.upload_result_to_supabase(
            result_bytes,
            res_name,
            current_user.id
        )

        # ─────────────────────────────
        # 5. THUMBNAIL (from result)
        # ─────────────────────────────
        try:
            thumb_url, _ = history_service.upload_thumbnail_to_supabase(
                result_bytes,
                file_name,
                current_user.id
            )
        except:
            thumb_url = result_url

        # ─────────────────────────────
        # 6. CREATE DB ENTRY
        # ─────────────────────────────
        entry = history_service.create_history_entry(
            db,
            current_user.id,
            {
                "original_url": original_url,
                "original_path": original_path,

                "result_url": result_url,
                "result_path": result_path,

                "thumbnail_url": thumb_url,

                "file_name": file_name,
                "width": width,
                "height": height,
                "file_size": len(result_bytes),

                "feature": feature,
                "params_json": params_json,
            }
        )

        return entry

    except Exception as e:
        print(" SAVE ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

# ──────────────────────────────────────────────
# PATCH /history/{id}/result
# Appelé après chaque traitement pour sauvegarder le résultat
# ──────────────────────────────────────────────
@router.patch("/{history_id}/result", response_model=HistoryOut)
async def save_result(
    history_id:  str,
    result_file: UploadFile  = File(...),
    feature:     str         = Form(None),   # "noise" | "blur" | "edge" | "convolution"
    params:      str         = Form(None),   # JSON string des paramètres
    db:          Session     = Depends(get_db),
    current_user              = Depends(get_current_user),
):
    # 1. Lire le fichier résultat
    result_bytes = await result_file.read()
    result_file.file.seek(0)

    # 2. Upload du résultat dans Supabase Storage
    result_name = f"result_{history_id}_{result_file.filename}"
    result_url, result_path = history_service.upload_result_to_supabase(
        result_bytes, result_name, current_user.id
    )

    # 3. Générer une miniature du résultat (écrase la précédente)
    try:
        thumb_url, _ = history_service.upload_thumbnail_to_supabase(
            result_bytes, f"result_{history_id}", current_user.id
        )
    except Exception:
        thumb_url = result_url

    # 4. Mettre à jour l'entrée
    update = HistoryUpdate(
        result_url    = result_url,
        result_path   = result_path,
        thumbnail_url = thumb_url,
        feature       = feature,
        params_json   = params,
    )

    entry = history_service.update_history_result(db, history_id, current_user.id, update)
    if not entry:
        raise HTTPException(status_code=404, detail="Entrée historique non trouvée")

    return entry


# ──────────────────────────────────────────────
# GET /history  — liste paginée de l'utilisateur
# ──────────────────────────────────────────────
@router.get("/", response_model=HistoryListOut)
def get_my_history(
    page:  int     = 1,
    limit: int     = 20,
    db:    Session = Depends(get_db),
    current_user   = Depends(get_current_user),
):
    return history_service.get_user_history(db, current_user.id, page, limit)


# ──────────────────────────────────────────────
# GET /history/{id}  — une entrée spécifique
# ──────────────────────────────────────────────
@router.get("/{history_id}", response_model=HistoryOut)
def get_history_entry(
    history_id: str,
    db:         Session = Depends(get_db),
    current_user         = Depends(get_current_user),
):
    entry = history_service.get_history_entry(db, history_id, current_user.id)
    if not entry:
        raise HTTPException(status_code=404, detail="Non trouvé")
    return entry


# ──────────────────────────────────────────────
# DELETE /history/{id}
# ──────────────────────────────────────────────
@router.delete("/{history_id}")
def delete_history_entry(
    history_id: str,
    db:         Session = Depends(get_db),
    current_user         = Depends(get_current_user),
):
    deleted = history_service.delete_history_entry(db, history_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Non trouvé")
    return {"message": "Supprimé"}
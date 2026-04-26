import io
import json
import math
 
import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
 
router = APIRouter(prefix="/blur", tags=["Flou"])
 
 
# Fonctions utilitaires pour décoder, encoder et traiter les images
 
def _decode_image(upload: UploadFile) -> np.ndarray:
    """Lire un fichier image et le convertir en tableau NumPy (format BGR)."""
    raw = upload.file.read()
    arr = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Fichier image invalide ou corrompu.")
    return img
 
 
def _encode_png(img: np.ndarray) -> bytes:
    """Convertir un tableau NumPy en fichier PNG."""
    success, buf = cv2.imencode(".png", img)
    if not success:
        raise HTTPException(status_code=500, detail="Échec de l'encodage PNG.")
    return buf.tobytes()
 
 
def _png_response(img: np.ndarray) -> StreamingResponse:
    """Retourner une image PNG en réponse HTTP."""
    return StreamingResponse(
        io.BytesIO(_encode_png(img)),
        media_type="image/png",
    )
 
 
def _validate_kernel_size(kernel_size: int, max_size: int = 31) -> None:
    """Vérifier que le kernel_size est valide pour OpenCV."""
    if kernel_size < 1:
        raise HTTPException(status_code=422, detail=f"kernel_size doit être ≥ 1 (reçu : {kernel_size}).")
    if kernel_size % 2 == 0:
        raise HTTPException(status_code=422, detail=f"kernel_size doit être impair (reçu : {kernel_size}).")
    if kernel_size > max_size:
        raise HTTPException(status_code=422, detail=f"kernel_size ne peut pas dépasser {max_size} (reçu : {kernel_size}).")
 
 
BORDER_MODES = {
    "reflect":   cv2.BORDER_REFLECT_101,
    "replicate": cv2.BORDER_REPLICATE,
    "constant":  cv2.BORDER_CONSTANT,
    "wrap":      cv2.BORDER_WRAP,
}
 
def _border_mode(mode: str) -> int:
    """Traduire le nom du mode de bordure en constante OpenCV."""
    if mode not in BORDER_MODES:
        raise HTTPException(
            status_code=422,
            detail=f"border_mode invalide : '{mode}'. Valeurs acceptées : {list(BORDER_MODES)}."
        )
    return BORDER_MODES[mode]
 
 
# Flou moyen: remplace chaque pixel par la moyenne de ses voisins
@router.post(
    "/average",
    summary="Flou moyen (Box Blur)",
    description="Applique un flou qui lisse l'image uniformément.",
)
async def apply_average_blur(
    file:        UploadFile = File(..., description="Image source (PNG, JPG, BMP, TIFF)"),
    kernel_size: int        = Form(3,         description="Taille du noyau, entier impair [3..31]"),
    normalize:   bool       = Form(True,      description="Diviser par k² pour obtenir une vraie moyenne"),
    border_mode: str        = Form("reflect", description="Mode de gestion des bords"),
) -> StreamingResponse:
 
    _validate_kernel_size(kernel_size)
    img = _decode_image(file)
 
    # cv2.blur = box filter normalisé (équivalent normalize=True)
    # cv2.boxFilter avec normalize=False donne la somme brute
    result = cv2.boxFilter(
        src=img,
        ddepth=-1,                     # même profondeur que la source
        ksize=(kernel_size, kernel_size),
        normalize=normalize,
        borderType=_border_mode(border_mode),
    )
 
    return _png_response(result)
 
 
# Flou gaussien: lisse en donnant plus de poids au centre
@router.post(
    "/gaussian",
    summary="Flou gaussien",
    description="Applique un flou plus naturel que le flou moyen.",
)
async def apply_gaussian_blur(
    file:        UploadFile = File(...),
    kernel_size: int        = Form(5,         description="Taille du noyau, entier impair [3..31]"),
    sigma_x:     float      = Form(1.0,       description="Écart-type horizontal σx (> 0)"),
    sigma_y:     float      = Form(0.0,       description="Écart-type vertical σy (0 = auto = σx)"),
    border_mode: str        = Form("reflect"),
) -> StreamingResponse:
 
    _validate_kernel_size(kernel_size)
 
    if sigma_x <= 0:
        raise HTTPException(status_code=422, detail="sigma_x doit être > 0.")
 
    img = _decode_image(file)
 
    result = cv2.GaussianBlur(
        src=img,
        ksize=(kernel_size, kernel_size),
        sigmaX=sigma_x,
        sigmaY=sigma_y,           # 0 → OpenCV utilise sigmaX automatiquement
        borderType=_border_mode(border_mode),
    )
 
    return _png_response(result)
 
 
# Flou de mouvement
def _build_motion_kernel(kernel_size: int, angle_deg: float) -> np.ndarray:
    """
    Crée un noyau pour simuler un mouvement dans une direction donnée.
    L'angle détermine la direction (0° = horizontal, 90° = vertical, etc.)
    """
    # Créer un noyau horizontal de base (une ligne de 1)
    kernel = np.zeros((kernel_size, kernel_size), dtype=np.float32)
    center = kernel_size // 2
    kernel[center, :] = 1.0
 
    # Pivoter le noyau selon l'angle
    rotation_matrix = cv2.getRotationMatrix2D(
        center=(float(center), float(center)),
        angle=angle_deg,
        scale=1.0,
    )
    kernel = cv2.warpAffine(
        src=kernel,
        M=rotation_matrix,
        dsize=(kernel_size, kernel_size),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=0,
    )
 
    # Normaliser: la somme des poids doit valoir 1
    total = kernel.sum()
    if total > 0:
        kernel /= total
 
    return kernel
 
 
# Flou de mouvement
@router.post(
    "/motion",
    summary="Flou de mouvement",
    description="Simule l'effet d'un mouvement (caméra ou objet qui bouge).",
)
async def apply_motion_blur(
    file:        UploadFile = File(...),
    kernel_size: int        = Form(15,        description="Longueur du mouvement en pixels"),
    angle:       float      = Form(0.0,       description="Direction en degrés (0=horizontal, 90=vertical)"),
    intensity:   float      = Form(1.0,       description="Force de l'effet de 0 à 1"),
    border_mode: str        = Form("reflect"),
) -> StreamingResponse:
 
    _validate_kernel_size(kernel_size, max_size=63)
 
    if not (0.0 <= angle <= 360.0):
        raise HTTPException(status_code=422, detail="angle doit être entre 0 et 360.")
    if not (0.0 <= intensity <= 1.0):
        raise HTTPException(status_code=422, detail="intensity doit être entre 0 et 1.")
 
    img = _decode_image(file)
 
    # Créer le noyau de mouvement
    motion_kernel = _build_motion_kernel(kernel_size, angle)
 
    # Appliquer la convolution
    blurred = cv2.filter2D(
        src=img,
        ddepth=-1,
        kernel=motion_kernel,
        borderType=_border_mode(border_mode),
    )
 
    # Mélanger avec l'originale selon l'intensité
    if intensity < 1.0:
        blurred = cv2.addWeighted(
            src1=img,     alpha=1.0 - intensity,
            src2=blurred, beta=intensity,
            gamma=0.0,
        )
 
    return _png_response(blurred)
 
 
# Flou avec noyau personnalisé: pour les noyaux custom
def _parse_custom_kernel(kernel_json: str) -> np.ndarray:
    """
    Convertir la chaîne JSON du noyau en tableau NumPy.
    Exemple: "[[1,2,1],[2,4,2],[1,2,1]]"
    """
    try:
        raw = json.loads(kernel_json)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Le noyau n'est pas un JSON valide : {exc}",
        )
 
    if not isinstance(raw, list) or len(raw) == 0:
        raise HTTPException(status_code=422, detail="Le noyau doit être un tableau 2D non vide.")
 
    N = len(raw)
 
    # Le noyau doit être carré et de taille impaire entre 3 et 9
    if N % 2 == 0 or N < 3 or N > 9:
        raise HTTPException(
            status_code=422,
            detail=f"Le noyau doit être carré avec une taille impaire entre 3 et 9 (reçu : {N}).",
        )
 
    # Valider chaque ligne
    for i, row in enumerate(raw):
        if not isinstance(row, list) or len(row) != N:
            raise HTTPException(
                status_code=422,
                detail=f"La ligne {i} doit avoir {N} colonnes.",
            )
        for j, val in enumerate(row):
            if not isinstance(val, (int, float)):
                raise HTTPException(
                    status_code=422,
                    detail=f"La valeur [{i}][{j}] doit être un nombre.",
                )
 
    return np.array(raw, dtype=np.float32)
 
 
@router.post(
    "/custom",
    summary="Flou avec noyau personnalisé",
    description="Appliquer un filtre personnalisé avec un noyau défini par l'utilisateur.",
)
async def apply_custom_blur(
    file:        UploadFile = File(...),
    kernel:      str        = Form(...,       description='Noyau 2D en JSON'),
    normalize:   bool       = Form(True,      description="Normaliser le noyau"),
    border_mode: str        = Form("reflect"),
    depth:       int        = Form(-1,        description="Profondeur de sortie (-1 = auto)"),
) -> StreamingResponse:
 
    kernel_arr = _parse_custom_kernel(kernel)
 
    # Si on normalise, vérifier que la somme ne soit pas 0
    if normalize:
        total = float(kernel_arr.sum())
        if total == 0.0:
            raise HTTPException(
                status_code=422,
                detail="La somme des valeurs du noyau est 0 : impossible de normaliser.",
            )
        kernel_arr /= total
 
    img = _decode_image(file)
 
    # Appliquer le filtre
    result = cv2.filter2D(
        src=img,
        ddepth=depth,
        kernel=kernel_arr,
        borderType=_border_mode(border_mode),
    )
 
    # S'assurer que les valeurs sont entre 0 et 255
    result = np.clip(result, 0, 255).astype(np.uint8)
 
    return _png_response(result)
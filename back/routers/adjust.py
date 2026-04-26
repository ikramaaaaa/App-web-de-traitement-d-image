from fastapi import APIRouter, UploadFile, File, Form
from services.adjust import brightness, contrast

router = APIRouter(prefix="/adjust", tags=["Adjust"])


@router.post("/brightness")
async def get_brightness(
    file:  UploadFile = File(...),
    alpha: float      = Form(...),
):
    # Lire le fichier image
    image_bytes = await file.read()
    # Appliquer l'ajustement de luminosité
    result = brightness(image_bytes, float(alpha))
    return {"image": result}

@router.post("/contrast")
async def get_contrast(
    file: UploadFile = File(...),
    C0:   float      = Form(...),
):
    # Lire le fichier image
    image_bytes = await file.read()
    # Appliquer l'ajustement de contraste
    result = contrast(image_bytes, float(C0))
    return {"image": result}
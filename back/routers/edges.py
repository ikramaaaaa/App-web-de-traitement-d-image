from fastapi import APIRouter, UploadFile, File, Form
from services.edges import (
    gradient_directionnel,
    roberts,
    prewitt,
    sobel,
    laplacien,
    seuillage_gradient,
    seuillage_laplacien,
    canny,
    lignes_contours,
)

router = APIRouter(prefix="/edges", tags=["Edges"])


@router.post("/gradient-directionnel")
async def get_gradient_directionnel(file: UploadFile = File(...)):
    image_bytes = await file.read()
    return gradient_directionnel(image_bytes)


@router.post("/roberts")
async def get_roberts(file: UploadFile = File(...)):
    image_bytes = await file.read()
    return roberts(image_bytes)


@router.post("/prewitt")
async def get_prewitt(file: UploadFile = File(...)):
    image_bytes = await file.read()
    return prewitt(image_bytes)


@router.post("/sobel")
async def get_sobel(file: UploadFile = File(...)):
    image_bytes = await file.read()
    return sobel(image_bytes)


@router.post("/laplacien")
async def get_laplacien(
    file: UploadFile = File(...),
    kernel: str = Form(default="4"),   # "4" → D (4-voisins)  |  "8" → D1 (8-voisins)
):
    image_bytes = await file.read()
    return laplacien(image_bytes, kernel=kernel)


@router.post("/seuillage-gradient")
async def get_seuillage_gradient(file: UploadFile = File(...)):
    image_bytes = await file.read()
    return seuillage_gradient(image_bytes)


@router.post("/seuillage-laplacien")
async def get_seuillage_laplacien(file: UploadFile = File(...)):
    image_bytes = await file.read()
    return seuillage_laplacien(image_bytes)


@router.post("/canny")
async def get_canny(
    file: UploadFile = File(...),
    threshold1: int = Form(default=100),
    threshold2: int = Form(default=200),
):
    image_bytes = await file.read()
    return canny(image_bytes, threshold1=threshold1, threshold2=threshold2)


@router.post("/lignes-contours")
async def get_lignes_contours(
    file: UploadFile = File(...),
    levels: int = Form(default=3),
):
    image_bytes = await file.read()
    return lignes_contours(image_bytes, levels=levels)
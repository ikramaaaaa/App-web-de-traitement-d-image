from fastapi import APIRouter, File, UploadFile, Form
from services.noise import apply_noise, apply_filter
 
router = APIRouter(prefix="/api/noise", tags=["noise"])
 
 
@router.post("/noise")
async def noise_endpoint(
    file:       UploadFile = File(...),
    noise_type: str        = Form(...),
    intensity:  int        = Form(20),
):
    img_bytes = await file.read()
    result    = apply_noise(img_bytes, noise_type, intensity)
    return result
 
 
@router.post("/filter")
async def filter_endpoint(
    original:    UploadFile = File(...),
    noisy:       UploadFile = File(...),
    filter_type: str        = Form(...),
    kernel_size: int        = Form(3),
):
    original_bytes = await original.read()
    noisy_bytes    = await noisy.read()
    result         = apply_filter(original_bytes, noisy_bytes, filter_type, kernel_size)
    return result
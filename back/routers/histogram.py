from fastapi import APIRouter, UploadFile, File, Form
from services.histogram import histogram, cumulative_histogram, equalize_histogram,rotate_image,imcrop_python
from fastapi.responses import Response

router = APIRouter(prefix="/histogram", tags=["Histogram"])

@router.post("/")
async def get_histogram(file: UploadFile = File(...)):

    image_bytes = await file.read()

    hist_data = histogram(image_bytes)

    return hist_data


@router.post("/cumulative")
async def getcumulative_histogram(file: UploadFile = File(...)):
    image_bytes = await file.read()

    cumulative = cumulative_histogram(image_bytes)

    return cumulative

@router.post("/equalize")
async def getequalize(file: UploadFile = File(...)):

    image_bytes = await file.read()

    result = equalize_histogram(image_bytes)

    return result


@router.post("/rotate")
async def rotate(file: UploadFile = File(...), angle: float = Form(...)):

    image_bytes = await file.read()

    result = rotate_image(image_bytes, angle)

    return Response(content=result, media_type="image/png")


@router.post("/crop")
async def crop(
    file: UploadFile = File(...),
    x: int = Form(...),
    y: int = Form(...),
    width: int = Form(...),
    height: int = Form(...)
):
    image_bytes = await file.read()

    result = imcrop_python(image_bytes, x, y, width, height)

    return Response(content=result, media_type="image/png")
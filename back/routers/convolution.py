from fastapi import APIRouter
from pydantic import BaseModel
from services.convolution import apply_convolution, apply_deconvolution

router = APIRouter(prefix="/api/convolution", tags=["Convolution"])


class ConvRequest(BaseModel):
    image: str        # base64
    kernel_size: int  # 3 | 5 | 7


@router.post("/apply")
async def convolve(body: ConvRequest):
    url = apply_convolution(body.image, body.kernel_size)
    return {"url": url}


@router.post("/deconvolve")
async def deconvolve(body: ConvRequest):
    url = apply_deconvolution(body.image, body.kernel_size)
    return {"url": url}
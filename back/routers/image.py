from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from sqlalchemy.orm import Session

from database import SessionLocal
from schemas.image import ImageOut
from services import image as image_service
from services.upload import upload_image


router = APIRouter(prefix="/images", tags=["Images"])


# ---------------- DB ----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------- UPLOAD IMAGE ----------------
@router.post("/add", response_model=ImageOut)
def upload_image_route(
    produit_id: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    try:
        print("produit_id reçu :", produit_id)

        #  upload vers Supabase
        result = upload_image(file)

        #  sauvegarde DB avec file_path
        image = image_service.create_image(
            db=db,
            file_url=result["file_url"],
            file_path=result["file_path"],   # IMPORTANT
            produit_id=produit_id
        )

        return image

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------- GET ALL ----------------
@router.get("/", response_model=list[ImageOut])
def get_images(db: Session = Depends(get_db)):
    return image_service.get_images(db)


# ---------------- GET ONE ----------------
@router.get("/{image_id}", response_model=ImageOut)
def get_image(image_id: str, db: Session = Depends(get_db)):

    img = image_service.get_image(db, image_id)

    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    return img


# get all new images (not linked to any produit)

@router.get("/status/new")
def read_new_images(db: Session = Depends(get_db)):
    images = image_service.get_new_images(db)
    return images

# ---------------- DELETE ----------------
@router.delete("/{image_id}")
def delete_image(image_id: str, db: Session = Depends(get_db)):

    deleted = image_service.delete_image(db, image_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Image not found")

    return {"message": "Image deleted successfully"}
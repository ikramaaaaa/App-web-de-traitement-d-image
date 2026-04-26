from sqlalchemy.orm import Session
from models import Image, User
from supabase_client import supabase


# ---------------- CREATE ----------------
def create_image(
    db: Session,
    file_url: str,
    file_path: str,
    user_id: str = None
):

    User = None

    # vérifier si produit existe
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()

    db_image = Image(
        file_url=file_url,
        file_path=file_path,  # IMPORTANT
        produit_id=user.id if user else None,
    )

    db.add(db_image)
    db.commit()
    db.refresh(db_image)

    return db_image


# ---------------- GET ALL ----------------
def get_images(db: Session):
    return db.query(Image).all()


# ---------------- GET ONE ----------------
def get_image(db: Session, image_id: str):
    return db.query(Image).filter(Image.id == image_id).first()

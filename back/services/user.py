from sqlalchemy.orm import Session
from models import User
from schemas.user import UserCreate, UserUpdate
from auth import hash_password, verify_password


def get_user(db: Session, user_id: str):
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_users(db: Session):
    return db.query(User).all()


def create_user(db: Session, user: UserCreate):
    db_user = User(
        nom=user.nom,
        email=user.email,
        password_hash=hash_password(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def update_user(db: Session, user_id: str, user: UserUpdate):

    db_user = db.query(User).filter(User.id == user_id).first()

    if not db_user:
        return None

    if user.nom:
        db_user.nom = user.nom

    if user.email:
        db_user.email = user.email

    if user.password:
        db_user.password_hash = hash_password(user.password)

    db.commit()
    db.refresh(db_user)

    return db_user


def delete_user(db: Session, user_id: str):
    db_user = db.query(User).filter(User.id == user_id).first()

    if db_user:
        db.delete(db_user)
        db.commit()
        return True

    return False
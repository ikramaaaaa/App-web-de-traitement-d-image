from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import SessionLocal
from schemas.user import UserCreate, UserOut, UserUpdate
from services import user as crud_user
from dependencies import get_db, get_current_user
from auth import create_access_token
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["users"])


class LoginRequest(BaseModel):
    email: str
    password: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Créer un utilisateur
# @router.post("/add", response_model=UserOut)
# async def create_user_endpoint(request: Request, db: Session = Depends(get_db)):
#     # DEBUG — affiche exactement ce que le frontend envoie
#     body = await request.json()
#     print("=== BODY REÇU ===", body)

#     try:
#         user = UserCreate(**body)
#     except Exception as e:
#         print("=== ERREUR VALIDATION ===", str(e))
#         raise HTTPException(status_code=400, detail=str(e))

#     db_user = crud_user.get_user_by_email(db, user.email)
#     if db_user:
#         raise HTTPException(status_code=400, detail="Email déjà utilisé")
#     return crud_user.create_user(db, user)

@router.post("/add", response_model=UserOut)
def create_user_endpoint(user: UserCreate, db: Session = Depends(get_db)):
    db_user = crud_user.get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    return crud_user.create_user(db, user)


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = crud_user.authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(401, "Email ou mot de passe incorrect")
    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "nom": current_user.nom,
        "email": current_user.email
    }


@router.get("/", response_model=list[UserOut])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_user.get_users(db, skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserOut)
def read_user(user_id: str, db: Session = Depends(get_db)):
    db_user = crud_user.get_user(db, user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return db_user


@router.put("/{user_id}", response_model=UserOut)
def update_user_endpoint(user_id: str, user: UserUpdate, db: Session = Depends(get_db)):
    db_user = crud_user.update_user(db, user_id, user)
    if db_user is None:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return db_user


@router.delete("/{user_id}")
def delete_user_endpoint(user_id: str, db: Session = Depends(get_db)):
    deleted = crud_user.delete_user(db, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"message": "Utilisateur supprimé"}
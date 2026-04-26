# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models import Base
from routers import user,history,histogram,convolution,edges
from dotenv import load_dotenv
from routers import adjust
from routers.noise import router as noise_router
from services.blur import router as blur_router
load_dotenv()

app = FastAPI()

# CORS DOIT être ajouté AVANT les routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Création des tables
Base.metadata.create_all(bind=engine)

# Routers
app.include_router(user.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(adjust.router,  prefix="/api")
app.include_router(histogram.router,prefix="/api")
app.include_router(noise_router)
app.include_router(convolution.router)
app.include_router(blur_router, prefix="/api/process")
app.include_router(edges.router,prefix="/api")
@app.get("/")
def root():
    return {"message": "API running"}
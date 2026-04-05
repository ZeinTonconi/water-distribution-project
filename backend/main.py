from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from sqlalchemy.orm import Session
from database import get_db
import models

Base.metadata.create_all(bind=engine)

from api.auth import router as auth_router
from api.farms.farms import router as farms_router
from api.simulation import router as simulation_router

app = FastAPI(title="Water Distribution API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(farms_router)
app.include_router(simulation_router)

@app.get("/")
def health():
    return {"status": "ok"}

@app.get("/crops")
def get_crops(db: Session = Depends(get_db)):
    from models.crop import Crop
    return db.query(Crop).all()

@app.get('/municipalities')
def get_municipalities(db: Session = Depends(get_db)):
    from models.municipality import Municipality
    return db.query(Municipality).all()

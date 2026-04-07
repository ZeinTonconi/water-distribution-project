from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from sqlalchemy.orm import Session
from database import get_db
from schemas import CropsResponse
import models

Base.metadata.create_all(bind=engine)

from api import auth_router,farms_router, simulation_router, crops_router

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
app.include_router(crops_router)

@app.get("/")
def health():
    return {"status": "ok"}

@app.get("/crops")
def get_crops(db: Session = Depends(get_db)):
    from models.crop import Crop
    crops = db.query(Crop).all()
    return [
        CropsResponse(
            id=crop.id,
            name=crop.name,
            is_perennial=crop.is_perennial,
            kc_initial=crop.kc_initial,
            kc_mid=crop.kc_mid,
            kc_late=crop.kc_late,
            drought_tolerance=crop.drought_tolerance,
            min_water=crop.min_water_mm_week,
        )
        for crop in crops
    ]

@app.get('/municipalities')
def get_municipalities(db: Session = Depends(get_db)):
    from models.municipality import Municipality
    return db.query(Municipality).all()

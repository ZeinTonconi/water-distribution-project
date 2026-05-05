from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from core.deps import get_current_user
from database import get_db
from models.user import User
from models.farm import Farm
from models.crop import Crop
from models.farm_crop import FarmCrop
from schemas.farm_crop import FarmCropCreate, FarmCropUpdate
from pydantic import BaseModel
from datetime import date
from models.parcel import Parcel

router = APIRouter(prefix="/farms", tags=["farms"]) 

class ParcelIn(BaseModel):
    parcel_count: int
    width_m: float
    length_m: float
    x: float = 0
    y: float = 0
    rotation: int = 0

class FarmCropCreate(BaseModel):
    crop_id: int
    planting_date: date | None = None
    current_stage: str | None = None
    parcels: list[ParcelIn]

class FarmCropUpdate(BaseModel):
    planting_date: date | None = None
    current_stage: str | None = None
    is_harvested: bool | None = None
    parcels: list[ParcelIn] | None = None


def _fc_response(fc: FarmCrop) -> dict:
    area_m2 = sum(p.parcel_count * p.width_m * p.length_m for p in fc.parcels)
    return {
        "id": fc.id,
        "crop_id": fc.crop_id,
        "crop_name": fc.crop.name,
        "planting_date": fc.planting_date,
        "current_stage": fc.current_stage,
        "is_harvested": fc.is_harvested,
        "is_perennial": fc.crop.is_perennial,
        "area_m2": area_m2,
        "parcels": [
            {
                "id": p.id,
                "parcel_count": p.parcel_count,
                "width_m": p.width_m,
                "length_m": p.length_m,
                "x": p.x,
                "y": p.y,
                "rotation": p.rotation,
            }
            for p in fc.parcels
        ]
    }

@router.post("/{farm_id}/crops", status_code=201)
def add_crop(
    farm_id: int,
    body: FarmCropCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(
        Farm.id == farm_id, Farm.user_id == current_user.id
    ).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Chacra no encontrada")

    fc = FarmCrop(
        farm_id=farm_id,
        crop_id=body.crop_id,
        planting_date=body.planting_date,
        current_stage=body.current_stage,
        is_harvested=False,
    )
    db.add(fc)
    db.flush()

    for p in body.parcels:
        db.add(Parcel(
            farm_crop_id=fc.id,
            parcel_count=p.parcel_count,
            width_m=p.width_m,
            length_m=p.length_m,
            x=p.x,
            y=p.y,
            rotation=p.rotation,
        ))

    db.commit()
    db.refresh(fc)
    return _fc_response(fc)

@router.patch("/{farm_id}/crops/{farm_crop_id}")
def update_crop(
    farm_id: int,
    farm_crop_id: int,
    body: FarmCropUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(
        Farm.id == farm_id, Farm.user_id == current_user.id
    ).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Chacra no encontrada")

    fc = db.query(FarmCrop).filter(
        FarmCrop.id == farm_crop_id, FarmCrop.farm_id == farm_id
    ).first()
    if not fc:
        raise HTTPException(status_code=404, detail="Cultivo no encontrado")

    if body.planting_date is not None:
        fc.planting_date = body.planting_date
    if body.current_stage is not None:
        fc.current_stage = body.current_stage
    if body.is_harvested is not None:
        fc.is_harvested = body.is_harvested

    # Replace parcels if provided
    if body.parcels is not None:
        for old in fc.parcels:
            db.delete(old)
        db.flush()
        for p in body.parcels:
            db.add(Parcel(
                farm_crop_id=fc.id,
                parcel_count=p.parcel_count,
                width_m=p.width_m,
                length_m=p.length_m,
                x=p.x,
                y=p.y,
                rotation=p.rotation,
            ))

    db.commit()
    db.refresh(fc)
    return _fc_response(fc)

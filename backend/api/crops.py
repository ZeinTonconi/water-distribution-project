from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from core.deps import get_current_user
from database import get_db
from models.user import User
from models.farm import Farm
from models.crop import Crop
from models.farm_crop import FarmCrop
from schemas.farm_crop import FarmCropCreate, FarmCropUpdate

router = APIRouter(prefix="/farms", tags=["farms"]) 

@router.post("/{farm_id}/crops", status_code=status.HTTP_201_CREATED)
def add_crop(
    farm_id: int,
    body: FarmCropCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.user_id == current_user.id
    ).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Chacra no encontrada")

    crop = db.query(Crop).filter(Crop.id == body.crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Cultivo no encontrado")

    if crop.is_perennial and not body.current_stage:
        raise HTTPException(
            status_code=400,
            detail="Los cultivos perennes necesitan una etapa actual"
        )
    if not crop.is_perennial and not body.planting_date:
        raise HTTPException(
            status_code=400,
            detail="Los cultivos anuales necesitan una fecha de siembra"
        )

    farm_crop = FarmCrop(
        farm_id=farm.id,
        crop_id=body.crop_id,
        area_m2=body.area_m2,
        planting_date=body.planting_date,
        current_stage=body.current_stage,
    )
    db.add(farm_crop)
    db.commit()
    db.refresh(farm_crop)
    return farm_crop


@router.patch("/{farm_id}/crops/{farm_crop_id}")
def update_crop(
    farm_id: int,
    farm_crop_id: int,
    body: FarmCropUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.user_id == current_user.id
    ).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Chacra no encontrada")

    farm_crop = db.query(FarmCrop).filter(
        FarmCrop.id == farm_crop_id,
        FarmCrop.farm_id == farm.id
    ).first()
    if not farm_crop:
        raise HTTPException(status_code=404, detail="Cultivo no encontrado")

    if body.area_m2 is not None:
        farm_crop.area_m2 = body.area_m2
    if body.planting_date is not None:
        farm_crop.planting_date = body.planting_date
    if body.current_stage is not None:
        farm_crop.current_stage = body.current_stage
    if body.is_harvested is not None:
        farm_crop.is_harvested = body.is_harvested

    db.commit()
    db.refresh(farm_crop)
    return farm_crop
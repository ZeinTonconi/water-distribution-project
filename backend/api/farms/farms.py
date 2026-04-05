from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.farm import Farm
from models.farm_crop import FarmCrop
from models.crop import Crop
from core.deps import get_current_user
from models.user import User
from api.farms.models.farmCreate import FarmCreate
from api.farms.models.farmUpdate import FarmUpdate

router = APIRouter(prefix="/farms", tags=["farms"]) 

@router.post("", status_code=status.HTTP_201_CREATED)
def create_farm(
    body: FarmCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = Farm(
        user_id=current_user.id,
        name=body.name,
        municipality_id=body.municipality_id,
        tank_capacity_l=body.tank_capacity_l,
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm

@router.get("/me")
def get_my_farm(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farms = db.query(Farm).filter(Farm.user_id == current_user.id).all()
    return [
        {
            "id": farm.id,
            "name": farm.name,
            "municipality": farm.municipality,
            "tank_capacity_l": farm.tank_capacity_l,
            "active_crops_count": db.query(FarmCrop).filter(
                FarmCrop.farm_id == farm.id,
                FarmCrop.is_harvested == False
            ).count()
        }
        for farm in farms
    ]

@router.get("/{farm_id}")
def get_farm(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = (
        db.query(Farm)
        .options(joinedload(Farm.farm_crops).joinedload(FarmCrop.crop))
        .filter(Farm.id == farm_id, Farm.user_id == current_user.id)
        .first()
    )
    if not farm:
        raise HTTPException(status_code=404, detail="Chacra no encontrada")

    return {
        "id": farm.id,
        "name": farm.name,
        "municipality": farm.municipality,
        "tank_capacity_l": farm.tank_capacity_l,
        "crops": [
            {
                "id": fc.id,
                "crop_id": fc.crop_id,
                "crop_name": fc.crop.name,
                "area_m2": fc.area_m2,
                "planting_date": fc.planting_date,
                "current_stage": fc.current_stage,
                "is_harvested": fc.is_harvested,
                "is_perennial": fc.crop.is_perennial,
            }
            for fc in farm.farm_crops
            if not fc.is_harvested
        ]
    }

@router.get("/{farm_id}/simulations")
def get_simulations(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from models.simulation import Simulation
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.user_id == current_user.id
    ).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Chacra no encontrada")

    sims = db.query(Simulation).filter(
        Simulation.farm_id == farm_id
    ).order_by(Simulation.created_at.desc()).all()

    return [
        {
            "id": s.id,
            "type": s.simulation_type,
            "priority": s.priority,
            "created_at": s.created_at
        }
        for s in sims
    ]

@router.patch("/{farm_id}")
def update_farm(
    farm_id: int,
    body: FarmUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.user_id == current_user.id
    ).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Chacra no encontrada")
    if body.tank_capacity_l is not None:
        farm.tank_capacity_l = body.tank_capacity_l
    if body.tank_current_pct is not None:
        farm.tank_current_pct = body.tank_current_pct
    if body.name is not None:
        farm.name = body.name
    db.commit()
    db.refresh(farm)
    return farm
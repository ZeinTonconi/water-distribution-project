from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.farm import Farm
from models.farm_crop import FarmCrop
from models.crop import Crop
from core.deps import get_current_user
from models.user import User
from schemas.farm import FarmUpdate, FarmCreate
from api.crops import _fc_response

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
        tank_capacity=body.tank_capacity,
        farm_width_m=body.farm_width_m,
        farm_height_m=body.farm_height_m,
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
            "tank_capacity": farm.tank_capacity,
            "farm_width_m": farm.farm_width_m,
            "farm_height_m": farm.farm_height_m,
            "active_crops": db.query(FarmCrop).filter(
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
        .options(
            joinedload(Farm.farm_crops).joinedload(FarmCrop.crop),
            joinedload(Farm.farm_crops).joinedload(FarmCrop.parcels),
            joinedload(Farm.municipality)
        )
        .filter(Farm.id == farm_id, Farm.user_id == current_user.id)
        .first()
    )
    if not farm:
        raise HTTPException(status_code=404, detail="Chacra no encontrada")

    return {
    "id": farm.id,
    "name": farm.name,
    "municipality": farm.municipality,
    "tank_capacity": farm.tank_capacity,
    "farm_width_m": farm.farm_width_m,
    "farm_height_m": farm.farm_height_m,
    "crops": [_fc_response(fc) for fc in farm.farm_crops if not fc.is_harvested]
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
    if body.tank_capacity is not None:
        farm.tank_capacity = body.tank_capacity
    if body.name is not None:
        farm.name = body.name
    db.commit()
    db.refresh(farm)
    return farm

@router.get("/{farm_id}/simulations/latest")
def get_latest_simulation(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from models.simulation import Simulation
    from models.simulation_week import SimulationWeek

    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.user_id == current_user.id
    ).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Chacra no encontrada")

    # Get the latest optimized simulation
    sim = (
        db.query(Simulation)
        .filter(
            Simulation.farm_id == farm_id,
            Simulation.simulation_type == 'optimized'
        )
        .order_by(Simulation.created_at.desc())
        .first()
    )

    if not sim:
        return None

    # Get its paired naive simulation
    naive_sim = (
        db.query(Simulation)
        .filter(
            Simulation.farm_id == farm_id,
            Simulation.simulation_type == 'naive',
            Simulation.created_at >= sim.created_at
        )
        .order_by(Simulation.created_at.asc())
        .first()
    )

    def build_sim_response(s):
        if not s:
            return None
        weeks_data = []
        # Group SimulationWeeks by week_number
        from sqlalchemy import distinct
        week_numbers = db.query(distinct(SimulationWeek.week_number))\
            .filter(SimulationWeek.simulation_id == s.id)\
            .order_by(SimulationWeek.week_number).all()

        for (wn,) in week_numbers:
            sw_rows = db.query(SimulationWeek)\
                .filter(
                    SimulationWeek.simulation_id == s.id,
                    SimulationWeek.week_number == wn
                ).all()

            sim_date = start_date_from_week(s.start_date, wn)
            weeks_data.append({
                "week": wn,
                "date": str(sim_date),
                "tank_level_l": round(sw_rows[0].tank_level_l) if sw_rows else 0,
                "crops": [
                    {
                        "farm_crop_id": row.farm_crop_id,
                        "crop_name": row.farm_crop.crop.name if row.farm_crop else "",
                        "allocated_l": round(row.allocated_l),
                        "demanded_l": round(row.demanded_l),
                        "satisfaction_pct": round(
                            row.allocated_l / row.demanded_l * 100
                            if row.demanded_l > 0 else 100
                        )
                    }
                    for row in sw_rows
                    if row.demanded_l > 0
                ]
            })

        return {
            "simulation_id": s.id,
            "type": s.simulation_type.value,
            "status": "optimal",
            "overall_satisfaction_pct": _calc_satisfaction(s.id, db),
            "start_date": str(s.start_date),
            "tank_current_pct": s.tank_current_pct,
            "tank_current_l": s.tank_current_l,
            "n_weeks": s.n_weeks,
            "created_at": str(s.created_at),
            "weeks": weeks_data
        }

    return {
        "optimized": build_sim_response(sim),
        "naive": build_sim_response(naive_sim),
        "meta": {
            "start_date": str(sim.start_date),
            "tank_current_pct": sim.tank_current_pct,
            "tank_current_l": sim.tank_current_l,
            "n_weeks": sim.n_weeks,
            "created_at": str(sim.created_at),
        }
    }

def _calc_satisfaction(sim_id: int, db) -> int:
    from models.simulation_week import SimulationWeek
    rows = db.query(SimulationWeek).filter(
        SimulationWeek.simulation_id == sim_id,
        SimulationWeek.demanded_l > 0
    ).all()
    if not rows:
        return 0
    total_allocated = sum(r.allocated_l for r in rows)
    total_demanded = sum(r.demanded_l for r in rows)
    return round(total_allocated / total_demanded * 100) if total_demanded > 0 else 100

def start_date_from_week(start_date, week_number):
    from datetime import timedelta
    return start_date + timedelta(weeks=week_number - 1)
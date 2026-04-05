from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import date, timedelta
from database import get_db
from models.farm import Farm
from models.farm_crop import FarmCrop
from models.simulation import Simulation
from models.simulation_week import SimulationWeek
from models.enums import Priority, SimulationType
from core.deps import get_current_user
from core.weather import fetch_daily_precipitation, compute_monthly_averages
from core.balance import compute_eto_hargreaves, compute_demand
from core.optimizer import run_optimized, run_naive
from models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/farms", tags=["simulation"])


class SimulateRequest(BaseModel):
    priority: Priority
    n_weeks: int = 16
    start_date: date = None
    tank_current_cpt: float = 1.0


@router.post("/{farm_id}/simulate")
def simulate(
    farm_id: int,
    body: SimulateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Load farm with crops and municipality
    farm = (
        db.query(Farm)
        .options(
            joinedload(Farm.farm_crops).joinedload(FarmCrop.crop),
            joinedload(Farm.municipality)
        )
        .filter(Farm.id == farm_id, Farm.user_id == current_user.id)
        .first()
    )
    if not farm:
        raise HTTPException(status_code=404, detail="Chacra no encontrada")

    active_crops = [fc for fc in farm.farm_crops if not fc.is_harvested]
    if not active_crops:
        raise HTTPException(status_code=400, detail="No tenés cultivos activos")

    # 2. Simulation start date
    start_date = body.start_date or date.today()
    n_weeks = body.n_weeks

    # 3. Fetch weather data
    try:
        daily = fetch_daily_precipitation(
            lat=farm.municipality.latitude,
            lon=farm.municipality.longitude
        )
        monthly_avg_mm = compute_monthly_averages(daily)
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="No se pudo obtener datos climáticos. Intentá de nuevo."
        )

    # 4. Build monthly ETo
    monthly_eto = {
        month: compute_eto_hargreaves(month)
        for month in range(1, 13)
    }

    # 5. Compute demand matrix

    weekly_rainfall_mm = []
    for week in range(n_weeks):
        sim_date = start_date + timedelta(weeks=week)
        month = sim_date.month
        avg_monthly_mm = monthly_avg_mm.get(month, 0.0)
        weekly_rainfall_mm.append(avg_monthly_mm / 4.33)

    # Weekly rainfall in liters for tank refill
    # Hardcoded catchment area for MVP — typical small roof in Luribay
    CATCHMENT_AREA_M2 = 40
    weekly_rainfall_l = [mm * CATCHMENT_AREA_M2 for mm in weekly_rainfall_mm]

    # Demand matrix — accounts for effective rainfall on crops
    demand = compute_demand(
        active_crops, start_date, n_weeks, monthly_eto, weekly_rainfall_mm
    )

    # 7. Tank level in liters
    tank_capacity_l = farm.tank_capacity_l
    tank_current_l = farm.tank_capacity_l * body.tank_current_cpt

    # 8. Crop parameters
    drought_tolerance = [fc.crop.drought_tolerance for fc in active_crops]
    min_water = [fc.crop.min_water_mm_week * fc.area_m2 for fc in active_crops]
    n_crops = len(active_crops)

    # 9. Run optimized simulation
    opt_result = run_optimized(
        demand=demand,
        tank_capacity_l=tank_capacity_l,
        tank_current_l=tank_current_l,
        weekly_rainfall_l=weekly_rainfall_l,
        min_water=min_water,
        drought_tolerance=drought_tolerance,
        priority=body.priority,
        n_crops=n_crops,
        n_weeks=n_weeks
    )

    # 10. Run naive simulation
    naive_result = run_naive(
        demand=demand,
        tank_capacity_l=tank_capacity_l,
        tank_current_l=tank_current_l,
        weekly_rainfall_l=weekly_rainfall_l,
        n_crops=n_crops,
        n_weeks=n_weeks
    )

    # 11. Save both simulations to DB
    def save_simulation(result, sim_type, priority=None):
        sim = Simulation(
            farm_id=farm.id,
            simulation_type=sim_type,
            priority=priority
        )
        db.add(sim)
        db.flush()  # get sim.id without committing

        if result["status"] in ("optimal", "feasible", "naive"):
            for i, fc in enumerate(active_crops):
                for t in range(n_weeks):
                    week = SimulationWeek(
                        simulation_id=sim.id,
                        farm_crop_id=fc.id,
                        week_number=t + 1,
                        allocated_l=result["allocation"][i][t],
                        demanded_l=demand[i][t],
                        tank_level_l=result["tank_levels"][t]
                    )
                    db.add(week)
        return sim

    opt_sim = save_simulation(opt_result, SimulationType.optimized, body.priority)
    naive_sim = save_simulation(naive_result, SimulationType.naive, None)
    db.commit()

    # 12. Build response
    def build_response(result, sim, sim_type):
        if result["status"] == "infeasible":
            return {
                "simulation_id": sim.id,
                "type": sim_type,
                "status": "infeasible",
                "overall_satisfaction_pct": 0,
                "weeks": []
            }
        weeks_data = []
        for t in range(n_weeks):
            week_entry = {
                "week": t + 1,
                "date": str(start_date + timedelta(weeks=t)),
                "tank_level_l": round(result["tank_levels"][t]),
                "crops": [
                    {
                        "farm_crop_id": active_crops[i].id,
                        "crop_name": active_crops[i].crop.name,
                        "allocated_l": round(result["allocation"][i][t]),
                        "demanded_l": round(demand[i][t]),
                        "satisfaction_pct": round(
                            result["allocation"][i][t] / demand[i][t] * 100
                            if demand[i][t] > 0 else 100
                        )
                    }
                    for i in range(n_crops)
                ]
            }
            weeks_data.append(week_entry)

        weeks_with_demand = [
            (result["allocation"][i][t], demand[i][t])
            for i in range(n_crops)
            for t in range(n_weeks)
            if demand[i][t] > 0
        ]

        if weeks_with_demand:
            total_allocated = sum(a for a, d in weeks_with_demand)
            total_demanded = sum(d for a, d in weeks_with_demand)
            print(weeks_with_demand)
            overall_pct = round(total_allocated / total_demanded * 100)
        else:
            overall_pct = 100

        return {
            "simulation_id": sim.id,
            "type": sim_type,
            "status": result["status"],
            "overall_satisfaction_pct": overall_pct,
            "weeks": weeks_data
        }

    return {
        "optimized": build_response(opt_result, opt_sim, "optimized"),
        "naive": build_response(naive_result, naive_sim, "naive")
    }
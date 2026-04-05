import math
from datetime import date
from models.crop import Crop

def compute_eto_hargreaves(month: int, latitude_deg: float = -16.0) -> float:
    T_mean = {
        1: 12.0, 2: 12.0, 3: 11.5, 4: 11.0, 5: 9.5,
        6: 8.5,  7: 8.0,  8: 9.0,  9: 10.5, 10: 12.0,
        11: 12.5, 12: 12.0
    }
    T_range = {
        1: 8.0,  2: 8.0,  3: 9.0,  4: 11.0, 5: 13.0,
        6: 14.0, 7: 15.0, 8: 15.0, 9: 13.0, 10: 12.0,
        11: 10.0, 12: 9.0
    }

    Ra_daily = {
        1: 38.0, 2: 36.5, 3: 34.0, 4: 29.5, 5: 25.5,
        6: 23.5, 7: 24.0, 8: 27.0, 9: 31.5, 10: 35.5,
        11: 38.0, 12: 38.5
    }

    T = T_mean[month]
    TR = T_range[month]
    Ra = Ra_daily[month]

    eto_daily = 0.0023 * (T + 17.8) * math.sqrt(TR) * Ra
    return eto_daily * 7 

def get_kc_for_week(crop: Crop, planting_date: date | None,
                    current_stage: str | None,
                    sim_date: date) -> float:
    if crop.is_perennial:
        stage = current_stage or "mid"
        if stage == "initial":
            return crop.kc_initial
        elif stage == "late":
            return crop.kc_late
        else:
            return crop.kc_mid

    if planting_date is None:
        return crop.kc_mid

    days_since_planting = (sim_date - planting_date).days
    if days_since_planting < 0:
        return 0.0

    weeks_since_planting = days_since_planting / 7

    stage_initial = crop.stage_initial_weeks or 0
    stage_dev     = crop.stage_dev_weeks or 0
    stage_mid     = crop.stage_mid_weeks or 0
    stage_late    = crop.stage_late_weeks or 0

    if weeks_since_planting < stage_initial:
        return crop.kc_initial
    elif weeks_since_planting < stage_initial + stage_dev:
        progress = (weeks_since_planting - stage_initial) / stage_dev
        return crop.kc_initial + progress * (crop.kc_mid - crop.kc_initial)
    elif weeks_since_planting < stage_initial + stage_dev + stage_mid:
        return crop.kc_mid
    elif weeks_since_planting < stage_initial + stage_dev + stage_mid + stage_late:
        progress = (weeks_since_planting - stage_initial - stage_dev - stage_mid) / stage_late
        return crop.kc_mid + progress * (crop.kc_late - crop.kc_mid)
    else:
        return 0.0 

def compute_demand(
    farm_crops: list,
    simulation_start: date,
    n_weeks: int,
    monthly_eto: dict,
    weekly_rainfall_mm: list[float]
) -> list[list[float]]:

    EFFECTIVE_RAINFALL_FRACTION = 0.75

    demand = []

    for fc in farm_crops:
        crop_demand = []
        for week in range(n_weeks):
            from datetime import timedelta
            sim_date = simulation_start + timedelta(weeks=week)
            month = sim_date.month

            eto_weekly = monthly_eto.get(month, 4.0)
            kc = get_kc_for_week(
                crop=fc.crop,
                planting_date=fc.planting_date,
                current_stage=fc.current_stage.value if fc.current_stage else None,
                sim_date=sim_date
            )

            etc_mm = eto_weekly * kc

            # Subtract effective rainfall — reduces irrigation need
            effective_rain_mm = weekly_rainfall_mm[week] * EFFECTIVE_RAINFALL_FRACTION
            net_irrigation_mm = max(0.0, etc_mm - effective_rain_mm)

            demand_liters = net_irrigation_mm * fc.area_m2
            crop_demand.append(demand_liters)

        demand.append(crop_demand)

    return demand
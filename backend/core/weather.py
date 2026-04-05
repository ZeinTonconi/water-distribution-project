import httpx
from collections import defaultdict
from datetime import date, datetime

OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive"

def fetch_daily_precipitation(lat: float, lon: float,
                               start_year: int = 2000,
                               end_year: int = 2020) -> dict:
    r = httpx.get(
        OPEN_METEO_URL,
        params={
            "latitude": lat,
            "longitude": lon,
            "start_date": f"{start_year}-01-01",
            "end_date": f"{end_year}-12-31",
            "daily": "precipitation_sum",
            "timezone": "America/La_Paz"
        },
        timeout=60
    )
    r.raise_for_status()
    data = r.json()
    dates = data["daily"]["time"]
    values = data["daily"]["precipitation_sum"]
    return {d: (v if v is not None else 0.0) for d, v in zip(dates, values)}

def compute_monthly_averages(daily: dict) -> dict:
    monthly_totals = defaultdict(list)

    for date_str, mm in daily.items():
        month = int(date_str[5:7])
        monthly_totals[month].append(mm)

    return {
        month: sum(values) / len(values) * 30
        for month, values in monthly_totals.items()
    }


def get_weekly_rainfall_series(lat: float, lon: float,
                                start_date: date,
                                n_weeks: int) -> list[float]:
    
    daily = fetch_daily_precipitation(lat, lon)
    monthly_avg = compute_monthly_averages(daily)

    weekly = []
    for week in range(n_weeks):
        days_offset = week * 7
        sim_date = date(
            start_date.year + (start_date.month + days_offset // 30 - 1) // 12,
            ((start_date.month + days_offset // 30 - 1) % 12) + 1,
            1
        )
        month = sim_date.month
        avg_monthly = monthly_avg.get(month, 0.0)
        weekly.append(avg_monthly / 4.33)  

    return weekly
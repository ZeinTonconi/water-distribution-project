from database import SessionLocal, engine, Base
from models.crop import Crop

Base.metadata.create_all(bind=engine)

CROPS = [
    {
        "name": "Tomate",
        "is_perennial": False,
        "stage_initial_weeks": 4,
        "stage_dev_weeks": 4,
        "stage_mid_weeks": 6,
        "stage_late_weeks": 4,
        "kc_initial": 0.60,
        "kc_mid": 1.15,
        "kc_late": 0.80,
        "min_water_mm_week": 25,
        "drought_tolerance": 1,
    },
    {
        "name": "Uva",
        "is_perennial": True,
        "stage_initial_weeks": 4,   
        "stage_dev_weeks": 6,       
        "stage_mid_weeks": 10,      
        "stage_late_weeks": 6,      
        "kc_initial": 0.30,
        "kc_mid": 0.85,
        "kc_late": 0.45,
        "min_water_mm_week": 12,
        "drought_tolerance": 4,
    },
    {
        "name": "Haba",
        "is_perennial": False,
        "stage_initial_weeks": 3,
        "stage_dev_weeks": 4,
        "stage_mid_weeks": 5,
        "stage_late_weeks": 4,
        "kc_initial": 0.50,
        "kc_mid": 1.10,
        "kc_late": 0.90,
        "min_water_mm_week": 18,
        "drought_tolerance": 3,
    },
    {
        "name": "Pepino",
        "is_perennial": False,
        "stage_initial_weeks": 3,
        "stage_dev_weeks": 3,
        "stage_mid_weeks": 4,
        "stage_late_weeks": 2,
        "kc_initial": 0.60,
        "kc_mid": 1.00,
        "kc_late": 0.75,
        "min_water_mm_week": 20,
        "drought_tolerance": 2,
    },
    {
        "name": "Pacay",
        "is_perennial": True,
        "stage_initial_weeks": 4,   
        "stage_dev_weeks": 6,       
        "stage_mid_weeks": 8,       
        "stage_late_weeks": 6,      
        "kc_initial": 0.50,
        "kc_mid": 0.90,
        "kc_late": 0.65,
        "min_water_mm_week": 10,
        "drought_tolerance": 4,
    },
]

def seed():
    db = SessionLocal()
    existing = db.query(Crop).count()
    if existing > 0:
        print(f"Catalog already has {existing} crops — skipping seed.")
        db.close()
        return

    for crop_data in CROPS:
        db.add(Crop(**crop_data))

    db.commit()
    print(f"Seeded {len(CROPS)} crops successfully.")
    db.close()

if __name__ == "__main__":
    seed()
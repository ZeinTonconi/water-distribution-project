import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, engine, Base
from models.municipality import Municipality
import models

Base.metadata.create_all(bind=engine)

MUNICIPALITIES = [
    {
        "name": "Luribay",
        "latitude": -16.983,
        "longitude": -67.633,
        "altitude_m": 2770,
    },
    {
        "name": "Coroico",
        "latitude": -16.183,
        "longitude": -67.717,
        "altitude_m": 1760,
    },
    {
        "name": "Chulumani",
        "latitude": -16.400,
        "longitude": -67.517,
        "altitude_m": 1740,
    },
    {
        "name": "Coripata",
        "latitude": -16.333,
        "longitude": -67.567,
        "altitude_m": 1490,
    },
    {
        "name": "Irupana",
        "latitude": -16.467,
        "longitude": -67.467,
        "altitude_m": 1800,
    },
    {
        "name": "Yanacachi",
        "latitude": -16.533,
        "longitude": -67.583,
        "altitude_m": 2050,
    },
]

def seed():
    db = SessionLocal()
    existing = db.query(Municipality).count()
    if existing > 0:
        print(f"Already have {existing} municipalities — skipping.")
        db.close()
        return

    for m in MUNICIPALITIES:
        db.add(Municipality(**m))

    db.commit()
    print(f"Seeded {len(MUNICIPALITIES)} municipalities.")
    db.close()

if __name__ == "__main__":
    seed()
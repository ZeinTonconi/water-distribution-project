from pydantic import BaseModel
from typing import Optional
from datetime import date
from models.enums import PerennialStage

class FarmCropCreate(BaseModel):
    crop_id: int
    area_m2: float
    planting_date: Optional[date] = None
    current_stage: Optional[PerennialStage] = None

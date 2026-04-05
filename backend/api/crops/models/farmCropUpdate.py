from pydantic import BaseModel
from typing import Optional
from datetime import date
from models.enums import PerennialStage

class FarmCropUpdate(BaseModel):
    area_m2: Optional[float] = None
    planting_date: Optional[date] = None
    current_stage: Optional[PerennialStage] = None
    is_harvested: Optional[bool] = None
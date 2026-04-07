from pydantic import BaseModel
from typing import Optional
from datetime import date
from models.enums import PerennialStage
from .camelModel import CamelModel

class FarmCropCreate(CamelModel):
    crop_id: int
    area_m2: float
    planting_date: Optional[date] = None
    current_stage: Optional[PerennialStage] = None


class FarmCropUpdate(CamelModel):
    area_m2: Optional[float] = None
    planting_date: Optional[date] = None
    current_stage: Optional[PerennialStage] = None
    is_harvested: Optional[bool] = None
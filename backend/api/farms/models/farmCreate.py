from pydantic import BaseModel

class FarmCreate(BaseModel):
    name: str
    municipality_id: int
    tank_capacity_l: float
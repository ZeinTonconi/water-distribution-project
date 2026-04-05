from pydantic import BaseModel

class FarmUpdate(BaseModel):
    tank_capacity_l: float = None
    name: str = None
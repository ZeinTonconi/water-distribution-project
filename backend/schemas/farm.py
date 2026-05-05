from .camelModel import CamelModel


class FarmCreate(CamelModel):
    name: str
    municipality_id: int
    tank_capacity: float
    farm_width_m: float
    farm_height_m: float


class FarmUpdate(CamelModel):
    tank_capacity: float = None
    name: str = None
    farm_width_m: float = None
    farm_height_m: float = None
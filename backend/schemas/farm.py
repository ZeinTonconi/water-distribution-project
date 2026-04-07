from .camelModel import CamelModel


class FarmCreate(CamelModel):
    name: str
    municipality_id: int
    tank_capacity: float

class FarmUpdate(CamelModel):
    tank_capacity: float = None
    name: str = None
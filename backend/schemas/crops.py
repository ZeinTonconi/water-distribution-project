from .camelModel import CamelModel


class CropsResponse(CamelModel):
    is_perennial: bool
    id: int
    name: str
    kc_initial: float
    kc_mid: float
    kc_late: float
    drought_tolerance: float
    min_water: float

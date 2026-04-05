import enum

class Priority(str, enum.Enum):
    sensitive = "sensitive"   # protect most water-sensitive crops first
    equal     = "equal"       # distribute equally regardless of crop type
    economic  = "economic"    # prioritize highest economic value crops

class SimulationType(str, enum.Enum):
    optimized = "optimized"   # OR-Tools LP result
    naive     = "naive"       # equal split baseline

class PerennialStage(str, enum.Enum):
    initial = "initial"
    mid     = "mid"
    late    = "late"
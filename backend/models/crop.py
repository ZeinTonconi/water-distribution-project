from sqlalchemy import Column, Integer, String, Float, Boolean
from database import Base

class Crop(Base):
    __tablename__ = "crops"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String, nullable=False)
    is_perennial = Column(Boolean, default=False)

    stage_initial_weeks = Column(Integer, nullable=True)
    stage_dev_weeks     = Column(Integer, nullable=True)
    stage_mid_weeks     = Column(Integer, nullable=True)
    stage_late_weeks    = Column(Integer, nullable=True)

    kc_initial        = Column(Float, nullable=False)
    kc_mid            = Column(Float, nullable=False)
    kc_late           = Column(Float, nullable=False)
    min_water_mm_week = Column(Float, nullable=False)
    drought_tolerance = Column(Integer, nullable=False)
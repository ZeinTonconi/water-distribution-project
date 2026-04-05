from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class SimulationWeek(Base):
    __tablename__ = "simulation_weeks"

    id            = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(Integer, ForeignKey("simulations.id"), nullable=False)
    farm_crop_id  = Column(Integer, ForeignKey("farm_crops.id"), nullable=False)
    week_number   = Column(Integer, nullable=False)
    allocated_l   = Column(Float, nullable=False)  # liters — more intuitive than m³
    demanded_l    = Column(Float, nullable=False)
    tank_level_l  = Column(Float, nullable=False)  # reservoir level after this week in liters

    simulation = relationship("Simulation", back_populates="weeks")
    farm_crop  = relationship("FarmCrop")
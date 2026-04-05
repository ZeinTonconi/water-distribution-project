from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from models.enums import Priority, SimulationType

class Simulation(Base):
    __tablename__ = "simulations"

    id              = Column(Integer, primary_key=True, index=True)
    farm_id         = Column(Integer, ForeignKey("farms.id"), nullable=False)
    created_at      = Column(DateTime, server_default=func.now())
    simulation_type = Column(Enum(SimulationType), nullable=False)
    priority        = Column(Enum(Priority), nullable=True)  # null for naive — it has no priority
    tank_current_pct = Column(Float, nullable=False, default=1.0)

    farm  = relationship("Farm", back_populates="simulations")
    weeks = relationship("SimulationWeek", back_populates="simulation")
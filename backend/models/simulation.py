from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum, Float, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from models.enums import Priority, SimulationType

class Simulation(Base):
    __tablename__ = "simulations"
    
    id               = Column(Integer, primary_key=True)
    farm_id          = Column(Integer, ForeignKey("farms.id"))
    simulation_type  = Column(Enum(SimulationType))
    priority         = Column(Enum(Priority), nullable=True)
    start_date       = Column(Date, nullable=False)        
    tank_current_pct = Column(Float, nullable=False)       
    tank_current_l   = Column(Float, nullable=False)       
    n_weeks          = Column(Integer, nullable=False)     
    created_at       = Column(DateTime, default=func.now())

    farm  = relationship("Farm", back_populates="simulations")
    weeks = relationship("SimulationWeek", back_populates="simulation")
from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base

class Scenario(Base):
    __tablename__ = "scenarios"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False)
    name             = Column(String, nullable=False, default="Mi escenario")
    tank_capacity_l  = Column(Float, nullable=False)
    tank_current_pct = Column(Float, nullable=False)
    flow_rate_lph    = Column(Float, nullable=False)
    priority         = Column(String, nullable=False)  # "sensitive" | "equal" | "economic"
    crops            = Column(JSON, nullable=False)

    user        = relationship("User", back_populates="scenarios")
    simulations = relationship("Simulation", back_populates="scenario")
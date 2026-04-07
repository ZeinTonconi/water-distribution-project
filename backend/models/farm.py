from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Farm(Base):
    __tablename__ = "farms"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False)
    name             = Column(String, nullable=False)
    municipality_id  = Column(Integer, ForeignKey("municipalities.id"), nullable=False)
    tank_capacity  = Column(Float, nullable=False)

    user         = relationship("User", back_populates="farms")
    municipality = relationship("Municipality")
    farm_crops   = relationship("FarmCrop", back_populates="farm")
    simulations  = relationship("Simulation", back_populates="farm")
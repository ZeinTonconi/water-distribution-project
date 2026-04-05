from sqlalchemy import Column, Integer, String, Float
from database import Base

class Municipality(Base):
    __tablename__ = "municipalities"

    id        = Column(Integer, primary_key=True, index=True)
    name      = Column(String, nullable=False, unique=True)
    latitude  = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude_m = Column(Integer, nullable=False)
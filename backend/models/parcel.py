from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Parcel(Base):
    __tablename__ = "parcels"

    id           = Column(Integer, primary_key=True, index=True)
    farm_crop_id = Column(Integer, ForeignKey("farm_crops.id"), nullable=False)
    parcel_count = Column(Integer, nullable=False, default=1)
    width_m      = Column(Float, nullable=False)
    length_m     = Column(Float, nullable=False)
    x            = Column(Float, nullable=False, default=0)
    y            = Column(Float, nullable=False, default=0)
    rotation     = Column(Integer, nullable=False, default=0)  # 0 or 90

    farm_crop = relationship("FarmCrop", back_populates="parcels")
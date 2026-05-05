from sqlalchemy import Column, Integer, Float, Boolean, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
from models.enums import PerennialStage

class FarmCrop(Base):
    __tablename__ = "farm_crops"

    id            = Column(Integer, primary_key=True, index=True)
    farm_id       = Column(Integer, ForeignKey("farms.id"), nullable=False)
    crop_id       = Column(Integer, ForeignKey("crops.id"), nullable=False)
    planting_date = Column(Date, nullable=True)
    current_stage = Column(Enum(PerennialStage), nullable=True)
    is_harvested  = Column(Boolean, default=False)

    farm    = relationship("Farm", back_populates="farm_crops")
    crop    = relationship("Crop")
    parcels = relationship("Parcel", back_populates="farm_crop",
                          cascade="all, delete-orphan")
    
    @property
    def area_m2(self) -> float:
        return sum(p.parcel_count * p.width_m * p.length_m for p in self.parcels)
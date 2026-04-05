from sqlalchemy import Column, Integer, Float, Boolean, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
from models.enums import PerennialStage

class FarmCrop(Base):
    __tablename__ = "farm_crops"

    id            = Column(Integer, primary_key=True, index=True)
    farm_id       = Column(Integer, ForeignKey("farms.id"), nullable=False)
    crop_id       = Column(Integer, ForeignKey("crops.id"), nullable=False)
    area_m2       = Column(Float, nullable=False)
    planting_date = Column(Date, nullable=True)
    current_stage = Column(Enum(PerennialStage), nullable=True)
    is_harvested  = Column(Boolean, default=False)

    farm = relationship("Farm", back_populates="farm_crops")
    crop = relationship("Crop")
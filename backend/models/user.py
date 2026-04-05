from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id       = Column(Integer, primary_key=True, index=True)
    name     = Column(String, nullable=False)
    password = Column(String, nullable=False)

    farms = relationship("Farm", back_populates="user", uselist=True)
    
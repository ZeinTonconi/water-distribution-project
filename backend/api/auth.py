from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.user import User
from core.security import hash_password, verify_password, create_access_token
from schemas.auth import RegisterRequest, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, response_model_by_alias=True)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.name == body.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un usuario con ese nombre"
        )
    user = User(
        name=body.name,
        password=hash_password(body.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user_id=user.id, name=user.name)

@router.post("/login", response_model=TokenResponse, response_model_by_alias=True)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.name == body.name).first()
    if not user or not verify_password(body.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre o contraseña incorrectos"
        )
    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user_id=user.id, name=user.name)
from .camelModel import CamelModel

class RegisterRequest(CamelModel):
    name: str
    password: str

class LoginRequest(CamelModel):
    name: str
    password: str

class TokenResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
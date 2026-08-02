from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserSession(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    roles: List[str] = []
    permissions: List[str] = []

class AuthCallbackRequest(BaseModel):
    access_token: str

class GoogleLoginResponse(BaseModel):
    message: str
    session: UserSession

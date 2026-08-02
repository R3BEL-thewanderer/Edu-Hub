from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ProfileBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileCreate(ProfileBase):
    id: str

class ProfileResponse(ProfileBase):
    id: str
    student_code: Optional[str] = None
    admission_batch: Optional[int] = None
    created_at: Optional[datetime] = None

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

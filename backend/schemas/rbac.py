from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RoleResponse(BaseModel):
    id: str
    name: str
    display_name: str
    description: Optional[str] = None
    is_system: bool = False

class PermissionResponse(BaseModel):
    id: str
    code: str
    display_name: str
    category: str
    description: Optional[str] = None

class UserRolesResponse(BaseModel):
    user_id: str
    roles: List[str]
    permissions: List[str]

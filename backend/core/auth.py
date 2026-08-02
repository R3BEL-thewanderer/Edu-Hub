from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.security import verify_token_and_domain
from core.config import settings

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifies token and enforces @tcetmumbai.in domain constraint."""
    return verify_token_and_domain(credentials)

def get_admin_user(user: dict = Depends(get_current_user)):
    """Legacy admin authorization helper (to be replaced by RBAC dependency in Phase 3)."""
    email = (user.get("email") or user.get("user_metadata", {}).get("email") or "").lower().strip()
    if email != settings.SUPER_ADMIN_EMAIL.lower() and user.get("sub") != settings.ADMIN_UID:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return user

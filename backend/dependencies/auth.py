from fastapi import Depends, HTTPException, status
from typing import Dict, Any, List
from core.security import verify_token_and_domain
from repositories.profile_repo import RBACRepository
from core.config import settings
from core.logging import logger

rbac_repo = RBACRepository()

def require_user(payload: Dict[str, Any] = Depends(verify_token_and_domain)) -> Dict[str, Any]:
    """
    Requires a valid authenticated user with @tcetmumbai.in email domain.
    Returns HTTP 401 if authentication fails.
    """
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required."
        )
    return payload

def _verify_roles(payload: Dict[str, Any], allowed_roles: List[str], role_label: str) -> Dict[str, Any]:
    user_id = payload["sub"]
    email = (payload.get("email") or payload.get("user_metadata", {}).get("email") or "").lower().strip()

    # Super Admin bypass for 1032250973@tcetmumbai.in
    if email == settings.SUPER_ADMIN_EMAIL.lower():
        logger.info(f"RBAC authorization granted via Super Admin bypass for {email}")
        return payload

    user_roles = rbac_repo.get_user_roles(user_id)
    
    # Check if user has any of the allowed roles
    matching_roles = set(user_roles).intersection(set(allowed_roles))
    if not matching_roles:
        logger.warning(
            f"RBAC authorization failed for user '{user_id}' ({email}): "
            f"Required {role_label} ({allowed_roles}), but user has roles {user_roles}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions."
        )
        
    logger.info(f"RBAC authorization granted for user '{user_id}' with roles {matching_roles}")
    return payload

def require_student(payload: Dict[str, Any] = Depends(require_user)) -> Dict[str, Any]:
    """Requires Student, Faculty, Content Manager, Admin, or Super Admin role."""
    allowed = ["student", "faculty", "content_manager", "admin", "super_admin"]
    return _verify_roles(payload, allowed, "Student or higher")

def require_content_manager(payload: Dict[str, Any] = Depends(require_user)) -> Dict[str, Any]:
    """Requires Content Manager, Admin, or Super Admin role."""
    allowed = ["content_manager", "admin", "super_admin"]
    return _verify_roles(payload, allowed, "Content Manager")

def require_faculty(payload: Dict[str, Any] = Depends(require_user)) -> Dict[str, Any]:
    """Requires Faculty, Admin, or Super Admin role."""
    allowed = ["faculty", "admin", "super_admin"]
    return _verify_roles(payload, allowed, "Faculty")

def require_admin(payload: Dict[str, Any] = Depends(require_user)) -> Dict[str, Any]:
    """Requires Admin or Super Admin role."""
    allowed = ["admin", "super_admin"]
    return _verify_roles(payload, allowed, "Admin")

def require_super_admin(payload: Dict[str, Any] = Depends(require_user)) -> Dict[str, Any]:
    """Requires Super Admin privileges via UUID boundary."""
    user_id = payload.get("sub")
    if not settings.SUPER_ADMIN_UUID:
        logger.error("SUPER_ADMIN_UUID is not set in environment variables.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error."
        )
        
    if user_id != settings.SUPER_ADMIN_UUID:
        logger.warning(
            f"Super Admin authorization failed for user '{user_id}'. UUID mismatch."
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Super Admin access required."
        )
        
    logger.info(f"Super Admin authorization granted via strict UUID match for {user_id}")
    return payload

from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from typing import Dict, Any
from core.config import settings
from core.logging import logger
from services.supabase_client import get_supabase

security = HTTPBearer()

def verify_token_and_domain(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Verifies Supabase JWT and enforces strict domain authorization.
    Rejects any email address not ending with @tcetmumbai.in.
    """
    token = credentials.credentials
    user_payload: Dict[str, Any] = {}

    # 1. Decode & verify signature using SUPABASE_JWT_SECRET
    try:
        if settings.SUPABASE_JWT_SECRET:
            user_payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
    except Exception as e:
        logger.debug(f"PyJWT decode fallback triggered: {e}")

    # 2. If PyJWT failed, verify via Supabase Auth API
    if not user_payload or "sub" not in user_payload:
        try:
            client = get_supabase()
            user_response = client.auth.get_user(token)
            if user_response and user_response.user:
                u = user_response.user
                user_payload = {
                    "sub": u.id,
                    "email": u.email,
                    "user_metadata": u.user_metadata or {},
                }
        except Exception as e:
            logger.error(f"Supabase Auth API token verification failed: {e}")

    if not user_payload or "sub" not in user_payload:
        logger.warning("Unverified authentication attempt blocked.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = (user_payload.get("email") or "").lower().strip()
    if not email:
        # Fallback to user_metadata if present
        email = (user_payload.get("user_metadata", {}).get("email") or "").lower().strip()

    # 3. Domain Enforcement Validation
    allowed_domain = f"@{settings.ALLOWED_EMAIL_DOMAIN.lower()}"
    if not email.endswith(allowed_domain):
        logger.warning(f"Unauthorized domain sign-in attempt rejected: email='{email}'")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only @{settings.ALLOWED_EMAIL_DOMAIN} accounts are allowed.",
        )

    return user_payload

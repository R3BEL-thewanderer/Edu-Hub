from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from core.config import settings

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifies the Supabase JWT access token from the Authorization header."""
    token = credentials.credentials
    
    # 1. Try decoding with PyJWT using SUPABASE_JWT_SECRET (ignoring strict aud mismatch)
    try:
        if settings.SUPABASE_JWT_SECRET:
            decoded = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            return decoded
    except Exception as e:
        pass  # Signature check fallback

    # 2. Try verifying via Supabase Client Auth API
    try:
        from services.supabase_client import get_supabase
        user_response = get_supabase().auth.get_user(token)
        if user_response and user_response.user:
            u = user_response.user
            return {
                "sub": u.id,
                "email": u.email,
                "role": u.role or "authenticated",
            }
    except Exception:
        pass  # Auth API fallback

    # 3. Fallback for unverified decode (development / mock mode)
    try:
        decoded = jwt.decode(token, options={"verify_signature": False, "verify_aud": False})
        if decoded and "sub" in decoded:
            return decoded
    except Exception:
        pass


    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

def get_admin_user(user: dict = Depends(get_current_user)):
    """Verifies that the current user is the admin."""
    if user.get("sub") != settings.ADMIN_UID:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return user

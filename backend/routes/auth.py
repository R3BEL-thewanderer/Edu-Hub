from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from core.security import verify_token_and_domain
from services.auth_service import AuthService
from schemas.auth import UserSession, AuthCallbackRequest, GoogleLoginResponse
from core.logging import logger

router = APIRouter()
auth_service = AuthService()

@router.get("/me", response_model=UserSession)
def get_current_user_me(user_payload: Dict[str, Any] = Depends(verify_token_and_domain)):
    """
    Returns the authenticated user's profile, roles, and permissions session.
    Verifies Supabase JWT and enforces @tcetmumbai.in domain authorization.
    """
    try:
        session = auth_service.process_authenticated_user(user_payload)
        return session
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing /auth/me for {user_payload.get('sub')}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user session."
        )

@router.post("/login/google", response_model=GoogleLoginResponse)
def login_google(req: AuthCallbackRequest):
    """
    Validates Google OAuth callback token from client, verifies @tcetmumbai.in domain,
    provisions user profile if missing, and assigns Super Admin role if applicable.
    """
    from fastapi.security import HTTPAuthorizationCredentials
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=req.access_token)
    user_payload = verify_token_and_domain(creds)
    
    session = auth_service.process_authenticated_user(user_payload)
    return GoogleLoginResponse(
        message="Authentication successful.",
        session=session
    )

@router.post("/logout")
def logout(user_payload: Dict[str, Any] = Depends(verify_token_and_domain)):
    """
    Invalidates session on server side.
    """
    logger.info(f"User logged out: {user_payload.get('sub')}")
    return {"message": "Logged out successfully."}

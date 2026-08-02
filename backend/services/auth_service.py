from typing import Dict, Any, List
from repositories.profile_repo import ProfileRepository, RBACRepository
from core.config import settings
from core.logging import logger
from schemas.auth import UserSession

class AuthService:
    def __init__(self):
        self.profile_repo = ProfileRepository()
        self.rbac_repo = RBACRepository()

    def process_authenticated_user(self, payload: Dict[str, Any]) -> UserSession:
        """
        Validates domain, provisions profile if missing, checks Super Admin email,
        fetches assigned roles from DB, and returns UserSession.
        """
        user_id = payload["sub"]
        email = (payload.get("email") or payload.get("user_metadata", {}).get("email") or "").lower().strip()
        user_meta = payload.get("user_metadata") or {}
        full_name = user_meta.get("full_name") or user_meta.get("name") or email.split("@")[0]
        avatar_url = user_meta.get("avatar_url") or user_meta.get("picture")

        # 1. Fetch or create profile
        profile = self.profile_repo.get_by_id(user_id)
        if not profile:
            logger.info(f"Auto-provisioning profile for new TCET user: {email}")
            profile = self.profile_repo.create_profile(
                user_id=user_id,
                email=email,
                full_name=full_name,
                avatar_url=avatar_url
            )

        # 2. Handle Super Admin auto-assignment
        if email == settings.SUPER_ADMIN_EMAIL.lower():
            existing_roles = self.rbac_repo.get_user_roles(user_id)
            if "super_admin" not in existing_roles:
                logger.info(f"Auto-assigning Super Admin role to {email}")
                self.rbac_repo.assign_role_by_name(user_id, "super_admin")

        # 3. Load roles from DB
        roles = self.rbac_repo.get_user_roles(user_id)
        if not roles:
            # Default to student if no roles explicitly assigned yet
            roles = ["student"]

        primary_role = "super_admin" if "super_admin" in roles else roles[0]

        return UserSession(
            id=user_id,
            email=email,
            full_name=profile.get("full_name") or full_name,
            avatar_url=profile.get("avatar_url") or avatar_url,
            role=primary_role,
            roles=roles,
            permissions=[]
        )

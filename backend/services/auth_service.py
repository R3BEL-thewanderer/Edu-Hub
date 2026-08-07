from typing import Dict, Any, List
from repositories.profile_repo import ProfileRepository, RBACRepository
from core.config import settings
from core.logging import logger
from schemas.auth import UserSession

from core.events import event_bus
from schemas.events import EventPayload, EventType

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
        display_name = user_meta.get("full_name") or user_meta.get("name") or email.split("@")[0]
        avatar_url = user_meta.get("avatar_url") or user_meta.get("picture")

        # 1. Fetch or create profile
        profile = self.profile_repo.get_by_id(user_id)
        is_new_user = False
        if not profile:
            is_new_user = True
            logger.info(f"Auto-provisioning profile for new TCET user: {email}")
            profile = self.profile_repo.create_profile(
                user_id=user_id,
                email=email,
                display_name=display_name,
                avatar_url=avatar_url
            )
            event_bus.publish(EventPayload(
                event_type=EventType.ACCOUNT_CREATED,
                user_id=user_id,
                entity_type="profile",
                entity_id=user_id,
                metadata={"title": "Account created"}
            ))

        # 2. Handle Super Admin auto-assignment
        if email == settings.SUPER_ADMIN_EMAIL.lower():
            existing_roles = self.rbac_repo.get_user_roles(user_id)
            if "super_admin" not in existing_roles:
                logger.info(f"Auto-assigning Super Admin role to {email}")
                self.rbac_repo.assign_role_by_name(user_id, "super_admin")
                event_bus.publish(EventPayload(
                    event_type=EventType.ROLE_CHANGED,
                    user_id=user_id,
                    metadata={"title": "Super Admin assigned"}
                ))

        # 3. Load roles from DB
        roles = self.rbac_repo.get_user_roles(user_id)
        if not roles:
            # Default to student if no roles explicitly assigned yet
            roles = ["student"]

        primary_role = "super_admin" if "super_admin" in roles else roles[0]

        # Publish Login Event
        login_type = EventType.FIRST_LOGIN if is_new_user else EventType.LOGIN
        event_bus.publish(EventPayload(
            event_type=login_type,
            user_id=user_id,
            metadata={"title": f"Logged in ({login_type})"}
        ))

        return UserSession(
            id=user_id,
            email=email,
            display_name=profile.get("display_name") or display_name,
            avatar_url=profile.get("avatar_url") or avatar_url,
            role=primary_role,
            roles=roles,
            permissions=[]
        )


from typing import Optional, Dict, Any, List
from services.supabase_client import get_supabase
from core.logging import logger

class ProfileRepository:
    def __init__(self):
        self.client = get_supabase()

    def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fetches profile by auth user ID."""
        try:
            res = self.client.table("profiles").select("*").eq("id", user_id).single().execute()
            return res.data
        except Exception as e:
            logger.debug(f"Profile lookup for {user_id}: {e}")
            return None

    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Fetches profile by email."""
        try:
            res = self.client.table("profiles").select("*").eq("email", email).single().execute()
            return res.data
        except Exception as e:
            logger.debug(f"Profile lookup for email {email}: {e}")
            return None

    def create_profile(self, user_id: str, email: str, display_name: Optional[str] = None, avatar_url: Optional[str] = None) -> Dict[str, Any]:
        """Creates a new profile extending auth.users."""
        profile_data = {
            "id": user_id,
            "email": email,
            "display_name": display_name or email.split("@")[0],
            "avatar_url": avatar_url,
        }
        res = self.client.table("profiles").insert(profile_data).execute()
        
        # Create default user preferences
        try:
            self.client.table("user_preferences").insert({"user_id": user_id}).execute()
        except Exception as e:
            logger.warning(f"Default preferences creation warning for {user_id}: {e}")
            
        return res.data[0] if res.data else profile_data

class RBACRepository:
    def __init__(self):
        self.client = get_supabase()

    def get_user_roles(self, user_id: str) -> List[str]:
        """Fetches all assigned role names for a user."""
        try:
            res = self.client.table("user_roles").select("roles(name)").eq("user_id", user_id).execute()
            if res.data:
                return [r["roles"]["name"] for r in res.data if "roles" in r and r["roles"]]
        except Exception as e:
            logger.error(f"Error fetching user roles for {user_id}: {e}")
        return []

    def get_user_permissions(self, user_id: str) -> List[str]:
        """Fetches all permission codes for a user based on assigned roles."""
        try:
            # Query user_roles -> role_permissions -> permissions
            res = self.client.table("user_roles") \
                .select("role_id, role_permissions(permissions(code))") \
                .eq("user_id", user_id) \
                .execute()
            
            permissions = set()
            if res.data:
                for ur in res.data:
                    for rp in ur.get("role_permissions", []):
                        perm = rp.get("permissions")
                        if perm and "code" in perm:
                            permissions.add(perm["code"])
            return list(permissions)
        except Exception as e:
            logger.error(f"Error fetching user permissions for {user_id}: {e}")
            return []

    def has_role(self, user_id: str, role_name: str) -> bool:
        """Checks if a user has a specific role."""
        roles = self.get_user_roles(user_id)
        return role_name in roles

    def has_any_role(self, user_id: str, role_names: List[str]) -> bool:
        """Checks if a user has any of the specified roles."""
        roles = set(self.get_user_roles(user_id))
        return bool(roles.intersection(role_names))

    def has_permission(self, user_id: str, permission_code: str) -> bool:
        """Checks if a user has a specific permission code."""
        permissions = self.get_user_permissions(user_id)
        return permission_code in permissions

    def assign_role_by_name(self, user_id: str, role_name: str) -> bool:
        """Assigns a role to a user by role name."""
        try:
            role_res = self.client.table("roles").select("id").eq("name", role_name).single().execute()
            if not role_res.data:
                logger.error(f"Role {role_name} not found in roles table.")
                return False
            role_id = role_res.data["id"]

            self.client.table("user_roles").upsert(
                {"user_id": user_id, "role_id": role_id},
                on_conflict="user_id,role_id"
            ).execute()
            return True
        except Exception as e:
            logger.error(f"Error assigning role {role_name} to user {user_id}: {e}")
            return False

    def revoke_role_by_name(self, user_id: str, role_name: str) -> bool:
        """Revokes a role from a user by role name."""
        try:
            role_res = self.client.table("roles").select("id").eq("name", role_name).single().execute()
            if not role_res.data:
                logger.error(f"Role {role_name} not found in roles table.")
                return False
            role_id = role_res.data["id"]

            self.client.table("user_roles").delete().eq("user_id", user_id).eq("role_id", role_id).execute()
            return True
        except Exception as e:
            logger.error(f"Error revoking role {role_name} from user {user_id}: {e}")
            return False

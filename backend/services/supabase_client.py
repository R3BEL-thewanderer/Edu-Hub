from supabase import create_client, Client
from core.config import settings

_client: Client = None

def get_supabase() -> Client:
    """Returns the Supabase admin client (service role key)."""
    global _client
    if _client is None:
        _client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
    return _client

# Convenience alias
supabase = get_supabase

def get_or_create_user(auth_id: str, email: str = "", name: str = "") -> str | None:
    """Helper to fetch internal user DB UUID or auto-provision if missing."""
    client = get_supabase()
    try:
        res = client.table("users").select("id").eq("auth_id", auth_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]["id"]
        
        user_email = email or f"user_{auth_id[:8]}@eduhub.co.in"
        user_name = name or "EduHub Student"
        new_u = client.table("users").insert({
            "auth_id": auth_id,
            "email": user_email,
            "name": user_name
        }).execute()
        if new_u.data:
            return new_u.data[0]["id"]
    except Exception as e:
        print(f"User auto-provisioning notice: {e}")
    return None

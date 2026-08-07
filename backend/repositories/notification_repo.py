from typing import List, Dict, Any, Optional
from services.supabase_client import get_supabase

class NotificationRepository:
    def __init__(self):
        self.supabase = get_supabase()

    def create_notification(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert row into notifications PostgreSQL table."""
        res = self.supabase.table("notifications").insert(data).execute()
        return res.data[0] if res.data else {}

    def get_unread_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("notifications").select("*").eq("user_id", user_id).eq("is_read", False).order("created_at", desc=True).execute()
        return res.data or []
        
    def mark_as_read(self, notification_id: str) -> bool:
        res = self.supabase.table("notifications").update({"is_read": True, "read_at": "now()"}).eq("id", notification_id).execute()
        return len(res.data) > 0 if res.data else False

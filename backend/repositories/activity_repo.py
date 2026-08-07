from typing import List, Dict, Any, Optional
from services.supabase_client import get_supabase

class ActivityRepository:
    def __init__(self):
        self.supabase = get_supabase()

    def log_activity(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert row into activity_logs PostgreSQL table."""
        res = self.supabase.table("activity_logs").insert(data).execute()
        return res.data[0] if res.data else {}

    def get_activities_for_user(self, user_id: str, limit: int = 50, offset: int = 0, category: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.supabase.table("activity_logs").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).offset(offset)
        # Assuming category is stuffed into metadata->>category manually by the service layer
        # Since Supabase postgREST can filter jsonb
        if category:
            query = query.filter("metadata->>category", "eq", category)
        res = query.execute()
        return res.data or []

    def get_platform_activities(self, limit: int = 50) -> List[Dict[str, Any]]:
        res = self.supabase.table("activity_logs").select("*").order("created_at", desc=True).limit(limit).execute()
        return res.data or []

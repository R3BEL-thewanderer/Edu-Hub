from typing import List, Dict, Any, Optional
from datetime import date
from services.supabase_client import get_supabase

class AIRepository:
    def __init__(self):
        self.supabase = get_supabase()

    def create_session(
        self, 
        user_id: str, 
        subject_id: Optional[str] = None, 
        provider: str = "nvidia",
        title: str = "New Conversation"
    ) -> Dict[str, Any]:
        data = {
            "user_id": user_id,
            "subject_id": subject_id,
            "provider": provider,
            "title": title
        }
        res = self.supabase.table("ai_chat_sessions").insert(data).execute()
        return res.data[0]

    def get_session(self, session_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        res = self.supabase.table("ai_chat_sessions").select("*").eq("id", session_id).eq("user_id", user_id).is_("deleted_at", "null").single().execute()
        return res.data if res else None

    def get_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("ai_chat_sessions").select("*").eq("user_id", user_id).is_("deleted_at", "null").order("last_message_at", desc=True).execute()
        return res.data or []

    def update_session(self, session_id: str, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        res = self.supabase.table("ai_chat_sessions").update(updates).eq("id", session_id).eq("user_id", user_id).execute()
        return res.data[0] if res.data else None

    def soft_delete_session(self, session_id: str, user_id: str) -> None:
        self.supabase.table("ai_chat_sessions").update({
            "deleted_at": "now()"
        }).eq("id", session_id).eq("user_id", user_id).execute()

    def add_message(
        self, 
        session_id: str, 
        role: str, 
        content: str, 
        tokens_used: int = 0, 
        sources: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        data = {
            "session_id": session_id,
            "role": role,
            "content": content,
            "tokens_used": tokens_used,
            "sources": sources or []
        }
        res = self.supabase.table("ai_chat_messages").insert(data).execute()
        return res.data[0]

    def get_messages(self, session_id: str) -> List[Dict[str, Any]]:
        # Fetch matching messages ensuring order 
        res = self.supabase.table("ai_chat_messages").select("*").eq("session_id", session_id).order("created_at").execute()
        return res.data or []

    def get_daily_usage(self, user_id: str, target_date: date) -> Dict[str, Any]:
        res = self.supabase.table("ai_usage_daily").select("*").eq("user_id", user_id).eq("usage_date", target_date.isoformat()).execute()
        if res.data:
            return res.data[0]
        return {"messages_used": 0, "tokens_used": 0}

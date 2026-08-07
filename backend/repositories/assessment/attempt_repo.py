from typing import List, Dict, Any, Optional
from services.supabase_client import get_supabase

class AttemptRepository:
    def __init__(self):
        self.supabase = get_supabase()

    def create_attempt(self, test_id: str, user_id: str) -> Dict[str, Any]:
        res = self.supabase.table("mock_attempts").insert({"test_id": test_id, "user_id": user_id}).execute()
        return res.data[0]

    def get_attempt(self, attempt_id: str) -> Optional[Dict[str, Any]]:
        res = self.supabase.table("mock_attempts").select("*").eq("id", attempt_id).single().execute()
        return res.data if res else None

    def get_all_test_attempts(self, test_id: str, user_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("mock_attempts").select("*").eq("test_id", test_id).eq("user_id", user_id).execute()
        return res.data or []

    def get_student_attempts_aggregate(self, user_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("mock_attempts").select("*").eq("user_id", user_id).eq("is_completed", True).execute()
        return res.data or []
        
    def get_global_attempts_aggregate(self) -> List[Dict[str, Any]]:
        res = self.supabase.table("mock_attempts").select("id, score, is_completed").eq("is_completed", True).execute()
        return res.data or []

    def finalize_attempt(self, attempt_id: str, score: float, total_correct: int, total_wrong: int, total_unanswered: int, time_taken: int) -> Dict[str, Any]:
        updates = {
            "is_completed": True,
            "submitted_at": "now()",
            "score": score,
            "total_correct": total_correct,
            "total_wrong": total_wrong,
            "total_unanswered": total_unanswered,
            "time_taken_seconds": time_taken
        }
        res = self.supabase.table("mock_attempts").update(updates).eq("id", attempt_id).execute()
        return res.data[0]

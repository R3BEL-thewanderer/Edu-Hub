from typing import List, Dict, Any, Optional
from services.supabase_client import get_supabase

class MockTestRepository:
    def __init__(self):
        self.supabase = get_supabase()

    def create_test(self, test_data: Dict[str, Any]) -> Dict[str, Any]:
        res = self.supabase.table("mock_tests").insert(test_data).execute()
        return res.data[0]

    def get_test(self, test_id: str) -> Optional[Dict[str, Any]]:
        res = self.supabase.table("mock_tests").select("*, mock_questions(*, mock_options(*))").eq("id", test_id).is_("deleted_at", "null").single().execute()
        return res.data if res else None

    def list_published_tests(self, subject_id: Optional[str] = None) -> List[Dict[str, Any]]:
        q = self.supabase.table("mock_tests").select("*").eq("is_published", True).is_("deleted_at", "null")
        if subject_id:
            q = q.eq("subject_id", subject_id)
        res = q.execute()
        return res.data or []

    def list_author_tests(self, author_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("mock_tests").select("*").eq("created_by", author_id).is_("deleted_at", "null").execute()
        return res.data or []

    def update_test(self, test_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        res = self.supabase.table("mock_tests").update(updates).eq("id", test_id).execute()
        return res.data[0] if res.data else None

    def soft_delete_test(self, test_id: str) -> None:
        self.supabase.table("mock_tests").update({"deleted_at": "now()"}).eq("id", test_id).execute()
        
    def duplicate_test(self, original_test_id: str, new_user_id: str) -> Dict[str, Any]:
        """Deep clones a test metadata."""
        test = self.get_test(original_test_id)
        if not test:
            raise ValueError("Test not found")
            
        new_test = {
            "subject_id": test["subject_id"],
            "created_by": new_user_id,
            "title": test["title"] + " (Copy)",
            "description": test.get("description"),
            "duration_minutes": test["duration_minutes"],
            "total_marks": test["total_marks"],
            "pass_marks": test.get("pass_marks"),
            "is_published": False,
            "max_attempts": test.get("max_attempts", 1),
            "shuffle_questions": test.get("shuffle_questions", True),
            "show_answers_after": test.get("show_answers_after", True),
        }
        res = self.create_test(new_test)
        return res

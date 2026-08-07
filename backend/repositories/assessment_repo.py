from typing import List, Dict, Any, Optional
from datetime import datetime
from services.supabase_client import get_supabase

class AssessmentRepository:
    def __init__(self):
        self.supabase = get_supabase()

    # -- TESTS --
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

    # -- QUESTIONS & OPTIONS --
    def create_question(self, question_data: Dict[str, Any], options_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        res = self.supabase.table("mock_questions").insert(question_data).execute()
        question = res.data[0]
        
        if options_data:
            for opt in options_data:
                opt["question_id"] = question["id"]
            self.supabase.table("mock_options").insert(options_data).execute()
        
        # return populated
        return self.get_question(question["id"])

    def get_question(self, question_id: str) -> Dict[str, Any]:
        res = self.supabase.table("mock_questions").select("*, mock_options(*)").eq("id", question_id).single().execute()
        return res.data

    def delete_question(self, question_id: str) -> None:
        self.supabase.table("mock_questions").delete().eq("id", question_id).execute()

    # -- ATTEMPTS & EVALUATION --
    def create_attempt(self, test_id: str, user_id: str) -> Dict[str, Any]:
        res = self.supabase.table("mock_attempts").insert({"test_id": test_id, "user_id": user_id}).execute()
        return res.data[0]

    def get_attempt(self, attempt_id: str) -> Optional[Dict[str, Any]]:
        res = self.supabase.table("mock_attempts").select("*").eq("id", attempt_id).single().execute()
        return res.data if res else None

    def get_all_test_attempts(self, test_id: str, user_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("mock_attempts").select("*").eq("test_id", test_id).eq("user_id", user_id).execute()
        return res.data or []

    def bulk_insert_answers(self, answers_data: List[Dict[str, Any]]) -> None:
        if answers_data:
            self.supabase.table("mock_answers").insert(answers_data).execute()

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

    # -- LEADERBOARD --
    def get_leaderboard(self, test_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.rpc("get_mock_leaderboard", {"p_test_id": test_id}).execute()
        return res.data or []

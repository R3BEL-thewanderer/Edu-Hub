from typing import List, Dict, Any, Optional
from services.supabase_client import get_supabase

class EvaluationRepository:
    def __init__(self):
        self.supabase = get_supabase()

    def bulk_insert_answers(self, answers_data: List[Dict[str, Any]]) -> None:
        if answers_data:
            self.supabase.table("mock_answers").insert(answers_data).execute()

    def update_manual_marks(self, answer_id: str, marks_awarded: float, is_correct: bool) -> Dict[str, Any]:
        """Faculty uses this to manually grade subjective answers like long format or code."""
        updates = {
            "marks_awarded": marks_awarded,
            "is_correct": is_correct
        }
        res = self.supabase.table("mock_answers").update(updates).eq("id", answer_id).execute()
        return res.data[0] if res.data else {}

    def get_answers_for_attempt(self, attempt_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("mock_answers").select("*, mock_questions(question_type)").eq("attempt_id", attempt_id).execute()
        return res.data or []

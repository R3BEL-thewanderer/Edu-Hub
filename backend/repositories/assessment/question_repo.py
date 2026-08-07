import uuid
from typing import List, Dict, Any, Optional
from services.supabase_client import get_supabase

class QuestionRepository:
    def __init__(self):
        self.supabase = get_supabase()

    def create_question(self, question_data: Dict[str, Any], options_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        res = self.supabase.table("mock_questions").insert(question_data).execute()
        question = res.data[0]
        
        if options_data:
            for opt in options_data:
                opt["question_id"] = question["id"]
            self.supabase.table("mock_options").insert(options_data).execute()
        
        return self.get_question(question["id"])

    def get_question(self, question_id: str) -> Dict[str, Any]:
        res = self.supabase.table("mock_questions").select("*, mock_options(*)").eq("id", question_id).single().execute()
        return res.data

    def delete_question(self, question_id: str) -> None:
        self.supabase.table("mock_questions").delete().eq("id", question_id).execute()

    def list_all_questions_for_author(self, user_id: str) -> List[Dict[str, Any]]:
        # Need to join with mock_tests to filter by created_by
        res = self.supabase.table("mock_questions").select("*, mock_tests!inner(created_by)").eq("mock_tests.created_by", user_id).execute()
        return res.data or []

    def import_question_to_test(self, question_id: str, target_test_id: str) -> Dict[str, Any]:
        """Reuse a question by copy-by-value since test_id is strict foreign key."""
        old_q = self.get_question(question_id)
        
        new_q_payload = {
            "test_id": target_test_id,
            "question_type": old_q["question_type"],
            "question_text": old_q["question_text"],
            "explanation": old_q.get("explanation"),
            "marks": old_q["marks"],
            "negative_marks": old_q.get("negative_marks", 0),
            "display_order": old_q.get("display_order"),
            "image_url": old_q.get("image_url")
        }
        
        new_opts_payload = []
        for opt in old_q.get("mock_options", []):
            new_opts_payload.append({
                "option_text": opt["option_text"],
                "is_correct": opt["is_correct"],
                "display_order": opt.get("display_order")
            })
            
        return self.create_question(new_q_payload, new_opts_payload)

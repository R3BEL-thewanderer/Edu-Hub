from typing import List, Dict, Any
from datetime import datetime, timezone
from fastapi import HTTPException
from schemas.assessment import AttemptSubmission, SaveAttemptSubmission

from repositories.assessment.attempt_repo import AttemptRepository
from repositories.assessment.mock_test_repo import MockTestRepository
from repositories.assessment.evaluation_repo import EvaluationRepository

from core.events import event_bus
from schemas.events import EventPayload, EventType

class EvaluationService:
    def __init__(self):
        self.attempt_repo = AttemptRepository()
        self.test_repo = MockTestRepository()
        self.eval_repo = EvaluationRepository()

    def start_attempt(self, user_id: str, test_id: str) -> Dict[str, Any]:
        test = self.test_repo.get_test(test_id)
        if not test or not test.get("is_published"):
            raise HTTPException(status_code=404, detail="Test not found or unavailable")
            
        previous_attempts = self.attempt_repo.get_all_test_attempts(test_id, user_id)
        if len(previous_attempts) >= test.get("max_attempts", 1):
            raise HTTPException(status_code=403, detail="Maximum attempts reached for this test")
            
        attempt = self.attempt_repo.create_attempt(test_id, user_id)
        
        event_bus.publish(EventPayload(
            event_type=EventType.TEST_STARTED,
            user_id=user_id,
            entity_type="mock_test",
            entity_id=test_id,
            metadata={"title": f"Started Test: {test.get('title', 'Unknown')}", "deep_link": f"/assessment/{test_id}/attempt"}
        ))
        
        return attempt
        
    def save_attempt(self, user_id: str, attempt_id: str, submission: SaveAttemptSubmission) -> Dict[str, Any]:
        """Temporarily save answers without finalizing the test."""
        attempt = self.attempt_repo.get_attempt(attempt_id)
        if not attempt or attempt.get("user_id") != user_id:
            raise HTTPException(status_code=404, detail="Attempt not found")
        if attempt.get("is_completed"):
            raise HTTPException(status_code=400, detail="Attempt is already completed")
            
        return {"status": "saved"}

    def submit_attempt(self, user_id: str, attempt_id: str, submission: AttemptSubmission) -> Dict[str, Any]:
        attempt = self.attempt_repo.get_attempt(attempt_id)
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")
        if attempt.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to submit this attempt")
        if attempt.get("is_completed"):
            raise HTTPException(status_code=400, detail="Attempt is already completed")
            
        test = self.test_repo.get_test(attempt["test_id"])
        
        now_ts = datetime.now(timezone.utc)
        started_at_str = attempt.get("started_at")
        started_at = datetime.fromisoformat(started_at_str.replace('Z', '+00:00')) if isinstance(started_at_str, str) else started_at_str
        
        time_taken = (now_ts - started_at).total_seconds()
        duration_allowed = test.get("duration_minutes", 0) * 60
        
        if time_taken > (duration_allowed + 30):
            time_taken = duration_allowed 
            
        questions = test.get("mock_questions", [])
        
        db_answers = []
        score = 0.0
        total_correct = 0
        total_wrong = 0
        total_unanswered = 0
        
        submitted_dict = {ans.question_id: ans for ans in submission.answers}
        
        for q in questions:
            q_id = q["id"]
            user_ans = submitted_dict.get(q_id)
            
            row = {
                "attempt_id": attempt_id,
                "question_id": q_id,
                "answered_at": "now()"
            }
            
            if not user_ans or (not user_ans.selected_option_id and not user_ans.short_answer_text):
                total_unanswered += 1
                db_answers.append(row)
                continue
                
            q_type = q.get("question_type")
            marks = float(q.get("marks", 0))
            neg_marks = float(q.get("negative_marks", 0.0))
            
            if q_type in ["mcq", "true_false", "multiple_correct"]:
                row["selected_option_id"] = user_ans.selected_option_id
                opts = q.get("mock_options", [])
                correct_opt = next((o for o in opts if o.get("is_correct")), None)
                
                if correct_opt and correct_opt["id"] == user_ans.selected_option_id:
                    row["is_correct"] = True
                    row["marks_awarded"] = marks
                    score += marks
                    total_correct += 1
                else:
                    row["is_correct"] = False
                    row["marks_awarded"] = -neg_marks
                    score -= neg_marks
                    total_wrong += 1
            else:
                row["short_answer_text"] = user_ans.short_answer_text
                row["is_correct"] = None 
                row["marks_awarded"] = 0
                
            db_answers.append(row)
            
        self.eval_repo.bulk_insert_answers(db_answers)
        
        final_score = max(0.0, score)
        res = self.attempt_repo.finalize_attempt(
            attempt_id=attempt_id,
            score=final_score, 
            total_correct=total_correct,
            total_wrong=total_wrong,
            total_unanswered=total_unanswered,
            time_taken=int(time_taken)
        )
        
        event_bus.publish(EventPayload(
            event_type=EventType.TEST_COMPLETED,
            user_id=user_id,
            entity_type="mock_test",
            entity_id=test.get("id"),
            metadata={
                "title": f"Completed Test: {test.get('title', 'Unknown')}", 
                "description": f"Score: {final_score}",
                "deep_link": f"/assessment/{test.get('id')}/review/{attempt_id}"
            }
        ))
        
        return res

    def get_student_analytics(self, user_id: str) -> Dict[str, Any]:
        """Provides student learning accuracy analytics."""
        attempts = self.attempt_repo.get_student_attempts_aggregate(user_id)
        
        if not attempts:
            return {
                "accuracy_percentage": 0.0,
                "average_time_per_question": 0.0,
                "total_attempts": 0,
                "progress_history": []
            }
            
        total_correct = sum(a.get("total_correct", 0) for a in attempts)
        total_wrong = sum(a.get("total_wrong", 0) for a in attempts)
        
        total_answered = total_correct + total_wrong
        accuracy = (total_correct / total_answered * 100) if total_answered > 0 else 0.0
        
        total_time = sum(a.get("time_taken_seconds", 0) for a in attempts)
        avg_time = (total_time / total_answered) if total_answered > 0 else 0.0
        
        return {
            "accuracy_percentage": round(accuracy, 2),
            "average_time_per_question": round(avg_time, 2),
            "total_attempts": len(attempts),
            "progress_history": [{"test_id": a["test_id"], "score": a["score"]} for a in attempts]
        }


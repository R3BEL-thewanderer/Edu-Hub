from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import HTTPException
from schemas.assessment import MockTestCreate, MockQuestionCreate, AttemptSubmission, AnswerSubmit
from repositories.assessment_repo import AssessmentRepository
from repositories.profile_repo import ProfileRepository

class AssessmentService:
    def __init__(self):
        self.repo = AssessmentRepository()
        self.profile_repo = ProfileRepository()

    # -- TESTS --
    def create_test(self, user_id: str, payload: MockTestCreate) -> Dict[str, Any]:
        """Creates an unpublished mock test, assigning creator ownership."""
        data = payload.model_dump(exclude_unset=True)
        # Convert datetime to ISO strings for DB compatibility if present
        if data.get("available_from"):
            data["available_from"] = data["available_from"].isoformat()
        if data.get("available_until"):
            data["available_until"] = data["available_until"].isoformat()

        data["created_by"] = user_id
        data["is_published"] = False
        return self.repo.create_test(data)

    def get_test_for_candidate(self, test_id: str) -> Dict[str, Any]:
        """Retrieves a published test stripped of sensitive answer parameters."""
        test = self.repo.get_test(test_id)
        if not test or not test.get("is_published"):
            raise HTTPException(status_code=404, detail="Test not found or currently unavailable.")
        
        # Enforce temporal bounds
        now = datetime.now(timezone.utc)
        start = test.get("available_from")
        end = test.get("available_until")
        if start and now.isoformat() < start:
            raise HTTPException(status_code=403, detail="Test has not started yet.")
        if end and now.isoformat() > end:
            raise HTTPException(status_code=403, detail="Test is no longer available.")
            
        # Strip correct options
        for q in test.get("mock_questions", []):
            if not test.get("show_answers_after"):
                q.pop("explanation", None)
            for opt in q.get("mock_options", []):
                opt.pop("is_correct", None)
        
        return test

    def publish_test(self, user_id: str, test_id: str) -> Dict[str, Any]:
        test = self.repo.get_test(test_id)
        if not test:
            raise HTTPException(status_code=404, detail="Test not found")
        if test["created_by"] != user_id:
            # Note: actual admin override should be handled in routes level with require_admin
            pass 
        return self.repo.update_test(test_id, {"is_published": True})
        
    def add_question(self, user_id: str, test_id: str, payload: MockQuestionCreate) -> Dict[str, Any]:
        data = payload.model_dump(exclude={"options"})
        data["test_id"] = test_id
        options = []
        if payload.options:
            options = [opt.model_dump() for opt in payload.options]
        return self.repo.create_question(data, options)

    # -- ATTEMPTS & EVALUATION --
    def start_attempt(self, user_id: str, test_id: str) -> Dict[str, Any]:
        test = self.repo.get_test(test_id)
        if not test or not test.get("is_published"):
            raise HTTPException(status_code=404, detail="Test not found or unavailable")
            
        previous_attempts = self.repo.get_all_test_attempts(test_id, user_id)
        if len(previous_attempts) >= test.get("max_attempts", 1):
            raise HTTPException(status_code=403, detail="Maximum attempts reached for this test")
            
        return self.repo.create_attempt(test_id, user_id)

    def submit_attempt(self, user_id: str, attempt_id: str, submission: AttemptSubmission) -> Dict[str, Any]:
        attempt = self.repo.get_attempt(attempt_id)
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")
        if attempt.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to submit this attempt")
        if attempt.get("is_completed"):
            raise HTTPException(status_code=400, detail="Attempt is already completed")
            
        test = self.repo.get_test(attempt["test_id"])
        
        # Enforce Timer Limits safely
        now_ts = datetime.now(timezone.utc)
        started_at_str = attempt.get("started_at")
        started_at = datetime.fromisoformat(started_at_str.replace('Z', '+00:00')) if isinstance(started_at_str, str) else started_at_str
        
        time_taken = (now_ts - started_at).total_seconds()
        duration_allowed = test.get("duration_minutes", 0) * 60
        
        # 30 second grace period for network drift
        if time_taken > (duration_allowed + 30):
            time_taken = duration_allowed # Cap exactly at limit
            
        # Build evaluation map from DB
        questions = test.get("mock_questions", [])
        q_map = {q["id"]: q for q in questions}
        
        db_answers = []
        score = 0.0
        total_correct = 0
        total_wrong = 0
        total_unanswered = 0
        
        # Map user submission
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
            
            if q_type == "mcq" or q_type == "true_false":
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
                # Subjective handling pending manual review
                row["short_answer_text"] = user_ans.short_answer_text
                row["is_correct"] = None 
                row["marks_awarded"] = 0
                
            db_answers.append(row)
            
        # Persist bulk evaluation
        self.repo.bulk_insert_answers(db_answers)
        
        return self.repo.finalize_attempt(
            attempt_id=attempt_id,
            score=max(0.0, score), # Enforce non-negative global score
            total_correct=total_correct,
            total_wrong=total_wrong,
            total_unanswered=total_unanswered,
            time_taken=int(time_taken)
        )

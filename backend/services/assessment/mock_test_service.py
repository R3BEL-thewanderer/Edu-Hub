from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import HTTPException
from schemas.assessment import MockTestCreate
from repositories.assessment.mock_test_repo import MockTestRepository
from repositories.assessment.question_repo import QuestionRepository
from repositories.assessment.attempt_repo import AttemptRepository

class MockTestService:
    def __init__(self):
        self.repo = MockTestRepository()
        self.q_repo = QuestionRepository()
        self.attempt_repo = AttemptRepository()

    def create_test(self, user_id: str, payload: MockTestCreate) -> Dict[str, Any]:
        data = payload.model_dump(exclude_unset=True)
        if data.get("available_from"):
            data["available_from"] = data["available_from"].isoformat()
        if data.get("available_until"):
            data["available_until"] = data["available_until"].isoformat()

        data["created_by"] = user_id
        data["is_published"] = False
        return self.repo.create_test(data)

    def duplicate_test(self, user_id: str, test_id: str) -> Dict[str, Any]:
        """Deep clone test metadata"""
        return self.repo.duplicate_test(original_test_id=test_id, new_user_id=user_id)

    def publish_test(self, user_id: str, test_id: str) -> Dict[str, Any]:
        test = self.repo.get_test(test_id)
        if not test:
            raise HTTPException(status_code=404, detail="Test not found")
        if test["created_by"] != user_id:
            # We enforce ownership natively here
            raise HTTPException(status_code=403, detail="Cannot publish a test you do not own")
        return self.repo.update_test(test_id, {"is_published": True})

    def get_test_for_candidate(self, test_id: str) -> Dict[str, Any]:
        """Fetch a sanitized test object, hiding explanations and accurate answers."""
        test = self.repo.get_test(test_id)
        if not test or not test.get("is_published"):
            raise HTTPException(status_code=404, detail="Test not found or currently unavailable.")
        
        now = datetime.now(timezone.utc)
        start = test.get("available_from")
        end = test.get("available_until")
        if start and now.isoformat() < start:
            raise HTTPException(status_code=403, detail="Test has not started yet.")
        if end and now.isoformat() > end:
            raise HTTPException(status_code=403, detail="Test is no longer available.")
            
        for q in test.get("mock_questions", []):
            if not test.get("show_answers_after"):
                q.pop("explanation", None)
            for opt in q.get("mock_options", []):
                opt.pop("is_correct", None)
        
        return test
        
    def get_platform_statistics(self) -> Dict[str, Any]:
        """Admin analytical insights."""
        tests = self.repo.list_published_tests()
        attempts = self.attempt_repo.get_global_attempts_aggregate()
        
        scores = [a["score"] for a in attempts if a.get("score") is not None]
        avg_score = sum(scores) / len(scores) if scores else 0.0
        
        return {
            "total_platform_tests": len(tests),
            "total_platform_attempts": len(attempts),
            "global_average_score": avg_score
        }

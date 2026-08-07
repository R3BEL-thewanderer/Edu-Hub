from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional

from schemas.assessment import (
    MockTestCreate, MockQuestionCreate, AttemptSubmission,
    SaveAttemptSubmission, SubjectiveEvaluation,
    StudentAnalyticsResponse, AdminAnalyticsResponse
)
from dependencies.auth import require_user, require_faculty, require_student, require_admin

from services.assessment.mock_test_service import MockTestService
from services.assessment.evaluation_service import EvaluationService
from services.assessment.leaderboard_service import LeaderboardService

router = APIRouter()
test_svc = MockTestService()
eval_svc = EvaluationService()
leader_svc = LeaderboardService()

# -----------------
# CANDIDATE ROUTES
# -----------------
@router.get("/tests")
def get_published_tests(subject_id: Optional[str] = None, user_id: dict = Depends(require_user)):
    return test_svc.repo.list_published_tests(subject_id)

@router.get("/tests/{test_id}")
def get_test_details(test_id: str, user: dict = Depends(require_user)):
    return test_svc.get_test_for_candidate(test_id)

@router.post("/tests/{test_id}/start")
def start_test(test_id: str, user: dict = Depends(require_student)):
    attempt = eval_svc.start_attempt(user["sub"], test_id)
    test_view = test_svc.get_test_for_candidate(test_id)
    return {"attempt": attempt, "test": test_view}

@router.patch("/attempts/{attempt_id}/save")
def save_test(attempt_id: str, submission: SaveAttemptSubmission, user: dict = Depends(require_student)):
    return eval_svc.save_attempt(user["sub"], attempt_id, submission)

@router.post("/attempts/{attempt_id}/submit")
def submit_test(attempt_id: str, submission: AttemptSubmission, user: dict = Depends(require_student)):
    return eval_svc.submit_attempt(user["sub"], attempt_id, submission)
    
@router.get("/analytics/student")
def student_analytics(user: dict = Depends(require_student)):
    return eval_svc.get_student_analytics(user["sub"])

# -----------------
# AUTHOR ROUTES
# -----------------
@router.get("/author/tests")
def get_author_tests(user: dict = Depends(require_faculty)):
    return test_svc.repo.list_author_tests(user["sub"])

@router.post("/author/tests")
def create_test(payload: MockTestCreate, user: dict = Depends(require_faculty)):
    return test_svc.create_test(user["sub"], payload)

@router.post("/author/tests/{test_id}/duplicate")
def duplicate_test(test_id: str, user: dict = Depends(require_faculty)):
    return test_svc.duplicate_test(user["sub"], test_id)

@router.post("/author/tests/{test_id}/publish")
def publish_test(test_id: str, user: dict = Depends(require_faculty)):
    return test_svc.publish_test(user["sub"], test_id)

@router.post("/author/tests/{test_id}/questions")
def add_question(test_id: str, payload: MockQuestionCreate, user: dict = Depends(require_faculty)):
    data = payload.model_dump(exclude={"options"})
    data["test_id"] = test_id
    options = [opt.model_dump() for opt in payload.options] if payload.options else []
    return test_svc.q_repo.create_question(data, options)
    
@router.post("/author/tests/{test_id}/questions/import")
def import_question(test_id: str, question_id: str, user: dict = Depends(require_faculty)):
    """Deep clone question from bank to a specific test."""
    return test_svc.q_repo.import_question_to_test(question_id, test_id)

@router.get("/author/questions")
def question_bank_list(user: dict = Depends(require_faculty)):
    return test_svc.q_repo.list_all_questions_for_author(user["sub"])

@router.patch("/author/answers/{answer_id}/evaluate")
def manual_evaluate(answer_id: str, diff: SubjectiveEvaluation, user: dict = Depends(require_faculty)):
    """Faculty evaluating short_answer/long_answer."""
    return eval_svc.eval_repo.update_manual_marks(answer_id, diff.marks_awarded, diff.is_correct)

# -----------------
# ADMIN ROUTES
# -----------------
@router.get("/analytics/admin")
def platform_analytics(user: dict = Depends(require_admin)):
    return test_svc.get_platform_statistics()

@router.get("/admin/tests")
def list_admin_tests(user: dict = Depends(require_admin)):
    client = test_svc.repo.supabase
    # Fetch all tests, with question counts
    tests_res = client.table("mock_tests").select("id, title, is_published, mock_questions(count)").is_("deleted_at", "null").execute()
    
    # We might approximate participants by counting unique users in attempts
    attempts_res = client.table("test_attempts").select("test_id, user_id").execute()
    participants = {}
    for a in attempts_res.data or []:
        tid = a["test_id"]
        uid = a["user_id"]
        if tid not in participants:
            participants[tid] = set()
        participants[tid].add(uid)
    
    formatted = []
    for t in tests_res.data or []:
        q_count = t.get("mock_questions", [{"count": 0}])[0].get("count", 0) if isinstance(t.get("mock_questions"), list) and len(t.get("mock_questions")) > 0 else 0
        p_count = len(participants.get(t["id"], set()))
        formatted.append({
            "id": t["id"],
            "title": t["title"],
            "questions_count": q_count,
            "status": "Active" if t["is_published"] else "Draft",
            "participants_count": p_count
        })
    return {"data": formatted}

# -----------------
# LEADERBOARD ROUTES
# -----------------
@router.get("/leaderboards/global")
def get_global_leaderboard(user: dict = Depends(require_user)):
    return leader_svc.get_global_leaderboard()

@router.get("/leaderboards/{test_id}")
def get_test_leaderboard(test_id: str, user: dict = Depends(require_user)):
    return leader_svc.get_test_leaderboard(test_id)

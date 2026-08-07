import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta

def test_assessment_save_attempt(client, valid_tcet_student_jwt):
    """Test saving intermediate attempt progress."""
    mock_attempt = {
        "id": "att1", "test_id": "test1", "user_id": "00000000-0000-0000-0000-000000000001",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "is_completed": False
    }

    with patch("repositories.profile_repo.RBACRepository.get_user_roles", return_value=["student"]), \
         patch("repositories.assessment.attempt_repo.AttemptRepository.get_attempt", return_value=mock_attempt):
        
        payload = {
            "answers": [
                {"question_id": "q1", "selected_option_id": "o1"}
            ]
        }
        
        res = client.patch("/api/assessment/attempts/att1/save", json=payload, headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res.status_code == 200
        assert res.json() == {"status": "saved"}

def test_assessment_question_bank_import(client, valid_faculty_jwt):
    """Test Faculty copy-by-value question reuse."""
    with patch("repositories.profile_repo.RBACRepository.get_user_roles", return_value=["faculty"]), \
         patch("repositories.assessment.question_repo.QuestionRepository.import_question_to_test", return_value={"id": "new_q2"}):
        
        res = client.post("/api/assessment/author/tests/test2/questions/import?question_id=old_q1", headers={"Authorization": f"Bearer {valid_faculty_jwt}"})
        
        # Test successfully calls underlying repo
        assert res.status_code == 200
        assert res.json()["id"] == "new_q2"

def test_student_analytics(client, valid_tcet_student_jwt):
    """Test aggregation of student accuracy calculations."""
    aggregates = [
        {"test_id": "t1", "score": 2.0, "total_correct": 2, "total_wrong": 1, "time_taken_seconds": 60},
        {"test_id": "t2", "score": 5.0, "total_correct": 5, "total_wrong": 0, "time_taken_seconds": 120}
    ]
    # Total correct = 7, total wrong = 1 => 7/8 = 87.5%
    # Total time = 180s, total answered = 8 => 22.5s avg time

    with patch("repositories.profile_repo.RBACRepository.get_user_roles", return_value=["student"]), \
         patch("repositories.assessment.attempt_repo.AttemptRepository.get_student_attempts_aggregate", return_value=aggregates):
        
        res = client.get("/api/assessment/analytics/student", headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        
        assert res.status_code == 200
        data = res.json()
        assert data["accuracy_percentage"] == 87.5
        assert data["average_time_per_question"] == 22.5
        assert data["total_attempts"] == 2
        assert len(data["progress_history"]) == 2

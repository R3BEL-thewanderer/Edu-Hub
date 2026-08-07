import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta

def test_assessment_start_unauthorized(client, valid_tcet_student_jwt):
    """Test standard RBAC checking."""
    with patch("repositories.profile_repo.RBACRepository.get_user_roles", return_value=["student"]):
        # Attempting to hit author routes without faculty access
        res = client.post("/api/assessment/author/tests", json={
            "subject_id": "math101",
            "title": "Unauthorized Test",
            "duration_minutes": 30,
            "total_marks": 10
        }, headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res.status_code == 403

def test_assessment_create_success(client, valid_faculty_jwt):
    """Test successful test creation by Faculty."""
    with patch("repositories.profile_repo.RBACRepository.get_user_roles", return_value=["faculty"]), \
         patch("repositories.assessment_repo.AssessmentRepository.create_test", return_value={"id": "test1"}):
        res = client.post("/api/assessment/author/tests", json={
            "subject_id": "math101",
            "title": "Math Midterm",
            "duration_minutes": 60,
            "total_marks": 100
        }, headers={"Authorization": f"Bearer {valid_faculty_jwt}"})
        assert res.status_code == 200
        assert res.json()["id"] == "test1"

def test_candidate_start_published(client, valid_tcet_student_jwt):
    """Student must be able to start only published tests."""
    with patch("repositories.profile_repo.RBACRepository.get_user_roles", return_value=["student"]), \
         patch("repositories.assessment_repo.AssessmentRepository.get_test", return_value={"is_published": False}), \
         patch("repositories.assessment_repo.AssessmentRepository.get_all_test_attempts", return_value=[]):
        res = client.get("/api/assessment/tests/test1/start", headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res.status_code == 404

def test_candidate_submit_validation(client, valid_tcet_student_jwt):
    """System validates correct options vs submitted options and calculates score securely."""
    fake_test = {
        "id": "test1", "is_published": True, "duration_minutes": 30,
        "mock_questions": [
            {
                "id": "q1", "question_type": "mcq", "marks": 2, "negative_marks": 0.5,
                "mock_options": [
                    {"id": "o1", "is_correct": True},
                    {"id": "o2", "is_correct": False}
                ]
            },
            {
                "id": "q2", "question_type": "mcq", "marks": 2, "negative_marks": 0.5,
                "mock_options": [
                    {"id": "o3", "is_correct": True},
                    {"id": "o4", "is_correct": False}
                ]
            }
        ]
    }
    
    mock_attempt = {
        "id": "att1", "test_id": "test1", "user_id": "00000000-0000-0000-0000-000000000001",
        "started_at": (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat(),
        "is_completed": False
    }

    with patch("repositories.profile_repo.RBACRepository.get_user_roles", return_value=["student"]), \
         patch("repositories.assessment_repo.AssessmentRepository.get_attempt", return_value=mock_attempt), \
         patch("repositories.assessment_repo.AssessmentRepository.get_test", return_value=fake_test), \
         patch("repositories.assessment_repo.AssessmentRepository.bulk_insert_answers"), \
         patch("repositories.assessment_repo.AssessmentRepository.finalize_attempt") as mock_final:
        
        # User answers Q1 correctly, Q2 wrongly
        payload = {
            "answers": [
                {"question_id": "q1", "selected_option_id": "o1"},
                {"question_id": "q2", "selected_option_id": "o4"} 
            ]
        }
        
        res = client.post("/api/assessment/attempts/att1/submit", json=payload, headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        
        assert res.status_code == 200
        mock_final.assert_called_once()
        args, kwargs = mock_final.call_args
        
        # Score calculation: 1 correct (+2 marks), 1 wrong (-0.5 marks) = 1.5 total score
        assert kwargs["score"] == 1.5
        assert kwargs["total_correct"] == 1
        assert kwargs["total_wrong"] == 1

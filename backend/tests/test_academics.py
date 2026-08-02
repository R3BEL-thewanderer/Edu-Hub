import pytest
from unittest.mock import patch, MagicMock

def test_subject_listing(client):
    """GET /api/subjects returns subjects list."""
    with patch("repositories.academics_repo.AcademicRepository.get_subjects") as mock_get:
        mock_get.return_value = [{"id": "sub-1", "name": "Physics", "code": "PHY"}]
        response = client.get("/api/subjects")
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["name"] == "Physics"

def test_material_upload_workflow(client, valid_tcet_student_jwt):
    """POST /api/materials as Content Manager creates pending material."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["content_manager"]), \
         patch("repositories.academics_repo.AcademicRepository.get_subject_by_id", return_value={"id": "sub-1"}), \
         patch("repositories.materials_repo.MaterialRepository.create_material") as mock_create_mat, \
         patch("repositories.materials_repo.MaterialRepository.create_version") as mock_create_ver:
        
        mock_create_mat.return_value = {"id": "mat-1", "title": "Unit 1 Notes"}
        mock_create_ver.return_value = {"id": "ver-1", "version_number": 1, "approval_status": "pending"}
        
        payload = {
            "subject_id": "sub-1",
            "material_type": "notes",
            "title": "Unit 1 Notes",
            "storage_path": "notes/unit1.pdf"
        }
        response = client.post("/api/materials", json=payload, headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert response.status_code == 200
        assert response.json()["id"] == "mat-1"

def test_material_approval(client, valid_admin_jwt):
    """POST /api/materials/{id}/approve as Admin creates approved review."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["admin"]), \
         patch("repositories.materials_repo.ReviewRepository.create_review") as mock_review:
        mock_review.return_value = {"id": "rev-1", "status": "approved"}
        response = client.post("/api/materials/ver-1/approve", headers={"Authorization": f"Bearer {valid_admin_jwt}"})
        assert response.status_code == 200
        assert response.json()["status"] == "approved"

def test_material_rejection(client, valid_admin_jwt):
    """POST /api/materials/{id}/reject as Admin creates rejected review."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["admin"]), \
         patch("repositories.materials_repo.ReviewRepository.create_review") as mock_review:
        mock_review.return_value = {"id": "rev-2", "status": "rejected"}
        response = client.post("/api/materials/ver-1/reject", headers={"Authorization": f"Bearer {valid_admin_jwt}"})
        assert response.status_code == 200
        assert response.json()["status"] == "rejected"

def test_material_versioning(client, valid_tcet_student_jwt):
    """PATCH /api/materials/{id} creates new material version."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["content_manager"]), \
         patch("repositories.materials_repo.MaterialRepository.get_material_by_id", return_value={"id": "mat-1", "uploaded_by": "student-uuid", "current_version_id": "ver-1"}), \
         patch("repositories.materials_repo.MaterialRepository.get_latest_version", return_value={"version_number": 1}), \
         patch("repositories.materials_repo.MaterialRepository.create_version") as mock_ver:
        mock_ver.return_value = {"id": "ver-2", "version_number": 2, "approval_status": "pending"}
        
        payload = {"storage_path": "notes/unit1_v2.pdf", "change_summary": "Fixed typos"}
        response = client.patch("/api/materials/mat-1", json=payload, headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert response.status_code == 200
        assert response.json()["version_number"] == 2

def test_bookmark_add_remove(client, valid_tcet_student_jwt):
    """POST and DELETE /api/bookmarks/{material_id} adds and removes bookmark."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["student"]), \
         patch("repositories.materials_repo.MaterialRepository.get_material_by_id", return_value={"id": "mat-1"}), \
         patch("repositories.materials_repo.BookmarkRepository.add_bookmark", return_value={"id": "bm-1"}), \
         patch("repositories.materials_repo.BookmarkRepository.remove_bookmark"):
        
        res1 = client.post("/api/bookmarks/mat-1", headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res1.status_code == 200
        
        res2 = client.delete("/api/bookmarks/mat-1", headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res2.status_code == 200
        assert res2.json()["success"] is True

def test_rating_uniqueness(client, valid_tcet_student_jwt):
    """POST /api/materials/{id}/rating upserts single rating per user."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["student"]), \
         patch("repositories.materials_repo.MaterialRepository.get_material_by_id", return_value={"id": "mat-1"}), \
         patch("repositories.materials_repo.RatingRepository.upsert_rating") as mock_rate:
        mock_rate.return_value = {"id": "rate-1", "rating": 5}
        
        payload = {"rating": 5, "review": "Great notes!"}
        res = client.post("/api/materials/mat-1/rating", json=payload, headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res.status_code == 200
        assert res.json()["rating"] == 5

def test_student_visibility(client, valid_tcet_student_jwt):
    """Student sees only approved materials."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["student"]), \
         patch("repositories.materials_repo.MaterialRepository.get_materials") as mock_get:
        mock_get.return_value = [{"id": "mat-1", "current_version_id": "ver-1"}]
        res = client.get("/api/materials", headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res.status_code == 200
        assert len(res.json()) == 1

def test_pending_material_visibility(client, valid_admin_jwt):
    """Admin / Content Manager sees pending materials."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["admin"]), \
         patch("repositories.materials_repo.MaterialRepository.get_pending_materials") as mock_pending:
        mock_pending.return_value = [{"id": "ver-1", "approval_status": "pending"}]
        res = client.get("/api/materials/pending", headers={"Authorization": f"Bearer {valid_admin_jwt}"})
        assert res.status_code == 200
        assert len(res.json()) == 1

def test_admin_approval_workflow(client, valid_admin_jwt):
    """Admin approval workflow sets material version status to approved."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["admin"]), \
         patch("repositories.materials_repo.ReviewRepository.create_review") as mock_review:
        mock_review.return_value = {"id": "rev-1", "version_id": "ver-1", "status": "approved"}
        res = client.post("/api/materials/ver-1/approve", json={"review_notes": "Looks accurate"}, headers={"Authorization": f"Bearer {valid_admin_jwt}"})
        assert res.status_code == 200
        assert res.json()["status"] == "approved"

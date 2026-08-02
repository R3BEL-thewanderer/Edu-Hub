import pytest
from unittest.mock import patch, MagicMock

def test_storage_path_generation():
    """Verify storage path generated matches exact academic hierarchy requirements."""
    from services.storage_service import StorageService
    service = StorageService()
    path = service.generate_storage_path(
        academic_year="2026-27",
        department="IT",
        semester="sem1",
        subject_name="DBMS",
        category="notes",
        filename="module1.pdf"
    )
    assert path == "notes/2026-27/IT/sem1/DBMS/notes/module1.pdf"

def test_2026_27_hierarchy_generation():
    """Verify 2026-27 IT folder structure generation creates 5 subjects per semester with 5 category subfolders."""
    from services.storage_service import StorageService
    service = StorageService()
    with patch("repositories.storage_repo.StorageRepository.upload_file_bytes"):
        folders = service.generate_hierarchy_folders("2026-27", "IT")
        # 2 semesters * 5 subjects * 5 categories = 50 folder paths
        assert len(folders) == 50
        assert "notes/2026-27/IT/sem1/Subject-1/notes/" in folders
        assert "notes/2026-27/IT/sem1/Subject-5/videos/" in folders
        assert "notes/2026-27/IT/sem2/Subject-5/videos/" in folders

def test_file_upload(client, valid_tcet_student_jwt):
    """POST /api/storage/upload uploads file and returns generated storage path."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["content_manager"]), \
         patch("repositories.storage_repo.StorageRepository.file_exists", return_value=False), \
         patch("repositories.storage_repo.StorageRepository.upload_file_bytes", return_value="notes/2026-27/IT/sem1/DBMS/notes/test.pdf"):
        
        files = {"file": ("test.pdf", b"%PDF-1.4 test content", "application/pdf")}
        data = {
            "academic_year": "2026-27",
            "department": "IT",
            "semester": "sem1",
            "subject_name": "DBMS",
            "category": "notes"
        }
        res = client.post("/api/storage/upload", files=files, data=data, headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res.status_code == 200
        assert res.json()["storage_path"] == "notes/2026-27/IT/sem1/DBMS/notes/test.pdf"

def test_duplicate_filename_handling(client, valid_tcet_student_jwt):
    """POST /api/storage/upload appends suffix if filename exists."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["content_manager"]), \
         patch("repositories.storage_repo.StorageRepository.file_exists", return_value=True), \
         patch("repositories.storage_repo.StorageRepository.upload_file_bytes") as mock_upload:
        
        mock_upload.return_value = "notes/2026-27/IT/sem1/DBMS/notes/test_1.pdf"
        files = {"file": ("test.pdf", b"%PDF-1.4 test content", "application/pdf")}
        data = {
            "academic_year": "2026-27",
            "department": "IT",
            "semester": "sem1",
            "subject_name": "DBMS",
            "category": "notes"
        }
        res = client.post("/api/storage/upload", files=files, data=data, headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res.status_code == 200
        assert "test_1.pdf" in res.json()["storage_path"]

def test_invalid_mime_type_rejection(client, valid_tcet_student_jwt):
    """POST /api/storage/upload rejects invalid MIME types with 422."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["content_manager"]):
        files = {"file": ("script.exe", b"binary data", "application/x-msdownload")}
        data = {
            "academic_year": "2026-27",
            "department": "IT",
            "semester": "sem1",
            "subject_name": "DBMS",
            "category": "notes"
        }
        res = client.post("/api/storage/upload", files=files, data=data, headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res.status_code == 422
        assert "MIME type" in res.json()["detail"]

def test_large_file_rejection(client, valid_tcet_student_jwt):
    """POST /api/storage/upload rejects files exceeding 50MB with 413."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["content_manager"]):
        large_content = b"0" * (51 * 1024 * 1024)
        files = {"file": ("large.pdf", large_content, "application/pdf")}
        data = {
            "academic_year": "2026-27",
            "department": "IT",
            "semester": "sem1",
            "subject_name": "DBMS",
            "category": "notes"
        }
        res = client.post("/api/storage/upload", files=files, data=data, headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res.status_code == 413

def test_signed_url_generation(client, valid_tcet_student_jwt):
    """POST /api/storage/signed-url returns 1-hour signed URL."""
    with patch("repositories.storage_repo.StorageRepository.generate_signed_url", return_value="https://supabase.co/storage/v1/object/sign/notes.pdf?token=xyz"):
        payload = {"file_path": "notes/2026-27/IT/sem1/DBMS/notes/module1.pdf"}
        res = client.post("/api/storage/signed-url", json=payload, headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res.status_code == 200
        assert "signed_url" in res.json()
        assert res.json()["expires_in_seconds"] == 3600

def test_delete_file_admin_only(client, valid_tcet_student_jwt, valid_admin_jwt):
    """DELETE /api/storage/file forbids student and allows admin."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["student"]):
        res1 = client.delete("/api/storage/file?file_path=notes/sample.pdf", headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res1.status_code == 403

    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["admin"]), \
         patch("repositories.storage_repo.StorageRepository.delete_file", return_value=True):
        res2 = client.delete("/api/storage/file?file_path=notes/sample.pdf", headers={"Authorization": f"Bearer {valid_admin_jwt}"})
        assert res2.status_code == 200
        assert res2.json()["success"] is True

def test_replace_file_faculty(client, valid_faculty_jwt):
    """POST /api/storage/replace allows faculty to replace existing file."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["faculty"]), \
         patch("repositories.storage_repo.StorageRepository.replace_file", return_value="notes/sample.pdf"):
        
        files = {"file": ("new_sample.pdf", b"%PDF-1.4 new data", "application/pdf")}
        data = {"file_path": "notes/sample.pdf"}
        res = client.post("/api/storage/replace", files=files, data=data, headers={"Authorization": f"Bearer {valid_faculty_jwt}"})
        assert res.status_code == 200
        assert res.json()["storage_path"] == "notes/sample.pdf"

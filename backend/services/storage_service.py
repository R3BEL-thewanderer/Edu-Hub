import re
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status, UploadFile
from repositories.storage_repo import StorageRepository
from repositories.academics_repo import AcademicRepository

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "video/mp4"
}

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB limit

CATEGORY_SUBFOLDERS = {"notes", "pyqs", "assignments", "presentations", "videos"}

class StorageService:
    def __init__(self):
        self.storage_repo = StorageRepository()
        self.academic_repo = AcademicRepository()

    def generate_storage_path(
        self, 
        academic_year: str, 
        department: str, 
        semester: str, 
        subject_name: str, 
        category: str, 
        filename: str
    ) -> str:
        """
        Generates dynamic path matching requirement:
        notes/{academic_year}/{department}/{semester}/{subject}/{category}/{filename}
        Example: notes/2026-27/IT/sem1/DBMS/notes/module1.pdf
        """
        # Sanitize parts
        clean_ay = academic_year.strip()
        clean_dept = department.strip().upper()
        clean_sem = semester.strip().lower()
        clean_subj = re.sub(r'[^a-zA-Z0-9_-]', '_', subject_name.strip())
        clean_cat = category.strip().lower()
        clean_file = re.sub(r'[^a-zA-Z0-9._-]', '_', filename.strip())

        if clean_cat not in CATEGORY_SUBFOLDERS:
            clean_cat = "notes"

        return f"notes/{clean_ay}/{clean_dept}/{clean_sem}/{clean_subj}/{clean_cat}/{clean_file}"

    def validate_file(self, content_type: str, file_size: int) -> None:
        """Validates MIME type and file size."""
        if content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
                detail=f"MIME type '{content_type}' is not allowed."
            )
        if file_size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, 
                detail=f"File size exceeds limit of 50MB."
            )

    def upload_file(
        self, 
        academic_year: str, 
        department: str, 
        semester: str, 
        subject_name: str, 
        category: str, 
        filename: str, 
        file_bytes: bytes, 
        content_type: str
    ) -> Dict[str, Any]:
        """Validates, generates path, handles duplicate filenames, and uploads file."""
        self.validate_file(content_type, len(file_bytes))
        storage_path = self.generate_storage_path(
            academic_year, department, semester, subject_name, category, filename
        )

        # Handle duplicate filenames
        if self.storage_repo.file_exists(storage_path):
            name_parts = filename.rsplit(".", 1)
            new_filename = f"{name_parts[0]}_1.{name_parts[1]}" if len(name_parts) > 1 else f"{filename}_1"
            storage_path = self.generate_storage_path(
                academic_year, department, semester, subject_name, category, new_filename
            )

        uploaded_path = self.storage_repo.upload_file_bytes(storage_path, file_bytes, content_type)
        return {
            "storage_path": uploaded_path,
            "filename": filename,
            "file_size": len(file_bytes),
            "mime_type": content_type
        }

    def generate_signed_url(self, file_path: str, download: bool = False) -> str:
        """Generates 1-hour signed URL."""
        return self.storage_repo.generate_signed_url(file_path, expires_in_seconds=3600, download=download)

    def delete_file(self, file_path: str) -> bool:
        return self.storage_repo.delete_file(file_path)

    def replace_file(self, file_path: str, file_bytes: bytes, content_type: str) -> Dict[str, Any]:
        self.validate_file(content_type, len(file_bytes))
        uploaded_path = self.storage_repo.replace_file(file_path, file_bytes, content_type)
        return {
            "storage_path": uploaded_path,
            "file_size": len(file_bytes),
            "mime_type": content_type
        }

    def generate_hierarchy_folders(
        self, 
        academic_year: str = "2026-27", 
        department: str = "IT"
    ) -> List[str]:
        """
        Pre-creates and returns standard folder paths for 2026-27 IT department
        with 5 subjects per semester (sem1 & sem2) and 5 category subfolders each.
        """
        folders = []
        semesters = ["sem1", "sem2"]
        subjects_per_sem = {
            "sem1": ["Subject-1", "Subject-2", "Subject-3", "Subject-4", "Subject-5"],
            "sem2": ["Subject-1", "Subject-2", "Subject-3", "Subject-4", "Subject-5"]
        }
        categories = ["notes", "pyqs", "assignments", "presentations", "videos"]

        for sem in semesters:
            for subj in subjects_per_sem[sem]:
                for cat in categories:
                    folder_path = f"notes/{academic_year}/{department}/{sem}/{subj}/{cat}/"
                    folders.append(folder_path)
                    # Upload a dummy .keep file to instantiate empty directory structure in Supabase
                    self.storage_repo.upload_file_bytes(f"{folder_path}.keep", b"", "text/plain")

        return folders

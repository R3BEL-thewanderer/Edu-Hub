from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, HTTPException, status
from typing import Optional
from pydantic import BaseModel
from dependencies.auth import (
    require_user, 
    require_student, 
    require_content_manager, 
    require_faculty, 
    require_admin
)
from services.storage_service import StorageService

router = APIRouter()
storage_service = StorageService()

class SignedUrlRequest(BaseModel):
    file_path: str
    download: bool = False

class ReplaceFileRequest(BaseModel):
    file_path: str

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    academic_year: str = Form(...),
    department: str = Form(...),
    semester: str = Form(...),
    subject_name: str = Form(...),
    category: str = Form("notes"),
    user: dict = Depends(require_content_manager)
):
    """Uploads file to Supabase Storage with dynamic path generation & RBAC enforcement."""
    content = await file.read()
    return storage_service.upload_file(
        academic_year=academic_year,
        department=department,
        semester=semester,
        subject_name=subject_name,
        category=category,
        filename=file.filename or "unnamed_file",
        file_bytes=content,
        content_type=file.content_type or "application/pdf"
    )

@router.post("/signed-url")
def get_signed_url(req: SignedUrlRequest, user: dict = Depends(require_user)):
    """Generates 1-hour signed URL for file access."""
    url = storage_service.generate_signed_url(req.file_path, download=req.download)
    return {"signed_url": url, "expires_in_seconds": 3600}

@router.delete("/file")
def delete_file(file_path: str = Query(...), user: dict = Depends(require_admin)):
    """Deletes file from storage (Admin / Super Admin)."""
    storage_service.delete_file(file_path)
    return {"success": True, "message": f"File '{file_path}' deleted successfully."}

@router.post("/replace")
async def replace_file(
    file_path: str = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(require_faculty)
):
    """Replaces file in storage (Faculty, Admin, Super Admin)."""
    content = await file.read()
    return storage_service.replace_file(
        file_path=file_path,
        file_bytes=content,
        content_type=file.content_type or "application/pdf"
    )

@router.post("/precreate-hierarchy")
def precreate_hierarchy(
    academic_year: str = Query("2026-27"),
    department: str = Query("IT"),
    user: dict = Depends(require_admin)
):
    """Pre-creates standard 5-subject folder hierarchy for specified academic year and department."""
    folders = storage_service.generate_hierarchy_folders(academic_year, department)
    return {
        "success": True,
        "academic_year": academic_year,
        "department": department,
        "folders_created": len(folders),
        "folder_paths": folders
    }

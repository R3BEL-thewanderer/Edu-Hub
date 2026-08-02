from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from dependencies.auth import (
    require_user, 
    require_student, 
    require_content_manager, 
    require_faculty, 
    require_admin
)
from services.academics_service import (
    AcademicService, 
    MaterialService, 
    ReviewService, 
    RatingService, 
    BookmarkService
)

academics_router = APIRouter()
materials_router = APIRouter()
bookmarks_router = APIRouter()

academic_service = AcademicService()
material_service = MaterialService()
review_service = ReviewService()
rating_service = RatingService()
bookmark_service = BookmarkService()

# ─── Pydantic Schemas ──────────────────────────────────────────
class CreateMaterialRequest(BaseModel):
    subject_id: str
    material_type: str
    title: str
    description: Optional[str] = None
    storage_path: str
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    youtube_url: Optional[str] = None
    duration: Optional[str] = None
    thumbnail_url: Optional[str] = None
    exam_year: Optional[str] = None

class CreateMaterialVersionRequest(BaseModel):
    storage_path: str
    change_summary: Optional[str] = None
    file_size_bytes: Optional[int] = None
    mime_type: Optional[str] = None
    youtube_url: Optional[str] = None
    duration: Optional[str] = None
    thumbnail_url: Optional[str] = None
    exam_year: Optional[str] = None

class ReviewRequest(BaseModel):
    review_notes: Optional[str] = None

class RatingRequest(BaseModel):
    rating: int
    review: Optional[str] = None


# ─── Academics Endpoints ───────────────────────────────────────
@academics_router.get("/departments")
def list_departments():
    return academic_service.get_departments()

@academics_router.get("/academic-years")
def list_academic_years():
    return academic_service.get_academic_years()

@academics_router.get("/semesters")
def list_semesters(
    academic_year_id: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None)
):
    return academic_service.get_semesters(academic_year_id, department_id)

@academics_router.get("/subjects")
def list_subjects(semester_id: Optional[str] = Query(None)):
    return academic_service.get_subjects(semester_id)

@academics_router.get("/subjects/{id}")
def get_subject(id: str):
    return academic_service.get_subject_by_id(id)


# ─── Study Materials Endpoints ─────────────────────────────────
@materials_router.get("/materials")
def list_materials(
    subject_id: Optional[str] = Query(None),
    material_type: Optional[str] = Query(None),
    academic_year_id: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None),
    semester_id: Optional[str] = Query(None),
    approval_status: Optional[str] = Query(None),
    user: dict = Depends(require_user)
):
    user_id = user["sub"]
    roles = user.get("roles", [])
    return material_service.get_materials(
        subject_id=subject_id, 
        material_type=material_type, 
        academic_year_id=academic_year_id,
        department_id=department_id,
        semester_id=semester_id,
        approval_status=approval_status,
        user_id=user_id, 
        user_roles=roles
    )

@materials_router.get("/materials/pending")
def list_pending_materials(user: dict = Depends(require_content_manager)):
    return material_service.get_pending_materials()

@materials_router.get("/materials/{id}")
def get_material(id: str, user: dict = Depends(require_user)):
    user_id = user["sub"]
    roles = user.get("roles", [])
    return material_service.get_material_by_id(id, user_id=user_id, user_roles=roles)

@materials_router.post("/materials")
def create_material(req: CreateMaterialRequest, user: dict = Depends(require_content_manager)):
    user_id = user["sub"]
    roles = user.get("roles", [])
    return material_service.create_material(
        subject_id=req.subject_id,
        material_type=req.material_type,
        title=req.title,
        description=req.description,
        storage_path=req.storage_path,
        uploaded_by=user_id,
        user_roles=roles,
        file_size_bytes=req.file_size_bytes,
        mime_type=req.mime_type,
        youtube_url=req.youtube_url,
        duration=req.duration,
        thumbnail_url=req.thumbnail_url,
        exam_year=req.exam_year
    )

@materials_router.patch("/materials/{id}")
def create_material_version(id: str, req: CreateMaterialVersionRequest, user: dict = Depends(require_content_manager)):
    user_id = user["sub"]
    roles = user.get("roles", [])
    return material_service.create_new_version(
        material_id=id,
        storage_path=req.storage_path,
        uploaded_by=user_id,
        user_roles=roles,
        change_summary=req.change_summary,
        file_size_bytes=req.file_size_bytes,
        mime_type=req.mime_type,
        youtube_url=req.youtube_url,
        duration=req.duration,
        thumbnail_url=req.thumbnail_url,
        exam_year=req.exam_year
    )

@materials_router.delete("/materials/{id}")
def delete_material(id: str, user: dict = Depends(require_content_manager)):
    user_id = user["sub"]
    roles = user.get("roles", [])
    material_service.delete_material(id, user_id=user_id, user_roles=roles)
    return {"success": True, "message": "Material deleted"}


# ─── Material Review Endpoints ────────────────────────────────
@materials_router.post("/materials/{id}/submit")
def submit_material_review(id: str, user: dict = Depends(require_content_manager)):
    # Since the prompt says "Editing an approved material MUST create a new pending version."
    # Creating a new version already marks it 'pending'. We don't have a specific submit service
    # except maybe if they uploaded as 'draft'. Since create maps it to 'pending'
    # we'll just confirm it.
    from services.supabase_client import get_supabase
    get_supabase().table("material_versions").update({"approval_status": "pending"}).eq("id", id).execute()
    return {"success": True, "message": "Material version submitted for review", "version_id": id}

@materials_router.post("/materials/{id}/approve")
def approve_material_version(id: str, req: Optional[ReviewRequest] = None, user: dict = Depends(require_admin)):
    reviewer_id = user["sub"]
    notes = req.review_notes if req else None
    return review_service.approve_material_version(version_id=id, reviewer_id=reviewer_id, notes=notes)

@materials_router.post("/materials/{id}/reject")
def reject_material_version(id: str, req: Optional[ReviewRequest] = None, user: dict = Depends(require_admin)):
    reviewer_id = user["sub"]
    notes = req.review_notes if req else None
    return review_service.reject_material_version(version_id=id, reviewer_id=reviewer_id, notes=notes)


# ─── Rating Endpoints ──────────────────────────────────────────
@materials_router.post("/materials/{id}/rating")
def rate_material(id: str, req: RatingRequest, user: dict = Depends(require_student)):
    user_id = user["sub"]
    return rating_service.add_rating(material_id=id, user_id=user_id, rating=req.rating, review=req.review)

@materials_router.get("/materials/{id}/ratings")
def get_material_ratings(id: str):
    return rating_service.get_ratings(id)


# ─── Bookmark Endpoints ────────────────────────────────────────
@bookmarks_router.post("/bookmarks/{material_id}")
def add_bookmark(material_id: str, user: dict = Depends(require_student)):
    user_id = user["sub"]
    return bookmark_service.add_bookmark(user_id=user_id, material_id=material_id)

@bookmarks_router.delete("/bookmarks/{material_id}")
def remove_bookmark(material_id: str, user: dict = Depends(require_student)):
    user_id = user["sub"]
    bookmark_service.remove_bookmark(user_id=user_id, material_id=material_id)
    return {"success": True, "message": "Bookmark removed"}

@bookmarks_router.get("/bookmarks")
def list_bookmarks(user: dict = Depends(require_student)):
    user_id = user["sub"]
    return bookmark_service.get_user_bookmarks(user_id=user_id)

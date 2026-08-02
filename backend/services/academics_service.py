from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from repositories.academics_repo import AcademicRepository
from repositories.materials_repo import (
    MaterialRepository, 
    ReviewRepository, 
    RatingRepository, 
    BookmarkRepository
)

class AcademicService:
    def __init__(self):
        self.repo = AcademicRepository()

    def get_departments(self) -> List[Dict[str, Any]]:
        return self.repo.get_departments()

    def get_academic_years(self) -> List[Dict[str, Any]]:
        return self.repo.get_academic_years()

    def get_semesters(self, academic_year_id: Optional[str] = None, department_id: Optional[str] = None) -> List[Dict[str, Any]]:
        return self.repo.get_semesters(academic_year_id, department_id)

    def get_subjects(self, semester_id: Optional[str] = None) -> List[Dict[str, Any]]:
        return self.repo.get_subjects(semester_id)

    def get_subject_by_id(self, subject_id: str) -> Dict[str, Any]:
        subject = self.repo.get_subject_by_id(subject_id)
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        return subject


class MaterialService:
    def __init__(self):
        self.material_repo = MaterialRepository()
        self.academic_repo = AcademicRepository()

    def get_materials(
        self, 
        subject_id: Optional[str] = None, 
        material_type: Optional[str] = None, 
        academic_year_id: Optional[str] = None,
        department_id: Optional[str] = None,
        semester_id: Optional[str] = None,
        approval_status: Optional[str] = None,
        user_id: Optional[str] = None, 
        user_roles: List[str] = []
    ) -> List[Dict[str, Any]]:
        is_elevated = any(r in ["admin", "super_admin", "faculty", "content_manager"] for r in user_roles)
        
        # Enforce approval status override for students
        if not is_elevated and approval_status != "approved":
            # If not elevated, they can only view approved materials or their own pending materials.
            # We'll fetch all matching and filter in python for their own if they requested pending.
            pass
            
        final_approval_status = approval_status
        if not is_elevated and not approval_status:
           final_approval_status = "approved"

        filter_subject_ids = None
        if academic_year_id or department_id or semester_id:
            semesters = self.academic_repo.get_semesters(academic_year_id, department_id)
            sem_ids = [s["id"] for s in semesters]
            if semester_id and semester_id in sem_ids:
                sem_ids = [semester_id]
            elif semester_id and not (academic_year_id or department_id):
                sem_ids = [semester_id]
                
            subjects = []
            for s_id in sem_ids:
                subjects.extend(self.academic_repo.get_subjects(s_id))
            
            filter_subject_ids = [s["id"] for s in subjects]
            if subject_id and subject_id not in filter_subject_ids:
                return []
            if subject_id:
                filter_subject_ids = [subject_id]
        elif subject_id:
            filter_subject_ids = [subject_id]
            
        materials = self.material_repo.get_materials(
            subject_ids=filter_subject_ids, 
            material_type=material_type, 
            approval_status=final_approval_status
        )
        
        if not is_elevated:
            # Students see approved materials or their own pending uploads
            return [
                m for m in materials 
                if m.get("current_version_id") is not None or m.get("uploaded_by") == user_id
            ]
        return materials

    def get_material_by_id(self, material_id: str, user_id: Optional[str] = None, user_roles: List[str] = []) -> Dict[str, Any]:
        material = self.material_repo.get_material_by_id(material_id)
        if not material:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study material not found")

        is_elevated = any(r in ["admin", "super_admin", "faculty", "content_manager"] for r in user_roles)
        if not is_elevated and material.get("current_version_id") is None and material.get("uploaded_by") != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access to pending material denied")

        return material

    def create_material(
        self, 
        subject_id: str, 
        material_type: str, 
        title: str, 
        description: Optional[str], 
        storage_path: str,
        uploaded_by: str,
        user_roles: List[str],
        file_size_bytes: Optional[int] = None,
        mime_type: Optional[str] = None,
        youtube_url: Optional[str] = None,
        duration: Optional[str] = None,
        thumbnail_url: Optional[str] = None,
        exam_year: Optional[str] = None
    ) -> Dict[str, Any]:
        # Check subject existence
        subject = self.academic_repo.get_subject_by_id(subject_id)
        if not subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")

        is_official = "faculty" in user_roles or "admin" in user_roles or "super_admin" in user_roles
        
        material = self.material_repo.create_material(
            subject_id=subject_id,
            material_type=material_type,
            title=title,
            description=description,
            uploaded_by=uploaded_by,
            is_official=is_official
        )

        version = self.material_repo.create_version(
            material_id=material["id"],
            version_number=1,
            storage_path=storage_path,
            uploaded_by=uploaded_by,
            file_size_bytes=file_size_bytes,
            mime_type=mime_type,
            youtube_url=youtube_url,
            duration=duration,
            thumbnail_url=thumbnail_url,
            exam_year=exam_year,
            approval_status="pending"
        )

        material["latest_version"] = version
        return material

    def create_new_version(
        self,
        material_id: str,
        storage_path: str,
        uploaded_by: str,
        user_roles: List[str],
        change_summary: Optional[str] = None,
        file_size_bytes: Optional[int] = None,
        mime_type: Optional[str] = None,
        youtube_url: Optional[str] = None,
        duration: Optional[str] = None,
        thumbnail_url: Optional[str] = None,
        exam_year: Optional[str] = None
    ) -> Dict[str, Any]:
        material = self.get_material_by_id(material_id, user_id=uploaded_by, user_roles=user_roles)

        # Content managers can edit only their own pending materials
        if "content_manager" in user_roles and not any(r in ["admin", "super_admin", "faculty"] for r in user_roles):
            if material["uploaded_by"] != uploaded_by:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit material uploaded by another user")

        latest_version = self.material_repo.get_latest_version(material_id)
        next_version_num = (latest_version["version_number"] + 1) if latest_version else 1

        version = self.material_repo.create_version(
            material_id=material_id,
            version_number=next_version_num,
            storage_path=storage_path,
            uploaded_by=uploaded_by,
            file_size_bytes=file_size_bytes,
            mime_type=mime_type,
            youtube_url=youtube_url,
            duration=duration,
            thumbnail_url=thumbnail_url,
            exam_year=exam_year,
            change_summary=change_summary,
            approval_status="pending"
        )
        return version

    def delete_material(self, material_id: str, user_id: str, user_roles: List[str]) -> None:
        material = self.get_material_by_id(material_id, user_id=user_id, user_roles=user_roles)
        
        is_admin = any(r in ["admin", "super_admin"] for r in user_roles)
        if not is_admin and material["uploaded_by"] != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins or the uploader can delete this material")

        self.material_repo.soft_delete_material(material_id, deleted_by=user_id)

    def get_pending_materials(self) -> List[Dict[str, Any]]:
        return self.material_repo.get_pending_materials()


class ReviewService:
    def __init__(self):
        self.review_repo = ReviewRepository()
        self.material_repo = MaterialRepository()

    def approve_material_version(self, version_id: str, reviewer_id: str, notes: Optional[str] = None) -> Dict[str, Any]:
        return self.review_repo.create_review(
            version_id=version_id,
            reviewer_id=reviewer_id,
            status="approved",
            review_notes=notes
        )

    def reject_material_version(self, version_id: str, reviewer_id: str, notes: Optional[str] = None) -> Dict[str, Any]:
        return self.review_repo.create_review(
            version_id=version_id,
            reviewer_id=reviewer_id,
            status="rejected",
            review_notes=notes
        )


class RatingService:
    def __init__(self):
        self.rating_repo = RatingRepository()
        self.material_repo = MaterialRepository()

    def add_rating(self, material_id: str, user_id: str, rating: int, review: Optional[str] = None) -> Dict[str, Any]:
        material = self.material_repo.get_material_by_id(material_id)
        if not material:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
            
        if rating < 1 or rating > 5:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Rating must be between 1 and 5")

        return self.rating_repo.upsert_rating(material_id, user_id, rating, review)

    def get_ratings(self, material_id: str) -> List[Dict[str, Any]]:
        return self.rating_repo.get_ratings(material_id)


class BookmarkService:
    def __init__(self):
        self.bookmark_repo = BookmarkRepository()
        self.material_repo = MaterialRepository()

    def add_bookmark(self, user_id: str, material_id: str) -> Dict[str, Any]:
        material = self.material_repo.get_material_by_id(material_id)
        if not material:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")

        try:
            return self.bookmark_repo.add_bookmark(user_id, material_id)
        except Exception as e:
            if "duplicate" in str(e).lower() or "unique constraint" in str(e).lower():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Material already bookmarked")
            raise e

    def remove_bookmark(self, user_id: str, material_id: str) -> None:
        self.bookmark_repo.remove_bookmark(user_id, material_id)

    def get_user_bookmarks(self, user_id: str) -> List[Dict[str, Any]]:
        return self.bookmark_repo.get_user_bookmarks(user_id)

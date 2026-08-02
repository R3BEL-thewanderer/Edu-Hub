from typing import List, Dict, Any, Optional
from services.supabase_client import get_supabase

class MaterialRepository:
    def __init__(self):
        self.supabase = get_supabase()

    def get_materials(
        self, 
        subject_ids: Optional[List[str]] = None, 
        material_type: Optional[str] = None, 
        approval_status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        query = self.supabase.table("study_materials").select(
            "*, material_versions(*), profiles:uploaded_by(full_name, email)"
        ).is_("deleted_at", "null")

        if subject_ids is not None:
            if not subject_ids:
                return [] # Empty list provided, return empty
            query = query.in_("subject_id", subject_ids)
            
        if material_type:
            query = query.eq("material_type", material_type)

        res = query.order("created_at", desc=True).execute()
        
        # In-memory approval filter for current_version_id
        materials = res.data or []
        if approval_status == "approved":
            materials = [m for m in materials if m.get("current_version_id") is not None]
        elif approval_status == "pending":
            materials = [m for m in materials if m.get("current_version_id") is None]
            
        return materials

    def get_material_by_id(self, material_id: str) -> Optional[Dict[str, Any]]:
        res = self.supabase.table("study_materials").select(
            "*, material_versions(*), profiles:uploaded_by(full_name, email)"
        ).eq("id", material_id).is_("deleted_at", "null").single().execute()
        return res.data if res else None

    def create_material(
        self, 
        subject_id: str, 
        material_type: str, 
        title: str, 
        description: Optional[str], 
        uploaded_by: str, 
        is_official: bool = False
    ) -> Dict[str, Any]:
        data = {
            "subject_id": subject_id,
            "material_type": material_type,
            "title": title,
            "description": description,
            "uploaded_by": uploaded_by,
            "is_official": is_official
        }
        res = self.supabase.table("study_materials").insert(data).execute()
        return res.data[0]

    def create_version(
        self,
        material_id: str,
        version_number: int,
        storage_path: str,
        uploaded_by: str,
        file_size_bytes: Optional[int] = None,
        mime_type: Optional[str] = None,
        youtube_url: Optional[str] = None,
        duration: Optional[str] = None,
        thumbnail_url: Optional[str] = None,
        exam_year: Optional[str] = None,
        change_summary: Optional[str] = None,
        approval_status: str = "pending"
    ) -> Dict[str, Any]:
        data = {
            "material_id": material_id,
            "version_number": version_number,
            "storage_path": storage_path,
            "uploaded_by": uploaded_by,
            "file_size_bytes": file_size_bytes,
            "mime_type": mime_type,
            "youtube_url": youtube_url,
            "duration": duration,
            "thumbnail_url": thumbnail_url,
            "exam_year": exam_year,
            "change_summary": change_summary,
            "approval_status": approval_status
        }
        res = self.supabase.table("material_versions").insert(data).execute()
        return res.data[0]

    def get_latest_version(self, material_id: str) -> Optional[Dict[str, Any]]:
        res = self.supabase.table("material_versions").select("*").eq("material_id", material_id).order("version_number", desc=True).limit(1).execute()
        return res.data[0] if res.data else None

    def update_material(self, material_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        res = self.supabase.table("study_materials").update(updates).eq("id", material_id).execute()
        return res.data[0] if res.data else {}

    def soft_delete_material(self, material_id: str, deleted_by: str) -> None:
        self.supabase.table("study_materials").update({
            "deleted_at": "now()",
            "deleted_by": deleted_by
        }).eq("id", material_id).execute()

    def get_pending_materials(self) -> List[Dict[str, Any]]:
        res = self.supabase.table("material_versions").select(
            "*, study_materials(*), profiles:uploaded_by(full_name, email)"
        ).eq("approval_status", "pending").order("created_at", desc=True).execute()
        return res.data or []


class ReviewRepository:
    def __init__(self):
        self.supabase = get_supabase()

    def create_review(self, version_id: str, reviewer_id: str, status: str, review_notes: Optional[str] = None) -> Dict[str, Any]:
        data = {
            "version_id": version_id,
            "reviewer_id": reviewer_id,
            "status": status,
            "review_notes": review_notes
        }
        res = self.supabase.table("material_reviews").insert(data).execute()
        return res.data[0]

    def get_reviews_by_version(self, version_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("material_reviews").select("*").eq("version_id", version_id).execute()
        return res.data or []


class RatingRepository:
    def __init__(self):
        self.supabase = get_supabase()

    def upsert_rating(self, material_id: str, user_id: str, rating: int, review: Optional[str] = None) -> Dict[str, Any]:
        data = {
            "material_id": material_id,
            "user_id": user_id,
            "rating": rating,
            "review": review
        }
        res = self.supabase.table("material_ratings").upsert(data, on_conflict="material_id, user_id").execute()
        return res.data[0]

    def get_ratings(self, material_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("material_ratings").select(
            "*, profiles:user_id(full_name)"
        ).eq("material_id", material_id).order("created_at", desc=True).execute()
        return res.data or []


class BookmarkRepository:
    def __init__(self):
        self.supabase = get_supabase()

    def add_bookmark(self, user_id: str, material_id: str) -> Dict[str, Any]:
        data = {"user_id": user_id, "material_id": material_id}
        res = self.supabase.table("bookmarks").insert(data).execute()
        return res.data[0]

    def remove_bookmark(self, user_id: str, material_id: str) -> None:
        self.supabase.table("bookmarks").delete().eq("user_id", user_id).eq("material_id", material_id).execute()

    def get_user_bookmarks(self, user_id: str) -> List[Dict[str, Any]]:
        res = self.supabase.table("bookmarks").select(
            "*, study_materials(*, material_versions(*))"
        ).eq("user_id", user_id).order("created_at", desc=True).execute()
        return res.data or []

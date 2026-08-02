from typing import List, Dict, Any, Optional
from services.supabase_client import get_supabase

class AcademicRepository:
    def __init__(self):
        self.supabase = get_supabase()

    def get_departments(self) -> List[Dict[str, Any]]:
        res = self.supabase.table("departments").select("*").is_("deleted_at", "null").eq("is_active", True).execute()
        return res.data or []

    def get_academic_years(self) -> List[Dict[str, Any]]:
        res = self.supabase.table("academic_years").select("*").order("start_year", desc=True).execute()
        return res.data or []

    def get_semesters(self, academic_year_id: Optional[str] = None, department_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.supabase.table("semesters").select("*").eq("is_active", True)
        if academic_year_id:
            query = query.eq("academic_year_id", academic_year_id)
        if department_id:
            query = query.eq("department_id", department_id)
        res = query.order("number").execute()
        return res.data or []

    def get_subjects(self, semester_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.supabase.table("subjects").select("*").is_("deleted_at", "null").eq("is_active", True)
        if semester_id:
            query = query.eq("semester_id", semester_id)
        res = query.order("display_order").execute()
        return res.data or []

    def get_subject_by_id(self, subject_id: str) -> Optional[Dict[str, Any]]:
        res = self.supabase.table("subjects").select("*").eq("id", subject_id).is_("deleted_at", "null").single().execute()
        return res.data if res else None

from fastapi import APIRouter, Depends, HTTPException
from core.auth import get_current_user
from services.supabase_client import supabase

router = APIRouter()

def get_semester_id(year_label: str, sem_string: str) -> str:
    """Helper to convert legacy '2025-26' and 'sem1' into a semester UUID"""
    sem_number = int(sem_string.replace("sem", ""))
    
    # 1. Get Academic Year
    ay_res = supabase().table("academic_years").select("id").eq("label", year_label).execute()
    if not ay_res.data:
        raise HTTPException(status_code=404, detail="Academic year not found")
    ay_id = ay_res.data[0]["id"]
    
    # 2. Get Semester
    sem_res = supabase().table("semesters").select("id").eq("academic_year_id", ay_id).eq("number", sem_number).execute()
    if not sem_res.data:
        raise HTTPException(status_code=404, detail="Semester not found")
    
    return sem_res.data[0]["id"]

@router.get("/{year}/{semester}")
def get_subjects(year: str, semester: str):
    """Returns subject list for a given year/semester. Public API — no auth required."""
    try:
        sem_id = get_semester_id(year, semester)
    except HTTPException:
        return []

    result = supabase().table("subjects").select(
        "id, name, code, icon, description, display_order, credits, is_active"
    ).eq("semester_id", sem_id).order("display_order").execute()
    
    return result.data or []

@router.get("/{year}/{semester}/{subject_id}")
def get_subject_detail(year: str, semester: str, subject_id: str):
    """Returns single subject details. Public API."""
    result = supabase().table("subjects").select("*").eq(
        "id", subject_id
    ).single().execute()
    
    if not result.data:
        return {"error": "Subject not found"}
    
    return result.data

@router.get("/{year}/{semester}/{subject_id}/files")
def get_subject_files(year: str, semester: str, subject_id: str, user: dict = Depends(get_current_user)):
    """Returns all files for a subject aligned with new study_materials schema. Requires auth."""
    
    # 1. Resolve subject_id: check if subject_id is a UUID or a subject code string
    subject_ids = [subject_id]
    try:
        # Check if subject_id is a subject code like 'pps', 'chemistry'
        subs_res = supabase().table("subjects").select("id").eq("code", subject_id.lower()).execute()
        if subs_res.data:
            subject_ids = [s["id"] for s in subs_res.data]
    except Exception as e:
        print(f"Subject lookup error: {e}")

    materials_res = supabase().table("study_materials").select(
        "*, material_versions!material_versions_material_id_fkey(*), profiles:uploaded_by(display_name, email)"
    ).in_("subject_id", subject_ids).is_("deleted_at", "null").order("created_at", desc=True).execute()
    
    raw_items = materials_res.data or []
    
    formatted_items = []
    for item in raw_items:
        versions = item.get("material_versions", [])
        latest_ver = versions[0] if isinstance(versions, list) and versions else {}
        
        # Flatten latest version details onto root item for frontend compatibility
        item["storage_path"] = latest_ver.get("storage_path") or item.get("storage_path")
        item["mime_type"] = latest_ver.get("mime_type") or "application/pdf"
        item["size_bytes"] = latest_ver.get("file_size_bytes") or 0
        item["exam_year"] = latest_ver.get("exam_year")
        item["youtube_url"] = latest_ver.get("youtube_url")
        item["duration"] = latest_ver.get("duration") or ""
        item["thumbnail_url"] = latest_ver.get("thumbnail_url")
        
        formatted_items.append(item)
    
    return {
        "notes": [i for i in formatted_items if i.get("material_type") in ["notes"]],
        "pdfs": [i for i in formatted_items if i.get("material_type") in ["pdf", "pdfs"]],
        "pyqs": [i for i in formatted_items if i.get("material_type") in ["pyq", "pyqs"]],
        "videos": [i for i in formatted_items if i.get("material_type") in ["video", "videos"]],
    }

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
from dependencies.auth import require_admin
from services.supabase_client import get_supabase
from services.storage import upload_file, delete_file as storage_delete

router = APIRouter()

@router.post("/upload")
async def admin_upload(
    file: UploadFile = File(...),
    year: str = Form(...),
    semester: str = Form(...),
    subjectId: str = Form(...),
    contentType: str = Form(...),  # notes, pdfs, pyqs
    title: str = Form(...),
    examYear: Optional[str] = Form(None),
    admin: dict = Depends(require_admin)
):
    # 1. Read file content
    content = await file.read()
    file_size = len(content)
    
    # 2. Build storage path: 2025-26/sem1/chemistry/pdfs/filename.pdf
    storage_path = f"{year}/{semester}/{subjectId}/{contentType}/{file.filename}"
    
    # 3. Upload to Supabase Storage
    upload_file(storage_path, content, file.content_type or "application/pdf")
    
    # 4. Insert file record into Supabase DB
    file_record = {
        "subject_id": subjectId,
        "year": year,
        "semester": semester,
        "content_type": contentType,
        "title": title,
        "storage_path": storage_path,
        "size_bytes": file_size,
        "mime_type": file.content_type or "application/pdf",
    }
    
    if examYear:
        file_record["exam_year"] = examYear
    
    client = get_supabase()
    result = client.table("files").insert(file_record).execute()
    
    # 5. Update subject stats
    count_col = f"{contentType}_count"
    client.rpc("increment_subject_stat", {
        "p_subject_id": subjectId,
        "p_column": count_col
    }).execute()
    
    return {
        "success": True, 
        "fileId": result.data[0]["id"] if result.data else None,
        "storagePath": storage_path
    }

class UploadVideoLinkRequest(BaseModel):
    year: str
    semester: str
    subjectId: str
    title: str
    youtubeUrl: str
    duration: Optional[str] = None

@router.post("/upload-video-link")
def admin_upload_video_link(req: UploadVideoLinkRequest, admin: dict = Depends(require_admin)):
    client = get_supabase()
    client.table("videos").insert({
        "subject_id": req.subjectId,
        "year": req.year,
        "semester": req.semester,
        "title": req.title,
        "video_type": "youtube",
        "youtube_url": req.youtubeUrl,
        "duration": req.duration,
    }).execute()
    
    return {"success": True}

@router.delete("/file/{file_id}")
def delete_file_route(file_id: str, admin: dict = Depends(require_admin)):
    client = get_supabase()
    result = client.table("files").select("storage_path").eq("id", file_id).single().execute()
    
    if result.data:
        storage_delete(result.data["storage_path"])
        client.table("files").delete().eq("id", file_id).execute()
    
    return {"success": True}

@router.get("/stats")
def get_stats(admin: dict = Depends(require_admin)):
    client = get_supabase()
    users_count = client.table("profiles").select("id", count="exact").execute()
    paid_count = client.table("user_roles").select("id", count="exact").execute()
    files_count = client.table("files").select("id", count="exact").execute()
    
    return {
        "totalUsers": users_count.count or 0,
        "paidSubscribers": paid_count.count or 0,
        "totalFiles": files_count.count or 0,
    }

class SubjectUpdateRequest(BaseModel):
    isLocked: Optional[bool] = None
    name: Optional[str] = None
    icon: Optional[str] = None

@router.patch("/subject/{subject_id}")
def update_subject(subject_id: str, req: SubjectUpdateRequest, admin: dict = Depends(require_admin)):
    update_data = {}
    if req.isLocked is not None:
        update_data["is_locked"] = req.isLocked
    if req.name is not None:
        update_data["name"] = req.name
    if req.icon is not None:
        update_data["icon"] = req.icon
    
    if update_data:
        client = get_supabase()
        client.table("subjects").update(update_data).eq("id", subject_id).execute()
    
    return {"success": True}

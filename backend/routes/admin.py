from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, Response
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from dependencies.auth import require_admin, require_super_admin
from services.supabase_client import get_supabase
from services.storage import upload_file, delete_file as storage_delete
from datetime import datetime, timezone, timedelta
import json
import csv
from io import StringIO
import logging
from collections import deque

router = APIRouter()

# In-memory logging for recent errors (System Health)
recent_errors = deque(maxlen=50)

class HealthLogHandler(logging.Handler):
    def emit(self, record):
        recent_errors.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": self.format(record)
        })

logger = logging.getLogger()
health_handler = HealthLogHandler()
health_handler.setFormatter(logging.Formatter('%(message)s'))
health_handler.setLevel(logging.ERROR)
logger.addHandler(health_handler)

# -----------------
# DASHBOARD & HEALTH
# -----------------
@router.get("/dashboard")
def get_dashboard(admin: dict = Depends(require_admin)):
    try:
        client = get_supabase()
        # Eager fetch
        users = client.table("profiles").select("id", count="exact").execute()
        files = client.table("study_materials").select("id", count="exact").execute()
        roles_res = client.table("roles").select("id").in_("name", ["admin", "super_admin", "content_manager"]).execute()
        role_ids = [r["id"] for r in roles_res.data] if roles_res.data else []
        
        active_staff = 0
        if role_ids:
            ur_res = client.table("user_roles").select("user_id").in_("role_id", role_ids).execute()
            active_staff = len(set(r["user_id"] for r in ur_res.data)) if ur_res.data else 0
        
        # Calculate active traffic (users active in the last 15 minutes)
        try:
            fifteen_mins_ago = (datetime.now(timezone.utc) - timedelta(minutes=15)).isoformat()
            tr_res = client.table("profiles").select("id", count="exact").gte("last_active_at", fifteen_mins_ago).execute()
            active_traffic = tr_res.count or 0
        except Exception:
            active_traffic = 0
        
        return {
            "status": "online",
            "totalUsers": users.count or 0,
            "totalFiles": files.count or 0,
            "activeStaff": active_staff,
            "activeTraffic": active_traffic,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        import traceback
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Dashboard error: {str(e)}")
        traceback.print_exc()
        raise

@router.get("/health")
def get_system_health(admin: dict = Depends(require_admin)):
    return {
        "database": "online",
        "storage": "online",
        "api": "online",
        "ai_service": "online",
        "recent_errors": list(recent_errors)
    }

@router.get("/analytics")
def get_analytics(admin: dict = Depends(require_admin)):
    client = get_supabase()
    # Provide simple timeseries or aggregate counts for the frontend charts
    return {
        "dailyActive": [],
        "revenueTrend": [],
        "subjectPopularity": []
    }

# -----------------
# USERS
# -----------------
@router.get("/users")
def get_users(admin: dict = Depends(require_admin), limit: int = 50, offset: int = 0):
    client = get_supabase()
    data = client.table("profiles").select("*").limit(limit).offset(offset).execute()
    count = client.table("profiles").select("id", count="exact").execute()
    
    users = data.data or []
    user_ids = [u["id"] for u in users]
    
    roles_map = {}
    if user_ids:
        # Fetch roles optimally
        roles_res = client.table("user_roles").select("user_id, roles(name)").in_("user_id", user_ids).execute()
        for ur in (roles_res.data or []):
            uid = ur["user_id"]
            if ur.get("roles") and isinstance(ur["roles"], dict):
                r_name = ur["roles"].get("name")
                if r_name:
                    roles_map.setdefault(uid, []).append(r_name)
                    
    formatted_data = []
    for u in users:
        u_roles = roles_map.get(u["id"], [])
        u["roles"] = u_roles
        formatted_data.append(u)
        
    return {"data": formatted_data, "total": count.count}

@router.get("/users/{user_id}")
def get_user_detail(user_id: str, admin: dict = Depends(require_super_admin)):
    client = get_supabase()
    user_res = client.table("profiles").select("*").eq("id", user_id).single().execute()
    user = user_res.data or {}
    
    if user:
        from repositories.profile_repo import RBACRepository
        roles = RBACRepository().get_user_roles(user["id"])
        user["roles"] = roles
        
    return user

class UserPatch(BaseModel):
    is_active: Optional[bool] = None
    ai_tutor_enabled: Optional[bool] = None
    display_name: Optional[str] = None
    department: Optional[str] = None

@router.patch("/users/{user_id}")
def patch_user(user_id: str, payload: UserPatch, admin: dict = Depends(require_super_admin)):
    client = get_supabase()
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        return {"success": True, "updated": user_id}
        
    if "department" in update_data:
        update_data["department_code"] = update_data.pop("department")
        
    client.table("profiles").update(update_data).eq("id", user_id).execute()
    
    if "display_name" in update_data:
        try:
            client.auth.admin.update_user_by_id(
                user_id,
                {"user_metadata": {"full_name": update_data["display_name"], "name": update_data["display_name"]}}
            )
        except Exception as e:
            import logging
            logging.error(f"Failed to sync auth metadata for {user_id}: {e}")
            
    return {"success": True, "updated": user_id}

class RoleAssignment(BaseModel):
    role: str

@router.post("/users/{user_id}/roles")
def grant_role(user_id: str, payload: RoleAssignment, admin: dict = Depends(require_super_admin)):
    from repositories.profile_repo import RBACRepository
    repo = RBACRepository()
    success = repo.assign_role_by_name(user_id, payload.role)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to assign role")
    return {"success": True}

@router.delete("/users/{user_id}/roles/{role_name}")
def revoke_role(user_id: str, role_name: str, admin: dict = Depends(require_super_admin)):
    from repositories.profile_repo import RBACRepository
    repo = RBACRepository()
    success = repo.revoke_role_by_name(user_id, role_name)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to revoke role")
    return {"success": True}



# -----------------
# ANNOUNCEMENTS
# -----------------
@router.get("/announcements")
def get_announcements(admin: dict = Depends(require_super_admin)):
    client = get_supabase()
    data = client.table("notifications").select("*").eq("type", "system").execute()
    return {"data": data.data or []}

@router.post("/announcements")
def create_announcement(payload: dict, admin: dict = Depends(require_super_admin)):
    client = get_supabase()
    notif = {
        "title": payload.get("title", "Announcement"),
        "body": payload.get("content", ""),
        "type": "system",
        "channel": "in_app",
        "priority": "high",
        "user_id": admin.get("sub") # creator ID, conceptually
    }
    client.table("notifications").insert(notif).execute()
    return {"success": True}

@router.delete("/announcements/{anc_id}")
def delete_announcement(anc_id: str, admin: dict = Depends(require_super_admin)):
    client = get_supabase()
    client.table("notifications").delete().eq("id", anc_id).execute()
    return {"success": True}

# -----------------
# SETTINGS
# -----------------
@router.get("/settings")
def get_settings(admin: dict = Depends(require_super_admin)):
    return {
        "platformName": "EduHub",
        "maintenanceMode": False,
        "registrationOpen": True
    }

@router.patch("/settings")
def patch_settings(payload: dict, admin: dict = Depends(require_super_admin)):
    return {"success": True}

# -----------------
# EXPORTS
# -----------------
@router.get("/export/users")
def export_users(admin: dict = Depends(require_super_admin)):
    client = get_supabase()
    data = client.table("profiles").select("*").execute()
    
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Email", "Display Name", "Created At"])
    for row in data.data:
        writer.writerow([row.get("id"), row.get("email"), row.get("display_name"), row.get("created_at")])
        
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users_export.csv"}
    )


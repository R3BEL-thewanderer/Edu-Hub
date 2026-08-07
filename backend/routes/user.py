from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from core.auth import get_current_user
from services.supabase_client import supabase

router = APIRouter()

@router.get("/profile")
def get_profile(user: dict = Depends(get_current_user)):
    uid = user.get("sub")
    # 'users' is deprecated, read from normalized 'profiles'
    result = supabase().table("profiles").select("*").eq("id", uid).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return result.data

class UpdateProfileRequest(BaseModel):
    displayName: str

@router.patch("/profile")
def update_profile(req: UpdateProfileRequest, user: dict = Depends(get_current_user)):
    uid = user.get("sub")
    
    supabase().table("profiles").update({
        "display_name": req.displayName
    }).eq("id", uid).execute()
    
    return {"success": True}

@router.delete("/account")
def delete_account(user: dict = Depends(get_current_user)):
    uid = user.get("sub")
    
    # Delete user row (cascade will handle related records)
    supabase().table("profiles").delete().eq("id", uid).execute()
    
    # Delete from Supabase Auth
    supabase().auth.admin.delete_user(uid)
    
    return {"success": True}

@router.get("/subscription")
def get_subscription(user: dict = Depends(get_current_user)):
    uid = user.get("sub")
    
    # 'users' has no is_paid anymore, it's inside user_subscriptions
    result = supabase().table("user_subscriptions").select(
        "status, started_at, expires_at"
    ).eq("user_id", uid).order("created_at", desc=True).limit(1).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return result.data

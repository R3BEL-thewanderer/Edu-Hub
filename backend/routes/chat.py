from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from core.auth import get_current_user
from core.config import settings
from services.supabase_client import supabase, get_or_create_user

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    subjectId: str
    sessionId: str = ""
    history: List[ChatMessage] = []
    attachedFileName: Optional[str] = None

def _get_ai_response(subject_name: str, message: str, context: str, history: list) -> dict:
    """Routes to the correct AI provider based on AI_PROVIDER in .env"""
    provider = settings.AI_PROVIDER.lower().strip()
    
    if provider == "gemini":
        from services.gemini import get_chat_response
        return get_chat_response(
            subject_name=subject_name,
            message=message,
            context=context,
            history=history,
        )
    else:
        from services.nvidia_ai import get_nvidia_chat_response
        return get_nvidia_chat_response(
            subject_name=subject_name,
            message=message,
            context=context,
            history=history,
        )

@router.post("")
def send_chat_message(request: ChatRequest, user: dict = Depends(get_current_user)):
    uid = user.get("sub")
    email = user.get("email") or ""
    name = user.get("user_metadata", {}).get("full_name") or ""
    
    # 1. Ensure user profile exists
    get_or_create_user(auth_id=uid, email=email, name=name)
    
    # 2. Get subject full name for context
    subject_name = request.subjectId
    try:
        subject_result = supabase().table("subjects").select(
            "name, full_name"
        ).eq("id", request.subjectId).execute()
        
        if subject_result.data and len(subject_result.data) > 0:
            subject_name = subject_result.data[0].get("full_name", subject_name)
    except Exception as e:
        print(f"Subject lookup notice: {e}")
    
    # 3. Build the user message (include file info if attached)
    user_message = request.message
    if request.attachedFileName:
        user_message = f"[Attached file: {request.attachedFileName}]\n\n{request.message}"
    
    # 4. Generate response using the configured AI provider
    response_data = _get_ai_response(
        subject_name=subject_name,
        message=user_message,
        context="",
        history=[h.model_dump() for h in request.history]
    )
    
    # 5. Store messages in Supabase (only if sessionId provided)
    if request.sessionId:
        try:
            supabase().table("chat_messages").insert([
                {
                    "session_id": request.sessionId,
                    "role": "user",
                    "content": request.message,
                },
                {
                    "session_id": request.sessionId,
                    "role": "bot",
                    "content": response_data["reply"],
                    "sources": response_data.get("sources", []),
                }
            ]).execute()
        except Exception as e:
            print(f"Chat history saving notice: {e}")
    
    return response_data

@router.get("/history/{session_id}")
def get_chat_history(session_id: str, user: dict = Depends(get_current_user)):
    result = supabase().table("chat_messages").select(
        "role, content, sources, created_at"
    ).eq("session_id", session_id).order("created_at").execute()
    
    return {"messages": result.data or []}

class NewSessionRequest(BaseModel):
    subjectId: str

@router.post("/new-session")
def new_chat_session(req: NewSessionRequest, user: dict = Depends(get_current_user)):
    uid = user.get("sub")
    email = user.get("email") or ""
    name = user.get("user_metadata", {}).get("full_name") or ""
    
    user_id = get_or_create_user(auth_id=uid, email=email, name=name)

    if not user_id:
        raise HTTPException(status_code=500, detail="Could not retrieve user profile")
    
    result = supabase().table("chat_sessions").insert({
        "user_id": user_id,
        "subject_id": req.subjectId,
        "year": "2025-26",
        "semester": "sem1",
    }).execute()
    
    return {"sessionId": result.data[0]["id"]}


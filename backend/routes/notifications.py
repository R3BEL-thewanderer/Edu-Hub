from fastapi import APIRouter, Depends, Path
from typing import List, Dict, Any

from schemas.notification import NotificationResponse
from dependencies.auth import require_user
from services.notification_service import NotificationService

router = APIRouter()
notif_svc = NotificationService()

@router.get("/", response_model=List[NotificationResponse])
def get_unread_notifications(user: dict = Depends(require_user)):
    """Fetch unread notifications for the authorized user."""
    return notif_svc.get_unread(user["sub"])

@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: str = Path(...),
    user: dict = Depends(require_user)
):
    """Mark a notification as read."""
    success = notif_svc.mark_read(notification_id)
    return {"status": "success", "marked": success}

from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    channel: str
    priority: str
    title: str
    body: Optional[str] = None
    action_url: Optional[str] = None
    metadata: Dict[str, Any] = {}
    is_read: bool = False
    read_at: Optional[datetime] = None
    sent_at: datetime
    expires_at: Optional[datetime] = None
    created_at: datetime

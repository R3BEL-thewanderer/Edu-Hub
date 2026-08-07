from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from schemas.events import EventCategory

class ActivityEntry(BaseModel):
    id: str
    user_id: str
    event_type: str
    category: EventCategory
    title: str
    description: Optional[str] = None
    timestamp: datetime
    actor_id: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    deep_link: Optional[str] = None
    metadata: Dict[str, Any] = {}
    visibility: str = "private"  # private, public, course, department

class ActivityFeedResponse(BaseModel):
    activities: List[ActivityEntry]
    total_count: int

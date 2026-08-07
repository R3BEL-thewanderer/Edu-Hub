import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import json

from schemas.events import EventPayload, EventCategory
from schemas.activity import ActivityEntry
from repositories.activity_repo import ActivityRepository
from core.events import event_bus

class ActivityService:
    def __init__(self):
        self.repo = ActivityRepository()
        self._register_subscribers()

    def _register_subscribers(self):
        """Automatically subscribe to ALL events on the bus."""
        event_bus.subscribe_all(self.handle_event)


    def handle_event(self, event: EventPayload):
        """Standard handler converting event payload to an activity log."""
        
        # Categorize
        if "auth." in event.event_type:
            category = EventCategory.AUTH
        elif "academics." in event.event_type:
            category = EventCategory.ACADEMICS
        elif "ai." in event.event_type:
            category = EventCategory.AI
        elif "tests." in event.event_type:
            category = EventCategory.MOCK_TESTS
        elif "achievements." in event.event_type:
            category = EventCategory.ACHIEVEMENTS
        elif "admin." in event.event_type:
            category = EventCategory.ADMIN
        else:
            category = EventCategory.SYSTEM
            
        # Extract title and description from metadata if provided
        title = event.metadata.get("title", f"Event: {event.event_type}")
        description = event.metadata.get("description", "")
        deep_link = event.metadata.get("deep_link")
        
        # Build persistent schema
        row = {
            "user_id": event.user_id,
            "action": event.event_type,
            "entity_type": event.entity_type,
            "entity_id": event.entity_id,
            "metadata": {
                "category": category,
                "title": title,
                "description": description,
                "deep_link": deep_link,
                "actor_id": event.actor_id,
                "extra": event.metadata
            }
        }
        
        self.repo.log_activity(row)

    def convert_to_entry(self, row: Dict[str, Any]) -> ActivityEntry:
        meta = row.get("metadata") or {}
        
        # Parse timestamp safely
        created_at_raw = row.get("created_at")
        if created_at_raw:
            try:
                # Handle standard UTC strings with or without +timezone offset properly
                created_at = datetime.fromisoformat(str(created_at_raw).replace("Z", "+00:00"))
            except ValueError:
                created_at = datetime.now(timezone.utc)
        else:
            created_at = datetime.now(timezone.utc)
            
        return ActivityEntry(
            id=row.get("id", str(uuid.uuid4())),
            user_id=row.get("user_id"),
            event_type=row.get("action"),
            category=meta.get("category", EventCategory.SYSTEM),
            title=meta.get("title", row.get("action")),
            description=meta.get("description"),
            timestamp=created_at,
            actor_id=meta.get("actor_id"),
            related_entity_type=row.get("entity_type"),
            related_entity_id=row.get("entity_id"),
            deep_link=meta.get("deep_link"),
            metadata=meta.get("extra", {})
        )

    def get_activities(self, user_id: str, limit: int = 50, offset: int = 0, category: Optional[str] = None) -> List[ActivityEntry]:
        rows = self.repo.get_activities_for_user(user_id, limit, offset, category)
        return [self.convert_to_entry(r) for r in rows]

    def get_platform_timeline(self, limit: int = 50) -> List[ActivityEntry]:
        rows = self.repo.get_platform_activities(limit)
        return [self.convert_to_entry(r) for r in rows]

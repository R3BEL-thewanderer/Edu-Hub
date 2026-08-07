from typing import List, Dict, Any
from schemas.events import EventPayload, EventType
from repositories.notification_repo import NotificationRepository

from core.events import event_bus

class NotificationService:
    def __init__(self):
        self.repo = NotificationRepository()
        self._register_subscribers()
        
    def _register_subscribers(self):
        # We can either subscribe to everything and filter, or subscribe to specific events.
        # Here we subscribe to ALL and let handle_event filter internally to keep it simple.
        event_bus.subscribe_all(self.handle_event)
        
    def handle_event(self, event: EventPayload):
        """Analyze if event warrants an actionable notification."""
        
        # Define high-priority events that need active warnings.
        # Everything goes to the ActivityFeed by default, but only urgent matters come here.
        notice_events = [
            EventType.TEST_STARTED.value,
            EventType.AI_LIMIT_REACHED.value,
            EventType.MATERIAL_REJECTED.value,
            EventType.ACCOUNT_BLOCKED.value,
            EventType.ROLE_CHANGED.value
        ]
        
        if event.event_type not in notice_events:
            return
            
        title = event.metadata.get("title", f"Notice: {event.event_type}")
        body = event.metadata.get("description", "You have a new alert.")
        deep_link = event.metadata.get("deep_link")
        
        priority = "high" if event.event_type == EventType.ACCOUNT_BLOCKED else "normal"
        
        # Assuming table `type` is an enum in DB: `system`, `course`, `announcement`
        # Because we can't change DB effortlessly for enums, generic `system` fits.
        
        self.repo.create_notification({
            "user_id": event.user_id,
            "type": "system",
            "priority": priority,
            "title": title,
            "body": body,
            "action_url": deep_link,
            "metadata": event.metadata
        })
        
    def get_unread(self, user_id: str) -> List[Dict[str, Any]]:
        return self.repo.get_unread_for_user(user_id)
        
    def mark_read(self, notification_id: str) -> bool:
        return self.repo.mark_as_read(notification_id)

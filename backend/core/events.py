import asyncio
from typing import Callable, Dict, List, Any, Awaitable
from schemas.events import EventPayload

class EventBus:
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[EventPayload], Any]]] = {}
        self._generic_subscribers: List[Callable[[EventPayload], Any]] = []

    def subscribe(self, event_type: str, callback: Callable[[EventPayload], Any]):
        """Subscribe a callable to a specific event type."""
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)

    def subscribe_all(self, callback: Callable[[EventPayload], Any]):
        """Subscribe a callable to ALL events."""
        self._generic_subscribers.append(callback)

    def publish(self, event: EventPayload):
        """Publish an event to specific and generic subscribers."""
        callbacks = self._subscribers.get(event.event_type, [])
        all_callbacks = callbacks + self._generic_subscribers
        
        for callback in all_callbacks:
            try:
                callback(event)
            except Exception as e:
                import logging
                logging.error(f"Error in subscriber for {event.event_type}: {e}")

# Global singleton event bus
event_bus = EventBus()

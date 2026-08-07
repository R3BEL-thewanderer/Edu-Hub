from pydantic import BaseModel
from typing import Optional, Dict, Any
from enum import Enum

class EventType(str, Enum):
    # Authentication
    ACCOUNT_CREATED = "auth.account_created"
    FIRST_LOGIN = "auth.first_login"
    LOGIN = "auth.login"
    
    # Academics
    MATERIAL_UPLOADED = "academics.material_uploaded"
    MATERIAL_APPROVED = "academics.material_approved"
    MATERIAL_REJECTED = "academics.material_rejected"
    MATERIAL_UPDATED = "academics.material_updated"
    BOOKMARK_ADDED = "academics.bookmark_added"
    BOOKMARK_REMOVED = "academics.bookmark_removed"
    RATING_SUBMITTED = "academics.rating_submitted"
    
    # AI
    AI_CONVERSATION_STARTED = "ai.conversation_started"
    AI_CONVERSATION_COMPLETED = "ai.conversation_completed"
    FLASHCARDS_GENERATED = "ai.flashcards_generated"
    CHAPTER_SUMMARIZED = "ai.chapter_summarized"
    QUIZ_GENERATED = "ai.quiz_generated"
    GENERAL_CHAT_COMPLETED = "ai.general_chat_completed"
    AI_LIMIT_REACHED = "ai.limit_reached"
    
    # Mock Tests
    TEST_STARTED = "tests.test_started"
    TEST_COMPLETED = "tests.test_completed"
    RESULT_PUBLISHED = "tests.result_published"
    LEADERBOARD_IMPROVED = "tests.leaderboard_improved"
    NEW_PERSONAL_BEST = "tests.new_personal_best"
    
    # Achievements
    STREAK_INCREASED = "achievements.streak_increased"
    BADGE_UNLOCKED = "achievements.badge_unlocked"
    TOP_10_RANKING = "achievements.top_10_ranking"
    
    # Administration
    PROFILE_UPDATED = "admin.profile_updated"
    DEPARTMENT_CHANGED = "admin.department_changed"
    SEMESTER_CHANGED = "admin.semester_changed"
    ROLE_CHANGED = "admin.role_changed"
    ACCOUNT_BLOCKED = "admin.account_blocked"
    ACCOUNT_UNBLOCKED = "admin.account_unblocked"
    
    # System
    WELCOME = "system.welcome"
    PLATFORM_MILESTONE = "system.milestone"


class EventCategory(str, Enum):
    AUTH = "Authentication"
    ACADEMICS = "Academics"
    AI = "AI"
    MOCK_TESTS = "Mock Tests"
    ACHIEVEMENTS = "Achievements"
    ADMIN = "Administration"
    SYSTEM = "System"


class EventPayload(BaseModel):
    event_type: str
    user_id: str
    actor_id: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    metadata: Dict[str, Any] = {}

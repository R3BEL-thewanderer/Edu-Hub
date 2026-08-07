from fastapi import APIRouter, Depends, Query
from typing import List, Optional

from schemas.activity import ActivityEntry, ActivityFeedResponse
from dependencies.auth import require_user, require_admin

from services.activity_service import ActivityService

router = APIRouter()
act_svc = ActivityService()

@router.get("/", response_model=ActivityFeedResponse)
def get_user_activity(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    category: Optional[str] = None,
    user: dict = Depends(require_user)
):
    """Fetch personal timeline for auth user (Student/Faculty)."""
    activities = act_svc.get_activities(user["sub"], limit=limit, offset=offset, category=category)
    return ActivityFeedResponse(activities=activities, total_count=len(activities))

@router.get("/recent", response_model=ActivityFeedResponse)
def get_recent_activity(user: dict = Depends(require_user)):
    """Fetch quick snapshot of recent user timeline."""
    activities = act_svc.get_activities(user["sub"], limit=10)
    return ActivityFeedResponse(activities=activities, total_count=len(activities))

@router.get("/platform", response_model=ActivityFeedResponse)
def get_platform_activity(
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(require_admin)
):
    """Admin-only view of aggregated platform activity."""
    activities = act_svc.get_platform_timeline(limit=limit)
    return ActivityFeedResponse(activities=activities, total_count=len(activities))

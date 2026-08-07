from fastapi import APIRouter
from routes import auth, files, chat, payment, admin, user, subjects, academics, assessment, activity, notifications

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(payment.router, prefix="/payment", tags=["payment"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(user.router, prefix="/user", tags=["user"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["subjects"])

# Phase 4: Academics, Materials, & Bookmarks
api_router.include_router(academics.academics_router, tags=["academics"])
api_router.include_router(academics.materials_router, tags=["materials"])
api_router.include_router(academics.bookmarks_router, tags=["bookmarks"])

# Phase 5 & 6 (Storage, AI) moved to Frontend direct integrations

# Phase 7: Assessments
api_router.include_router(assessment.router, prefix="/assessment", tags=["assessment"])

# Phase 8: Notifications & Activity Feed
api_router.include_router(activity.router, prefix="/activity", tags=["activity"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])

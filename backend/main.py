from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.logging import logger
from routes import api_router

app = FastAPI(
    title=settings.APP_NAME,
    description="FastAPI Backend for EduHub — Powered by Supabase",
    version=settings.APP_VERSION,
)

# CORS setup for edu-hub.co.in
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://192.168.0.104:3000",
    "http://192.168.0.104:5173",
    "http://192.168.0.104:5174",
    "http://192.168.0.104:8000",
    "https://edu-hub.co.in",
    "https://www.edu-hub.co.in",
    "https://staging.edu-hub.co.in",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include central router
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
def startup_event():
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} ({settings.ENVIRONMENT})")
    logger.info(f"Configured Auth Domain Restriction: @{settings.ALLOWED_EMAIL_DOMAIN}")

@app.get("/health")
def health_check():
    supabase_status = "unconfigured"
    db_status = "unconfigured"
    
    # Check Supabase connectivity
    try:
        from services.supabase_client import get_supabase
        client = get_supabase()
        if client:
            supabase_status = "connected"
            # Quick query check to verify database connectivity
            res = client.table("roles").select("count", count="exact").limit(1).execute()
            if res is not None:
                db_status = "connected"
    except Exception as e:
        logger.error(f"Health check connectivity check failed: {e}")
        supabase_status = "error"
        db_status = "error"

    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "supabase": supabase_status,
        "database": db_status,
        "allowed_email_domain": settings.ALLOWED_EMAIL_DOMAIN,
    }

# Run with: uvicorn main:app --reload

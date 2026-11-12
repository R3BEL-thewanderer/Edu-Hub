from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.logging import logger
from routes import api_router
import postgrest

app = FastAPI(
    title=settings.APP_NAME,
    description="FastAPI Backend for EduHub — Powered by Supabase",
    version=settings.APP_VERSION,
)

# CORS setup
origins = [
    settings.FRONTEND_URL,
]

if settings.ENVIRONMENT == "development":
    origins.extend([
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(192\.168|10(\.\d+){1,3})\.\d+\.\d+:(3000|5173|5174|8000)" if settings.ENVIRONMENT == "development" else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include central router
app.include_router(api_router, prefix="/api")

@app.exception_handler(postgrest.exceptions.APIError)
async def supabase_api_error_handler(request: Request, exc: postgrest.exceptions.APIError):
    if getattr(exc, "code", None) == "PGRST116":
        return JSONResponse(
            status_code=404,
            content={"detail": "Resource not found"}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "Database execution error", "message": exc.message}
    )

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
            try:
                res = client.table("subjects").select("count", count="exact").limit(1).execute()
            except Exception:
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

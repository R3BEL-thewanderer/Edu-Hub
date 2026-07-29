from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import api_router

app = FastAPI(
    title="EduHub API",
    description="FastAPI Backend for EduHub — Powered by Supabase",
    version="2.0.0"
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
    "https://staging.edu-hub.co.in"
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

@app.get("/health")
def health_check():
    return {"status": "ok", "backend": "supabase"}

# Run with: uvicorn main:app --reload

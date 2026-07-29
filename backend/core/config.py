from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    
    # Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""
    
    # Admin
    ADMIN_UID: str = ""
    
    # ─── AI Provider Switch ───────────────────────────
    # Set to "nvidia" or "gemini" in .env to switch AI backend
    AI_PROVIDER: str = "nvidia"
    
    # Gemini AI (Free API — https://aistudio.google.com/apikey)
    GEMINI_API_KEY: str = ""
    
    # NVIDIA NIM API
    NVIDIA_API_KEY: str = ""
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()

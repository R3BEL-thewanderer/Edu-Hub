from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # App
    APP_NAME: str = "EduHub API"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "development"
    
    # Supabase Auth & PostgreSQL
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    DATABASE_URL: str = ""
    
    # Auth Domain & Super Admin Constraints
    ALLOWED_EMAIL_DOMAIN: str = "tcetmumbai.in"
    SUPER_ADMIN_EMAIL: str = "1032250973@tcetmumbai.in"
    
    # Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""
    
    # Legacy Admin UID fallback
    ADMIN_UID: str = ""
    
    # AI Provider
    AI_PROVIDER: str = "nvidia"
    GEMINI_API_KEY: str = ""
    NVIDIA_API_KEY: str = ""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

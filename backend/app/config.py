from pydantic_settings import BaseSettings
from typing import Optional, List
import os

class Settings(BaseSettings):
    # Supabase Configuration
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: Optional[str] = None
    supabase_jwt_secret: Optional[str] = None
    
    # Application Configuration
    app_name: str = "KetoSansStress API"
    debug: bool = False
    secret_key: str = "your-secret-key-here"
    
    # API Configuration
    api_v1_prefix: str = "/api"
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:8081", "https://app.emergent.sh"]
    
    # Legacy MongoDB (keeping for migration)
    mongo_url: Optional[str] = None
    emergent_llm_key: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
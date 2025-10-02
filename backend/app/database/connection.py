from supabase import create_client, Client
from supabase.client import ClientOptions
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class SupabaseManager:
    _instance = None
    _client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseManager, cls).__new__(cls)
        return cls._instance
    
    def get_client(self) -> Client:
        if self._client is None:
            try:
                self._client = create_client(
                    settings.supabase_url,
                    settings.supabase_anon_key,
                    options=ClientOptions(
                        auto_refresh_token=True,
                        persist_session=False,
                        storage=None
                    )
                )
                logger.info("Supabase client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
                raise
        return self._client
    
    def get_admin_client(self) -> Client:
        try:
            if not settings.supabase_service_role_key:
                logger.warning("Service role key not configured, using anon key")
                return self.get_client()
                
            return create_client(
                settings.supabase_url,
                settings.supabase_service_role_key,
                options=ClientOptions(
                    auto_refresh_token=False,
                    persist_session=False
                )
            )
        except Exception as e:
            logger.error(f"Failed to initialize admin Supabase client: {e}")
            raise

# Initialize singleton instance
supabase_manager = SupabaseManager()

def get_supabase_client() -> Client:
    return supabase_manager.get_client()

def get_admin_supabase_client() -> Client:
    return supabase_manager.get_admin_client()
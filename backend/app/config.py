"""
Central configuration, loaded from environment variables (.env file in dev).
Never hardcode secrets here — this file only defines *how* they're loaded.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App ---
    app_name: str = "ClientTrack"
    environment: str = "development"  # "development" | "production"

    # --- Security ---
    # Generate with: python -c "import secrets; print(secrets.token_urlsafe(64))"
    secret_key: str
    access_token_expire_minutes: int = 60 * 24  # 24h
    algorithm: str = "HS256"

    # --- Database ---
    # Use postgresql+psycopg://user:pass@host:5432/dbname in production.
    # Defaults to a local SQLite file for easy local dev.
    database_url: str = "sqlite:///./clienttrack.db"

    # --- CORS ---
    # Comma-separated list of allowed frontend origins, e.g.
    # "https://app.yourdomain.com,http://localhost:5173"
    cors_origins: str = "http://localhost:5173"

    # --- LLM (task breakdown generation) ---
    gemini_api_key: str = ""
    llm_model: str = "gemini-2.5-flash"

    # --- Rate limiting ---
    rate_limit_login: str = "5/minute"
    rate_limit_register: str = "3/minute"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

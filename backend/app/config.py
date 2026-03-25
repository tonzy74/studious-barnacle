from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    SECRET_KEY: str = Field(..., min_length=32)
    LINKEDIN_CLIENT_ID: str = Field(...)
    LINKEDIN_CLIENT_SECRET: str = Field(...)
    LINKEDIN_REDIRECT_URI: str = Field(default="http://localhost:8000/auth/callback")
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./jobpilot.db")
    REDIS_URL: str = Field(default="redis://localhost:6379")
    ENCRYPTION_KEY: str = Field(...)
    ALLOWED_ORIGINS: str = Field(default="http://localhost:3000")
    SESSION_EXPIRY_HOURS: int = Field(default=24)
    MAX_DAILY_APPLICATIONS: int = Field(default=5)
    CAPTCHA_SERVICE_API_KEY: str = Field(default="")

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()

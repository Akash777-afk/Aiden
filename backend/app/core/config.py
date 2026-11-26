from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All configuration comes from environment variables (or a local .env file).
    No secrets are hard-coded: dev defaults are generated or clearly marked unsafe."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "AIDEN API"
    VERSION: str = "0.2.0"
    ENVIRONMENT: str = Field("development", pattern="^(development|test|staging|production)$")
    API_PREFIX: str = "/api/v1"

    # Database — SQLite for local dev/tests; MySQL 8 in Phase 3:
    #   mysql+pymysql://user:pass@host:3306/aiden?charset=utf8mb4
    DATABASE_URL: str = "sqlite:///./aiden_dev.db"
    DB_ECHO: bool = False

    # Auth
    JWT_SECRET: str = "dev-only-change-me-please-32-bytes-min!!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_MINUTES: int = 15
    REFRESH_TOKEN_DAYS: int = 14

    # Field-level encryption for sensitive wellbeing data (comma-separated Fernet keys; first = active).
    DATA_ENCRYPTION_KEYS: str = "w2l6l8nH6mJz3rQ0-dev-only-key-replace-in-prod-0000="

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:4173"

    LOGIN_RATE_LIMIT: int = 10  # attempts per window
    LOGIN_RATE_WINDOW_SECONDS: int = 300

    DEFAULT_TIMEZONE: str = "Asia/Kolkata"

    # AI provider: "mock" (rule-based demo) now; "openai"/"anthropic"/etc. plug in during Phase 5.
    AI_PROVIDER: str = "mock"

    @field_validator("JWT_SECRET")
    @classmethod
    def _secret_len(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        return v

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    if s.is_production:
        if s.JWT_SECRET.startswith("dev-only") or "dev-only" in s.DATA_ENCRYPTION_KEYS:
            raise RuntimeError("Refusing to start in production with development secrets.")
    return s


settings = get_settings()

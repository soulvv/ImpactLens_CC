from typing import List, Union, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    ImpactLens AI - Canonical Backend Configuration
    All configuration values are sourced from backend/.env or environment variables.
    Server secrets must never be exposed to the browser or frontend.
    """
    # Application Metadata
    PROJECT_NAME: str = "ImpactLens AI"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database Configuration (PostgreSQL Required)
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/impactlens_db"

    # Cloudinary Media Storage (Server-Only Secrets)
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Google Gemini Multimodal AI (Server-Only Secrets)
    GEMINI_API_KEY: str = ""
    GOOGLE_API_KEY: Optional[str] = None  # Compatible fallback
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # OmniDimension Voice Intelligence (Server-Only Secrets)
    OMNIDIM_API_KEY: str = ""
    OMNIDIM_AGENT_ID: str = ""
    OMNIDIM_BASE_URL: str = "https://api.omnidimension.ai/v1"

    # Video & Media Processing Configuration (Optional)
    FFMPEG_PATH: Optional[str] = None
    FFPROBE_PATH: Optional[str] = None
    VIDEO_MAX_ANALYSIS_DURATION_SECONDS: float = 600.0
    VIDEO_MAX_FRAMES: int = 10

    # CORS Allowed Origins
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    def get_effective_gemini_key(self) -> str:
        """Returns GEMINI_API_KEY or falls back to GOOGLE_API_KEY."""
        return (self.GEMINI_API_KEY or self.GOOGLE_API_KEY or "").strip()

    @property
    def is_gemini_configured(self) -> bool:
        """Checks if a valid Gemini API key is configured."""
        key = self.get_effective_gemini_key()
        return bool(key and key != "mock-gemini-key")

    @property
    def is_cloudinary_configured(self) -> bool:
        """Checks if all required Cloudinary credentials are set."""
        return bool(
            self.CLOUDINARY_CLOUD_NAME.strip()
            and self.CLOUDINARY_API_KEY.strip()
            and self.CLOUDINARY_API_SECRET.strip()
        )

    @property
    def is_omnidim_configured(self) -> bool:
        """Checks if OmniDimension API credentials are set."""
        key = self.OMNIDIM_API_KEY.strip()
        return bool(key and key != "mock-omnidim-key")


settings = Settings()

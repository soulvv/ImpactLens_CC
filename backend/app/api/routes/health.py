import shutil
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.database import get_db, engine
from app.services.cloudinary_service import cloudinary_service

router = APIRouter()


@router.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint reporting configuration availability.
    NEVER exposes secrets, credentials, or connection strings.
    """
    db_connected = False
    engine_name = str(engine.url.drivername) if hasattr(engine, "url") else "unknown"
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False

    cloudinary_active = bool(settings.is_cloudinary_configured)
    gemini_active = bool(settings.is_gemini_configured)
    omnidim_active = bool(settings.is_omnidim_configured)
    
    # Check FFmpeg availability
    # Use `or`, not getattr(settings, "FFMPEG_PATH", "ffmpeg"): the attribute
    # exists and defaults to None, so getattr's default never applies and
    # shutil.which(None) raises TypeError. That turned /health into a 500,
    # which would fail the Render health check and fail the deploy.
    ffmpeg_bin = settings.FFMPEG_PATH or "ffmpeg"
    ffmpeg_available = bool(shutil.which(ffmpeg_bin))

    overall_status = "ok" if db_connected else "degraded"

    return {
        "status": overall_status,
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "database": True if db_connected else False,
        "cloudinary": True if cloudinary_active else "disabled",
        "gemini": True if gemini_active else "disabled",
        "omnidimension": True if omnidim_active else "disabled",
        "video_processing": True if ffmpeg_available else "disabled",
        "details": {
            "database": {
                "connected": db_connected,
                "engine": engine_name,
            },
            "cloudinary": {
                "status": "configured" if cloudinary_active else "disabled",
                "cloud_name_set": bool(settings.CLOUDINARY_CLOUD_NAME),
                "api_key_set": bool(settings.CLOUDINARY_API_KEY),
                "api_secret_set": bool(settings.CLOUDINARY_API_SECRET),
            },
            "gemini": {
                "status": "configured" if gemini_active else "disabled",
                "api_key_set": gemini_active,
                "model": settings.GEMINI_MODEL,
            },
            "omnidimension": {
                "status": "configured" if omnidim_active else "disabled",
                "api_key_set": bool(settings.OMNIDIM_API_KEY),
                "agent_id_set": bool(settings.OMNIDIM_AGENT_ID),
            },
            "ffmpeg": {
                "available": ffmpeg_available,
                "binary": ffmpeg_bin,
            },
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


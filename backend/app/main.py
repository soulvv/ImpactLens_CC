import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.database import init_db
from app.api.routes import health, media, projects, activities, dashboard, search, voice, comparisons, videos, reports

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("impactlens")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB tables and seed default data
    logger.info("==================================================")
    logger.info("Starting ImpactLens AI Backend API (%s)...", settings.ENVIRONMENT)
    logger.info("==================================================")

    # 1. Database validation
    if not settings.DATABASE_URL:
        logger.critical("DATABASE_URL configuration is missing. PostgreSQL database connection is required.")
        raise RuntimeError("DATABASE_URL is required to start ImpactLens AI backend.")
    try:
        init_db()
        logger.info("[CONFIG] PostgreSQL database connected and initialized.")
    except Exception as e:
        logger.critical("Failed to connect to PostgreSQL database: %s", e)
        raise

    # 2. Cloudinary validation
    if settings.is_cloudinary_configured:
        logger.info("[CONFIG] Cloudinary storage configured (cloud: %s).", settings.CLOUDINARY_CLOUD_NAME)
    else:
        logger.warning("[CONFIG] Cloudinary configuration is missing. Media upload will fall back to local storage.")

    # 3. Gemini validation
    if settings.is_gemini_configured:
        logger.info("[CONFIG] Gemini AI configured (model: %s).", settings.GEMINI_MODEL)
    else:
        logger.warning("[CONFIG] Gemini configuration is missing. AI analysis is running in offline heuristic fallback mode.")

    # 4. OmniDimension validation
    if settings.is_omnidim_configured:
        logger.info("[CONFIG] OmniDimension voice assistant configured (agent_id: %s).", settings.OMNIDIM_AGENT_ID)
    else:
        logger.warning("[CONFIG] OmniDimension configuration is missing. Voice assistant is running in embedded local fallback mode.")

    # 5. FFmpeg validation
    import shutil
    ffmpeg_bin = getattr(settings, "FFMPEG_PATH", "ffmpeg")
    if shutil.which(ffmpeg_bin):
        logger.info("[CONFIG] FFmpeg video processing pipeline available (%s).", ffmpeg_bin)
    else:
        logger.warning("[CONFIG] FFmpeg binary not found on PATH or FFMPEG_PATH. Video keyframe extraction will use fallback frames.")

    logger.info("ImpactLens AI backend initialized successfully.")
    yield
    # Shutdown
    logger.info("ImpactLens AI Backend shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="ImpactLens AI: Sustainability & Environmental Impact Media Intelligence API for NGOs and Governments.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [o.strip() for o in origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local uploads directory for sandbox local preview
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include Routers
app.include_router(health.router)
app.include_router(health.router, prefix="/api")
app.include_router(media.router)
app.include_router(projects.router)
app.include_router(activities.router)
app.include_router(dashboard.router)
app.include_router(search.router, prefix="/api")
app.include_router(voice.router, prefix="/api")
app.include_router(comparisons.router, prefix="/api")
app.include_router(videos.router)
app.include_router(reports.router, prefix="/api")


@app.get("/")
def root():
    return {
        "service": "ImpactLens AI API",
        "description": "Environmental Impact & Field Media Intelligence Platform",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from app.db.database import get_db
from app.db.models import Media, MediaAnalysis
from app.services.video_service import video_service

logger = logging.getLogger("impactlens.videos")
router = APIRouter(prefix="/api/videos", tags=["Videos"])


@router.get("/{id}/moments", response_model=List[Dict[str, Any]])
def get_video_key_moments(
    id: str,
    db: Session = Depends(get_db)
):
    """
    Returns the verified chronological key evidence moments for an environmental video.
    Each moment has an exact timestamp in seconds and observable visual description.
    """
    media = db.query(Media).options(joinedload(Media.analysis)).filter(Media.id == id).first()
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Video asset '{id}' not found.")
    if media.media_type != "video":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Asset '{id}' is not a video record.")

    if not media.analysis or not media.analysis.key_moments:
        return []

    return media.analysis.key_moments


@router.post("/{id}/extract-frames")
def trigger_frame_extraction(
    id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Manually triggers representative frame extraction and analysis for a video record.
    """
    media = db.query(Media).filter(Media.id == id).first()
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Video asset '{id}' not found.")
    if media.media_type != "video":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Asset '{id}' is not a video record.")

    media.status = "analyzing"
    db.commit()

    background_tasks.add_task(video_service.process_video, media.id)
    return {
        "status": "processing",
        "video_id": media.id,
        "message": "Representative frame extraction and video intelligence pipeline enqueued."
    }

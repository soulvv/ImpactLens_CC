import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, BackgroundTasks, status
from sqlalchemy.orm import Session, joinedload
from app.db.database import get_db, SessionLocal
from app.db.models import Media, Project, Activity, MediaAnalysis
from app.schemas.media import MediaResponse, MediaDetailResponse
from app.schemas.project import ProjectResponse
from app.schemas.ai import MediaAnalysisResponse
from app.services.cloudinary_service import cloudinary_service
from app.services.ai_service import ai_service
from app.services.embedding_service import embedding_service
from app.services.video_service import video_service

logger = logging.getLogger("impactlens.media")
router = APIRouter(prefix="/api/media", tags=["Media"])


def process_media_ai_task(media_id: str):
    """
    Background worker that runs Gemini multimodal analysis, generates
    768-dim semantic embeddings, and stores structured metadata.
    Routes videos through the Video Intelligence Pipeline and images through the Image Pipeline.
    """
    db = SessionLocal()
    try:
        media = db.query(Media).options(joinedload(Media.project)).filter(Media.id == media_id).first()
        if not media:
            logger.warning(f"Media {media_id} not found for AI processing.")
            return

        # Video Pipeline branch
        if media.media_type == "video":
            db.close()
            video_service.process_video(media_id)
            return

        media.status = "analyzing"
        db.commit()

        project_name = media.project.name if media.project else None
        
        # 1. Multimodal AI Analysis
        ai_output = ai_service.analyze_image(
            image_url=media.secure_url,
            project_name=project_name,
            filename=media.filename
        )

        # 2. Semantic dense vector embedding
        embedding_corpus = f"{ai_output.project or ''} {ai_output.activity or ''} {ai_output.location or ''} {ai_output.description} {' '.join(ai_output.tags)} {' '.join(ai_output.objects)}"
        embedding = embedding_service.generate_embedding(embedding_corpus)

        # 3. Upsert MediaAnalysis
        analysis = db.query(MediaAnalysis).filter(MediaAnalysis.media_id == media.id).first()
        if not analysis:
            analysis = MediaAnalysis(media_id=media.id)
            db.add(analysis)

        analysis.description = ai_output.description
        analysis.project = ai_output.project
        analysis.activity = ai_output.activity
        analysis.location = ai_output.location
        analysis.objects = ai_output.objects
        analysis.visual_signals = ai_output.visual_signals
        analysis.conditions = ai_output.conditions
        analysis.tags = ai_output.tags
        analysis.confidence = ai_output.confidence
        analysis.model_name = "gemini-1.5-flash"
        analysis.analysis_version = "v2.0-multimodal"
        analysis.status = "ready"
        analysis.embedding = embedding

        media.status = "ready"
        db.commit()

        # 4. Audit activity log
        activity_record = Activity(
            project_id=media.project_id,
            action="ai_analyzed",
            description=f"AI verified '{media.filename}': identified '{ai_output.activity}' with {int(ai_output.confidence * 100)}% confidence."
        )
        db.add(activity_record)
        db.commit()

        logger.info(f"Successfully processed AI analysis for media {media_id} ({ai_output.activity})")
    except Exception as e:
        db.rollback()
        logger.error(f"Error analyzing media {media_id}: {e}", exc_info=True)
    finally:
        db.close()


@router.get("", response_model=List[MediaResponse])
def get_media_list(
    project_id: Optional[str] = None,
    media_type: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve field evidence media records with flexible filtering and AI enrichment."""
    query = db.query(Media).options(
        joinedload(Media.analysis),
        joinedload(Media.project)
    )
    
    if project_id and project_id != "all":
        query = query.filter(Media.project_id == project_id)
        
    if media_type and media_type != "all":
        query = query.filter(Media.media_type == media_type.lower())
        
    if status_filter and status_filter != "all":
        query = query.filter(Media.status == status_filter.lower())
        
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(Media.filename.ilike(search_fmt))
        
    media_list = query.order_by(Media.created_at.desc()).all()
    
    results = []
    for item in media_list:
        resp = MediaResponse.model_validate(item)
        resp.project_name = item.project.name if item.project else "Unassigned"
        if item.analysis:
            resp.activity = item.analysis.activity
            resp.location = item.analysis.location
            resp.tags = item.analysis.tags or []
            resp.ai_description = item.analysis.description
        results.append(resp)
        
    return results


@router.post("/upload", response_model=MediaResponse, status_code=status.HTTP_201_CREATED)
async def upload_media(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None),
    status_override: Optional[str] = Form("uploaded"),
    db: Session = Depends(get_db)
):
    """
    Upload an environmental field photo or drone video.
    Routes file through Cloudinary Service, registers metadata in database,
    triggers background AI analysis, and appends an immutable audit activity.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a valid filename.")
        
    # Determine media type (image or video)
    content_type = file.content_type or ""
    filename_lower = file.filename.lower()
    
    if content_type.startswith("video") or filename_lower.endswith((".mp4", ".mov", ".avi", ".mkv", ".webm")):
        media_type = "video"
    elif content_type.startswith("image") or filename_lower.endswith((".jpg", ".jpeg", ".png", ".webp", ".tiff", ".gif")):
        media_type = "image"
    else:
        media_type = "image"

    # Read bytes
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file contents: {str(e)}")

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty (0 bytes).")

    # Upload to Cloudinary or sandbox
    try:
        upload_result = cloudinary_service.upload_file(
            file_bytes=contents,
            filename=file.filename,
            media_type=media_type,
            folder="impactlens/evidence"
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Media upload processing failed: {str(e)}")

    # Verify project if passed
    project_name = None
    if project_id and project_id != "unassigned":
        proj = db.query(Project).filter(Project.id == project_id).first()
        if proj:
            project_name = proj.name
        else:
            project_id = None

    # Save to database
    media_record = Media(
        project_id=project_id,
        filename=file.filename,
        media_type=media_type,
        file_size=upload_result.get("bytes", len(contents)),
        width=upload_result.get("width"),
        height=upload_result.get("height"),
        format=upload_result.get("format"),
        duration_seconds=upload_result.get("duration"),
        cloudinary_public_id=upload_result.get("public_id"),
        cloudinary_url=upload_result.get("url"),
        secure_url=upload_result.get("secure_url"),
        status="processing" if media_type == "video" else "analyzing"
    )
    db.add(media_record)
    db.commit()
    db.refresh(media_record)

    # Log initial upload activity
    target_dossier = f"to '{project_name}'" if project_name else "(unassigned dossier)"
    activity = Activity(
        project_id=project_id,
        action="media_uploaded",
        description=f"Field evidence file '{file.filename}' ({media_type.upper()}) ingested {target_dossier}."
    )
    db.add(activity)
    db.commit()

    # Enqueue background multimodal AI analysis for both images and videos
    background_tasks.add_task(process_media_ai_task, media_record.id)

    resp = MediaResponse.model_validate(media_record)
    resp.project_name = project_name or "Unassigned"
    return resp


@router.get("/{id}/video-analysis")
def get_video_analysis(
    id: str,
    db: Session = Depends(get_db)
):
    """Retrieve detailed video intelligence including key moments and frame sequence."""
    media = db.query(Media).options(joinedload(Media.analysis)).filter(Media.id == id).first()
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Media asset '{id}' not found.")
    if media.media_type != "video":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Media asset '{id}' is not a video record.")

    analysis = media.analysis
    return {
        "media_id": media.id,
        "filename": media.filename,
        "status": media.status,
        "duration_seconds": media.duration_seconds,
        "width": media.width,
        "height": media.height,
        "format": media.format,
        "summary": analysis.description if analysis else "Video analysis in progress.",
        "activity": analysis.activity if analysis else "Field Survey",
        "location": analysis.location if analysis else None,
        "objects": analysis.objects if analysis else [],
        "visual_signals": analysis.visual_signals if analysis else [],
        "conditions": analysis.conditions if analysis else [],
        "tags": analysis.tags if analysis else [],
        "key_moments": analysis.key_moments if analysis else [],
        "frame_count": analysis.frame_count if analysis else 0,
        "confidence": analysis.confidence if analysis else 0.0,
        "model_name": analysis.model_name if analysis else "gemini-1.5-flash",
        "analysis_version": analysis.analysis_version if analysis else "v3.5-video"
    }


@router.post("/{id}/retry-analysis")
def retry_media_analysis(
    id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Retry analysis for a media asset with failed or incomplete status."""
    media = db.query(Media).filter(Media.id == id).first()
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Media asset '{id}' not found.")

    media.status = "processing" if media.media_type == "video" else "analyzing"
    db.commit()

    background_tasks.add_task(process_media_ai_task, media.id)
    return {
        "status": "retrying",
        "media_id": media.id,
        "media_type": media.media_type,
        "message": f"Analysis pipeline re-enqueued for {media.filename}."
    }


@router.post("/{id}/analyze", response_model=MediaDetailResponse)
def trigger_media_analysis(
    id: str,
    db: Session = Depends(get_db)
):
    """
    On-demand AI intelligence analysis or re-analysis for a media record.
    Executes Gemini multimodal model and updates semantic embedding.
    """
    item = db.query(Media).filter(Media.id == id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Media asset with ID '{id}' was not found."
        )

    # Execute analysis directly
    process_media_ai_task(id)

    # Re-fetch enriched
    item = db.query(Media).options(
        joinedload(Media.analysis),
        joinedload(Media.project)
    ).filter(Media.id == id).first()

    project_resp = ProjectResponse.model_validate(item.project) if item.project else None
    analysis_resp = MediaAnalysisResponse.model_validate(item.analysis) if item.analysis else None

    resp = MediaDetailResponse.model_validate(item)
    resp.project = project_resp
    resp.project_name = item.project.name if item.project else "Unassigned"
    resp.analysis = analysis_resp
    if item.analysis:
        resp.activity = item.analysis.activity
        resp.location = item.analysis.location
        resp.tags = item.analysis.tags or []
        resp.ai_description = item.analysis.description
        resp.ai_status = item.analysis.status

    return resp


@router.get("/{id}", response_model=MediaDetailResponse)
def get_media_detail(
    id: str,
    db: Session = Depends(get_db)
):
    """Retrieve complete metadata, project linkage, and AI analysis for a single media asset."""
    item = db.query(Media).options(
        joinedload(Media.analysis),
        joinedload(Media.project)
    ).filter(Media.id == id).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Media asset with ID '{id}' was not found."
        )

    project_resp = ProjectResponse.model_validate(item.project) if item.project else None
    analysis_resp = MediaAnalysisResponse.model_validate(item.analysis) if item.analysis else None

    resp = MediaDetailResponse.model_validate(item)
    resp.project = project_resp
    resp.project_name = item.project.name if item.project else "Unassigned"
    resp.analysis = analysis_resp
    if item.analysis:
        resp.activity = item.analysis.activity
        resp.location = item.analysis.location
        resp.tags = item.analysis.tags or []
        resp.ai_description = item.analysis.description
        resp.ai_status = item.analysis.status

    return resp


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_media(
    id: str,
    db: Session = Depends(get_db)
):
    """Delete a media asset and destroy its remote Cloudinary storage asset."""
    item = db.query(Media).filter(Media.id == id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Media asset with ID '{id}' was not found."
        )

    # Delete from Cloudinary
    if item.cloudinary_public_id:
        cloudinary_service.delete_file(item.cloudinary_public_id, item.media_type)

    # Record deletion activity
    activity = Activity(
        project_id=item.project_id,
        action="media_deleted",
        description=f"Field evidence file '{item.filename}' removed from dossier."
    )
    db.add(activity)

    db.delete(item)
    db.commit()
    return {"status": "success", "message": f"Media asset '{id}' deleted successfully."}

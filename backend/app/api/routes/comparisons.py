import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from app.db.database import get_db
from app.db.models import Comparison, Project, Media
from app.schemas.comparison import (
    ComparisonCreateRequest,
    ComparisonResponse,
    ComparisonSourcesResponse,
    SuggestedPair
)
from app.schemas.media import MediaResponse
from app.services.comparison_service import comparison_service

router = APIRouter(prefix="/comparisons", tags=["Before / After Comparisons"])


def _serialize_comparison(comp: Comparison) -> ComparisonResponse:
    resp = ComparisonResponse.model_validate(comp)
    resp.project_name = comp.project.name if comp.project else None
    if comp.before_media:
        b = MediaResponse.model_validate(comp.before_media)
        b.project_name = resp.project_name
        if comp.before_media.analysis:
            b.activity = comp.before_media.analysis.activity
            b.location = comp.before_media.analysis.location
            b.tags = comp.before_media.analysis.tags
            b.ai_description = comp.before_media.analysis.description
        resp.before_media = b

    if comp.after_media:
        a = MediaResponse.model_validate(comp.after_media)
        a.project_name = resp.project_name
        if comp.after_media.analysis:
            a.activity = comp.after_media.analysis.activity
            a.location = comp.after_media.analysis.location
            a.tags = comp.after_media.analysis.tags
            a.ai_description = comp.after_media.analysis.description
        resp.after_media = a

    return resp


@router.post("", response_model=ComparisonResponse, status_code=status.HTTP_201_CREATED)
def create_comparison(
    request: ComparisonCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Creates a new Before/After impact comparison record and runs
    multimodal AI visual change detection.
    """
    try:
        comp = comparison_service.create_comparison(
            db=db,
            project_id=request.project_id,
            before_media_id=request.before_media_id,
            after_media_id=request.after_media_id,
            title=request.title
        )
        # Reload with joined relationships
        comp = db.query(Comparison).options(
            joinedload(Comparison.project),
            joinedload(Comparison.before_media).joinedload(Media.analysis),
            joinedload(Comparison.after_media).joinedload(Media.analysis)
        ).filter(Comparison.id == comp.id).first()
        return _serialize_comparison(comp)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Comparison creation failed: {e}")


@router.get("", response_model=List[ComparisonResponse])
def get_comparisons(
    project_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Lists impact comparisons with flexible filtering by project and status.
    """
    query = db.query(Comparison).options(
        joinedload(Comparison.project),
        joinedload(Comparison.before_media).joinedload(Media.analysis),
        joinedload(Comparison.after_media).joinedload(Media.analysis)
    )

    if project_id and project_id != "all":
        query = query.filter(Comparison.project_id == project_id)

    if status_filter and status_filter != "all":
        query = query.filter(Comparison.status == status_filter.lower())

    items = query.order_by(Comparison.created_at.desc()).limit(limit).all()
    return [_serialize_comparison(item) for item in items]


@router.get("/suggestions", response_model=List[SuggestedPair])
def get_suggested_pairs(
    project_id: str = Query(..., description="Project ID to analyze for potential pairs"),
    db: Session = Depends(get_db)
):
    """
    Smart pairing: Identifies potential before/after comparison pairs
    based on timeline progression, location alignment, and activity complement.
    """
    return comparison_service.get_suggested_pairs(db, project_id)


@router.get("/{id}", response_model=ComparisonResponse)
def get_comparison_detail(
    id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieves full details, visual change categories, and source assets for a comparison.
    """
    comp = db.query(Comparison).options(
        joinedload(Comparison.project),
        joinedload(Comparison.before_media).joinedload(Media.analysis),
        joinedload(Comparison.after_media).joinedload(Media.analysis)
    ).filter(Comparison.id == id).first()

    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Comparison '{id}' not found.")

    return _serialize_comparison(comp)


@router.post("/{id}/analyze", response_model=ComparisonResponse)
def trigger_reanalyze_comparison(
    id: str,
    db: Session = Depends(get_db)
):
    """
    Re-runs AI multimodal comparison analysis for an existing record.
    """
    comp = db.query(Comparison).options(
        joinedload(Comparison.project),
        joinedload(Comparison.before_media).joinedload(Media.analysis),
        joinedload(Comparison.after_media).joinedload(Media.analysis)
    ).filter(Comparison.id == id).first()

    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Comparison '{id}' not found.")

    comp.status = "analyzing"
    db.commit()

    try:
        ai_output = comparison_service.compare_images(
            before_media=comp.before_media,
            after_media=comp.after_media,
            project_name=comp.project.name if comp.project else None
        )
        comp.overall_change = ai_output.overall_change
        comp.comparison_summary = ai_output.summary
        comp.analysis_result = ai_output.model_dump()
        comp.confidence = ai_output.confidence
        comp.status = "ready"
        comp.error_message = None
        db.commit()
    except Exception as e:
        comp.status = "failed"
        comp.error_message = str(e)
        db.commit()

    db.refresh(comp)
    return _serialize_comparison(comp)


@router.get("/{id}/sources", response_model=ComparisonSourcesResponse)
def get_comparison_sources(
    id: str,
    db: Session = Depends(get_db)
):
    """
    Preserves strict traceability: returns original source asset IDs,
    Cloudinary storage locators, non-repudiation timestamps, and verification hashes.
    """
    comp = db.query(Comparison).options(
        joinedload(Comparison.project),
        joinedload(Comparison.before_media).joinedload(Media.analysis),
        joinedload(Comparison.after_media).joinedload(Media.analysis)
    ).filter(Comparison.id == id).first()

    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Comparison '{id}' not found.")

    b = comp.before_media
    a = comp.after_media

    # Generate deterministic traceability hash
    raw_sig = f"{comp.id}:{b.id}:{a.id}:{comp.created_at.isoformat()}:{comp.analysis_version}"
    t_hash = f"sig_{hashlib.sha256(raw_sig.encode()).hexdigest()[:24]}"

    return ComparisonSourcesResponse(
        comparison_id=comp.id,
        project_id=comp.project_id,
        project_name=comp.project.name if comp.project else None,
        before_media={
            "id": b.id,
            "filename": b.filename,
            "media_type": b.media_type,
            "cloudinary_public_id": b.cloudinary_public_id or "local_sandbox",
            "secure_url": b.secure_url,
            "created_at": b.created_at.isoformat(),
            "activity": b.analysis.activity if b.analysis else None,
            "location": b.analysis.location if b.analysis else None
        },
        after_media={
            "id": a.id,
            "filename": a.filename,
            "media_type": a.media_type,
            "cloudinary_public_id": a.cloudinary_public_id or "local_sandbox",
            "secure_url": a.secure_url,
            "created_at": a.created_at.isoformat(),
            "activity": a.analysis.activity if a.analysis else None,
            "location": a.analysis.location if a.analysis else None
        },
        model_name=comp.model_name,
        analysis_version=comp.analysis_version,
        comparison_timestamp=comp.updated_at,
        traceability_hash=t_hash
    )


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_comparison(
    id: str,
    db: Session = Depends(get_db)
):
    """
    Deletes an impact comparison record. Does not remove underlying media assets.
    """
    comp = db.query(Comparison).filter(Comparison.id == id).first()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Comparison '{id}' not found.")

    db.delete(comp)
    db.commit()
    return {"status": "success", "message": f"Comparison '{id}' deleted."}

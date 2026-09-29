import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from app.db.database import get_db
from app.db.models import Report, ReportEvidence, Project, Media
from app.schemas.report import (
    ReportCreate,
    ReportResponse,
    ReportEvidenceItemResponse,
    CampaignContentResponse,
)
from app.services.report_service import report_service

logger = logging.getLogger("impactlens.reports.api")

router = APIRouter(prefix="/reports", tags=["Impact Reports"])


def _serialize_report(report: Report) -> ReportResponse:
    """Helper to convert SQLAlchemy Report model to Pydantic ReportResponse."""
    evidence_resp = []
    if hasattr(report, "evidence_items") and report.evidence_items:
        for item in report.evidence_items:
            m_fn = item.media.filename if item.media else None
            m_url = (item.media.secure_url or item.media.cloudinary_url) if item.media else None
            m_type = item.media.media_type if item.media else None
            evidence_resp.append(
                ReportEvidenceItemResponse(
                    id=item.id,
                    report_id=item.report_id,
                    media_id=item.media_id,
                    comparison_id=item.comparison_id,
                    video_moment_id=item.video_moment_id,
                    section=item.section,
                    evidence_role=item.evidence_role,
                    notes=item.notes,
                    created_at=item.created_at,
                    media_filename=m_fn,
                    media_url=m_url,
                    media_type=m_type,
                )
            )

    return ReportResponse(
        id=report.id,
        project_id=report.project_id,
        project_name=report.project.name if report.project else None,
        project_location=report.project.location if report.project else None,
        project_organization=report.project.organization if report.project else None,
        title=report.title,
        status=report.status,
        reporting_period_start=report.reporting_period_start,
        reporting_period_end=report.reporting_period_end,
        evidence_count=report.evidence_count,
        comparison_count=report.comparison_count,
        generated_content=report.generated_content,
        model_name=report.model_name,
        analysis_version=report.analysis_version,
        error_message=report.error_message,
        created_at=report.created_at,
        updated_at=report.updated_at,
        evidence_items=evidence_resp,
    )


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_and_generate_report(
    payload: ReportCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Creates a new report record and immediately triggers evidence-backed report synthesis.
    """
    try:
        report = report_service.create_report(
            db=db,
            project_id=payload.project_id,
            title=payload.title,
            start_date=payload.reporting_period_start,
            end_date=payload.reporting_period_end,
            include_images=payload.include_images,
            include_videos=payload.include_videos,
            include_comparisons=payload.include_comparisons,
            sections=payload.sections,
        )
        return _serialize_report(report)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.error(f"Error in create_and_generate_report: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate impact report: {str(e)}",
        )


@router.get("", response_model=List[ReportResponse])
def list_reports(
    project_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    """
    Lists all reports with project details and evidence citations.
    """
    query = (
        db.query(Report)
        .options(
            joinedload(Report.project),
            joinedload(Report.evidence_items).joinedload(ReportEvidence.media),
        )
        .order_by(Report.created_at.desc())
    )

    if project_id:
        query = query.filter(Report.project_id == project_id)
    if status_filter:
        query = query.filter(Report.status == status_filter)

    reports = query.all()
    return [_serialize_report(r) for r in reports]


@router.get("/public/{id}", response_model=ReportResponse)
def get_public_report(id: str, db: Session = Depends(get_db)):
    """
    Public/shareable endpoint for viewing report without internal administrative actions.
    """
    report = (
        db.query(Report)
        .options(
            joinedload(Report.project),
            joinedload(Report.evidence_items).joinedload(ReportEvidence.media),
        )
        .filter(Report.id == id)
        .first()
    )
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{id}' was not found.",
        )
    return _serialize_report(report)


@router.get("/{id}", response_model=ReportResponse)
def get_report_by_id(id: str, db: Session = Depends(get_db)):
    """
    Retrieves a single report with complete structured content and traceability citations.
    """
    report = (
        db.query(Report)
        .options(
            joinedload(Report.project),
            joinedload(Report.evidence_items).joinedload(ReportEvidence.media),
        )
        .filter(Report.id == id)
        .first()
    )
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{id}' was not found.",
        )
    return _serialize_report(report)


@router.post("/{id}/regenerate", response_model=ReportResponse)
def regenerate_report(id: str, db: Session = Depends(get_db)):
    """
    Regenerates the impact report using the latest project evidence and comparisons.
    """
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{id}' was not found.",
        )
    try:
        updated = report_service.generate_report_pipeline(db=db, report_id=id)
        return _serialize_report(updated)
    except Exception as e:
        logger.error(f"Error regenerating report {id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate report: {str(e)}",
        )


@router.get("/{id}/evidence", response_model=List[ReportEvidenceItemResponse])
def get_report_evidence(id: str, db: Session = Depends(get_db)):
    """
    Retrieves the complete evidence traceability ledger for a report.
    """
    evidence = (
        db.query(ReportEvidence)
        .options(joinedload(ReportEvidence.media))
        .filter(ReportEvidence.report_id == id)
        .all()
    )
    resp = []
    for item in evidence:
        m_fn = item.media.filename if item.media else None
        m_url = (item.media.secure_url or item.media.cloudinary_url) if item.media else None
        m_type = item.media.media_type if item.media else None
        resp.append(
            ReportEvidenceItemResponse(
                id=item.id,
                report_id=item.report_id,
                media_id=item.media_id,
                comparison_id=item.comparison_id,
                video_moment_id=item.video_moment_id,
                section=item.section,
                evidence_role=item.evidence_role,
                notes=item.notes,
                created_at=item.created_at,
                media_filename=m_fn,
                media_url=m_url,
                media_type=m_type,
            )
        )
    return resp


@router.get("/{id}/campaign-content", response_model=CampaignContentResponse)
def get_report_campaign_content(id: str, db: Session = Depends(get_db)):
    """
    Retrieves campaign-ready content variants for social, briefings, and grant communications.
    """
    report = db.query(Report).filter(Report.id == id).first()
    if not report or not report.generated_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{id}' was not found or has no generated content.",
        )
    campaign = report.generated_content.get("campaign_content", {})
    return CampaignContentResponse(
        headline=campaign.get("headline", report.title),
        short_summary=campaign.get("short_summary", ""),
        social_caption=campaign.get("social_caption", ""),
        impact_story=campaign.get("impact_story", ""),
        sponsor_summary=campaign.get("sponsor_summary", ""),
        callout=campaign.get("callout", ""),
        sources=campaign.get("sources", []),
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(id: str, db: Session = Depends(get_db)):
    """
    Permanently removes a report and its linked evidence references.
    """
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{id}' was not found.",
        )
    db.delete(report)
    db.commit()
    return None

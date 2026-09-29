from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from app.db.database import get_db
from app.db.models import Project, Media, MediaAnalysis, Report, ReportEvidence
from app.services.omnidim_service import omnidim_service

router = APIRouter(prefix="/voice", tags=["Voice Intelligence (OmniDimension)"])


class VoiceQueryPayload(BaseModel):
    transcript: str
    context: Optional[Dict[str, Any]] = None


class VoiceSessionRequest(BaseModel):
    user_id: Optional[str] = "field_auditor_01"
    context: Optional[Dict[str, Any]] = None


@router.post("/session")
def create_voice_session(payload: Optional[VoiceSessionRequest] = None):
    """
    Initializes a voice assistant session with OmniDimension.
    Generates credentials and configurations for the frontend @omnidim-ai/client.
    """
    context = payload.context if payload else None
    return omnidim_service.create_session(context=context)


@router.post("/query")
def process_voice_query(
    payload: VoiceQueryPayload,
    db: Session = Depends(get_db)
):
    """
    Accepts speech-to-text transcript and executes grounded intelligence reasoning.
    Returns spoken conversational response and linked visual evidence records.
    """
    if not payload.transcript or not payload.transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript text is required."
        )
    return omnidim_service.process_voice_query(db, payload.transcript)


@router.get("/stats")
def get_voice_grounded_stats(db: Session = Depends(get_db)):
    """
    Provides aggregated statistics for voice agent speech grounding.
    """
    project_count = db.query(Project).count()
    media_count = db.query(Media).count()
    verified_count = db.query(MediaAnalysis).filter(MediaAnalysis.status == "ready").count()
    return {
        "active_projects": project_count,
        "total_media_records": media_count,
        "verified_analyses": verified_count,
        "verification_rate_percent": round((verified_count / max(1, media_count)) * 100, 1)
    }


@router.get("/projects")
def get_voice_projects(db: Session = Depends(get_db)):
    """
    List of projects for voice query entity resolution.
    """
    projects = db.query(Project).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "location": p.location,
            "organization": p.organization,
            "media_count": len(p.media)
        }
        for p in projects
    ]


@router.get("/projects/{project_id}")
def get_voice_project_detail(project_id: str, db: Session = Depends(get_db)):
    """
    Detailed project dossier context for voice grounding.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    recent_media = db.query(Media).options(joinedload(Media.analysis)).filter(Media.project_id == project_id).limit(6).all()
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "location": project.location,
        "organization": project.organization,
        "status": project.status,
        "evidence": [
            {
                "media_id": m.id,
                "filename": m.filename,
                "secure_url": m.secure_url,
                "activity": m.analysis.activity if m.analysis else None,
                "description": m.analysis.description if m.analysis else None
            }
            for m in recent_media
        ]
    }


@router.get("/media/{media_id}")
def get_voice_media_detail(media_id: str, db: Session = Depends(get_db)):
    """
    Direct visual evidence lookup for voice referencing.
    """
    media = db.query(Media).options(
        joinedload(Media.analysis),
        joinedload(Media.project)
    ).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    return {
        "id": media.id,
        "filename": media.filename,
        "secure_url": media.secure_url,
        "project": media.project.name if media.project else None,
        "analysis": {
            "description": media.analysis.description if media.analysis else None,
            "activity": media.analysis.activity if media.analysis else None,
            "location": media.analysis.location if media.analysis else None,
            "confidence": media.analysis.confidence if media.analysis else None,
            "tags": media.analysis.tags if media.analysis else []
        } if media.analysis else None
    }


class VoiceComparisonSearchPayload(BaseModel):
    query: str
    project_id: Optional[str] = None


@router.post("/comparisons/search")
def search_voice_comparisons(
    payload: VoiceComparisonSearchPayload,
    db: Session = Depends(get_db)
):
    """
    Search before/after impact comparisons for voice inquiry grounding.
    """
    from app.db.models import Comparison
    query = db.query(Comparison).options(
        joinedload(Comparison.project),
        joinedload(Comparison.before_media).joinedload(Media.analysis),
        joinedload(Comparison.after_media).joinedload(Media.analysis)
    ).filter(Comparison.status == "ready")

    if payload.project_id:
        query = query.filter(Comparison.project_id == payload.project_id)

    q_lower = payload.query.lower()
    comps = query.all()
    matched = []
    for c in comps:
        corpus = f"{c.title or ''} {c.overall_change or ''} {c.comparison_summary or ''} {c.project.name if c.project else ''}".lower()
        if any(term in corpus for term in q_lower.split() if len(term) > 2) or len(comps) == 1:
            matched.append(c)

    results = matched if matched else comps[:3]
    return [
        {
            "id": c.id,
            "project_name": c.project.name if c.project else "Field Project",
            "title": c.title,
            "overall_change": c.overall_change,
            "summary": c.comparison_summary,
            "confidence": c.confidence,
            "before_media": {
                "id": c.before_media.id,
                "secure_url": c.before_media.secure_url,
                "filename": c.before_media.filename
            },
            "after_media": {
                "id": c.after_media.id,
                "secure_url": c.after_media.secure_url,
                "filename": c.after_media.filename
            }
        }
        for c in results
    ]


@router.get("/comparisons/{comparison_id}")
def get_voice_comparison_detail(
    comparison_id: str,
    db: Session = Depends(get_db)
):
    """
    Direct impact comparison lookup for voice referencing.
    """
    from app.db.models import Comparison
    c = db.query(Comparison).options(
        joinedload(Comparison.project),
        joinedload(Comparison.before_media).joinedload(Media.analysis),
        joinedload(Comparison.after_media).joinedload(Media.analysis)
    ).filter(Comparison.id == comparison_id).first()

    if not c:
        raise HTTPException(status_code=404, detail="Comparison not found")

    return {
        "id": c.id,
        "project": c.project.name if c.project else None,
        "title": c.title,
        "overall_change": c.overall_change,
        "summary": c.comparison_summary,
        "confidence": c.confidence,
        "analysis_result": c.analysis_result,
        "before_media": {
            "id": c.before_media.id,
            "secure_url": c.before_media.secure_url,
            "filename": c.before_media.filename
        },
        "after_media": {
            "id": c.after_media.id,
            "secure_url": c.after_media.secure_url,
            "filename": c.after_media.filename
        }
    }


@router.get("/projects/{project_id}/comparisons")
def get_voice_project_comparisons(
    project_id: str,
    db: Session = Depends(get_db)
):
    """
    List comparisons under a specific project for voice grounding.
    """
    from app.db.models import Comparison
    comps = db.query(Comparison).options(
        joinedload(Comparison.project)
    ).filter(Comparison.project_id == project_id, Comparison.status == "ready").all()

    return [
        {
            "id": c.id,
            "title": c.title,
            "overall_change": c.overall_change,
            "summary": c.comparison_summary
        }
        for c in comps
    ]


@router.get("/videos")
def get_voice_videos(db: Session = Depends(get_db)):
    """List verified videos for voice agent grounding."""
    videos = db.query(Media).options(
        joinedload(Media.analysis),
        joinedload(Media.project)
    ).filter(Media.media_type == "video").all()

    return [
        {
            "id": v.id,
            "filename": v.filename,
            "project": v.project.name if v.project else "Unassigned",
            "duration_seconds": v.duration_seconds,
            "activity": v.analysis.activity if v.analysis else None,
            "summary": v.analysis.description if v.analysis else None,
            "key_moments_count": len(v.analysis.key_moments or []) if v.analysis else 0,
            "status": v.status
        }
        for v in videos
    ]


@router.post("/videos/search")
def search_voice_videos(
    payload: VoiceQueryPayload,
    db: Session = Depends(get_db)
):
    """Semantic search filtered strictly to video assets for voice queries."""
    from app.schemas.search import SearchRequest
    from app.services.search_service import search_service

    req = SearchRequest(query=payload.transcript, media_type="video", limit=5)
    res = search_service.search(db, req)
    return res.results


@router.get("/videos/{id}")
def get_voice_video_detail(id: str, db: Session = Depends(get_db)):
    """Retrieve detailed video record and intelligence for voice agent."""
    v = db.query(Media).options(
        joinedload(Media.analysis),
        joinedload(Media.project)
    ).filter(Media.id == id, Media.media_type == "video").first()
    if not v:
        raise HTTPException(status_code=404, detail="Video record not found")

    return {
        "id": v.id,
        "filename": v.filename,
        "project": v.project.name if v.project else "Unassigned",
        "duration_seconds": v.duration_seconds,
        "secure_url": v.secure_url,
        "activity": v.analysis.activity if v.analysis else "Field Video Record",
        "location": v.analysis.location if v.analysis else None,
        "summary": v.analysis.description if v.analysis else None,
        "key_moments": v.analysis.key_moments if v.analysis else [],
        "confidence": v.analysis.confidence if v.analysis else 0.88,
        "status": v.status
    }


@router.get("/videos/{id}/moments")
def get_voice_video_moments(id: str, db: Session = Depends(get_db)):
    """Retrieve key moments for voice queries."""
    v = db.query(Media).options(joinedload(Media.analysis)).filter(Media.id == id, Media.media_type == "video").first()
    if not v or not v.analysis or not v.analysis.key_moments:
        return []
    return v.analysis.key_moments


@router.post("/reports/search")
def search_reports_for_voice(payload: VoiceQueryPayload, db: Session = Depends(get_db)):
    """Search for relevant reports based on voice query."""
    q = f"%{payload.transcript.strip()}%"
    reports = db.query(Report).options(joinedload(Report.project)).filter(
        (Report.title.ilike(q)) | (Report.project.has(Project.name.ilike(q)))
    ).limit(5).all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "project_name": r.project.name if r.project else None,
            "status": r.status,
            "evidence_count": r.evidence_count,
            "comparison_count": r.comparison_count,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reports
    ]


@router.get("/reports/{id}")
def get_voice_report_detail(id: str, db: Session = Depends(get_db)):
    """Retrieve report content for voice grounding."""
    report = db.query(Report).options(joinedload(Report.project)).filter(Report.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return {
        "id": report.id,
        "title": report.title,
        "project_name": report.project.name if report.project else None,
        "overview": report.generated_content.get("overview") if report.generated_content else None,
        "evidence_count": report.evidence_count,
        "comparison_count": report.comparison_count,
        "status": report.status,
    }


@router.post("/projects/{project_id}/generate-report")
def generate_report_via_voice(project_id: str, db: Session = Depends(get_db)):
    """Voice-triggered immediate report generation."""
    from app.services.report_service import report_service
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    report = report_service.create_report(db, project_id=project_id)
    return {
        "report_id": report.id,
        "title": report.title,
        "status": report.status,
        "message": f"Impact report generated for {project.name}.",
        "route": f"/reports/{report.id}",
    }


@router.get("/reports/{id}/summary")
def get_voice_report_summary(id: str, db: Session = Depends(get_db)):
    """Get spoken summary and campaign content for voice delivery."""
    report = db.query(Report).options(joinedload(Report.project)).filter(Report.id == id).first()
    if not report or not report.generated_content:
        raise HTTPException(status_code=404, detail="Report or content not found")
    gen = report.generated_content
    camp = gen.get("campaign_content", {})
    return {
        "title": report.title,
        "project": report.project.name if report.project else "Project",
        "overview": gen.get("overview"),
        "headline": camp.get("headline"),
        "short_summary": camp.get("short_summary"),
        "key_observations": gen.get("key_observations", []),
    }


@router.get("/reports/{id}/evidence")
def get_voice_report_evidence(id: str, db: Session = Depends(get_db)):
    """Get evidence citations for voice factuality checking."""
    evidence = db.query(ReportEvidence).options(joinedload(ReportEvidence.media)).filter(ReportEvidence.report_id == id).all()
    return [
        {
            "id": e.id,
            "section": e.section,
            "evidence_role": e.evidence_role,
            "media_id": e.media_id,
            "comparison_id": e.comparison_id,
            "filename": e.media.filename if e.media else None,
            "notes": e.notes,
        }
        for e in evidence
    ]



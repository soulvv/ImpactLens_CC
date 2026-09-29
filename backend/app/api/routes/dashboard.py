from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db.models import Project, Media, Activity
from app.schemas.dashboard import DashboardSummaryResponse, DashboardMetrics
from app.schemas.media import MediaResponse
from app.schemas.project import ProjectResponse
from app.schemas.activity import ActivityResponse

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def format_bytes(size: int | float | None) -> str:
    """Format bytes to human-readable string."""
    if not size or size <= 0:
        return "0 KB"
    val = float(size)
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if abs(val) < 1024.0:
            return f"{val:.1f} {unit}"
        val /= 1024.0
    return f"{val:.1f} PB"


@router.get("/stats", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Aggregate high-level telemetry and metrics for the dashboard view."""
    # 1. Total Media count
    total_media = db.query(func.count(Media.id)).scalar() or 0

    # 2. Active Projects count
    active_projects_count = db.query(func.count(Project.id)).filter(Project.status == "active").scalar() or 0

    # 3. Processing Queue (status != ready/verified)
    processing_count = (
        db.query(func.count(Media.id))
        .filter(Media.status.in_(["uploaded", "pending_analysis", "processing"]))
        .scalar()
        or 0
    )

    # 4. Storage Used
    total_bytes = db.query(func.sum(Media.file_size)).scalar() or 0
    storage_human = format_bytes(total_bytes)

    metrics = DashboardMetrics(
        total_media=total_media,
        active_projects=active_projects_count,
        processing_queue=processing_count,
        storage_bytes=int(total_bytes),
        storage_human=storage_human,
    )

    # 5. Recent Media (latest 6)
    recent_media_db = db.query(Media).order_by(Media.created_at.desc()).limit(6).all()
    project_map = {p.id: p.name for p in db.query(Project.id, Project.name).all()}
    recent_media = []
    for m in recent_media_db:
        resp = MediaResponse.model_validate(m)
        resp.project_name = project_map.get(m.project_id) if m.project_id else "Unassigned"
        recent_media.append(resp)

    # 6. Active Projects summary (latest 4)
    projects_db = (
        db.query(Project)
        .filter(Project.status == "active")
        .order_by(Project.created_at.desc())
        .limit(4)
        .all()
    )
    active_projects = []
    for p in projects_db:
        p_media_count = db.query(func.count(Media.id)).filter(Media.project_id == p.id).scalar() or 0
        p_resp = ProjectResponse.model_validate(p)
        p_resp.media_count = p_media_count
        active_projects.append(p_resp)

    # 7. Recent Activity (latest 6)
    activities_db = db.query(Activity).order_by(Activity.created_at.desc()).limit(6).all()
    recent_activity = []
    for a in activities_db:
        a_resp = ActivityResponse.model_validate(a)
        a_resp.project_name = project_map.get(a.project_id) if a.project_id else None
        recent_activity.append(a_resp)

    return DashboardSummaryResponse(
        metrics=metrics,
        recent_media=recent_media,
        active_projects=active_projects,
        recent_activity=recent_activity,
    )

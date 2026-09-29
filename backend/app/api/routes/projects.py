from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.db.database import get_db
from app.db.models import Project, Media, Activity
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectDetailResponse, ProjectUpdate
from app.schemas.media import MediaResponse

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.get("", response_model=List[ProjectResponse])
def get_projects(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve all projects with attached media count."""
    query = db.query(Project)
    
    if status_filter:
        query = query.filter(Project.status == status_filter)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Project.name.ilike(search_fmt)) |
            (Project.description.ilike(search_fmt)) |
            (Project.location.ilike(search_fmt)) |
            (Project.organization.ilike(search_fmt))
        )
        
    projects = query.order_by(Project.created_at.desc()).all()
    
    # Calculate media counts
    results = []
    for p in projects:
        media_count = db.query(func.count(Media.id)).filter(Media.project_id == p.id).scalar() or 0
        resp = ProjectResponse.model_validate(p)
        resp.media_count = media_count
        results.append(resp)
        
    return results


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db)
):
    """Create a new impact project dossier."""
    project = Project(
        name=project_in.name,
        description=project_in.description,
        location=project_in.location,
        organization=project_in.organization,
        status=project_in.status or "active"
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    # Record activity
    activity = Activity(
        project_id=project.id,
        action="project_created",
        description=f"Project '{project.name}' created by lead organization: {project.organization or 'Unassigned'}."
    )
    db.add(activity)
    db.commit()
    
    resp = ProjectResponse.model_validate(project)
    resp.media_count = 0
    return resp


@router.get("/{id}", response_model=ProjectDetailResponse)
def get_project_by_id(
    id: str,
    db: Session = Depends(get_db)
):
    """Get project details by ID."""
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{id}' was not found."
        )
        
    media_count = db.query(func.count(Media.id)).filter(Media.project_id == project.id).scalar() or 0
    resp = ProjectDetailResponse.model_validate(project)
    resp.media_count = media_count
    return resp


@router.get("/{id}/media", response_model=List[MediaResponse])
def get_project_media(
    id: str,
    db: Session = Depends(get_db)
):
    """Retrieve all field media records associated with a project."""
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{id}' was not found."
        )
        
    media_items = db.query(Media).filter(Media.project_id == id).order_by(Media.created_at.desc()).all()
    results = []
    for m in media_items:
        resp = MediaResponse.model_validate(m)
        resp.project_name = project.name
        results.append(resp)
    return results


@router.get("/{id}/comparisons", response_model=List[dict])
def get_project_comparisons(
    id: str,
    db: Session = Depends(get_db)
):
    """Retrieve all impact comparisons belonging to a project dossier."""
    from app.api.routes.comparisons import _serialize_comparison
    from app.db.models import Comparison
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{id}' was not found."
        )

    comparisons = db.query(Comparison).options(
        joinedload(Comparison.project),
        joinedload(Comparison.before_media).joinedload(Media.analysis),
        joinedload(Comparison.after_media).joinedload(Media.analysis)
    ).filter(Comparison.project_id == id).order_by(Comparison.created_at.desc()).all()

    return [_serialize_comparison(c).model_dump() for c in comparisons]


@router.get("/{id}/reports", response_model=List[dict])
def get_project_reports(
    id: str,
    db: Session = Depends(get_db)
):
    """Retrieve all impact reports belonging to a project dossier."""
    from app.api.routes.reports import _serialize_report
    from app.db.models import Report
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID '{id}' was not found."
        )

    reports = db.query(Report).options(
        joinedload(Report.project),
        joinedload(Report.evidence_items)
    ).filter(Report.project_id == id).order_by(Report.created_at.desc()).all()

    return [_serialize_report(r).model_dump() for r in reports]



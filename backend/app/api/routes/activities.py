from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Activity, Project
from app.schemas.activity import ActivityResponse

router = APIRouter(prefix="/api/activities", tags=["Activities"])


@router.get("", response_model=List[ActivityResponse])
def get_activities(
    limit: int = Query(20, ge=1, le=100),
    project_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve immutable audit trail of system activities."""
    query = db.query(Activity)
    if project_id:
        query = query.filter(Activity.project_id == project_id)
        
    activities = query.order_by(Activity.created_at.desc()).limit(limit).all()
    
    # Map project names
    project_map = {p.id: p.name for p in db.query(Project.id, Project.name).all()}
    
    results = []
    for a in activities:
        resp = ActivityResponse.model_validate(a)
        resp.project_name = project_map.get(a.project_id) if a.project_id else None
        results.append(resp)
        
    return results

from typing import List
from pydantic import BaseModel
from app.schemas.media import MediaResponse
from app.schemas.project import ProjectResponse
from app.schemas.activity import ActivityResponse


class DashboardMetrics(BaseModel):
    total_media: int
    active_projects: int
    processing_queue: int
    storage_bytes: int
    storage_human: str


class DashboardSummaryResponse(BaseModel):
    metrics: DashboardMetrics
    recent_media: List[MediaResponse]
    active_projects: List[ProjectResponse]
    recent_activity: List[ActivityResponse]

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.project import ProjectResponse
from app.schemas.ai import MediaAnalysisResponse


class MediaBase(BaseModel):
    filename: str
    media_type: str
    file_size: int
    project_id: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    format: Optional[str] = None
    duration_seconds: Optional[float] = None
    frame_rate: Optional[float] = None
    status: str = "uploaded"


class MediaResponse(MediaBase):
    id: str
    cloudinary_public_id: Optional[str] = None
    cloudinary_url: str
    secure_url: str
    created_at: datetime
    updated_at: datetime
    project_name: Optional[str] = None
    activity: Optional[str] = None
    location: Optional[str] = None
    tags: List[str] = []
    ai_description: Optional[str] = None
    duration_seconds: Optional[float] = None
    frame_rate: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class MediaDetailResponse(MediaResponse):
    project: Optional[ProjectResponse] = None
    analysis: Optional[MediaAnalysisResponse] = None
    ai_status: str = "ready"
    ai_scheduled_modules: List[str] = [
        "Multimodal Environmental Vision (Gemini 1.5/2.5)",
        "Automated Activity & Entity Extraction",
        "Dense Semantic Vector Indexing (pgvector)",
        "OmniDimension Grounded Voice Retrieval"
    ]

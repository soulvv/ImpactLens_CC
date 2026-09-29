from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ReportCreate(BaseModel):
    project_id: str
    title: Optional[str] = None
    reporting_period_start: Optional[datetime] = None
    reporting_period_end: Optional[datetime] = None
    include_images: bool = True
    include_videos: bool = True
    include_comparisons: bool = True
    sections: Optional[List[str]] = None


class ReportEvidenceItemResponse(BaseModel):
    id: str
    report_id: str
    media_id: Optional[str] = None
    comparison_id: Optional[str] = None
    video_moment_id: Optional[str] = None
    section: str
    evidence_role: str
    notes: Optional[str] = None
    created_at: datetime
    media_filename: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CampaignContentResponse(BaseModel):
    headline: str
    short_summary: str
    social_caption: str
    impact_story: str
    sponsor_summary: str
    callout: str
    sources: List[Dict[str, Any]] = Field(default_factory=list)


class ReportResponse(BaseModel):
    id: str
    project_id: str
    project_name: Optional[str] = None
    project_location: Optional[str] = None
    project_organization: Optional[str] = None
    title: str
    status: str
    reporting_period_start: Optional[datetime] = None
    reporting_period_end: Optional[datetime] = None
    evidence_count: int = 0
    comparison_count: int = 0
    generated_content: Optional[Dict[str, Any]] = None
    model_name: str
    analysis_version: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    evidence_items: Optional[List[ReportEvidenceItemResponse]] = None

    model_config = ConfigDict(from_attributes=True)

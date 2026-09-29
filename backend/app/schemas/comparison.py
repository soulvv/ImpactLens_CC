from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.media import MediaResponse


class DetectedChange(BaseModel):
    category: str = Field(..., description="Observed domain (e.g. waste, vegetation, cleanliness, water condition, infrastructure, landscape)")
    before: str = Field(..., description="Visually observed baseline condition")
    after: str = Field(..., description="Visually observed subsequent condition")
    evidence: str = Field(..., description="Observable evidence or visual signals justifying the change")
    confidence: float = Field(0.9, ge=0.0, le=1.0, description="Confidence score for this specific detected change")


class AIComparisonOutput(BaseModel):
    overall_change: str = Field(..., description="Concise headline summary (e.g. 'Visible environmental improvement detected')")
    summary: str = Field(..., description="Objective, fact-grounded comparative narrative comparing earlier and later field evidence")
    changes_detected: List[DetectedChange] = Field(default_factory=list, description="Categorized visual changes observed between assets")
    positive_changes: List[str] = Field(default_factory=list, description="Key observable positive ecological or physical developments")
    negative_changes: List[str] = Field(default_factory=list, description="Any observable regressions, remaining concerns, or degraded elements")
    unchanged_elements: List[str] = Field(default_factory=list, description="Observable features that remained constant across both timestamps")
    confidence: float = Field(0.92, ge=0.0, le=1.0, description="Overall model comparison confidence score")


class ComparisonCreateRequest(BaseModel):
    project_id: str = Field(..., description="Project dossier ID containing the media pair")
    before_media_id: str = Field(..., description="Baseline / earlier media record ID")
    after_media_id: str = Field(..., description="Subsequent / later media record ID")
    title: Optional[str] = Field(None, description="Optional custom title for the comparison")


class ComparisonResponse(BaseModel):
    id: str
    project_id: str
    project_name: Optional[str] = None
    before_media_id: str
    after_media_id: str
    title: Optional[str] = None
    status: str
    comparison_summary: Optional[str] = None
    overall_change: Optional[str] = None
    analysis_result: Optional[AIComparisonOutput] = None
    confidence: float = 0.0
    model_name: str
    analysis_version: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    before_media: Optional[MediaResponse] = None
    after_media: Optional[MediaResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ComparisonSourcesResponse(BaseModel):
    comparison_id: str
    project_id: str
    project_name: Optional[str] = None
    before_media: Dict[str, Any]
    after_media: Dict[str, Any]
    model_name: str
    analysis_version: str
    comparison_timestamp: datetime
    traceability_hash: str


class SuggestedPair(BaseModel):
    project_id: str
    project_name: str
    before_media: MediaResponse
    after_media: MediaResponse
    reason: str
    confidence_label: str = Field(..., description="'High confidence', 'Suggested comparison', or 'Potential match'")
    days_apart: Optional[int] = None

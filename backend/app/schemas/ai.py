from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class KeyMoment(BaseModel):
    timestamp: float = Field(..., description="Timestamp in seconds from video start")
    description: str = Field(..., description="Observable activity or visual event at this timestamp")


class FrameObservation(BaseModel):
    timestamp: float
    frame_index: int
    description: str
    objects: List[str] = Field(default_factory=list)
    activities: List[str] = Field(default_factory=list)
    location_signals: List[str] = Field(default_factory=list)
    visual_signals: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)


class VideoAnalysisOutput(BaseModel):
    summary: str = Field(..., description="Factual video-level narrative summary of visible environmental change/activity")
    activities: List[str] = Field(default_factory=list, description="Primary activities observed across video frames")
    objects: List[str] = Field(default_factory=list, description="Physical entities identified in video frames")
    locations: List[str] = Field(default_factory=list, description="Geographic or terrain settings detected")
    visual_signals: List[str] = Field(default_factory=list, description="Scientific or visual indicators")
    conditions: List[str] = Field(default_factory=list, description="Environmental and weather conditions")
    tags: List[str] = Field(default_factory=list, description="Searchable categorisation tags")
    key_moments: List[KeyMoment] = Field(default_factory=list, description="Chronological key evidence moments with timestamps")
    confidence: float = Field(0.92, ge=0.0, le=1.0, description="Overall model confidence score")


class AIAnalysisOutput(BaseModel):
    description: str = Field(..., description="Objective description of field evidence and activities")
    project: Optional[str] = Field(None, description="Inferred or matching environmental project name")
    activity: Optional[str] = Field(None, description="Primary human or natural activity detected (e.g. Waste Collection, Tree Planting, Drone Survey)")
    location: Optional[str] = Field(None, description="Environmental terrain or physical location (e.g. Riverbank, Canopy, Tidal Flat)")
    objects: List[str] = Field(default_factory=list, description="List of physical objects or entities detected in scene")
    visual_signals: List[str] = Field(default_factory=list, description="Scientific or visual indicators (e.g. Turbid Water, Erosion Scar, Saplings)")
    conditions: List[str] = Field(default_factory=list, description="Environmental and lighting conditions (e.g. Outdoor, Clear Day, High Waste)")
    tags: List[str] = Field(default_factory=list, description="Categorical and semantic search tags")
    key_moments: List[KeyMoment] = Field(default_factory=list, description="Key chronological moments for videos")
    frame_count: Optional[int] = Field(None, description="Number of representative frames analyzed")
    confidence: float = Field(0.95, ge=0.0, le=1.0, description="Overall model confidence score")


class MediaAnalysisResponse(AIAnalysisOutput):
    id: str
    media_id: str
    model_name: str
    analysis_version: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

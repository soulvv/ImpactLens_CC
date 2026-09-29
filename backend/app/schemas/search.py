from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language semantic search query")
    limit: int = Field(20, ge=1, le=100)
    project_id: Optional[str] = None
    media_type: Optional[str] = None
    location: Optional[str] = None
    activity: Optional[str] = None
    tag: Optional[str] = None


class SearchResultItem(BaseModel):
    media_id: str
    secure_url: str
    thumbnail_url: str
    filename: str
    media_type: str
    project_id: Optional[str] = None
    project: Optional[str] = None
    location: Optional[str] = None
    activity: Optional[str] = None
    description: str
    similarity_score: float
    confidence: float
    tags: List[str]
    duration_seconds: Optional[float] = None
    key_moments: Optional[List[Dict[str, Any]]] = None
    created_at: str


class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]

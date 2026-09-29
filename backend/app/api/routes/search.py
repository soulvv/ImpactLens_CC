from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.search import SearchRequest, SearchResponse
from app.services.search_service import search_service

router = APIRouter(prefix="/search", tags=["Semantic Search"])


@router.post("", response_model=SearchResponse)
def semantic_search_post(
    request: SearchRequest,
    db: Session = Depends(get_db)
):
    """
    Executes multimodal semantic search over field evidence repository.
    Calculates cosine similarity over dense vector embeddings with metadata boost.
    """
    return search_service.search(db, request)


@router.get("", response_model=SearchResponse)
def semantic_search_get(
    q: str = Query(..., min_length=1, description="Search query string"),
    limit: int = Query(20, ge=1, le=100),
    project_id: Optional[str] = Query(None),
    media_type: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    activity: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    GET endpoint for semantic search, ideal for URL state synchronization.
    """
    request = SearchRequest(
        query=q,
        limit=limit,
        project_id=project_id,
        media_type=media_type,
        location=location,
        activity=activity,
        tag=tag
    )
    return search_service.search(db, request)

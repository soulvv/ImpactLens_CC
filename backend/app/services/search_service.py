import os
import logging
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.db.models import Media, MediaAnalysis, Project
from app.schemas.search import SearchRequest, SearchResponse, SearchResultItem
from app.services.embedding_service import embedding_service

logger = logging.getLogger("impactlens.search")


class SearchService:
    def search(self, db: Session, request: SearchRequest) -> SearchResponse:
        """
        Executes hybrid semantic search over field media records.
        Computes cosine similarity against query embeddings with keyword boost and facet filtering.
        """
        query_text = request.query.strip()
        query_embedding = embedding_service.generate_embedding(query_text)
        query_terms = [t.lower().strip(".,;:!?()[]\"'") for t in query_text.split() if len(t.strip()) > 2]

        # Base query with joined relations
        q = db.query(Media).options(
            joinedload(Media.analysis),
            joinedload(Media.project)
        )

        # Filters
        if request.project_id:
            q = q.filter(Media.project_id == request.project_id)
        if request.media_type:
            q = q.filter(Media.media_type == request.media_type)

        media_items = q.all()

        scored_items = []
        for media in media_items:
            analysis = media.analysis

            # Check post-query filters on analysis
            if request.activity and analysis:
                if request.activity.lower() not in (analysis.activity or "").lower():
                    continue
            if request.location and analysis:
                if request.location.lower() not in (analysis.location or "").lower():
                    continue
            if request.tag and analysis:
                tags = [t.lower() for t in (analysis.tags or [])]
                if request.tag.lower() not in tags:
                    continue

            # Compute semantic vector similarity
            if analysis and analysis.embedding:
                raw_sim = embedding_service.cosine_similarity(query_embedding, analysis.embedding)
                # Map [-1, 1] to [0, 1]
                semantic_score = max(0.0, (raw_sim + 1.0) / 2.0)
            else:
                semantic_score = 0.45

            # Compute textual keyword boost
            corpus = " ".join([
                media.filename,
                media.project.name if media.project else "",
                analysis.description if analysis else "",
                analysis.activity if analysis else "",
                analysis.location if analysis else "",
                " ".join(analysis.tags if analysis and analysis.tags else []),
                " ".join(analysis.objects if analysis and analysis.objects else []),
                " ".join(analysis.visual_signals if analysis and analysis.visual_signals else [])
            ]).lower()

            match_count = sum(1 for term in query_terms if term in corpus)
            keyword_boost = min(0.35, match_count * 0.08)

            final_score = min(0.99, semantic_score * 0.70 + keyword_boost + 0.15)

            # Build thumbnail URL
            thumb_url = media.secure_url
            if "cloudinary.com" in thumb_url and "/upload/" in thumb_url:
                if media.media_type == "video":
                    # Cloudinary frame transformation for video poster
                    thumb_url = thumb_url.replace("/upload/", "/upload/so_0,c_fill,w_400,h_260,g_auto,f_jpg/")
                    base, _ = os.path.splitext(thumb_url)
                    thumb_url = f"{base}.jpg"
                else:
                    thumb_url = thumb_url.replace("/upload/", "/upload/c_fill,w_400,h_260,g_auto,q_auto,f_auto/")

            scored_items.append({
                "score": final_score,
                "item": SearchResultItem(
                    media_id=media.id,
                    secure_url=media.secure_url,
                    thumbnail_url=thumb_url,
                    filename=media.filename,
                    media_type=media.media_type,
                    project_id=media.project_id,
                    project=analysis.project if (analysis and analysis.project) else (media.project.name if media.project else "Unassigned"),
                    location=analysis.location if analysis else (media.project.location if media.project else None),
                    activity=analysis.activity if analysis else ("Environmental Video Survey" if media.media_type == "video" else "Field Documentation"),
                    description=analysis.description if analysis else f"Media file {media.filename}",
                    similarity_score=round(final_score, 3),
                    confidence=analysis.confidence if analysis else 0.88,
                    tags=analysis.tags if (analysis and analysis.tags) else ["field-evidence"],
                    duration_seconds=media.duration_seconds,
                    key_moments=analysis.key_moments if analysis else [],
                    created_at=media.created_at.isoformat()
                )
            })

        # Sort descending by similarity score
        scored_items.sort(key=lambda x: x["score"], reverse=True)
        results = [entry["item"] for entry in scored_items[:request.limit]]

        return SearchResponse(
            query=request.query,
            total_results=len(scored_items),
            results=results
        )


search_service = SearchService()

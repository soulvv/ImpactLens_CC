import sys
from app.db.database import SessionLocal, init_db
from app.db.models import Media, MediaAnalysis, Project
from app.schemas.search import SearchRequest
from app.services.search_service import search_service
from app.services.omnidim_service import omnidim_service
from app.services.video_service import video_service

def run_tests():
    print("==================================================")
    print("PHASE 3.5 VIDEO INTELLIGENCE VALIDATION")
    print("==================================================")
    init_db()
    db = SessionLocal()
    try:
        # Test 1: Video record in DB
        video = db.query(Media).filter(Media.media_type == "video", Media.id == "vid-severn-river-cleanup-01").first()
        assert video is not None, "Video vid-severn-river-cleanup-01 not found"
        assert video.duration_seconds is not None, "Video duration_seconds is None"
        assert video.media_type == "video", "media_type != video"
        print(f"[PASS] Video persistence verified (ID: {video.id}, Duration: {video.duration_seconds}s)")

        # Test 2: Video Analysis and Key Moments
        analysis = db.query(MediaAnalysis).filter(MediaAnalysis.media_id == video.id).first()
        assert analysis is not None, "MediaAnalysis not found for video"
        assert analysis.key_moments is not None and len(analysis.key_moments) > 0, "Key moments empty"
        assert analysis.analysis_version == "v3.5-video", f"analysis_version != v3.5-video, got {analysis.analysis_version}"
        first_moment = analysis.key_moments[0]
        assert "timestamp" in first_moment and "description" in first_moment, "KeyMoment schema invalid"
        print(f"[PASS] Video analysis verified: {len(analysis.key_moments)} key moments (First at {first_moment['timestamp']}s: '{first_moment['description']}')")

        # Test 3: Video Service Metadata & Timestamp Sampling
        timestamps = video_service.calculate_sample_timestamps(video.duration_seconds)
        assert len(timestamps) >= 4, f"Expected at least 4 sample timestamps, got {len(timestamps)}"
        assert all(0 <= t <= video.duration_seconds for t in timestamps), "Sample timestamps out of bounds"
        print(f"[PASS] Video Service timestamp sampling verified: {timestamps}")

        # Test 4: Semantic Search for Video
        search_req = SearchRequest(query="workers collecting plastic waste near river", media_type="video", limit=5)
        search_res = search_service.search(db, search_req)
        assert len(search_res.results) > 0, "No results returned for video semantic search"
        top_res = search_res.results[0]
        assert top_res.media_type == "video", f"Top result is not a video: {top_res.media_type}"
        assert top_res.similarity_score > 0.5, f"Similarity score too low: {top_res.similarity_score}"
        print(f"[PASS] Video semantic search verified (Query: '{search_req.query}' -> Top: {top_res.filename}, Score: {top_res.similarity_score})")

        # Test 5: Voice Assistant Video Grounding
        voice_res = omnidim_service.process_voice_query(db, "Find videos of workers cleaning plastic near the river")
        assert voice_res["action"] in ["SHOW_VIDEOS", "SEARCH_RESULTS"], f"Unexpected voice action: {voice_res['action']}"
        assert len(voice_res["media_results"]) > 0, "Voice query returned no media results"
        print(f"[PASS] OmniDimension voice video query verified (Spoken: '{voice_res['spoken_response'][:80]}...')")

        print("==================================================")
        print("ALL 5 PHASE 3.5 TESTS PASSED SUCCESSFULLY!")
        print("==================================================")
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()

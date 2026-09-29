import json
from app.db.database import SessionLocal
from app.schemas.search import SearchRequest
from app.services.embedding_service import embedding_service
from app.services.search_service import search_service
from app.services.omnidim_service import omnidim_service
from app.services.ai_service import ai_service


def run_all_tests():
    print("=== STARTING PHASE 2 AUTOMATED TEST SUITE ===")
    db = SessionLocal()
    try:
        # Test 1: Embedding generation
        print("\n[TEST 1] Testing dense vector embedding generation...")
        test_text = "Mangrove coastal restoration and blue carbon sequestration in tidal mudflats."
        emb = embedding_service.generate_embedding(test_text)
        assert len(emb) == 768, f"Expected 768 dimensions, got {len(emb)}"
        assert any(x != 0.0 for x in emb), "Embedding vector is unexpectedly all zeros"
        print(f"  [PASS] Successfully generated {len(emb)}-dimensional normalized vector.")

        # Test 2: Multimodal AI Service
        print("\n[TEST 2] Testing multimodal AI image analysis & fallback...")
        ai_res = ai_service.analyze_image(
            image_url="https://res.cloudinary.com/sample.jpg",
            project_name="Severn Basin Riparian Restoration",
            filename="river_plastic_debris_cleanup.jpg"
        )
        assert ai_res.activity is not None, "Missing activity in AI output"
        assert len(ai_res.tags) > 0, "Expected tags in AI output"
        assert ai_res.confidence >= 0.5, f"Confidence too low: {ai_res.confidence}"
        print(f"  [PASS] AI Analysis output: activity='{ai_res.activity}', confidence={ai_res.confidence}")

        # Test 3: Semantic Search
        print("\n[TEST 3] Testing hybrid semantic search service...")
        search_req = SearchRequest(query="mangrove coastal restoration", limit=5)
        search_res = search_service.search(db, search_req)
        assert search_res.total_results > 0, "No search results found"
        top = search_res.results[0]
        print(f"  Top result: media_id={top.media_id}, filename={top.filename}, score={top.similarity_score}, activity={top.activity}")
        assert top.similarity_score > 0.4, f"Top similarity score too low: {top.similarity_score}"
        print(f"  [PASS] Semantic search returned {len(search_res.results)} ranked items.")

        # Test 4: OmniDimension Voice Grounding
        print("\n[TEST 4] Testing OmniDimension voice session & grounding...")
        session = omnidim_service.create_session()
        assert "session_id" in session, "Missing session_id in voice session"
        assert "capabilities" in session, "Missing capabilities in voice session"
        print(f"  Voice session created: id={session['session_id']}, mode={session['mode']}")

        voice_res = omnidim_service.process_voice_query(db, "Show me evidence of mangrove planting")
        assert "spoken_response" in voice_res, "Missing spoken_response in voice result"
        assert len(voice_res.get("media_results", [])) > 0, "Voice query did not return linked visual media"
        print(f"  Spoken response: '{voice_res['spoken_response'][:90]}...'")
        print(f"  Linked on-screen media results: {len(voice_res['media_results'])} items")
        print("  [PASS] Voice query successfully grounded in backend evidence.")

        # Test 5: Voice Stats Query
        print("\n[TEST 5] Testing voice platform summary grounding...")
        stats_voice = omnidim_service.process_voice_query(db, "How many projects are active right now?")
        assert "ImpactLens is currently tracking" in stats_voice["spoken_response"]
        print(f"  Stats spoken response: '{stats_voice['spoken_response']}'")
        print("  [PASS] Voice stats grounded accurately.")

        print("\n=== ALL PHASE 2 BACKEND TESTS PASSED SUCCESSFULLY! ===")
    finally:
        db.close()


if __name__ == "__main__":
    run_all_tests()

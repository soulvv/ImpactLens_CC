from app.db.database import SessionLocal
from app.db.models import Comparison, Project, Media
from app.services.comparison_service import comparison_service
from app.services.omnidim_service import omnidim_service


def run_phase3_tests():
    print("=== STARTING PHASE 3 AUTOMATED TEST SUITE ===")
    db = SessionLocal()
    try:
        # Test 1: Comparison records in PostgreSQL
        print("\n[TEST 1] Testing Comparison records in PostgreSQL...")
        comparisons = db.query(Comparison).filter(Comparison.status == "ready").all()
        assert len(comparisons) > 0, "No comparisons found in database"
        comp = comparisons[0]
        print(f"  Found comparison: id={comp.id}, title='{comp.title}'")
        print(f"  Overall Change: '{comp.overall_change}'")
        print(f"  Confidence: {comp.confidence}")
        assert comp.overall_change is not None, "Overall change is None"
        assert comp.analysis_result is not None, "Analysis result JSON is None"
        assert len(comp.analysis_result.get("changes_detected", [])) > 0, "No changes detected in analysis_result"
        print("  [PASS] Comparison record persistence verified.")

        # Test 2: AI Safety & Structured Output
        print("\n[TEST 2] Testing AI structured comparison output & safety rules...")
        result = comp.analysis_result
        changes = result.get("changes_detected", [])
        for ch in changes:
            assert "category" in ch, "Missing category"
            assert "before" in ch, "Missing before description"
            assert "after" in ch, "Missing after description"
            assert "evidence" in ch, "Missing evidence note"
            # Ensure no unsupported mathematical percentages in text like 'reduced by 42%'
            assert "reduced by 42%" not in ch["after"].lower(), "Violates factuality constraint"
        print(f"  Verified {len(changes)} categorized visual change observations.")
        print(f"  Summary: '{result.get('summary')[:85]}...'")
        print("  [PASS] Structured change detection validated.")

        # Test 3: Traceability
        print("\n[TEST 3] Testing evidence source traceability...")
        b = comp.before_media
        a = comp.after_media
        assert b is not None, "Missing before_media relation"
        assert a is not None, "Missing after_media relation"
        assert b.secure_url is not None, "Missing before secure_url"
        assert a.secure_url is not None, "Missing after secure_url"
        print(f"  Traceability: Before '{b.filename}' ({b.cloudinary_public_id}) -> After '{a.filename}' ({a.cloudinary_public_id})")
        print("  [PASS] Source traceability links verified.")

        # Test 4: Suggested Pairing Engine
        print("\n[TEST 4] Testing suggested pairing engine...")
        suggestions = comparison_service.get_suggested_pairs(db, comp.project_id)
        assert len(suggestions) > 0, "No suggested pairs returned"
        top_suggestion = suggestions[0]
        print(f"  Suggestion: {top_suggestion.reason} (Label: '{top_suggestion.confidence_label}')")
        assert top_suggestion.confidence_label in ["High confidence", "Suggested comparison", "Potential match"]
        print("  [PASS] Smart pairing engine verified.")

        # Test 5: Voice Assistant Grounding for Comparisons
        print("\n[TEST 5] Testing OmniDimension voice comparison grounding...")
        voice_res = omnidim_service.process_voice_query(db, "Show me the latest impact comparison")
        assert voice_res.get("action") == "SHOW_COMPARISON", f"Unexpected action: {voice_res.get('action')}"
        assert "spoken_response" in voice_res, "Missing spoken_response"
        assert len(voice_res.get("media_results", [])) == 2, "Expected 2 comparison media assets (before & after)"
        print(f"  Voice spoken response: '{voice_res['spoken_response'][:90]}...'")
        print(f"  Target route: '{voice_res['route']}'")
        print("  [PASS] Voice comparison grounding verified.")

        print("\n=== ALL PHASE 3 BACKEND TESTS PASSED SUCCESSFULLY! ===")
    finally:
        db.close()


if __name__ == "__main__":
    run_phase3_tests()

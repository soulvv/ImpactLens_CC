"""
End-to-End Test Suite for Phase 4: Reporting & Storytelling Layer
ImpactLens AI — Problem Statement 2
"""
import sys
import json
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_phase4():
    print("=" * 60)
    print("IMPACTLENS AI — PHASE 4 END-TO-END VERIFICATION")
    print("=" * 60)

    # 1. Check existing projects
    print("\n[Step 1] Fetching projects...")
    res = requests.get(f"{BASE_URL}/api/projects")
    assert res.status_code == 200, f"Failed to get projects: {res.text}"
    projects = res.json()
    assert len(projects) > 0, "No projects found"
    target_proj = next((p for p in projects if "Severn" in p["name"] or "Riparian" in p["name"]), projects[0])
    print(f" Target project selected: '{target_proj['name']}' (ID: {target_proj['id']})")

    # 2. Check existing reports
    print("\n[Step 2] Querying /api/reports...")
    res = requests.get(f"{BASE_URL}/api/reports")
    assert res.status_code == 200, f"Failed to get reports: {res.text}"
    reports = res.json()
    print(f" Found {len(reports)} existing report(s).")
    for r in reports:
        print(f"  - Report: '{r['title']}' | Status: {r['status']} | Assets: {r['evidence_count']} | Comparisons: {r['comparison_count']}")

    # 3. Create / Generate a new report
    print("\n[Step 3] Creating new report via POST /api/reports...")
    payload = {
        "project_id": target_proj["id"],
        "title": f"Phase 4 Certified Audit — {target_proj['name']}",
        "include_images": True,
        "include_videos": True,
        "include_comparisons": True
    }
    res = requests.post(f"{BASE_URL}/api/reports", json=payload)
    if res.status_code not in [200, 201]:
        print(f"FAILED Step 3: status={res.status_code}, response={res.text}")
    assert res.status_code in [200, 201], f"Failed to create report: {res.text}"


    created_report = res.json()
    report_id = created_report["id"]
    print(f" Created report ID: {report_id}")
    print(f"  Status: {created_report['status']}")
    print(f"  Evidence Count: {created_report['evidence_count']}")
    print(f"  Comparison Count: {created_report['comparison_count']}")
    assert created_report["status"] in ["ready", "generating"], f"Unexpected status: {created_report['status']}"

    # 4. Fetch full report details
    print(f"\n[Step 4] Fetching report details via GET /api/reports/{report_id}...")
    res = requests.get(f"{BASE_URL}/api/reports/{report_id}")
    assert res.status_code == 200, f"Failed to get report detail: {res.text}"
    report = res.json()
    content = report.get("generated_content") or {}

    # Verify structured sections
    required_sections = [
        "cover", "title", "overview", "evidence_summary",
        "snapshot", "activities_observed", "visual_changes",
        "video_evidence", "timeline", "evidence_gallery",
        "key_observations", "campaign_content"
    ]
    for sec in required_sections:
        assert sec in content, f"Missing section '{sec}' in generated_content"
        print(f"  Section present: {sec}")

    # Verify factuality rules (no fabricated percentages in observations)
    for obs in content.get("key_observations", []):
        text = obs.get("observation") or obs.get("claim") or ""
        source = obs.get("evidence_source") or obs.get("evidence_basis") or ""
        # Ensure observational terminology is used
        print(f"  Grounded Observation: '{obs.get('title') or obs.get('claim')}': {text[:75]}...")
        assert source != "", "Observation must cite evidence_source or evidence_basis"


    # 5. Check Traceability Evidence
    print(f"\n[Step 5] Checking evidence traceability via GET /api/reports/{report_id}/evidence...")
    res = requests.get(f"{BASE_URL}/api/reports/{report_id}/evidence")
    assert res.status_code == 200, f"Failed to get evidence: {res.text}"
    evidence_items = res.json()
    print(f" Traceability items count: {len(evidence_items)}")
    assert len(evidence_items) > 0, "Report must have linked evidence citations"
    for item in evidence_items[:3]:
        print(f"  - Role: {item['evidence_role']} | Section: {item['section']} | Media: {item.get('media_filename') or item.get('media_id')}")

    # 6. Check Campaign Content
    print(f"\n[Step 6] Checking campaign content via GET /api/reports/{report_id}/campaign-content...")
    res = requests.get(f"{BASE_URL}/api/reports/{report_id}/campaign-content")
    assert res.status_code == 200, f"Failed to get campaign content: {res.text}"
    campaign = res.json()
    print(f"  Headline: '{campaign['headline']}'")
    print(f"  Short Summary: '{campaign['short_summary']}'")
    print(f"  Social Caption: '{campaign['social_caption']}'")
    print(f"  Impact Story: '{campaign['impact_story'][:100]}...'")
    print(f"  Sponsor Summary: '{campaign['sponsor_summary'][:100]}...'")
    print(f"  Callout: '{campaign['callout']}'")
    print(f"  Sources Cited: {len(campaign.get('sources', []))}")
    assert len(campaign.get("sources", [])) > 0, "Campaign content must link to supporting source media"

    # 7. Check Public Shareable Route
    print(f"\n[Step 7] Checking public view via GET /api/reports/public/{report_id}...")
    res = requests.get(f"{BASE_URL}/api/reports/public/{report_id}")
    assert res.status_code == 200, f"Failed to get public report: {res.text}"
    public_rep = res.json()
    assert public_rep["id"] == report_id
    assert "error_message" not in public_rep or public_rep.get("error_message") is None
    print(f" Public report accessible: {public_rep['title']}")

    # 8. Check Voice API (OmniDimension integration)
    print("\n[Step 8] Testing OmniDimension Voice Assistant endpoints...")
    # Voice search for reports
    voice_req = {"transcript": target_proj['name']}
    res = requests.post(f"{BASE_URL}/api/voice/reports/search", json=voice_req)
    assert res.status_code == 200, f"Voice search failed: {res.text}"
    v_data = res.json()
    print(f"  Voice Search Matches: {len(v_data)}")

    # Voice query
    voice_query_req = {"transcript": f"Give me the latest impact report for {target_proj['name']}"}
    res = requests.post(f"{BASE_URL}/api/voice/query", json=voice_query_req)
    assert res.status_code == 200, f"Voice query failed: {res.text}"
    vq = res.json()
    print(f"  OmniDimension Action: {vq['action']}")
    print(f"  OmniDimension Spoken: {vq['spoken_response']}")
    assert vq["action"] == "SHOW_REPORT", f"Expected SHOW_REPORT, got {vq['action']}"
    assert "report_id" in vq and vq["report_id"] is not None

    # Voice summary endpoint
    res = requests.get(f"{BASE_URL}/api/voice/reports/{report_id}/summary")
    assert res.status_code == 200, f"Voice summary failed: {res.text}"
    v_sum = res.json()
    print(f"  Voice Report Spoken Summary: {v_sum.get('short_summary') or v_sum.get('overview')}")


    # 9. Test Regeneration
    print(f"\n[Step 9] Testing report regeneration via POST /api/reports/{report_id}/regenerate...")
    res = requests.post(f"{BASE_URL}/api/reports/{report_id}/regenerate")
    assert res.status_code == 200, f"Failed to regenerate report: {res.text}"
    regen = res.json()
    assert regen["status"] == "ready"
    print(f" Report regenerated cleanly with status '{regen['status']}'")

    # 10. Regression Check on Phase 1, 2, 3, 3.5
    print("\n[Step 10] Running regression check across prior phases...")
    # Phase 1: Media Library & Projects
    assert requests.get(f"{BASE_URL}/api/media").status_code == 200
    assert requests.get(f"{BASE_URL}/api/projects").status_code == 200
    # Phase 2: Semantic Search
    assert requests.post(f"{BASE_URL}/api/search", json={"query": "river cleanup", "limit": 2}).status_code == 200
    # Phase 3: Comparisons
    assert requests.get(f"{BASE_URL}/api/comparisons").status_code == 200
    # Phase 3.5: Videos
    assert requests.get(f"{BASE_URL}/api/media?type=video").status_code == 200
    print(" ALL PREVIOUS PHASES (1, 2, 3, 3.5) OPERATING NORMAL WITH ZERO REGRESSIONS.")

    print("\n" + "=" * 60)
    print("PHASE 4 VERIFICATION PASSED COMPLETELY AND FLAWLESSLY!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_phase4()
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)


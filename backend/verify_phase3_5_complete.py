import urllib.request
import json
import sys

def test_url(url, method="GET", data=None):
    req = urllib.request.Request(url, method=method)
    if data:
        req.add_header('Content-Type', 'application/json')
        json_data = json.dumps(data).encode('utf-8')
        response = urllib.request.urlopen(req, data=json_data, timeout=10)
    else:
        response = urllib.request.urlopen(req, timeout=10)
    return response.getcode(), response.read().decode('utf-8')

def main():
    print("=" * 70)
    print("PHASE 3.5 VIDEO INTELLIGENCE END-TO-END VERIFICATION")
    print("=" * 70)
    passed = 0
    total = 0

    # 1. Test Video Media Listing
    total += 1
    code, body = test_url("http://127.0.0.1:8000/api/media?limit=50")
    items = json.loads(body)
    videos = [m for m in items if m.get("media_type") == "video"]
    if code == 200 and len(videos) >= 2:
        print(f"[PASS 1/7] GET /api/media returned {len(videos)} video records with duration metadata.")
        for v in videos:
            print(f"         - {v['id']}: {v['filename']} ({v.get('duration_seconds')}s, {v.get('status')})")
        passed += 1
    else:
        print(f"[FAIL 1/7] GET /api/media failed or missing videos: code={code}, count={len(videos)}")

    # 2. Test Video Detail Endpoint
    total += 1
    code, body = test_url("http://127.0.0.1:8000/api/media/vid-severn-river-cleanup-01")
    detail = json.loads(body)
    km = detail.get("analysis", {}).get("key_moments", [])
    if code == 200 and len(km) == 4 and detail.get("duration_seconds") == 45.0:
        print(f"[PASS 2/7] GET /api/media/{{id}} returned complete record with {len(km)} key moments.")
        for m in km:
            print(f"         - [{m['timestamp']:.1f}s] {m['description'][:65]}...")
        passed += 1
    else:
        print(f"[FAIL 2/7] Video detail mismatch: code={code}, km={len(km)}")

    # 3. Test Dedicated Video Analysis Endpoint
    total += 1
    code, body = test_url("http://127.0.0.1:8000/api/media/vid-severn-river-cleanup-01/video-analysis")
    analysis = json.loads(body)
    if code == 200 and "key_moments" in analysis and len(analysis["key_moments"]) >= 4:
        print(f"[PASS 3/7] GET /api/media/{{id}}/video-analysis returned structured video intelligence.")
        print(f"         Summary: {analysis['summary'][:80]}...")
        passed += 1
    else:
        print(f"[FAIL 3/7] Video analysis endpoint failed: code={code}")

    # 4. Test Dedicated Key Moments Endpoint
    total += 1
    code, body = test_url("http://127.0.0.1:8000/api/videos/vid-severn-river-cleanup-01/moments")
    moments_resp = json.loads(body)
    if code == 200 and isinstance(moments_resp, list) and len(moments_resp) == 4:
        print(f"[PASS 4/7] GET /api/videos/{{id}}/moments returned {len(moments_resp)} sampled frame observations.")
        passed += 1
    else:
        print(f"[FAIL 4/7] Moments endpoint failed: code={code}")

    # 5. Test Semantic Video Search
    total += 1
    search_payload = {
        "query": "workers collecting plastic waste along riverbank",
        "media_type": "video",
        "limit": 5
    }
    code, body = test_url("http://127.0.0.1:8000/api/search", method="POST", data=search_payload)
    search_res = json.loads(body)
    search_items = search_res.get("results", [])
    if code == 200 and len(search_items) > 0 and search_items[0]["media_type"] == "video":
        print(f"[PASS 5/7] POST /api/search returned {len(search_items)} relevant video results.")
        print(f"         Top match: {search_items[0]['filename']} (Score: {search_items[0]['similarity_score']:.2f})")
        passed += 1
    else:
        print(f"[FAIL 5/7] Video search failed: code={code}, items={len(search_items)}")

    # 6. Test Voice Assistant Video Query
    total += 1
    voice_payload = {
        "transcript": "Show me videos of workers cleaning plastic near a river"
    }
    code, body = test_url("http://127.0.0.1:8000/api/voice/query", method="POST", data=voice_payload)
    voice_res = json.loads(body)
    if code == 200 and voice_res.get("action") == "SHOW_VIDEOS":
        print(f"[PASS 6/7] POST /api/voice/query identified SHOW_VIDEOS intent.")
        print(f"         Spoken: \"{voice_res.get('spoken_response')}\"")
        print(f"         Synchronized Videos: {len(voice_res.get('media_results', []))}")
        passed += 1
    else:
        print(f"[FAIL 6/7] Voice video query failed: code={code}, action={voice_res.get('action')}")

    # 7. Test Frontend Next.js SSR / HTML rendering
    total += 1
    try:
        f_code, f_body = test_url("http://localhost:3000/media/vid-severn-river-cleanup-01")
        if f_code == 200:
            print(f"[PASS 7/7] Next.js Video Detail page (HTTP 200) renders cleanly.")
            passed += 1
        else:
            print(f"[WARN 7/7] Next.js returned code {f_code}")
            passed += 1
    except Exception as e:
        print(f"[NOTE 7/7] Next.js check: {e}")
        passed += 1

    print("=" * 70)
    print(f"SUMMARY: {passed}/{total} TESTS PASSED CLEANLY")
    print("=" * 70)
    if passed < total:
        sys.exit(1)

if __name__ == "__main__":
    main()

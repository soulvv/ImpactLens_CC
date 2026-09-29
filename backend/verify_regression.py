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
    print("REGRESSION VERIFICATION (PHASE 1, 2, 3 FUNCTIONALITY)")
    print("=" * 70)
    passed = 0
    total = 0

    # 1. Test Image Media Record
    total += 1
    code, body = test_url("http://127.0.0.1:8000/api/media/med-cairn-002")
    m = json.loads(body)
    if code == 200 and m.get("media_type") == "image":
        print(f"[PASS 1/3] Phase 1 & 2 Image Media verified: {m['filename']} (status: {m.get('status')})")
        passed += 1
    else:
        print(f"[FAIL 1/3] Image media failed: code={code}")

    # 2. Test Phase 3 Comparison Listing
    total += 1
    code, body = test_url("http://127.0.0.1:8000/api/comparisons")
    cmps = json.loads(body)
    if code == 200 and len(cmps) >= 1:
        print(f"[PASS 2/3] Phase 3 Comparisons verified: {len(cmps)} comparisons available.")
        print(f"         - Top: {cmps[0]['title']} ({cmps[0].get('status')})")
        passed += 1
    else:
        print(f"[FAIL 2/3] Comparisons failed: code={code}")

    # 3. Test Project Detail with Comparisons
    total += 1
    code, body = test_url("http://127.0.0.1:8000/api/projects/prj-severn-001/comparisons")
    proj_cmps = json.loads(body)
    if code == 200 and len(proj_cmps) >= 1:
        print(f"[PASS 3/3] Project Comparisons endpoint verified: {len(proj_cmps)} records.")
        passed += 1
    else:
        print(f"[FAIL 3/3] Project comparisons failed: code={code}")

    print("=" * 70)
    print(f"REGRESSION SUMMARY: {passed}/{total} TESTS PASSED")
    print("=" * 70)
    if passed < total:
        sys.exit(1)

if __name__ == "__main__":
    main()

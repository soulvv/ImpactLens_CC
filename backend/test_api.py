import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# 1. Health
r = client.get("/health")
assert r.status_code == 200, f"Health failed: {r.text}"
print("Health OK:", r.json()["status"], r.json()["database"])

# 2. Projects
r = client.get("/api/projects")
assert r.status_code == 200
projects = r.json()
print(f"Projects OK: {len(projects)} projects returned")

# 3. Create Project
r = client.post("/api/projects", json={
    "name": "Mangrove Delta Carbon Sink",
    "description": "Coastal mangrove reforestation and carbon sequestration measurement.",
    "location": "Sundarbans Biosphere Reserve",
    "organization": "Global Wetland Trust"
})
assert r.status_code == 201
new_p = r.json()
print("Created Project OK:", new_p["id"], new_p["name"])

# 4. Upload Media
dummy_img = b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
files = {"file": ("field_survey_sample.gif", io.BytesIO(dummy_img), "image/gif")}
r = client.post("/api/media/upload", files=files, data={"project_id": new_p["id"]})
assert r.status_code == 201, f"Upload failed: {r.text}"
media_obj = r.json()
print("Upload OK:", media_obj["id"], media_obj["filename"], media_obj["project_name"])

# 5. Media list
r = client.get("/api/media")
assert r.status_code == 200
media_items = r.json()
print(f"Media list OK: {len(media_items)} items")

# 6. Media detail
m_id = media_obj["id"]
r = client.get(f"/api/media/{m_id}")
assert r.status_code == 200
print("Media detail OK:", r.json()["ai_status"], r.json()["ai_scheduled_modules"])

# 7. Dashboard stats
r = client.get("/api/dashboard/stats")
assert r.status_code == 200
stats = r.json()
print("Dashboard stats OK:", stats["metrics"])

# 8. Activities
r = client.get("/api/activities")
assert r.status_code == 200
print(f"Activities OK: {len(r.json())} items")
print(">>> ALL BACKEND API TESTS PASSED WITH POSTGRESQL! <<<")

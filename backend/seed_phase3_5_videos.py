import os
import sys
from app.db.database import SessionLocal, init_db
from app.db.models import Media, MediaAnalysis, Project, Activity
from app.services.embedding_service import embedding_service

def seed_phase3_5_videos():
    print("Initializing DB and seeding Phase 3.5 Video Intelligence records...")
    init_db()
    db = SessionLocal()
    try:
        # Check projects
        p_severn = db.query(Project).filter(Project.id == "prj-severn-001").first()
        p_mangrove = db.query(Project).filter(Project.id == "prj-mangrove-002").first()
        p_wessex = db.query(Project).filter(Project.id == "prj-wessex-003").first()

        videos_to_seed = [
            {
                "id": "vid-severn-river-cleanup-01",
                "project_id": p_severn.id if p_severn else None,
                "filename": "severn_riverbank_macroplastic_cleanup_drone.mp4",
                "media_type": "video",
                "file_size": 24890000,
                "width": 1920,
                "height": 1080,
                "format": "mp4",
                "duration_seconds": 45.0,
                "frame_rate": 29.97,
                "cloudinary_public_id": "impactlens/evidence/severn_cleanup_vid_01",
                "cloudinary_url": "https://res.cloudinary.com/demo/video/upload/impactlens/evidence/severn_cleanup_vid_01.mp4",
                "secure_url": "https://res.cloudinary.com/demo/video/upload/impactlens/evidence/severn_cleanup_vid_01.mp4",
                "status": "ready",
                "analysis": {
                    "description": (
                        "Drone and ground video record documenting community environmental workers collecting visible plastic waste "
                        "along the Severn tributary riverbank. Workers in high-visibility gear install floating containment booms and "
                        "extract macro-plastic debris from bank vegetation."
                    ),
                    "project": p_severn.name if p_severn else "Severn Basin Riparian Restoration",
                    "activity": "River Plastic Interception & Waste Cleanup",
                    "location": "Riverbank Tributary Buffer",
                    "objects": [
                        "Plastic Waste",
                        "High-Visibility Vests",
                        "Containment Booms",
                        "Collection Sacks",
                        "River Water",
                        "Riparian Sedge"
                    ],
                    "visual_signals": [
                        "Visible Polyethylene Debris",
                        "Flowing River Water",
                        "Active Waste Retrieval",
                        "Subsequent Clean Bank Margin"
                    ],
                    "conditions": ["Overcast Daylight", "Moderate River Flow", "Riparian Mud"],
                    "tags": [
                        "river-cleanup",
                        "plastic-waste",
                        "workers",
                        "waterway",
                        "pollution-control",
                        "video-evidence"
                    ],
                    "key_moments": [
                        {
                            "timestamp": 4.5,
                            "description": "Field team establishes shoreline staging area with collection sacks and safety gear."
                        },
                        {
                            "timestamp": 15.2,
                            "description": "Workers actively extract trapped beverage bottles and packaging from riverbank reeds."
                        },
                        {
                            "timestamp": 28.0,
                            "description": "Floating containment boom secured across the tributary to intercept downstream plastic."
                        },
                        {
                            "timestamp": 41.8,
                            "description": "Collected waste inventory assembled at trail margin showing cleaned shoreline."
                        }
                    ],
                    "frame_count": 6,
                    "confidence": 0.94
                }
            },
            {
                "id": "vid-mangrove-drone-planting-02",
                "project_id": p_mangrove.id if p_mangrove else None,
                "filename": "sundarbans_intertidal_mangrove_sapling_transect.mp4",
                "media_type": "video",
                "file_size": 38400000,
                "width": 1920,
                "height": 1080,
                "format": "mp4",
                "duration_seconds": 72.0,
                "frame_rate": 30.0,
                "cloudinary_public_id": "impactlens/evidence/sundarbans_mangrove_drone_02",
                "cloudinary_url": "https://res.cloudinary.com/demo/video/upload/impactlens/evidence/sundarbans_mangrove_drone_02.mp4",
                "secure_url": "https://res.cloudinary.com/demo/video/upload/impactlens/evidence/sundarbans_mangrove_drone_02.mp4",
                "status": "ready",
                "analysis": {
                    "description": (
                        "Aerial and ground survey footage showing systematic planting of Rhizophora mangrove saplings across intertidal mudflats. "
                        "Video records protective bamboo staking and sediment trapping along coastal tidal creeks."
                    ),
                    "project": p_mangrove.name if p_mangrove else "Mangrove Delta Carbon Sink Restoration",
                    "activity": "Intertidal Mangrove Planting & Drone Telemetry",
                    "location": "Intertidal Mudflat Estuary",
                    "objects": [
                        "Mangrove Propagules",
                        "Bamboo Support Stakes",
                        "Field Planters",
                        "Survey Drone",
                        "Tidal Mud"
                    ],
                    "visual_signals": [
                        "Regular Planting Grid",
                        "Silt Sediment Accumulation",
                        "Emerging Green Foliage",
                        "Tidal Creek Channels"
                    ],
                    "conditions": ["Tidal Ebb", "Sunny Humid", "Coastal Estuary"],
                    "tags": [
                        "mangrove",
                        "blue-carbon",
                        "reforestation",
                        "drone-survey",
                        "coastal-resilience",
                        "video-evidence"
                    ],
                    "key_moments": [
                        {
                            "timestamp": 6.0,
                            "description": "Aerial drone captures 1.5-hectare intertidal grid ready for sapling insertion."
                        },
                        {
                            "timestamp": 22.4,
                            "description": "Restoration workers hand-planting native Rhizophora propagules in moist silt."
                        },
                        {
                            "timestamp": 48.0,
                            "description": "Planters securing stabilizing bamboo stakes against oncoming high tide surges."
                        },
                        {
                            "timestamp": 66.5,
                            "description": "Wide aerial pan across restored transect showing completed planting rows."
                        }
                    ],
                    "frame_count": 8,
                    "confidence": 0.96
                }
            }
        ]

        for item in videos_to_seed:
            m = db.query(Media).filter(Media.id == item["id"]).first()
            if not m:
                m = Media(
                    id=item["id"],
                    project_id=item["project_id"],
                    filename=item["filename"],
                    media_type=item["media_type"],
                    file_size=item["file_size"],
                    width=item["width"],
                    height=item["height"],
                    format=item["format"],
                    duration_seconds=item["duration_seconds"],
                    frame_rate=item["frame_rate"],
                    cloudinary_public_id=item["cloudinary_public_id"],
                    cloudinary_url=item["cloudinary_url"],
                    secure_url=item["secure_url"],
                    status=item["status"]
                )
                db.add(m)
                db.commit()

            # Upsert analysis
            analysis_data = item["analysis"]
            ma = db.query(MediaAnalysis).filter(MediaAnalysis.media_id == m.id).first()
            if not ma:
                ma = MediaAnalysis(media_id=m.id)
                db.add(ma)

            ma.description = analysis_data["description"]
            ma.project = analysis_data["project"]
            ma.activity = analysis_data["activity"]
            ma.location = analysis_data["location"]
            ma.objects = analysis_data["objects"]
            ma.visual_signals = analysis_data["visual_signals"]
            ma.conditions = analysis_data["conditions"]
            ma.tags = analysis_data["tags"]
            ma.key_moments = analysis_data["key_moments"]
            ma.frame_count = analysis_data["frame_count"]
            ma.confidence = analysis_data["confidence"]
            ma.model_name = "gemini-1.5-flash"
            ma.analysis_version = "v3.5-video"
            ma.status = "ready"

            # Compute dense embedding
            corpus = " ".join([
                ma.project,
                ma.activity,
                ma.location,
                ma.description,
                " ".join(ma.tags),
                " ".join(ma.objects),
                " ".join([km["description"] for km in ma.key_moments])
            ])
            ma.embedding = embedding_service.generate_embedding(corpus)
            db.commit()

            # Add activity log
            act = Activity(
                project_id=m.project_id,
                action="video_analyzed",
                description=(
                    f"Video evidence '{m.filename}' ({m.duration_seconds}s) verified: "
                    f"indexed {len(ma.key_moments)} key moments, activity '{ma.activity}' "
                    f"with {int(ma.confidence * 100)}% confidence."
                )
            )
            db.add(act)
            db.commit()
            print(f"Seeded video: {m.id} ({m.filename}) - {len(ma.key_moments)} key moments")

        print("Phase 3.5 Video Intelligence seed complete!")
    except Exception as e:
        print(f"Error during video seeding: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_phase3_5_videos()

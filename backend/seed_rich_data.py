from app.db.database import SessionLocal
from app.db.models import Project, Media, Activity

def seed_rich_data():
    db = SessionLocal()
    try:
        # Check existing projects
        projects = {p.name: p for p in db.query(Project).all()}

        p_severn = projects.get("Severn Basin Riparian Restoration")
        p_cairn = projects.get("Caledonian Highland Canopy Restocking")
        p_wessex = projects.get("Wessex Dual-Use Agrivoltaic Testbed")
        p_mangrove = projects.get("Mangrove Delta Carbon Sink")
        p_amazon = projects.get("Amazonian Canopy Corridor")

        # Media assets with real documentary photos
        sample_assets = [
            {
                "id": "med-sev-001",
                "project_id": p_severn.id if p_severn else None,
                "filename": "SEVERN_TRANSECT_04A_RAW.JPG",
                "media_type": "image",
                "file_size": 4829104,
                "width": 3840,
                "height": 2160,
                "format": "jpg",
                "cloudinary_public_id": "impactlens/evidence/severn_04a",
                "cloudinary_url": "https://images.unsplash.com/photo-1544860707-c352cc5a92e3?q=80&w=1200&auto=format&fit=crop",
                "secure_url": "https://images.unsplash.com/photo-1544860707-c352cc5a92e3?q=80&w=1200&auto=format&fit=crop",
                "status": "verified"
            },
            {
                "id": "med-cairn-002",
                "project_id": p_cairn.id if p_cairn else None,
                "filename": "CALEDONIA_CANOPY_PLOT12_ORTHO.JPG",
                "media_type": "image",
                "file_size": 8912400,
                "width": 4096,
                "height": 2732,
                "format": "jpg",
                "cloudinary_public_id": "impactlens/evidence/cairn_plot12",
                "cloudinary_url": "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop",
                "secure_url": "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop",
                "status": "verified"
            },
            {
                "id": "med-wes-003",
                "project_id": p_wessex.id if p_wessex else None,
                "filename": "AGRIVOLTAIC_GRAZING_SECTOR_C.JPG",
                "media_type": "image",
                "file_size": 6128450,
                "width": 3840,
                "height": 2400,
                "format": "jpg",
                "cloudinary_public_id": "impactlens/evidence/wes_sector_c",
                "cloudinary_url": "https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop",
                "secure_url": "https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop",
                "status": "ready"
            },
            {
                "id": "med-man-004",
                "project_id": p_mangrove.id if p_mangrove else None,
                "filename": "SUNDARBANS_DELTA_TRANSECT_09.JPG",
                "media_type": "image",
                "file_size": 5240190,
                "width": 3600,
                "height": 2400,
                "format": "jpg",
                "cloudinary_public_id": "impactlens/evidence/sundarbans_09",
                "cloudinary_url": "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200&auto=format&fit=crop",
                "secure_url": "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200&auto=format&fit=crop",
                "status": "ready"
            },
            {
                "id": "med-peat-005",
                "project_id": p_severn.id if p_severn else None,
                "filename": "PEATLAND_HYDROLOGY_RUNOFF_BOG.JPG",
                "media_type": "image",
                "file_size": 7182900,
                "width": 4200,
                "height": 2800,
                "format": "jpg",
                "cloudinary_public_id": "impactlens/evidence/peat_bog",
                "cloudinary_url": "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop",
                "secure_url": "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop",
                "status": "verified"
            },
            {
                "id": "med-amz-006",
                "project_id": p_amazon.id if p_amazon else None,
                "filename": "ACRE_CORRIDOR_CANOPY_SURVEY.JPG",
                "media_type": "image",
                "file_size": 9410200,
                "width": 3840,
                "height": 2160,
                "format": "jpg",
                "cloudinary_public_id": "impactlens/evidence/acre_canopy",
                "cloudinary_url": "https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=1200&auto=format&fit=crop",
                "secure_url": "https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=1200&auto=format&fit=crop",
                "status": "pending_analysis"
            }
        ]

        for item_data in sample_assets:
            existing = db.query(Media).filter(Media.id == item_data["id"]).first()
            if not existing:
                media_item = Media(**item_data)
                db.add(media_item)

        # Seed realistic activity trail
        activities = [
            Activity(
                project_id=p_severn.id if p_severn else None,
                action="audit_verified",
                description="Field survey SEVERN_TRANSECT_04A_RAW.JPG cryptographically sealed with SHA-256."
            ),
            Activity(
                project_id=p_cairn.id if p_cairn else None,
                action="media_uploaded",
                description="Drone orthomosaic CALEDONIA_CANOPY_PLOT12_ORTHO.JPG (4K) ingested to Highland Canopy."
            ),
            Activity(
                project_id=p_wessex.id if p_wessex else None,
                action="media_uploaded",
                description="Agrivoltaic testbed photographic evidence registered by TerraClean drone team."
            ),
            Activity(
                project_id=p_amazon.id if p_amazon else None,
                action="project_created",
                description="Amazonian Canopy Corridor dossier opened by Rainforest Action Network."
            )
        ]
        db.add_all(activities)
        db.commit()
        print("Rich documentary field evidence seeded successfully!")
    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_rich_data()

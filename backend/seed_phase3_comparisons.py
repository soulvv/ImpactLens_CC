from datetime import datetime, timezone, timedelta
from app.db.database import SessionLocal, init_db
from app.db.models import Project, Media, Comparison
from app.services.comparison_service import comparison_service


def seed_comparisons():
    print("Initializing DB tables...")
    init_db()
    db = SessionLocal()
    try:
        # Check projects
        projects = db.query(Project).all()
        print(f"Found {len(projects)} projects.")
        for p in projects:
            print(f"Project {p.id}: {p.name} ({len(p.media)} media)")

        # Create or verify comparison for Mangrove project if 2+ media exist
        for p in projects:
            media = list(p.media)
            if len(media) >= 2:
                existing_comp = db.query(Comparison).filter(Comparison.project_id == p.id).first()
                if not existing_comp:
                    print(f"\nCreating initial comparison for project '{p.name}'...")
                    # Sort by created_at
                    media_sorted = sorted(media, key=lambda m: m.created_at or datetime.now(timezone.utc))
                    comp = comparison_service.create_comparison(
                        db=db,
                        project_id=p.id,
                        before_media_id=media_sorted[0].id,
                        after_media_id=media_sorted[1].id,
                        title=f"{p.name} Restoration Baseline Alignment"
                    )
                    print(f"  -> Created comparison {comp.id}: {comp.overall_change}")
                else:
                    print(f"Project '{p.name}' already has comparison {existing_comp.id}.")

        # If Severn project only has 1 media, let's create a subsequent survey photo record so we have a rich River comparison!
        severn = db.query(Project).filter(Project.name.ilike("%Severn%")).first()
        if severn and len(severn.media) == 1:
            print("\nAdding subsequent survey evidence to Severn Basin Riparian Restoration...")
            m_before = severn.media[0]
            # Create subsequent media
            m_after = Media(
                project_id=severn.id,
                filename="SEVERN_TRANSECT_04B_REMEDIATED.JPG",
                media_type="image",
                file_size=1945820,
                width=1920,
                height=1080,
                format="jpg",
                cloudinary_public_id="impactlens/evidence/severn_transect_04b",
                cloudinary_url="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
                secure_url="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80",
                status="ready",
                created_at=m_before.created_at + timedelta(days=75) if m_before.created_at else datetime.now(timezone.utc)
            )
            db.add(m_after)
            db.commit()
            db.refresh(m_after)

            from app.services.ai_service import ai_service
            from app.db.models import MediaAnalysis
            ai_out = ai_service.analyze_image(
                image_url=m_after.secure_url,
                project_name=severn.name,
                filename=m_after.filename
            )
            analysis = MediaAnalysis(
                media_id=m_after.id,
                description="Remediated riverbank sector following debris extraction and native sedge planting. Stabilized soil margins and minimal visible plastic waste observed.",
                project=severn.name,
                activity="Riparian Buffer Remediation & Native Replanting",
                location=m_before.analysis.location if m_before.analysis else "Severn River Corridor",
                objects=["Restored Embankment", "Native Sedges", "Buffer Stakes"],
                visual_signals=["Clear Riparian Margin", "Absence of Surface Debris", "Root Stabilization"],
                conditions=["Sunny", "Low River Flow", "Post-Cleanup"],
                tags=["river-restoration", "plastic-remediation", "riparian-buffer", "cleanliness"],
                confidence=0.96,
                status="ready"
            )
            db.add(analysis)
            db.commit()

            print("Creating Severn Basin Before/After comparison...")
            comp = comparison_service.create_comparison(
                db=db,
                project_id=severn.id,
                before_media_id=m_before.id,
                after_media_id=m_after.id,
                title="Severn Riverbank Plastic Waste Remediation"
            )
            print(f"  -> Created Severn comparison: {comp.overall_change}")

        total_comps = db.query(Comparison).count()
        print(f"\nTotal comparisons in database: {total_comps}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_comparisons()

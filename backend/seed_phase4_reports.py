import sys
from app.db.database import SessionLocal
from app.db.models import Project, Report
from app.services.report_service import report_service

def seed_reports():
    print("Seeding Phase 4 Impact Reports...")
    db = SessionLocal()
    try:
        severn = db.query(Project).filter(Project.id == "prj-severn-001").first()
        if not severn:
            print("[FAIL] Severn project not found!")
            return

        # Check if report already exists
        existing = db.query(Report).filter(Report.project_id == severn.id).first()
        if existing and existing.status == "ready":
            print(f"[OK] Report already exists for Severn Basin: {existing.id} ({existing.title})")
            report = existing
        else:
            print("Generating initial comprehensive report for Severn Basin...")
            report = report_service.create_report(
                db=db,
                project_id=severn.id,
                title="Severn Basin Riparian Restoration — Field Impact Audit",
            )
            print(f"[SUCCESS] Report generated: {report.id} - {report.title}")
            print(f"Evidence count: {report.evidence_count}, Comparisons: {report.comparison_count}")

        # Seed second report for Caledonian Restocking if available
        cairn = db.query(Project).filter(Project.id == "prj-cairn-002").first()
        if cairn:
            existing_cairn = db.query(Report).filter(Report.project_id == cairn.id).first()
            if not existing_cairn or existing_cairn.status != "ready":
                print("Generating report for Caledonian Restocking...")
                rep2 = report_service.create_report(
                    db=db,
                    project_id=cairn.id,
                    title="Caledonian Highland Canopy Restocking — Aerial & Ground Progress Audit",
                )
                print(f"[SUCCESS] Second report generated: {rep2.id}")

    except Exception as e:
        print(f"[ERROR] Failed to seed reports: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_reports()

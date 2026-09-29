import sys
from app.db.database import SessionLocal, init_db
from app.db.models import Media, MediaAnalysis, Project
from app.services.ai_service import ai_service
from app.services.embedding_service import embedding_service


def seed_ai_for_existing_media():
    print("Initializing database tables...")
    init_db()
    db = SessionLocal()
    try:
        media_list = db.query(Media).all()
        print(f"Total media records in database: {len(media_list)}")
        
        analyzed_count = 0
        for m in media_list:
            existing = db.query(MediaAnalysis).filter(MediaAnalysis.media_id == m.id).first()
            if not existing:
                print(f"Analyzing media {m.id} ({m.filename})...")
                proj_name = m.project.name if m.project else None
                ai_output = ai_service.analyze_image(
                    image_url=m.secure_url,
                    project_name=proj_name,
                    filename=m.filename
                )
                
                corpus = f"{ai_output.project or ''} {ai_output.activity or ''} {ai_output.location or ''} {ai_output.description} {' '.join(ai_output.tags)} {' '.join(ai_output.objects)}"
                emb = embedding_service.generate_embedding(corpus)
                
                analysis = MediaAnalysis(
                    media_id=m.id,
                    description=ai_output.description,
                    project=ai_output.project,
                    activity=ai_output.activity,
                    location=ai_output.location,
                    objects=ai_output.objects,
                    visual_signals=ai_output.visual_signals,
                    conditions=ai_output.conditions,
                    tags=ai_output.tags,
                    confidence=ai_output.confidence,
                    model_name="gemini-1.5-flash",
                    analysis_version="v2.0-multimodal",
                    status="ready",
                    embedding=emb
                )
                m.status = "ready"
                db.add(analysis)
                db.commit()
                analyzed_count += 1
                print(f"  -> Generated analysis for {m.filename}: {ai_output.activity} (tags: {ai_output.tags[:3]})")
            else:
                print(f"Media {m.id} ({m.filename}) already has analysis ({existing.activity}).")

        print(f"Done! Newly analyzed: {analyzed_count}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_ai_for_existing_media()

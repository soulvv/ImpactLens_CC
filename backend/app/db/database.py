import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("impactlens.db")

Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    # Try PostgreSQL first if configured
    if db_url.startswith("postgresql"):
        try:
            test_engine = create_engine(
                db_url,
                pool_pre_ping=True,
                connect_args={"connect_timeout": 3}
            )
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Successfully connected to primary PostgreSQL database.")
            return test_engine
        except Exception as e:
            logger.warning(
                f"Could not connect to PostgreSQL ({e}). "
                "Falling back to local SQLite database (impactlens.db) for development."
            )
            fallback_url = "sqlite:///./impactlens.db"
            return create_engine(
                fallback_url,
                connect_args={"check_same_thread": False}
            )
    else:
        # SQLite or other specified dialect
        connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}
        return create_engine(db_url, connect_args=connect_args)

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initializes tables and seeds initial project data if empty."""
    from app.db.models import Project, Activity, Media, MediaAnalysis, Comparison, Report, ReportEvidence
    Base.metadata.create_all(bind=engine)
    
    # Safe, idempotent column migrations.
    # "ALTER TABLE ... ADD COLUMN IF NOT EXISTS" is PostgreSQL-only syntax, so the
    # column set is inspected first and only genuinely missing columns are added.
    # Defaults intentionally live on the ORM models, so no DB-level DEFAULT is emitted
    # (keeps the statement portable across PostgreSQL and SQLite).
    from sqlalchemy import inspect
    try:
        inspector = inspect(engine)
        existing_tables = set(inspector.get_table_names())
        migrations = {
            "media": [
                ("duration_seconds", "FLOAT"),
                ("frame_rate", "FLOAT"),
            ],
            "media_analysis": [
                ("key_moments", "JSON"),
                ("frame_count", "INTEGER"),
            ],
        }
        with engine.begin() as conn:
            for table, columns in migrations.items():
                if table not in existing_tables:
                    continue
                present = {c["name"] for c in inspector.get_columns(table)}
                for column, ddl_type in columns:
                    if column in present:
                        continue
                    try:
                        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))
                        logger.info("Migration: added missing column %s.%s", table, column)
                    except Exception as e:
                        logger.warning("Could not add column %s.%s: %s", table, column, e)
    except Exception as e:
        logger.warning(f"Column migration check note: {e}")

    # Check if we should seed default environmental projects
    db = SessionLocal()
    try:
        project_count = db.query(Project).count()
        if project_count == 0:
            logger.info("Database empty: seeding initial environmental projects and activity ledger.")
            
            p1 = Project(
                id="prj-severn-001",
                name="Severn Basin Riparian Restoration",
                description="Long-term riparian zone buffer reconstruction, native sedge revegetation, and erosion telemetry monitoring along Severn river tributaries.",
                location="Severn Valley, Shropshire, UK",
                organization="Severn Rivers Ecology Trust",
                status="active"
            )
            p2 = Project(
                id="prj-cairn-002",
                name="Caledonian Highland Canopy Restocking",
                description="Highland native scots pine and birch reforestation, drone aerial multispectral verification, and deer exclusion fencing assessment.",
                location="Cairngorms National Park, Scotland",
                organization="Highland Forest Conservation",
                status="active"
            )
            p3 = Project(
                id="prj-wessex-003",
                name="Wessex Dual-Use Agrivoltaic Testbed",
                description="Verification of dual-purpose bifacial solar arrays over regenerative perennial pasture with controlled livestock rotation.",
                location="Cotswolds & Wessex Basin, UK",
                organization="TerraClean Energy Labs",
                status="active"
            )
            
            db.add_all([p1, p2, p3])
            
            # Initial Activity log
            a1 = Activity(
                project_id=p1.id,
                action="project_initialized",
                description="Severn Basin Riparian Restoration dossier initialized with sensor monitoring protocols."
            )
            a2 = Activity(
                project_id=p2.id,
                action="project_initialized",
                description="Caledonian Highland Canopy Restocking project registered for aerial survey tracking."
            )
            a3 = Activity(
                project_id=p3.id,
                action="project_initialized",
                description="Wessex Dual-Use Agrivoltaic Testbed approved for ground verification telemetry."
            )
            db.add_all([a1, a2, a3])
            db.commit()
            logger.info("Successfully seeded 3 environmental projects and initial activity trail.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

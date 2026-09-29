import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, BigInteger, Integer, Float, DateTime, ForeignKey, Index, JSON
)
from sqlalchemy.orm import relationship
from app.db.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    organization = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="active", index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    media = relationship("Media", back_populates="project", cascade="all, delete-orphan", order_by="desc(Media.created_at)")
    activities = relationship("Activity", back_populates="project", cascade="all, delete-orphan", order_by="desc(Activity.created_at)")
    comparisons = relationship("Comparison", back_populates="project", cascade="all, delete-orphan", order_by="desc(Comparison.created_at)")
    reports = relationship("Report", back_populates="project", cascade="all, delete-orphan", order_by="desc(Report.created_at)")


class Media(Base):
    __tablename__ = "media"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    media_type = Column(String(20), nullable=False, index=True)  # 'image' or 'video'
    file_size = Column(BigInteger, nullable=False, default=0)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    format = Column(String(50), nullable=True)
    duration_seconds = Column(Float, nullable=True)
    frame_rate = Column(Float, nullable=True)
    cloudinary_public_id = Column(String(255), nullable=True, index=True)
    cloudinary_url = Column(Text, nullable=False)
    secure_url = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="uploaded", index=True)  # 'uploaded', 'processing', 'analyzing', 'ready', 'failed'
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="media")
    analysis = relationship("MediaAnalysis", back_populates="media", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_media_project_status", "project_id", "status"),
        Index("idx_media_type_created", "media_type", "created_at"),
    )


class MediaAnalysis(Base):
    __tablename__ = "media_analysis"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    media_id = Column(String(36), ForeignKey("media.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=False)
    project = Column(String(255), nullable=True, index=True)
    activity = Column(String(255), nullable=True, index=True)
    location = Column(String(255), nullable=True, index=True)
    objects = Column(JSON, nullable=False, default=list)
    visual_signals = Column(JSON, nullable=False, default=list)
    conditions = Column(JSON, nullable=False, default=list)
    tags = Column(JSON, nullable=False, default=list)
    key_moments = Column(JSON, nullable=True, default=list)
    frame_count = Column(Integer, nullable=True, default=0)
    confidence = Column(Float, nullable=False, default=0.0)
    model_name = Column(String(100), nullable=False, default="gemini-1.5-flash")
    analysis_version = Column(String(50), nullable=False, default="v3.5-video")
    status = Column(String(50), nullable=False, default="ready", index=True)
    embedding = Column(JSON, nullable=True)  # Dense vector float list for semantic search
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    media = relationship("Media", back_populates="analysis")

    __table_args__ = (
        Index("idx_analysis_activity", "activity"),
        Index("idx_analysis_status", "status"),
    )


class Activity(Base):
    __tablename__ = "activities"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)  # 'media_uploaded', 'ai_analyzed', 'project_created', 'audit_verified'
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    # Relationships
    project = relationship("Project", back_populates="activities")


class Comparison(Base):
    __tablename__ = "comparisons"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    before_media_id = Column(String(36), ForeignKey("media.id", ondelete="CASCADE"), nullable=False, index=True)
    after_media_id = Column(String(36), ForeignKey("media.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default="analyzing", index=True)  # 'draft', 'analyzing', 'ready', 'failed'
    comparison_summary = Column(Text, nullable=True)
    overall_change = Column(String(255), nullable=True)
    analysis_result = Column(JSON, nullable=True)
    confidence = Column(Float, nullable=False, default=0.0)
    model_name = Column(String(100), nullable=False, default="gemini-1.5-flash")
    analysis_version = Column(String(50), nullable=False, default="v3.0-comparison")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="comparisons")
    before_media = relationship("Media", foreign_keys=[before_media_id])
    after_media = relationship("Media", foreign_keys=[after_media_id])

    __table_args__ = (
        Index("idx_comparison_project_status", "project_id", "status"),
    )


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="draft", index=True)  # 'draft', 'generating', 'ready', 'failed'
    reporting_period_start = Column(DateTime(timezone=True), nullable=True)
    reporting_period_end = Column(DateTime(timezone=True), nullable=True)
    evidence_count = Column(Integer, nullable=False, default=0)
    comparison_count = Column(Integer, nullable=False, default=0)
    generated_content = Column(JSON, nullable=True)
    model_name = Column(String(100), nullable=False, default="gemini-1.5-flash")
    analysis_version = Column(String(50), nullable=False, default="v4.0-impact-report")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="reports")
    evidence_items = relationship("ReportEvidence", back_populates="report", cascade="all, delete-orphan", order_by="desc(ReportEvidence.created_at)")

    __table_args__ = (
        Index("idx_report_project_status", "project_id", "status"),
    )


class ReportEvidence(Base):
    __tablename__ = "report_evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    report_id = Column(String(36), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    media_id = Column(String(36), ForeignKey("media.id", ondelete="SET NULL"), nullable=True, index=True)
    comparison_id = Column(String(36), ForeignKey("comparisons.id", ondelete="SET NULL"), nullable=True, index=True)
    video_moment_id = Column(String(100), nullable=True)
    section = Column(String(100), nullable=False, index=True)  # 'cover', 'visual_changes', 'video_evidence', 'timeline', 'gallery', 'observations', 'campaign'
    evidence_role = Column(String(100), nullable=False)  # 'primary_hero', 'baseline', 'subsequent', 'sampled_observation', 'key_moment', 'gallery_item'
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    report = relationship("Report", back_populates="evidence_items")
    media = relationship("Media")
    comparison = relationship("Comparison")

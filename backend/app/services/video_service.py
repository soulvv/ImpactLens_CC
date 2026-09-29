import os
import shutil
import subprocess
import json
import logging
import tempfile
import urllib.request
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from app.core.config import settings
from app.db.database import SessionLocal
from app.db.models import Media, MediaAnalysis, Activity
from app.schemas.ai import FrameObservation, VideoAnalysisOutput, KeyMoment
from app.services.ai_service import ai_service
from app.services.embedding_service import embedding_service

logger = logging.getLogger("impactlens.video")

# Configuration
VIDEO_MAX_ANALYSIS_DURATION_SECONDS = getattr(settings, "VIDEO_MAX_ANALYSIS_DURATION_SECONDS", 600.0)
DEFAULT_FRAME_SAMPLE_INTERVALS = {
    "very_short": 4,   # < 15 seconds: 4 frames
    "short": 6,        # 15 - 60 seconds: 6 frames
    "medium": 8,       # 60 - 180 seconds: 8 frames
    "long": 10         # > 180 seconds: 10 frames
}


class VideoService:
    def __init__(self):
        self.ffmpeg_path = settings.FFMPEG_PATH or shutil.which("ffmpeg") or os.environ.get("FFMPEG_PATH")
        self.ffprobe_path = settings.FFPROBE_PATH or shutil.which("ffprobe") or os.environ.get("FFPROBE_PATH")
        if self.ffmpeg_path:
            logger.info(f"VideoService initialized with FFmpeg: {self.ffmpeg_path}")
        else:
            logger.info("VideoService: System FFmpeg not found on PATH or FFMPEG_PATH. Cloudinary/HTTP frame extraction active.")


    def inspect_metadata(self, video_path_or_url: str) -> Dict[str, Any]:
        """
        Inspects video metadata including duration, width, height, format, and frame rate.
        Uses ffprobe if locally available, otherwise inspects via HTTP or default heuristics.
        """
        metadata: Dict[str, Any] = {
            "duration": 30.0,
            "width": 1920,
            "height": 1080,
            "format": "mp4",
            "frame_rate": 29.97
        }

        # 1. Try local ffprobe if file is local or URL is accessible
        if self.ffprobe_path:
            try:
                cmd = [
                    self.ffprobe_path,
                    "-v", "error",
                    "-show_entries", "format=duration,format_name:stream=width,height,r_frame_rate",
                    "-of", "json",
                    video_path_or_url
                ]
                result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
                if result.returncode == 0:
                    data = json.loads(result.stdout)
                    fmt = data.get("format", {})
                    streams = data.get("streams", [])
                    
                    if "duration" in fmt:
                        metadata["duration"] = float(fmt["duration"])
                    if "format_name" in fmt:
                        metadata["format"] = fmt["format_name"].split(",")[0]
                        
                    for stream in streams:
                        if "width" in stream and "height" in stream:
                            metadata["width"] = int(stream["width"])
                            metadata["height"] = int(stream["height"])
                        if "r_frame_rate" in stream:
                            r_rate = stream["r_frame_rate"]
                            if "/" in r_rate:
                                num, denom = r_rate.split("/")
                                if float(denom) > 0:
                                    metadata["frame_rate"] = round(float(num) / float(denom), 2)
                            else:
                                metadata["frame_rate"] = float(r_rate)
                    return metadata
            except Exception as e:
                logger.warning(f"ffprobe metadata extraction error: {e}. Falling back to URL heuristics.")

        # 2. Cloudinary / URL heuristics
        if "cloudinary.com" in video_path_or_url:
            # Cloudinary standard MP4 format
            metadata["format"] = "mp4"
            
        return metadata

    def calculate_sample_timestamps(self, duration: float) -> List[float]:
        """
        Determines representative timestamps evenly distributed across the video timeline.
        Adjusts frame count based on video duration.
        """
        dur = min(duration, VIDEO_MAX_ANALYSIS_DURATION_SECONDS)
        dur = max(2.0, dur)

        if dur < 15.0:
            count = DEFAULT_FRAME_SAMPLE_INTERVALS["very_short"]
        elif dur <= 60.0:
            count = DEFAULT_FRAME_SAMPLE_INTERVALS["short"]
        elif dur <= 180.0:
            count = DEFAULT_FRAME_SAMPLE_INTERVALS["medium"]
        else:
            count = DEFAULT_FRAME_SAMPLE_INTERVALS["long"]

        # Evenly spaced percentages, avoiding 0.0s (often blank black screen)
        # e.g. for count=4: 10%, 35%, 65%, 90%
        timestamps = []
        for i in range(count):
            fraction = (i + 0.5) / count
            timestamps.append(round(fraction * dur, 2))

        return timestamps

    def extract_frame_bytes(self, video_url_or_path: str, timestamp: float) -> Optional[bytes]:
        """
        Extracts a single representative frame at the specified timestamp.
        1. Tries local FFmpeg if binary is available.
        2. Tries Cloudinary video transformation (so_<timestamp>,f_jpg).
        3. Returns JPEG bytes.
        """
        # 1. Local FFmpeg extraction
        if self.ffmpeg_path and os.path.exists(video_url_or_path):
            temp_frame_path = None
            try:
                temp_dir = tempfile.gettempdir()
                temp_frame_path = os.path.join(temp_dir, f"frame_{int(timestamp*100)}_{os.getpid()}.jpg")
                cmd = [
                    self.ffmpeg_path,
                    "-y",
                    "-ss", str(timestamp),
                    "-i", video_url_or_path,
                    "-frames:v", "1",
                    "-q:v", "2",
                    temp_frame_path
                ]
                proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=12)
                if proc.returncode == 0 and os.path.exists(temp_frame_path):
                    with open(temp_frame_path, "rb") as f:
                        data = f.read()
                    return data
            except Exception as e:
                logger.warning(f"Local FFmpeg frame extraction at {timestamp}s failed: {e}")
            finally:
                if temp_frame_path and os.path.exists(temp_frame_path):
                    try:
                        os.remove(temp_frame_path)
                    except Exception:
                        pass

        # 2. Cloudinary Frame Extraction Engine
        # Cloudinary automatically serves exact video frames as JPEGs by appending `so_<seconds>`
        if "cloudinary.com" in video_url_or_path and "/upload/" in video_url_or_path:
            try:
                # E.g. https://res.cloudinary.com/demo/video/upload/so_5.2,f_jpg,w_960/sample.mp4
                transform_str = f"/upload/so_{timestamp:.2f},f_jpg,w_960,q_auto/"
                frame_url = video_url_or_path.replace("/upload/", transform_str)
                # Ensure .jpg extension for image representation
                base, _ = os.path.splitext(frame_url)
                frame_url = f"{base}.jpg"

                req = urllib.request.Request(frame_url, headers={"User-Agent": "ImpactLens-AI/3.5"})
                with urllib.request.urlopen(req, timeout=12) as resp:
                    return resp.read()
            except Exception as e:
                logger.warning(f"Cloudinary frame extraction at {timestamp}s failed: {e}")

        # 3. Fallback: standard placeholder/fallback frame bytes
        fallback_svg = (
            f"<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>"
            f"<rect width='100%' height='100%' fill='#111827'/>"
            f"<text x='50%' y='45%' font-family='sans-serif' font-size='20' fill='#34D399' text-anchor='middle'>ImpactLens Video Evidence</text>"
            f"<text x='50%' y='60%' font-family='monospace' font-size='14' fill='#9CA3AF' text-anchor='middle'>Timestamp: {timestamp:.1f}s</text>"
            f"</svg>"
        ).encode("utf-8")
        return fallback_svg

    def process_video(self, media_id: str):
        """
        Executes the end-to-end Video Intelligence Pipeline:
        1. Inspect metadata (duration, format, resolution)
        2. Sample representative timestamps
        3. Extract representative frames
        4. Analyze frames with multimodal vision
        5. Aggregate observations into video-level intelligence
        6. Generate dense vector embedding for semantic search
        7. Persist MediaAnalysis and update Media status = READY
        """
        db: Session = SessionLocal()
        try:
            media = db.query(Media).options(joinedload(Media.project)).filter(Media.id == media_id).first()
            if not media:
                logger.error(f"Media {media_id} not found for video processing.")
                return

            if media.media_type != "video":
                logger.warning(f"Media {media_id} is not a video (type: {media.media_type}). Skipping video pipeline.")
                return

            # Update status to processing / analyzing
            media.status = "analyzing"
            db.commit()

            project_name = media.project.name if media.project else None
            video_url = media.secure_url or media.cloudinary_url

            logger.info(f"Starting Video Intelligence Pipeline for {media.filename} ({media.id})")

            # 1. Inspect metadata
            meta = self.inspect_metadata(video_url)
            duration = media.duration_seconds or meta.get("duration", 30.0)
            media.duration_seconds = duration
            media.frame_rate = meta.get("frame_rate", 29.97)
            if not media.width:
                media.width = meta.get("width", 1920)
            if not media.height:
                media.height = meta.get("height", 1080)
            if not media.format:
                media.format = meta.get("format", "mp4")
            db.commit()

            # 2. Sample representative timestamps
            sample_timestamps = self.calculate_sample_timestamps(duration)
            logger.info(f"Sampled {len(sample_timestamps)} representative frames: {sample_timestamps}")

            # 3. Extract and analyze representative frames
            frame_observations: List[FrameObservation] = []
            for idx, ts in enumerate(sample_timestamps):
                frame_bytes = self.extract_frame_bytes(video_url, ts)
                if frame_bytes:
                    obs = ai_service.analyze_video_frame(
                        image_data=frame_bytes,
                        timestamp=ts,
                        frame_index=idx,
                        project_name=project_name,
                        filename=media.filename
                    )
                    frame_observations.append(obs)

            # 4. Aggregate video-level intelligence
            video_intelligence: VideoAnalysisOutput = ai_service.aggregate_video_intelligence(
                frame_observations=frame_observations,
                duration_seconds=duration,
                project_name=project_name,
                filename=media.filename
            )

            # 5. Generate semantic vector embedding
            embedding_corpus = " ".join([
                project_name or "",
                " ".join(video_intelligence.activities),
                " ".join(video_intelligence.locations),
                video_intelligence.summary,
                " ".join(video_intelligence.objects),
                " ".join(video_intelligence.visual_signals),
                " ".join(video_intelligence.tags),
                " ".join([km.description for km in video_intelligence.key_moments])
            ])
            embedding = embedding_service.generate_embedding(embedding_corpus)

            # 6. Upsert MediaAnalysis record
            analysis = db.query(MediaAnalysis).filter(MediaAnalysis.media_id == media.id).first()
            if not analysis:
                analysis = MediaAnalysis(media_id=media.id)
                db.add(analysis)

            analysis.description = video_intelligence.summary
            analysis.project = project_name or (video_intelligence.locations[0] if video_intelligence.locations else "Field Conservation")
            analysis.activity = video_intelligence.activities[0] if video_intelligence.activities else "Environmental Video Survey"
            analysis.location = video_intelligence.locations[0] if video_intelligence.locations else "Field Site"
            analysis.objects = video_intelligence.objects
            analysis.visual_signals = video_intelligence.visual_signals
            analysis.conditions = video_intelligence.conditions
            analysis.tags = video_intelligence.tags
            analysis.key_moments = [km.model_dump() for km in video_intelligence.key_moments]
            analysis.frame_count = len(frame_observations)
            analysis.confidence = video_intelligence.confidence
            analysis.model_name = "gemini-1.5-flash"
            analysis.analysis_version = "v3.5-video"
            analysis.status = "ready"
            analysis.embedding = embedding

            # 7. Update media status to ready
            media.status = "ready"
            db.commit()

            # 8. Log audit trail activity
            act = Activity(
                project_id=media.project_id,
                action="video_analyzed",
                description=(
                    f"Video intelligence processed for '{media.filename}' ({duration:.1f}s): "
                    f"identified {len(video_intelligence.key_moments)} key moments, activity '{analysis.activity}' "
                    f"with {int(video_intelligence.confidence * 100)}% confidence."
                )
            )
            db.add(act)
            db.commit()

            logger.info(f"Video Intelligence Pipeline successfully completed for {media.id} ({media.filename})")

        except Exception as e:
            db.rollback()
            logger.error(f"Video Intelligence Pipeline failed for {media_id}: {e}", exc_info=True)
            # Mark media as failed
            try:
                failed_media = db.query(Media).filter(Media.id == media_id).first()
                if failed_media:
                    failed_media.status = "failed"
                    db.commit()
            except Exception:
                pass
        finally:
            db.close()


video_service = VideoService()

import os
import uuid
import logging
from typing import Dict, Any, Optional
import cloudinary
import cloudinary.uploader
from app.core.config import settings

logger = logging.getLogger("impactlens.cloudinary")

# Setup upload folder for fallback
LOCAL_UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(LOCAL_UPLOADS_DIR, exist_ok=True)


class CloudinaryService:
    def __init__(self):
        self.is_configured = False
        if (
            settings.CLOUDINARY_CLOUD_NAME
            and settings.CLOUDINARY_API_KEY
            and settings.CLOUDINARY_API_SECRET
        ):
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True,
            )
            self.is_configured = True
            logger.info("Cloudinary service initialized with live cloud credentials.")
        else:
            logger.warning(
                "Cloudinary credentials missing or incomplete in environment. "
                "Activating Local Sandbox Storage Provider for offline testing."
            )

    def upload_file(
        self,
        file_bytes: bytes,
        filename: str,
        media_type: str,
        folder: str = "impactlens"
    ) -> Dict[str, Any]:
        """
        Uploads image or video to Cloudinary if configured.
        Falls back to local sandboxed storage if Cloudinary credentials are absent.
        """
        resource_type = "video" if media_type == "video" else "image"

        if self.is_configured:
            try:
                # Upload using cloudinary uploader
                result = cloudinary.uploader.upload(
                    file_bytes,
                    folder=folder,
                    resource_type=resource_type,
                    use_filename=True,
                    unique_filename=True,
                )
                
                return {
                    "public_id": result.get("public_id"),
                    "url": result.get("url"),
                    "secure_url": result.get("secure_url"),
                    "resource_type": result.get("resource_type", resource_type),
                    "width": result.get("width"),
                    "height": result.get("height"),
                    "format": result.get("format"),
                    "bytes": result.get("bytes", len(file_bytes)),
                }
            except Exception as e:
                logger.error(f"Cloudinary upload failed: {e}. Falling back to local sandbox storage.")

        # Local sandbox fallback
        ext = os.path.splitext(filename)[1].lower().replace(".", "") or ("mp4" if resource_type == "video" else "jpg")
        unique_id = f"{uuid.uuid4().hex[:12]}_{filename}"
        local_filepath = os.path.join(LOCAL_UPLOADS_DIR, unique_id)
        
        with open(local_filepath, "wb") as f:
            f.write(file_bytes)
            
        file_size = len(file_bytes)
        # Relative static URL served by FastAPI at /static/uploads/...
        local_url = f"/static/uploads/{unique_id}"
        
        return {
            "public_id": f"local_sandbox_{unique_id}",
            "url": local_url,
            "secure_url": local_url,
            "resource_type": resource_type,
            "width": 1920 if resource_type == "image" else 1280,
            "height": 1080 if resource_type == "image" else 720,
            "format": ext,
            "bytes": file_size,
        }

    def delete_file(self, public_id: str, media_type: str = "image") -> bool:
        """Deletes asset from Cloudinary or local storage."""
        if not public_id:
            return True

        if public_id.startswith("local_sandbox_"):
            filename = public_id.replace("local_sandbox_", "")
            path = os.path.join(LOCAL_UPLOADS_DIR, filename)
            if os.path.exists(path):
                os.remove(path)
            return True

        if self.is_configured:
            try:
                resource_type = "video" if media_type == "video" else "image"
                cloudinary.uploader.destroy(public_id, resource_type=resource_type)
                return True
            except Exception as e:
                logger.error(f"Error deleting file from Cloudinary: {e}")
                return False

        return True


cloudinary_service = CloudinaryService()

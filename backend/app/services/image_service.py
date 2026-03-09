from typing import Dict, Optional
import io
import os
import uuid
import tempfile
from pathlib import Path

from fastapi import UploadFile


class ImageService:
    """Service responsible for validating and storing/uploading images.

    Responsibilities are small and testable: detect image type, upload to
    cloud provider (Cloudinary) or save locally, and return a public URL.
    """

    def __init__(
        self,
        allowed_map: Dict[str, str],
        max_bytes: int = 5 * 1024 * 1024,
        uploads_dir: Optional[str] = None,
        cloudinary_url: Optional[str] = None,
    ):
        self.allowed_map = allowed_map
        self.max_bytes = max_bytes
        self.cloudinary_url = cloudinary_url
        self.uploads_dir = uploads_dir or os.path.join(
            os.path.dirname(__file__), "..", "..", "static", "uploads"
        )

    def _detect_extension(self, data: bytes, content_type: str) -> Optional[str]:
        if not data:
            return None

        if data.startswith(b"\x89PNG\r\n\x1a\n"):
            return ".png"
        if data.startswith(b"\xff\xd8\xff"):
            return ".jpg"
        if data.startswith(b"GIF87a") or data.startswith(b"GIF89a"):
            return ".gif"
        if len(data) >= 12 and data[0:4] == b"RIFF" and data[8:12] == b"WEBP":
            return ".webp"

        if content_type:
            ct_main = content_type.split(";", 1)[0].strip().lower()
            if ct_main in self.allowed_map:
                return self.allowed_map.get(ct_main)

        return None

    def _save_locally(self, data: bytes, ext: str) -> str:
        Path(self.uploads_dir).mkdir(parents=True, exist_ok=True)
        # Use NamedTemporaryFile + replace for atomic write on Windows
        with tempfile.NamedTemporaryFile(
            dir=self.uploads_dir, suffix=ext, delete=False
        ) as tmpf:
            tmpf.write(data)
            tmp_name = tmpf.name
        dest_name = f"{uuid.uuid4().hex}{ext}"
        dest_path = os.path.join(self.uploads_dir, dest_name)
        os.replace(tmp_name, dest_path)
        return f"/static/uploads/{dest_name}"

    def _upload_cloudinary(self, data: bytes) -> str:
        # Lazy import so the project doesn't require cloudinary unless configured
        import cloudinary
        import cloudinary.uploader

        cloudinary.config(cloudinary_url=self.cloudinary_url)
        result = cloudinary.uploader.upload(
            io.BytesIO(data), resource_type="image", folder="ecommerce_store"
        )
        secure_url = result.get("secure_url") or result.get("url")
        if not secure_url:
            raise RuntimeError("Cloudinary did not return a URL")
        return secure_url

    def process_upload(self, upload_file: UploadFile) -> str:
        content_type = (upload_file.content_type or "").lower()
        data = upload_file.file.read() if hasattr(upload_file, "file") else b""
        if not data:
            raise ValueError("Empty file")
        if len(data) > self.max_bytes:
            raise ValueError("File too large")

        ext = self._detect_extension(data, content_type)
        if not ext:
            raise ValueError("Unsupported or unrecognized image type")

        if self.cloudinary_url:
            return self._upload_cloudinary(data)

        return self._save_locally(data, ext)

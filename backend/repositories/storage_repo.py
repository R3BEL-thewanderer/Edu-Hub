from typing import List, Dict, Any, Optional
from services.supabase_client import get_supabase

BUCKET_NAME = "eduhub-materials"

class StorageRepository:
    def __init__(self, bucket_name: str = BUCKET_NAME):
        self.supabase = get_supabase()
        self.bucket_name = bucket_name

    def upload_file_bytes(self, file_path: str, file_bytes: bytes, mime_type: str = "application/pdf") -> str:
        """Upload file content bytes to Supabase Storage."""
        res = self.supabase.storage.from_(self.bucket_name).upload(
            path=file_path,
            file=file_bytes,
            file_options={"content-type": mime_type, "upsert": "true"}
        )
        return file_path

    def generate_signed_url(self, file_path: str, expires_in_seconds: int = 3600, download: bool = False) -> str:
        """Generate a 1-hour signed URL for secure download/viewing."""
        options = {}
        if download:
            options["download"] = True

        res = self.supabase.storage.from_(self.bucket_name).create_signed_url(
            path=file_path,
            expires_in=expires_in_seconds,
            options=options
        )
        if isinstance(res, dict):
            if "signedUrl" in res:
                return res["signedUrl"]
            if "signedURL" in res:
                return res["signedURL"]
        return str(res)

    def delete_file(self, file_path: str) -> bool:
        """Delete a file from Supabase Storage."""
        self.supabase.storage.from_(self.bucket_name).remove([file_path])
        return True

    def replace_file(self, file_path: str, new_bytes: bytes, mime_type: str = "application/pdf") -> str:
        """Replace file by re-uploading with upsert option."""
        return self.upload_file_bytes(file_path, new_bytes, mime_type)

    def file_exists(self, file_path: str) -> bool:
        """Check if file exists by listing parent directory."""
        parts = file_path.rsplit("/", 1)
        folder = parts[0] if len(parts) > 1 else ""
        filename = parts[1] if len(parts) > 1 else parts[0]

        files = self.supabase.storage.from_(self.bucket_name).list(folder)
        for f in files or []:
            if f.get("name") == filename:
                return True
        return False

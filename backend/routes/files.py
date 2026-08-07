from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from services.storage import generate_signed_url
import re

router = APIRouter()

class FileRequest(BaseModel):
    filePath: str
    subjectId: Optional[str] = None

# Allowed path pattern: year/semester/subject/type/filename.(pdf|mp4|webm)
VALID_PATH_PATTERN = re.compile(
    r'^[\d]{4}-[\d]{2}/sem[12]/[a-z0-9-]+/(notes|pdfs|pyqs|videos)/[A-Za-z0-9_\-\(\)\s\.]+\.(pdf|mp4|webm|mkv)$'
)

@router.post("/signed-url")
def get_signed_url(request: FileRequest):
    """
    Generate a time-limited signed URL for viewing a PDF inline.
    The URL expires after 1 hour and does not allow downloads.
    
    Security: validates file path pattern to prevent path traversal.
    Auth is handled by the frontend (user must be logged in to see the View button).
    """
    # Validate path to prevent abuse
    if not VALID_PATH_PATTERN.match(request.filePath):
        raise HTTPException(status_code=400, detail="Invalid file path")
    
    try:
        url = generate_signed_url(request.filePath, expiration_seconds=3600, download=False)
        return {"signedUrl": url, "expiresIn": 3600}
    except Exception as e:
        print(f"Error generating signed URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate file access URL")

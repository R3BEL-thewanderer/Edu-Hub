import io
import re
from typing import Optional, Dict
from pypdf import PdfReader
from pptx import Presentation
from services.supabase_client import get_supabase

class DocumentService:
    def __init__(self):
        self.supabase = get_supabase()
        self.bucket_name = "eduhub-materials"
        # Simple in-memory cache for extracted text to prevent redundant parsing
        self._text_cache: Dict[str, str] = {}

    def extract_text(self, storage_path: str, mime_type: Optional[str] = None) -> str:
        """Download and extract normalized text from a storage file."""
        if storage_path in self._text_cache:
            return self._text_cache[storage_path]

        # Download file bytes
        res = self.supabase.storage.from_(self.bucket_name).download(storage_path)
        if not res:
            raise FileNotFoundError(f"File not found in storage: {storage_path}")

        ext = storage_path.split('.')[-1].lower()
        file_bytes = io.BytesIO(res)
        extracted_text = ""

        if ext == 'pdf' or mime_type == 'application/pdf':
            extracted_text = self._parse_pdf(file_bytes)
        elif ext in ['pptx', 'ppt']:
            extracted_text = self._parse_pptx(file_bytes)
        elif ext in ['txt', 'md', 'csv']:
            extracted_text = file_bytes.read().decode('utf-8', errors='ignore')
        else:
            raise ValueError(f"Unsupported file format for extraction: {ext}")

        cleaned_text = self._normalize_text(extracted_text)
        
        # Cache text if under a reasonable threshold (e.g. 500kb text size)
        if len(cleaned_text) < 500000:
            self._text_cache[storage_path] = cleaned_text

        return cleaned_text

    def _parse_pdf(self, file_bytes: io.BytesIO) -> str:
        text = []
        try:
            reader = PdfReader(file_bytes)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text.append(page_text)
        except Exception as e:
            raise ValueError(f"Error parsing PDF: {str(e)}")
        return "\n".join(text)

    def _parse_pptx(self, file_bytes: io.BytesIO) -> str:
        text = []
        try:
            prs = Presentation(file_bytes)
            for slide in prs.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text"):
                        text.append(shape.text)
        except Exception as e:
            raise ValueError(f"Error parsing PPTX: {str(e)}")
        return "\n".join(text)

    def _normalize_text(self, text: str) -> str:
        # Replace multiple spaces with a single space
        text = re.sub(r' +', ' ', text)
        # Replace multiple newlines with a single newline
        text = re.sub(r'\n+', '\n', text)
        return text.strip()

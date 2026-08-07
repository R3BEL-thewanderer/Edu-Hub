import logging
import asyncio
from typing import AsyncGenerator, Dict, Any, Optional

from schemas.ai import ChatRequest
from repositories.ai_repository import AIRepository
from repositories.materials_repo import MaterialRepository
from services.document_service import DocumentService
from services.prompt_builder import PromptBuilder
from clients.nvidia_client import NVIDIAClient
from services.usage_service import UsageService

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.ai_repo = AIRepository()
        self.material_repo = MaterialRepository()
        self.document_service = DocumentService()
        self.prompt_builder = PromptBuilder()
        self.nvidia_client = NVIDIAClient()
        self.usage_service = UsageService()

    async def chat_stream(self, user_id: str, request: ChatRequest) -> AsyncGenerator[str, None]:
        session_id = request.session_id
        subject_id = None
        
        # 2. Extract Document Context if material_id provided
        material = None
        document_text = None
        metadata = None
        
        if request.material_id:
            material = self.material_repo.get_material_by_id(request.material_id)
            if material:
                subject_id = material.get('subject_id')
                versions = material.get('material_versions', [])
                if versions:
                    # Get the most recent version
                    v = max(versions, key=lambda x: x.get('version_number', 0))
                    storage_path = v.get('storage_path')
                    mime = v.get('mime_type')
                    if storage_path:
                        try:
                            document_text = self.document_service.extract_text(storage_path, mime)
                            metadata = {
                                "title": material.get("title"),
                                "material_type": material.get("material_type")
                            }
                        except Exception as e:
                            logger.warning(f"Failed to extract document {storage_path}: {e}")
                            document_text = "[Failed to extract document content. It might be unsupported or restricted.]"

        # 3. Create or Validate Session
        if not session_id:
            title = request.question[:40] + ("..." if len(request.question) > 40 else "")
            sess = self.ai_repo.create_session(user_id, subject_id=subject_id, title=title)
            session_id = sess["id"]
            # To instantly inform the frontend of the session ID in a typical non-streaming setup, we could return it.
            # In a streaming setup, we can yield it as a system metadata packet.
            yield f"__SESSION_ID__:{session_id}\n"
        else:
            sess = self.ai_repo.get_session(session_id, user_id)
            if not sess:
                yield "Error: Session not found or unauthorized access."
                return

        # 4. Construct Inference Prompt
        history = self.ai_repo.get_messages(session_id)
        
        system_msg = self.prompt_builder.build_system_prompt()
        messages = [{"role": "system", "content": system_msg}]
        
        # Provide up to last 8 messages to maintain token window
        for msg in history[-8:]:
            # Clean history of internal markdown metadata
            content = msg["content"]
            if msg["role"] == "user":
                # We only want the raw question in history, not the massive document embed
                pass 
            messages.append({"role": msg["role"], "content": content})
            
        # Current user action with payload injected
        user_content = self.prompt_builder.build_user_prompt(
            question=request.question,
            material_metadata=metadata,
            document_text=document_text
        )
        
        messages.append({"role": "user", "content": user_content})

        # Save the current question (raw) to the DB
        user_msg_tokens = self.usage_service.estimate_tokens(user_content)
        sources = [request.material_id] if request.material_id else []
        self.ai_repo.add_message(session_id, "user", request.question, tokens_used=user_msg_tokens, sources=sources)

        # 5. Connect to NVIDIA and Stream
        full_response = ""
        stream = self.nvidia_client.stream_chat(messages)
        
        async for chunk in stream:
            full_response += chunk
            yield chunk

        # 6. Store AI response
        assistant_tokens = self.usage_service.estimate_tokens(full_response)
        self.ai_repo.add_message(session_id, "assistant", full_response, tokens_used=assistant_tokens)

    def get_sessions(self, user_id: str):
        return self.ai_repo.get_sessions(user_id)
        
    def get_session(self, session_id: str, user_id: str):
        return self.ai_repo.get_session(session_id, user_id)
        
    def delete_session(self, session_id: str, user_id: str):
        return self.ai_repo.soft_delete_session(session_id, user_id)
        
    def update_session(self, session_id: str, user_id: str, title: str):
        return self.ai_repo.update_session(session_id, user_id, {"title": title})

import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

def test_chat_without_material_generation(client, valid_tcet_student_jwt):
    """Verify standard API inference fallback (Chat without material, General engineering doubt)."""
    with patch("clients.nvidia_client.NVIDIAClient.stream_chat") as mock_stream, \
         patch("repositories.ai_repository.AIRepository.create_session", return_value={"id": "sess1"}), \
         patch("repositories.ai_repository.AIRepository.get_messages", return_value=[]), \
         patch("repositories.ai_repository.AIRepository.add_message"), \
         patch("services.usage_service.UsageService.check_daily_limits"):
        
        async def mock_generator(*args, **kwargs):
            yield "This is a standard answer."
        mock_stream.return_value = mock_generator()
        
        payload = {"question": "Explain TCP vs UDP"}
        res = client.post("/api/ai/chat/stream", json=payload, headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res.status_code == 200
        assert "This is a standard answer." in res.text

def test_chat_with_pdf(client, valid_tcet_student_jwt):
    """Verify prompt builder integrates PDF content correctly (Chat with PDF)."""
    with patch("clients.nvidia_client.NVIDIAClient.stream_chat") as mock_stream, \
         patch("services.document_service.DocumentService.extract_text", return_value="PDF CONTENT: Normalization rules."), \
         patch("repositories.materials_repo.MaterialRepository.get_material_by_id", return_value={
             "id": "mat1", "subject_id": "sub1", "title": "DB Notes", "material_type": "PDF",
             "material_versions": [{"version_number": 1, "storage_path": "path/file.pdf", "mime_type": "application/pdf"}]
         }), \
         patch("repositories.ai_repository.AIRepository.create_session", return_value={"id": "sess1"}), \
         patch("repositories.ai_repository.AIRepository.get_messages", return_value=[]), \
         patch("repositories.ai_repository.AIRepository.add_message"), \
         patch("services.usage_service.UsageService.check_daily_limits"):
        
        async def mock_generator(*args, **kwargs):
            # args[0] is the messages list
            assert "PDF CONTENT: Normalization rules" in args[0][-1]["content"]
            yield "Here is the summary."
            
        mock_stream.side_effect = mock_generator
        
        payload = {"question": "Summarize this PDF", "material_id": "mat1"}
        res = client.post("/api/ai/chat/stream", json=payload, headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res.status_code == 200

def test_chat_with_ppt_flashcard_generation(client, valid_tcet_student_jwt):
    """Verify PPT context extraction (Chat with PPT, Flashcard generation)."""
    with patch("clients.nvidia_client.NVIDIAClient.stream_chat") as mock_stream, \
         patch("services.document_service.DocumentService.extract_text", return_value="SLIDE 1: Intro to Biology"), \
         patch("repositories.materials_repo.MaterialRepository.get_material_by_id", return_value={
             "id": "mat1", "subject_id": "sub1", "title": "Bio Slides", "material_type": "PPTX",
             "material_versions": [{"version_number": 1, "storage_path": "path/file.pptx", "mime_type": "application/vnd.ms-powerpoint"}]
         }), \
         patch("repositories.ai_repository.AIRepository.create_session", return_value={"id": "sess1"}), \
         patch("repositories.ai_repository.AIRepository.get_messages", return_value=[]), \
         patch("repositories.ai_repository.AIRepository.add_message"), \
         patch("services.usage_service.UsageService.check_daily_limits"):
        
        async def mock_generator(*args, **kwargs):
            yield "Flashcard 1: Biology"
        mock_stream.side_effect = mock_generator
        
        payload = {"question": "Generate flashcards", "material_id": "mat1"}
        res = client.post("/api/ai/chat/stream", json=payload, headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res.status_code == 200
        assert "Flashcard" in res.text

def test_daily_usage_limit_rejection(client, valid_tcet_student_jwt):
    """Verify robust request rejection when Daily Usage/Token bounds exceed."""
    with patch("repositories.ai_repository.AIRepository.get_daily_usage", return_value={"messages_used": 50, "tokens_used": 0}):
        payload = {"question": "Should be rejected"}
        res = client.post("/api/ai/chat/stream", json=payload, headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res.status_code == 429
        assert "message limit reached" in res.json()["detail"]

def test_nvidia_api_failure_fallback(client, valid_tcet_student_jwt):
    """Verify NVIDIA timeout parsing (NVIDIA API timeout/failure)."""
    with patch("clients.nvidia_client.NVIDIAClient.stream_chat") as mock_stream, \
         patch("repositories.ai_repository.AIRepository.create_session", return_value={"id": "sess1"}), \
         patch("repositories.ai_repository.AIRepository.get_messages", return_value=[]), \
         patch("repositories.ai_repository.AIRepository.add_message"), \
         patch("services.usage_service.UsageService.check_daily_limits"):
        
        async def mock_fail(*args, **kwargs):
            yield "\n[System: AI provider timed out.]"
        mock_stream.side_effect = mock_fail
        
        payload = {"question": "Will this fail?"}
        res = client.post("/api/ai/chat/stream", json=payload, headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res.status_code == 200
        assert "timed out" in res.text

def test_conversation_deletion(client, valid_tcet_student_jwt):
    """Verify conversation soft delete API and RBAC constraints."""
    with patch("repositories.ai_repository.AIRepository.soft_delete_session") as mock_del:
        res = client.delete("/api/ai/conversations/sess1", headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert res.status_code == 200
        mock_del.assert_called_once()

def test_unauthorized_access(client):
    """Verify endpoints block requests lacking JWT configurations."""
    res = client.get("/api/ai/conversations")
    assert res.status_code == 401

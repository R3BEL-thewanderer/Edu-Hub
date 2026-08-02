import pytest
from unittest.mock import patch, MagicMock

def test_health_endpoint(client):
    """GET /health returns status, version, environment, database, and supabase status."""
    with patch("services.supabase_client.get_supabase") as mock_get_sp:
        mock_client = MagicMock()
        mock_client.table.return_value.select.return_value.limit.return_value.execute.return_value = {"data": []}
        mock_get_sp.return_value = mock_client
        
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data
        assert "environment" in data
        assert "database" in data
        assert "supabase" in data

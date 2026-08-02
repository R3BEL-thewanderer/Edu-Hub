import pytest
from unittest.mock import patch, MagicMock

def test_student_accessing_admin_endpoint_forbidden(client, valid_tcet_student_jwt):
    """Student role accessing /api/admin/stats returns HTTP 403 Forbidden."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["student"]):
        response = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert response.status_code == 403
        assert response.json()["detail"] == "Insufficient permissions."

def test_admin_accessing_admin_endpoint_allowed(client, valid_admin_jwt):
    """Admin role accessing /api/admin/stats succeeds with HTTP 200."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=["admin"]), \
         patch("routes.admin.get_supabase") as mock_get_sp:
        mock_client = MagicMock()
        mock_count = MagicMock()
        mock_count.count = 5
        mock_client.table.return_value.select.return_value.execute.return_value = mock_count
        mock_get_sp.return_value = mock_client
        
        response = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {valid_admin_jwt}"})
        assert response.status_code == 200

def test_super_admin_bypass_all_endpoints(client, valid_super_admin_jwt):
    """Super Admin email bypasses role checks and gains access to administrative endpoints."""
    with patch("routes.admin.get_supabase") as mock_get_sp:
        mock_client = MagicMock()
        mock_count = MagicMock()
        mock_count.count = 10
        mock_client.table.return_value.select.return_value.execute.return_value = mock_count
        mock_get_sp.return_value = mock_client
        
        response = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {valid_super_admin_jwt}"})
        assert response.status_code == 200

def test_missing_role_assignment_returns_forbidden(client, valid_tcet_student_jwt):
    """User with no assigned roles accessing protected endpoint returns HTTP 403 Forbidden."""
    with patch("dependencies.auth.rbac_repo.get_user_roles", return_value=[]):
        response = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert response.status_code == 403
        assert response.json()["detail"] == "Insufficient permissions."

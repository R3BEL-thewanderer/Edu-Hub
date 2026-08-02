import pytest
from unittest.mock import patch

def test_missing_jwt(client):
    """Missing JWT returns HTTP 401 Unauthorized."""
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_invalid_jwt(client):
    """Malformed or invalid JWT returns HTTP 401 Unauthorized."""
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert response.status_code == 401

def test_expired_jwt(client, expired_jwt):
    """Expired JWT returns HTTP 401 Unauthorized."""
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired_jwt}"})
    assert response.status_code == 401

def test_invalid_gmail_domain(client, invalid_gmail_jwt):
    """student@gmail.com is rejected with HTTP 403 Forbidden."""
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {invalid_gmail_jwt}"})
    assert response.status_code == 403
    assert response.json()["detail"] == "Only @tcetmumbai.in accounts are allowed."

def test_invalid_yahoo_domain(client, invalid_yahoo_jwt):
    """user@yahoo.com is rejected with HTTP 403 Forbidden."""
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {invalid_yahoo_jwt}"})
    assert response.status_code == 403
    assert response.json()["detail"] == "Only @tcetmumbai.in accounts are allowed."

def test_valid_tcet_login_and_auth_me(client, valid_tcet_student_jwt):
    """Valid @tcetmumbai.in student login succeeds on /api/auth/me."""
    mock_profile = {
        "id": "00000000-0000-0000-0000-000000000001",
        "email": "1032250974@tcetmumbai.in",
        "full_name": "Test Student",
        "avatar_url": None
    }
    with patch("repositories.profile_repo.ProfileRepository.get_by_id", return_value=mock_profile), \
         patch("repositories.profile_repo.RBACRepository.get_user_roles", return_value=["student"]):
        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "1032250974@tcetmumbai.in"
        assert data["role"] == "student"

def test_auth_logout(client, valid_tcet_student_jwt):
    """Logout endpoint invalidates session and returns HTTP 200."""
    response = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully."

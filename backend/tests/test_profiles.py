import pytest
from unittest.mock import patch, MagicMock

def test_profile_auto_provisioning_on_first_login(client, valid_tcet_student_jwt):
    """First login creates profile and preferences if missing."""
    new_user_id = "00000000-0000-0000-0000-000000000001"
    email = "1032250974@tcetmumbai.in"
    
    created_profile = {
        "id": new_user_id,
        "email": email,
        "full_name": "1032250974",
        "avatar_url": None
    }
    
    with patch("repositories.profile_repo.ProfileRepository.get_by_id", return_value=None), \
         patch("repositories.profile_repo.ProfileRepository.create_profile", return_value=created_profile) as mock_create, \
         patch("repositories.profile_repo.RBACRepository.get_user_roles", return_value=["student"]):
        
        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert response.status_code == 200
        mock_create.assert_called_once_with(
            user_id=new_user_id,
            email=email,
            full_name="Test Student",
            avatar_url=None
        )

def test_profile_reuse_on_subsequent_login(client, valid_tcet_student_jwt):
    """Subsequent logins reuse existing profile without duplicate creation."""
    user_id = "00000000-0000-0000-0000-000000000001"
    existing_profile = {
        "id": user_id,
        "email": "1032250974@tcetmumbai.in",
        "full_name": "Existing Student",
        "avatar_url": "https://example.com/avatar.png"
    }
    
    with patch("repositories.profile_repo.ProfileRepository.get_by_id", return_value=existing_profile), \
         patch("repositories.profile_repo.ProfileRepository.create_profile") as mock_create, \
         patch("repositories.profile_repo.RBACRepository.get_user_roles", return_value=["student"]):
        
        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {valid_tcet_student_jwt}"})
        assert response.status_code == 200
        mock_create.assert_not_called()
        assert response.json()["full_name"] == "Existing Student"

def test_super_admin_auto_assignment(client, valid_super_admin_jwt):
    """Super Admin email (1032250973@tcetmumbai.in) automatically gets super_admin role."""
    super_admin_id = "00000000-0000-0000-0000-000000000000"
    profile = {
        "id": super_admin_id,
        "email": "1032250973@tcetmumbai.in",
        "full_name": "Super Admin"
    }
    
    with patch("repositories.profile_repo.ProfileRepository.get_by_id", return_value=profile), \
         patch("repositories.profile_repo.RBACRepository.get_user_roles", side_effect=[[], ["super_admin"]]), \
         patch("repositories.profile_repo.RBACRepository.assign_role_by_name", return_value=True) as mock_assign:
        
        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {valid_super_admin_jwt}"})
        assert response.status_code == 200
        mock_assign.assert_called_once_with(super_admin_id, "super_admin")
        assert response.json()["role"] == "super_admin"

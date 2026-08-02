import pytest
import jwt
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from main import app
from core.config import settings

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def jwt_secret():
    return settings.SUPABASE_JWT_SECRET or "testsecretkey123"

@pytest.fixture
def valid_tcet_student_jwt(jwt_secret):
    payload = {
        "sub": "00000000-0000-0000-0000-000000000001",
        "email": "1032250974@tcetmumbai.in",
        "user_metadata": {"full_name": "Test Student"}
    }
    return jwt.encode(payload, jwt_secret, algorithm="HS256")

@pytest.fixture
def valid_super_admin_jwt(jwt_secret):
    payload = {
        "sub": "00000000-0000-0000-0000-000000000000",
        "email": settings.SUPER_ADMIN_EMAIL,
        "user_metadata": {"full_name": "Super Admin"}
    }
    return jwt.encode(payload, jwt_secret, algorithm="HS256")

@pytest.fixture
def valid_faculty_jwt(jwt_secret):
    payload = {
        "sub": "00000000-0000-0000-0000-000000000002",
        "email": "faculty@tcetmumbai.in",
        "user_metadata": {"full_name": "Test Faculty"}
    }
    return jwt.encode(payload, jwt_secret, algorithm="HS256")

@pytest.fixture
def valid_admin_jwt(jwt_secret):
    payload = {
        "sub": "00000000-0000-0000-0000-000000000003",
        "email": "admin@tcetmumbai.in",
        "user_metadata": {"full_name": "Test Admin"}
    }
    return jwt.encode(payload, jwt_secret, algorithm="HS256")

@pytest.fixture
def invalid_gmail_jwt(jwt_secret):
    payload = {
        "sub": "00000000-0000-0000-0000-000000000004",
        "email": "student@gmail.com"
    }
    return jwt.encode(payload, jwt_secret, algorithm="HS256")

@pytest.fixture
def invalid_yahoo_jwt(jwt_secret):
    payload = {
        "sub": "00000000-0000-0000-0000-000000000005",
        "email": "user@yahoo.com"
    }
    return jwt.encode(payload, jwt_secret, algorithm="HS256")

@pytest.fixture
def expired_jwt(jwt_secret):
    payload = {
        "sub": "00000000-0000-0000-0000-000000000006",
        "email": "student@tcetmumbai.in",
        "exp": 1000000000  # Past timestamp
    }
    return jwt.encode(payload, jwt_secret, algorithm="HS256")

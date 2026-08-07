from fastapi.testclient import TestClient
from main import app
from test_all_endpoints import create_mock_jwt
import json

client = TestClient(app)
jwt = create_mock_jwt("super_admin")
res = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {jwt}"})
print(res.status_code)
print(res.json())

import sys
import time
from fastapi.testclient import TestClient
import jwt
from main import app
from core.config import settings
import json

client = TestClient(app)

def create_valid_admin_jwt():
    payload = {
        'sub': settings.ADMIN_UID,
        'email': settings.SUPER_ADMIN_EMAIL,
        'exp': int(time.time()) + 3600,
        'user_metadata': {'display_name': 'Super Admin', 'role': 'super_admin'}
    }
    return jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm='HS256')

def test_endpoints():
    token = create_valid_admin_jwt()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Grab OpenAPI spec
    openapi = client.get("/openapi.json").json()
    paths = openapi.get("paths", {})
    
    routes = []
    for path, methods in paths.items():
        if "get" in methods:
            routes.append(path)
            
    with open("endpt_report.txt", "w", encoding="utf-8") as f:
        f.write("====================================================\n")
        f.write("                ENDPOINT VERIFICATION               \n")
        f.write("====================================================\n")
        
        passed = 0
        failed = 0
        
        for path in routes:
            # Mock Path parameters
            p = path.replace('{year}', '2025-26')
            p = p.replace('{semester}', 'sem5')
            p = p.replace('{subject_id}', 'e2d3a712-ef12-4e1b-a483-a25786274d4b')
            p = p.replace('{aid}', 'e2d3a712-ef12-4e1b-a483-a25786274d4b')
            p = p.replace('{anc_id}', 'e2d3a712-ef12-4e1b-a483-a25786274d4b')
            p = p.replace('{user_id}', 'e2d3a712-ef12-4e1b-a483-a25786274d4b')
            p = p.replace('{session_id}', 'e2d3a712-ef12-4e1b-a483-a25786274d4b')
            p = p.replace('{cid}', 'e2d3a712-ef12-4e1b-a483-a25786274d4b')
            p = p.replace('{content_id}', 'e2d3a712-ef12-4e1b-a483-a25786274d4b')
            p = p.replace('{type}', 'mock_test')
            p = p.replace('{id}', 'e2d3a712-ef12-4e1b-a483-a25786274d4b')
            p = p.replace('{test_id}', 'e2d3a712-ef12-4e1b-a483-a25786274d4b')
            
            try:
                res = client.get(p, headers=headers)
                status = res.status_code
                if status == 500:
                    f.write(f"✗ GET {p} returned 500: {res.json()}\n")
                    failed += 1
                else:
                    f.write(f"✓ GET {p} returned {status}\n")
                    passed += 1
            except Exception as e:
                f.write(f"✗ GET {p} CRASHED: {str(e)}\n")
                failed += 1
                
        f.write("====================================================\n")
        f.write(f"TOTAL TESTED: {len(routes)}\n")
        f.write(f"PASSED (No 500s): {passed}\n")
        f.write(f"FAILED (500s): {failed}\n")
        f.write("====================================================\n")

if __name__ == "__main__":
    test_endpoints()

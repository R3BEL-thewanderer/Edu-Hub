import json
import os
import re
import urllib.request
from collections import defaultdict

def scan_frontend():
    frontend_dir = r"c:\fe-notes\frontend\app\src"
    
    with open("audit_routes_output.json", "r") as f:
        routes = json.load(f)
        
    frontend_files = []
    for root, dirs, files in os.walk(frontend_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                frontend_files.append(os.path.join(root, file))
                
    usage_map = {route['path']: {"frontend_files": set(), "used": False} for route in routes}
    
    # Simple matching for common api patterns
    for fpath in frontend_files:
        with open(fpath, "r", encoding="utf-8") as file:
            content = file.read()
            for route_info in routes:
                path = route_info['path']
                
                # Create a regex to match the path regardless of exact parameter insertion
                # For example: `/api/admin/users/{user_id}` -> `/api/admin/users/`
                # And we match base patterns. Or just match the pieces.
                pieces = [p for p in path.split('/') if not p.startswith('{')]
                
                # E.g. `/api/admin/users/{user_id}` => `/api/admin/users`
                # e.g. `/api/materials/{id}/approve` => `/api/materials` and `approve` in the same line/area
                base_endpoint = '/'.join(pieces)
                if len(pieces) > 2: # At least /api/something
                     # Create a fuzzy text check
                     static_segment = "/".join([p for p in path.split('/') if not p.startswith('{')])
                     
                     # A better approach: Just check if the first N static segments are used.
                     parts = path.split('{')
                     static_start = parts[0].rstrip('/')
                     if static_start and static_start in content:
                           # If it has suffix like /approve, check if approve is also in file
                           if len(parts) > 1 and '}' in parts[-1]:
                               suffix = parts[-1].split('}')[-1].strip('/')
                               if suffix and suffix not in content:
                                   continue
                           
                           usage_map[path]["frontend_files"].add(fpath.replace(r"c:\fe-notes\frontend\app\\", ""))
                           usage_map[path]["used"] = True

    # 1. Generate api_audit_report.md
    with open("api_audit_report.md", "w", encoding="utf-8") as f:
        f.write("# EduHub Backend API Discovery Report\n\n")
        f.write("| Method | Endpoint | File | Auth Required | Role | Status |\n")
        f.write("|--------|----------|------|---------------|------|--------|\n")
        
        for route in routes:
            method = route['methods'][0] if route['methods'] else "NONE"
            file_short = os.path.basename(route['file'])
            status = "Ready" # Will be updated with health checks later
            f.write(f"| {method} | `{route['path']}` | `{file_short}` | {route['auth']} | {route['role']} | {status} |\n")

    # 2. Generate frontend_backend_mapping.md
    with open("frontend_backend_mapping.md", "w", encoding="utf-8") as f:
        f.write("# Frontend to Backend Mapping\n\n")
        f.write("| Endpoint | Frontend Files | Status |\n")
        f.write("|----------|----------------|--------|\n")
        for rp, info in usage_map.items():
            files_str = ", ".join(info["frontend_files"]) if info["frontend_files"] else "None"
            status = "✅ Used" if info["used"] else "❌ Never called"
            f.write(f"| `{rp}` | {files_str} | {status} |\n")

    # 3. Generate unused_endpoints.md
    with open("unused_endpoints.md", "w", encoding="utf-8") as f:
        f.write("# Unused API Endpoints (Dead Code Candidates)\n\n")
        f.write("These endpoints were never found requested by any `.ts` or `.tsx` file in the frontend.\n\n")
        count = 0
        for rp, info in usage_map.items():
            if not info["used"]:
                f.write(f"- `{rp}`\n")
                count += 1
        
        if count == 0:
            f.write("All endpoints are actively utilized by the frontend.\n")

if __name__ == "__main__":
    scan_frontend()
    print("Generated api_audit_report.md, frontend_backend_mapping.md, unused_endpoints.md")

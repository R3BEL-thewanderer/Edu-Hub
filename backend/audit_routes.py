import json
from fastapi.routing import APIRoute
from main import app  # Assuming main.py exposes the FastAPI app instance

def extract_routes(app):
    routes = []
    for route in app.routes:
        if isinstance(route, APIRoute):
            auth_req = "Unknown"
            role = "Unknown"
            
            # Simple heuristic checking dependencies for auth names
            deps = []
            for d in route.dependencies:
                dep_name = getattr(d.dependency, '__name__', str(d.dependency))
                deps.append(dep_name)
                
            if deps:
                auth_req = "Yes"
                if any("super_admin" in d for d in deps):
                    role = "Super Admin"
                elif any("admin" in d for d in deps):
                    role = "Admin"
                elif any("student" in d for d in deps):
                    role = "Student"
                elif any("faculty" in d for d in deps):
                    role = "Faculty"
                elif any("content_manager" in d for d in deps):
                    role = "Content Manager"
                elif any("user" in d for d in deps):
                    role = "Any Auth"
            else:
                auth_req = "No"
                role = "Public"
                
            routes.append({
                "path": route.path,
                "name": route.name,
                "methods": list(route.methods),
                "file": route.endpoint.__code__.co_filename if hasattr(route.endpoint, '__code__') else "Unknown",
                "auth": auth_req,
                "role": role
            })
    return routes

if __name__ == "__main__":
    r = extract_routes(app)
    with open("audit_routes_output.json", "w") as f:
        json.dump(r, f, indent=2)
    print(f"Extracted {len(r)} routes.")

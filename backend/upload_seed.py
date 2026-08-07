import os
import sys
from pathlib import Path
from services.supabase_client import get_supabase
from repositories.materials_repo import MaterialRepository
from services.storage import BUCKET_NAME

def main():
    client = get_supabase()
    repo = MaterialRepository()
    
    # 1. Fetch Super Admin User ID for uploaded_by
    admin_res = client.table("profiles").select("id").eq("email", "1032250955@tcetmumbai.in").execute()
    if not admin_res.data:
        print("Super admin not found.")
        sys.exit(1)
    admin_id = admin_res.data[0]["id"]
    
    # 2. Fetch Subjects and create code-to-id map
    subs_res = client.table("subjects").select("id, code").execute()
    subs_map = {s["code"]: s["id"] for s in subs_res.data if s.get("code")}
    
    # Create bucket if it doesn't exist
    try:
        client.storage.get_bucket(BUCKET_NAME)
    except Exception:
        print(f"Bucket {BUCKET_NAME} missing. Creating now...")
        client.storage.create_bucket(BUCKET_NAME, options={"public": False})
        
    # 3. Type mapping
    type_map = {
        "notes": "notes",
        "pdfs": "pdf",
        "pyqs": "pyq",
        "videos": "video"
    }

    base_dir = Path(r"c:\fe-notes\notes")
    if not base_dir.exists():
        print("Base directory not found")
        sys.exit(1)
        
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            file_path = Path(root) / file
            
            # extract parts: c:\fe-notes\notes\2025-26\sem1\chemistry\pdfs\test.pdf
            rel_path = file_path.relative_to(base_dir)
            parts = rel_path.parts
            
            if len(parts) < 4:
                print(f"Skipping poorly mapped path: {rel_path}")
                continue
                
            year = parts[0]
            sem = parts[1]
            subcode = parts[2]
            ctype_folder = parts[3]
            
            if subcode not in subs_map:
                print(f"Skipping {file_path}, subject {subcode} not in DB.")
                continue
                
            subject_id = subs_map[subcode]
            
            if ctype_folder not in type_map:
                print(f"Skipping unknown folder type: {ctype_folder}")
                continue
                
            material_type = type_map[ctype_folder]
            
            storage_path = f"{year}/{sem}/{subcode}/{ctype_folder}/{file}"
            
            # Check if file already in storage (optional, to avoid rewriting)
            # For simplicity, we just upload unconditionally
            try:
                print(f"Uploading {storage_path}...")
                with open(file_path, "rb") as f:
                    client.storage.from_(BUCKET_NAME).upload(
                        storage_path, 
                        f.read(),
                        {"upsert": "true", "content-type": "application/pdf" if file.endswith(".pdf") else "video/mp4"}
                    )
                
                print("Inserting into database...")
                # DB Insert
                m = repo.create_material(
                    subject_id=subject_id,
                    material_type=material_type,
                    title=file_path.stem,
                    description=f"Auto-uploaded {ctype_folder} for {subcode}",
                    uploaded_by=admin_id,
                    is_official=True
                )
                
                v = repo.create_version(
                    material_id=m["id"],
                    version_number=1,
                    storage_path=storage_path,
                    uploaded_by=admin_id,
                    file_size_bytes=os.path.getsize(file_path),
                    mime_type="application/pdf" if file.endswith(".pdf") else "video/mp4",
                    approval_status="approved"
                )
                
                repo.update_material(m["id"], {"current_version_id": v["id"]})
                print(f"Success: {file}")
            except Exception as e:
                print(f"Failed to process {file}: {e}")

if __name__ == "__main__":
    main()

"""Verify schema was created and subjects seeded"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv()
from supabase import create_client
from core.config import settings

client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

# Check subjects
try:
    r = client.table("subjects").select("id, name, semester").order("semester").order("display_order").execute()
    print(f"SUBJECTS: {len(r.data)} found")
    for s in r.data:
        print(f"  [{s['semester']}] {s['name']} ({s['id']})")
except Exception as e:
    print(f"SUBJECTS ERROR: {e}")

# Check all tables exist
for table in ["users", "files", "videos", "chat_sessions", "chat_messages", "payments"]:
    try:
        r = client.table(table).select("*").limit(0).execute()
        print(f"TABLE {table}: OK")
    except Exception as e:
        print(f"TABLE {table}: MISSING")

# Check storage bucket
buckets = client.storage.list_buckets()
names = [b.name for b in buckets]
print(f"STORAGE: {names}")

print("ALL DONE")

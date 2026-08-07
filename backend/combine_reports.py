import os

output_file = r"c:\fe-notes\API_AUDIT_REPORT.md"
input_files = [
    r"c:\fe-notes\backend\api_audit_report.md",
    r"c:\fe-notes\backend\frontend_backend_mapping.md",
    r"c:\fe-notes\backend\unused_endpoints.md",
    r"C:\Users\Ashish\.gemini\antigravity\brain\c5c1d8c8-00af-4243-96fc-32c0add1cc72\test_report.md",
    r"C:\Users\Ashish\.gemini\antigravity\brain\c5c1d8c8-00af-4243-96fc-32c0add1cc72\security_audit.md",
    r"C:\Users\Ashish\.gemini\antigravity\brain\c5c1d8c8-00af-4243-96fc-32c0add1cc72\performance_audit.md"
]

content = "# Comprehensive EduHub API Audit\n\n"

for fpath in input_files:
    if os.path.exists(fpath):
        with open(fpath, "r", encoding="utf-8") as f:
            content += f.read()
            content += "\n\n---\n\n"
    else:
        content += f"Could not find: {fpath}\n\n"

with open(output_file, "w", encoding="utf-8") as f:
    f.write(content)
    
print(f"Successfully combined everything into {output_file}")

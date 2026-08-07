import json

def generate_report():
    with open("health_check_results.json", "r") as f:
        results = json.load(f)

    passes = sum(1 for r in results if r["verdict"].startswith("✅"))
    fails = sum(1 for r in results if r["verdict"].startswith("❌"))

    content = f"# Backend API Health & Test Report\n\n"
    content += f"**Total Endpoints Tested**: {len(results)}\n"
    content += f"**Passed (Proper Status Handling)**: {passes}\n"
    content += f"**Failed (Unhandled Errors/500/404s)**: {fails}\n\n"
    
    content += "| Method | Endpoint | Status Code | Verdict |\n"
    content += "|--------|----------|-------------|---------|\n"
    
    for r in results:
        content += f"| {r['method']} | `{r['endpoint']}` | {r['status_code']} | {r['verdict']} |\n"

    with open(r"C:\Users\Ashish\.gemini\antigravity\brain\c5c1d8c8-00af-4243-96fc-32c0add1cc72\test_report.md", "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    generate_report()

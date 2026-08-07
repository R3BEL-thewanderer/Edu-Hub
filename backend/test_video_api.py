import urllib.request, json
req = urllib.request.Request('http://localhost:8000/api/files/signed-url', method='POST', headers={'Content-Type': 'application/json'}, data=b'{"filePath": "2025-26/sem1/iiks/videos/Women_In_Indian_Society.mp4"}')
try:
    print(urllib.request.urlopen(req).read().decode())
except Exception as e:
    print(e.read().decode() if hasattr(e, 'read') else str(e))

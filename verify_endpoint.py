
import requests
import json
import sys

URL = "https://hairstyle-consulting-production.up.railway.app/sse"

try:
    # Test 1: POST (Stateless JSON-RPC)
    print("Testing POST (Stateless JSON-RPC)...")
    payload = {
        "jsonrpc": "2.0",
        "method": "initialize",
        "params": {
            "clientInfo": {"name": "test-script", "version": "1.0"},
            "capabilities": {},
            "protocolVersion": "2024-11-05"
        },
        "id": 1
    }
    resp = requests.post(URL, json=payload, timeout=10)
    print(f"POST Status: {resp.status_code}")
    print(f"POST Body: {resp.text[:200]}...")
    
    if resp.status_code != 200:
        print("POST Failed!")
        sys.exit(1)

    # Test 2: GET (SSE)
    print("\nTesting GET (SSE)...")
    resp_get = requests.get(URL, stream=True, timeout=5)
    print(f"GET Status: {resp_get.status_code}")
    # Read a bit of stream
    for line in resp_get.iter_lines():
        if line:
            print(f"GET Stream Data: {line}")
            break
            
    if resp_get.status_code != 200:
        print("GET Failed!")
        sys.exit(1)
        
    print("\nSUCCESS: Hybrid endpoint is working!")

except Exception as e:
    print(f"Verification Failed: {e}")
    sys.exit(1)

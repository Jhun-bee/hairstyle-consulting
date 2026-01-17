
import requests
import json
import sys


# Try HTTPS (Correct)
URL_HTTPS = "https://hairstyle-consulting-production.up.railway.app/sse"

# Try HTTP (Possible User Mistake)
URL_HTTP = "http://hairstyle-consulting-production.up.railway.app/sse"

def test_url(url, label):
    print(f"\n--- Testing {label} ({url}) ---")
    try:
        # Test 1: POST
        print("Testing POST...")
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
        resp = requests.post(url, json=payload, timeout=10, allow_redirects=False)
        print(f"POST Status: {resp.status_code}")
        if resp.status_code != 200:
             print(f"POST Body: {resp.text[:500]}...")
        if resp.status_code in [301, 302, 307, 308]:
             print(f"POST Redirects to: {resp.headers.get('Location')}")
        
        # Test 2: GET
        print("Testing GET...")
        headers = {"Origin": "https://playmcp.co"}
        resp_get = requests.get(url, stream=True, timeout=5, headers=headers, allow_redirects=False)
        print(f"GET Status: {resp_get.status_code}")
        if resp_get.status_code in [301, 302, 307, 308]:
             print(f"GET Redirects to: {resp_get.headers.get('Location')}")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    test_url(URL_HTTPS, "HTTPS")
    test_url(URL_HTTP, "HTTP")


import json
import os
import sys

# Path assumed relative to where we run it (backend root)
file_path = "app/data/styles.json"

print(f"Checking {file_path}...")

if not os.path.exists(file_path):
    print(f"ERROR: File not found at {os.path.abspath(file_path)}")
    sys.exit(1)

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print("SUCCESS: JSON is valid.")
    print(f"Loaded {len(data)} styles.")
    
    # Check male/female count
    males = [s for s in data if s.get('gender') == 'male']
    females = [s for s in data if s.get('gender') == 'female']
    print(f"Male styles: {len(males)}")
    print(f"Female styles: {len(females)}")

except json.JSONDecodeError as e:
    print(f"ERROR: JSON Decode Error at line {e.lineno}, column {e.colno}:")
    print(e.msg)
except Exception as e:
    print(f"ERROR: {e}")

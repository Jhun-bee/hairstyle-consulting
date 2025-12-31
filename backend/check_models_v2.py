from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("GOOGLE_API_KEY not found.")
    exit()

client = genai.Client(api_key=api_key)

print("="*60)
print("Available GEMINI models (for text/vision generation):")
print("="*60)
try:
    models_pager = client.models.list()
    for model in models_pager:
        # Filter for models that support generateContent and are gemini
        if 'gemini' in model.name.lower():
            print(f"  ID: {model.name}")
            print(f"      Display: {model.display_name}")
            # Try to get supported methods if available
            if hasattr(model, 'supported_generation_methods'):
                print(f"      Methods: {model.supported_generation_methods}")
            print()
except Exception as e:
    print(f"Error listing models: {e}")

from fastapi import APIRouter
import os
import json

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BACKEND_ROOT, "data")
STYLES_JSON_PATH = os.path.join(DATA_DIR, "styles.json")

router = APIRouter()

@router.get("")
def get_styles():
    """
    Returns the list of available hair styles for frontend selection.
    Using unified styles.json database.
    """
    try:
        if not os.path.exists(STYLES_JSON_PATH):
            print(f"Error: {STYLES_JSON_PATH} not found.")
            return {"male": [], "female": []}
            
        with open(STYLES_JSON_PATH, "r", encoding="utf-8") as f:
            styles_db = json.load(f)
            
        male_styles = [{"name": s['name'], "image_url": s.get('image_url', '')} for s in styles_db if s.get('gender') == 'male']
        female_styles = [{"name": s['name'], "image_url": s.get('image_url', '')} for s in styles_db if s.get('gender') == 'female']
        
        return {
            "male": male_styles,
            "female": female_styles
        }
    except Exception as e:
        print(f"Error loading styles: {e}")
        return {"male": [], "female": []}

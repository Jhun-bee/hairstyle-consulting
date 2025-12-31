from fastapi import APIRouter, File, UploadFile, HTTPException
from app.services.gemini_client import client
from app.schemas import FaceAnalysisResult, RecommendationResponse
import shutil
import os
import json
import uuid

router = APIRouter()

# Load Data
# Current file: backend/app/api/endpoints/consultant.py
# We need to go up 4 levels to get to 'backend' root
# 1. endpoints -> 2. api -> 3. app -> 4. backend
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
DATA_DIR = os.path.join(BACKEND_ROOT, "app", "data")
UPLOADS_DIR = os.path.join(BACKEND_ROOT, "uploads")

with open(os.path.join(DATA_DIR, "styles.json"), "r", encoding="utf-8") as f:
    STYLES_DB = json.load(f)

@router.post("/analyze", response_model=FaceAnalysisResult)
async def analyze_face(file: UploadFile = File(...)):
    # Save file
    file_id = str(uuid.uuid4())
    file_ext = file.filename.split('.')[-1]
    filename = f"{file_id}.{file_ext}"
    file_path = os.path.join(UPLOADS_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Analyze
    result = await client.analyze_face(file_path)
    
    # Add the relative path or ID so we can reuse it for fitting
    # We'll use the filename as the ID for simplicity
    result['file_id'] = filename
    
    return result

@router.post("/recommend")
async def recommend_style(analysis: FaceAnalysisResult):
    # LLM Recommendation
    rec_result = await client.recommend_styles_with_llm(analysis.model_dump(), STYLES_DB)
    
    try:
        recommendations = []
        for pid in rec_result.get('recommended_style_ids', []):
            style = next((s for s in STYLES_DB if s['id'] == pid), None)
            if style:
                recommendations.append(style)
        
        return {
            "analysis": analysis,
            "recommendations": recommendations,
            "consultant_comment": rec_result.get('consultant_comment', rec_result.get('comment', "Here are my top picks for you."))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.schemas import FittingRequest

@router.post("/fitting")
async def virtual_fitting(request: FittingRequest):
    # 1. Find the user's original image
    # We assume 'user_image_path' passed from frontend is just the filename or ID we returned earlier
    original_filename = request.user_image_path
    original_path = os.path.join(UPLOADS_DIR, original_filename)
    
    if not os.path.exists(original_path):
        raise HTTPException(status_code=404, detail="Original image not found. Please upload again.")
        
    # 2. Find the target style prompt
    style = next((s for s in STYLES_DB if s['id'] == request.style_id), None)
    if not style:
        raise HTTPException(status_code=404, detail="Style not found.")
        
    # 3. Generate
    generated_image_url = await client.generate_hairstyle(
        original_image_path=original_path,
        prompt_modifier=style.get('prompt_modifier', style['name'])
    )
    
    return {"generated_image_url": generated_image_url}

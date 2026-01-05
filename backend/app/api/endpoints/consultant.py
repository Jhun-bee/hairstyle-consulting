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
RESULTS_DIR = os.path.join(BACKEND_ROOT, "results")

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
async def recommend_style(analysis: FaceAnalysisResult, gender_filter: str = "all"):
    # Filter styles by gender if specified
    # Style IDs: m_XX = male, w_XX = female
    if gender_filter == "male":
        filtered_styles = [s for s in STYLES_DB if s['id'].startswith('m_')]
    elif gender_filter == "female":
        filtered_styles = [s for s in STYLES_DB if s['id'].startswith('w_')]
    else:
        filtered_styles = STYLES_DB
    
    # LLM Recommendation with filtered styles
    rec_result = await client.recommend_styles_with_llm(analysis.model_dump(), filtered_styles)
    
    try:
        recommendations = []
        for pid in rec_result.get('recommended_style_ids', []):
            style = next((s for s in filtered_styles if s['id'] == pid), None)
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

# === Advanced Image Generation Endpoints ===

from app.schemas import TimeChangeRequest, MultiAngleRequest, PoseRequest, PhotoBoothRequest

# Helper to resolve image path from URL path
def resolve_image_path(url_path: str) -> str:
    """
    Resolves /results/xxx.png or /uploads/xxx.png to actual file path
    """
    if url_path.startswith('/results/'):
        return os.path.join(RESULTS_DIR, url_path.replace('/results/', ''))
    elif url_path.startswith('/uploads/'):
        return os.path.join(UPLOADS_DIR, url_path.replace('/uploads/', ''))
    else:
        # Fallback: try uploads dir
        return os.path.join(UPLOADS_DIR, url_path)

@router.post("/time-change")
async def generate_time_change(request: TimeChangeRequest):
    """
    시간 변화 (머리 자람) 이미지 생성
    Returns: {"1month": url, "3months": url, "1year": url}
    """
    original_path = resolve_image_path(request.user_image_path)
    
    if not os.path.exists(original_path):
        raise HTTPException(status_code=404, detail=f"Original image not found: {original_path}")
    
    result = await client.generate_time_change(
        user_image_path=original_path,
        style_name=request.style_name,
        seed=request.seed
    )
    
    return result

@router.post("/multi-angle")
async def generate_multi_angle(request: MultiAngleRequest):
    """
    다각도 (앞/옆/뒤) 이미지 생성
    Returns: {"front": url, "left": url, "right": url, "back": url}
    """
    original_path = resolve_image_path(request.user_image_path)
    
    if not os.path.exists(original_path):
        raise HTTPException(status_code=404, detail=f"Original image not found: {original_path}")
    
    result = await client.generate_multi_angle(
        user_image_path=original_path,
        style_name=request.style_name,
        seed=request.seed
    )
    
    return result

@router.post("/pose")
async def generate_pose(request: PoseRequest):
    """
    포즈 (화보 컷) 이미지 생성
    scene_type: "studio" | "outdoor" | "runway"
    Returns: {"images": [url1, url2, url3, url4, url5]}
    """
    original_path = resolve_image_path(request.user_image_path)
    
    if not os.path.exists(original_path):
        raise HTTPException(status_code=404, detail=f"Original image not found: {original_path}")
    
    result = await client.generate_pose(
        user_image_path=original_path,
        style_name=request.style_name,
        scene_type=request.scene_type,
        seed=request.seed
    )
    
    return result

@router.post("/photo-booth")
async def generate_photo_booth(request: PhotoBoothRequest):
    """
    인생세컷 합성
    image_urls: 선택된 3개 이미지 URL 리스트
    Returns: {"photo_booth_url": url}
    """
    if len(request.image_urls) != 3:
        raise HTTPException(status_code=400, detail="Exactly 3 images are required.")
    
    result_url = await client.generate_photo_booth(
        image_urls=request.image_urls,
        style_name=request.style_name
    )
    
    return {"photo_booth_url": result_url}

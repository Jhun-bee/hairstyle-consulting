"""
Hair Omakase MCP Server
AI 헤어 컨설팅 서비스를 MCP 도구로 제공합니다.

PlayMCP 공모전 출품용 - v0.7.0 (fastapi-mcp 기반)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_mcp import FastApiMCP
from pydantic import BaseModel, Field
from typing import Optional, List
import os
import json
import base64
from dotenv import load_dotenv

load_dotenv()

# Load styles database
BACKEND_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BACKEND_ROOT, "app", "data")
STYLES_JSON_PATH = os.path.join(DATA_DIR, "styles.json")

with open(STYLES_JSON_PATH, "r", encoding="utf-8") as f:
    STYLES_DB = json.load(f)

# Import Gemini client for AI functionality
from app.services.gemini_client import GeminiClient
gemini_client = GeminiClient()

# ========================================
# FastAPI App
# ========================================
app = FastAPI(
    title="Hair Omakase MCP Server",
    description="AI 헤어 컨설팅 서비스 - 얼굴 분석, 스타일 추천, 가상 피팅",
    version="0.7.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================
# Pydantic Models
# ========================================
class StyleInfo(BaseModel):
    id: str
    name: str
    tags: List[str] = []
    description: str = ""

class AnalyzeFaceRequest(BaseModel):
    image_base64: str = Field(..., description="base64로 인코딩된 이미지 데이터")

class AnalyzeFaceResponse(BaseModel):
    face_shape: str
    skin_tone: str
    hair_length: str
    hair_texture: str
    hair_color: str
    feature_summary: str
    image_id: Optional[str] = None
    error: Optional[str] = None

class RecommendStylesRequest(BaseModel):
    face_shape: str = Field(..., description="얼굴형 (계란형, 둥근형, 각진형 등)")
    skin_tone: str = Field(..., description="피부톤 (웜톤, 쿨톤 등)")
    hair_length: str = Field(..., description="현재 머리 기장")
    hair_texture: str = Field(..., description="모질 (직모, 곱슬 등)")
    gender: str = Field(default="all", description="성별 필터 (male, female, all)")

class RecommendStylesResponse(BaseModel):
    recommendations: List[dict]
    consultant_comment: str

class GenerateHairstyleRequest(BaseModel):
    image_base64: str = Field(..., description="base64로 인코딩된 원본 이미지")
    style_name: str = Field(..., description="적용할 헤어스타일 이름")
    gender: str = Field(default="female", description="성별 (male, female)")

class GenerateHairstyleResponse(BaseModel):
    success: bool
    style_applied: str
    result_image_base64: Optional[str] = None
    error: Optional[str] = None

# ========================================
# API Endpoints (MCP Tools로 자동 변환됨)
# ========================================

@app.get("/", summary="Health Check")
async def health_check():
    """서버 상태를 확인합니다."""
    return {
        "status": "healthy",
        "service": "Hair Omakase MCP Server",
        "version": "0.7.0"
    }

@app.get("/styles", summary="Get Available Styles", response_model=List[StyleInfo])
async def get_available_styles(gender: str = "all"):
    """
    사용 가능한 헤어스타일 목록을 조회합니다.
    
    - **gender**: 성별 필터 ("male", "female", "all")
    """
    if gender == "male":
        filtered = [s for s in STYLES_DB if s['id'].startswith('m_')]
    elif gender == "female":
        filtered = [s for s in STYLES_DB if s['id'].startswith('w_')]
    else:
        filtered = STYLES_DB
    
    return [
        StyleInfo(
            id=s["id"],
            name=s["name"],
            tags=s.get("tags", []),
            description=s.get("prompt_modifier", "")[:100]
        )
        for s in filtered
    ]

@app.post("/analyze-face", summary="Analyze Face", response_model=AnalyzeFaceResponse)
async def analyze_face(request: AnalyzeFaceRequest):
    """
    사용자 얼굴을 분석하여 얼굴형, 피부톤, 현재 헤어 상태를 파악합니다.
    
    - **image_base64**: base64로 인코딩된 이미지 데이터
    """
    import uuid
    
    try:
        image_data = base64.b64decode(request.image_base64)
        temp_filename = f"temp_{uuid.uuid4().hex}.jpg"
        temp_path = os.path.join(BACKEND_ROOT, "uploads", temp_filename)
        
        os.makedirs(os.path.join(BACKEND_ROOT, "uploads"), exist_ok=True)
        
        with open(temp_path, "wb") as f:
            f.write(image_data)
        
        result = await gemini_client.analyze_face(temp_path)
        result["image_id"] = temp_filename
        
        return AnalyzeFaceResponse(**result)
        
    except Exception as e:
        return AnalyzeFaceResponse(
            error=str(e),
            face_shape="Unknown",
            skin_tone="Unknown",
            hair_length="Unknown",
            hair_texture="Unknown",
            hair_color="Unknown",
            feature_summary="분석 중 오류가 발생했습니다."
        )

@app.post("/recommend-styles", summary="Recommend Styles", response_model=RecommendStylesResponse)
async def recommend_styles(request: RecommendStylesRequest):
    """
    얼굴 분석 결과를 기반으로 맞춤 헤어스타일을 추천합니다.
    """
    analysis = {
        "face_shape": request.face_shape,
        "skin_tone": request.skin_tone,
        "hair_length": request.hair_length,
        "hair_texture": request.hair_texture,
        "hair_color": "Unknown",
        "feature_summary": f"{request.face_shape} 얼굴형, {request.skin_tone} 피부"
    }
    
    if request.gender == "male":
        filtered_styles = [s for s in STYLES_DB if s['id'].startswith('m_')]
    elif request.gender == "female":
        filtered_styles = [s for s in STYLES_DB if s['id'].startswith('w_')]
    else:
        filtered_styles = STYLES_DB
    
    try:
        rec_result = await gemini_client.recommend_styles_with_llm(analysis, filtered_styles)
        
        recommendations = []
        for style_id in rec_result.get('recommended_style_ids', [])[:3]:
            style = next((s for s in filtered_styles if s['id'] == style_id), None)
            if style:
                recommendations.append({
                    "id": style["id"],
                    "name": style["name"],
                    "tags": style.get("tags", [])
                })
        
        return RecommendStylesResponse(
            recommendations=recommendations,
            consultant_comment=rec_result.get('comment', rec_result.get('consultant_comment', "추천 스타일입니다."))
        )
    except Exception as e:
        fallback = filtered_styles[:3] if len(filtered_styles) >= 3 else filtered_styles
        return RecommendStylesResponse(
            recommendations=[{"id": s["id"], "name": s["name"], "tags": s.get("tags", [])} for s in fallback],
            consultant_comment=f"기본 추천 스타일입니다. (오류: {str(e)})"
        )

@app.post("/generate-hairstyle", summary="Generate Hairstyle", response_model=GenerateHairstyleResponse)
async def generate_hairstyle(request: GenerateHairstyleRequest):
    """
    선택한 헤어스타일을 적용한 가상 피팅 이미지를 생성합니다.
    """
    import uuid
    
    try:
        image_data = base64.b64decode(request.image_base64)
        temp_filename = f"input_{uuid.uuid4().hex}.jpg"
        temp_path = os.path.join(BACKEND_ROOT, "uploads", temp_filename)
        
        os.makedirs(os.path.join(BACKEND_ROOT, "uploads"), exist_ok=True)
        os.makedirs(os.path.join(BACKEND_ROOT, "results"), exist_ok=True)
        
        with open(temp_path, "wb") as f:
            f.write(image_data)
        
        result_id, result_url = gemini_client.generate_quick_fitting_hairstyle(
            original_image_path=temp_path,
            style_description=request.style_name,
            gender=request.gender
        )
        
        result_path = os.path.join(BACKEND_ROOT, "results", f"{result_id}.jpg")
        
        if os.path.exists(result_path):
            with open(result_path, "rb") as f:
                result_base64 = base64.b64encode(f.read()).decode('utf-8')
            
            return GenerateHairstyleResponse(
                success=True,
                style_applied=request.style_name,
                result_image_base64=result_base64
            )
        else:
            return GenerateHairstyleResponse(
                success=False,
                error="Generated image not found",
                style_applied=request.style_name
            )
            
    except Exception as e:
        return GenerateHairstyleResponse(
            success=False,
            error=str(e),
            style_applied=request.style_name
        )

# ========================================
# FastAPI-MCP 설정
# ========================================
mcp = FastApiMCP(app)
mcp.mount()

# ========================================
# 서버 실행
# ========================================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)

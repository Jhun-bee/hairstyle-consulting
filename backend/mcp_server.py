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
import io
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

# ========================================
# 이미지 헬퍼 함수
# ========================================
MAX_IMAGE_SIZE = 1024  # 최대 1024x1024

def validate_and_resize_image(image_base64: str) -> tuple[bytes, str]:
    """
    base64 이미지를 검증하고 필요시 리사이즈합니다.
    
    Returns:
        (image_bytes, error_message)
        성공 시 error_message는 None
    """
    # base64 데이터 검증
    if not image_base64 or len(image_base64) < 100:
        return None, "이미지 데이터가 너무 작습니다. 올바른 이미지를 업로드해주세요."
    
    # base64가 잘렸는지 확인 (패딩 체크)
    try:
        # 패딩 보정
        padding = 4 - (len(image_base64) % 4)
        if padding != 4:
            image_base64 += "=" * padding
        
        image_data = base64.b64decode(image_base64)
    except Exception as e:
        return None, f"이미지 데이터가 손상되었습니다. 더 작은 이미지를 사용해주세요. (base64 디코딩 오류)"
    
    # 이미지 유효성 검증
    try:
        img = Image.open(io.BytesIO(image_data))
        img.verify()  # 이미지 무결성 검증
        # verify 후 다시 열어야 함
        img = Image.open(io.BytesIO(image_data))
    except Exception as e:
        return None, f"이미지를 열 수 없습니다. 이미지가 손상되었거나 지원하지 않는 형식입니다. 더 작은 이미지를 업로드해주세요."
    
    # 이미지 리사이즈 (너무 크면)
    if img.width > MAX_IMAGE_SIZE or img.height > MAX_IMAGE_SIZE:
        # 비율 유지하며 리사이즈
        img.thumbnail((MAX_IMAGE_SIZE, MAX_IMAGE_SIZE), Image.Resampling.LANCZOS)
    
    # RGB로 변환 (PNG 등은 RGBA일 수 있음)
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    
    # JPEG로 저장
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=85)
    return output.getvalue(), None

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
    version="0.7.3"
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
    
    # 이미지 검증 및 리사이즈
    image_data, error_msg = validate_and_resize_image(request.image_base64)
    
    if error_msg:
        return AnalyzeFaceResponse(
            error=error_msg,
            face_shape="분석 실패",
            skin_tone="분석 실패",
            hair_length="분석 실패",
            hair_texture="분석 실패",
            hair_color="분석 실패",
            feature_summary=error_msg
        )
    
    try:
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
            error=f"얼굴 분석 중 오류: {str(e)}",
            face_shape="분석 실패",
            skin_tone="분석 실패",
            hair_length="분석 실패",
            hair_texture="분석 실패",
            hair_color="분석 실패",
            feature_summary="얼굴 분석 중 오류가 발생했습니다. 다시 시도해주세요."
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
    
    # 이미지 검증 및 리사이즈
    image_data, error_msg = validate_and_resize_image(request.image_base64)
    
    if error_msg:
        return GenerateHairstyleResponse(
            success=False,
            error=error_msg,
            style_applied=request.style_name
        )
    
    try:
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
                error="이미지 생성에 실패했습니다. 다시 시도해주세요.",
                style_applied=request.style_name
            )
            
    except Exception as e:
        return GenerateHairstyleResponse(
            success=False,
            error=f"헤어스타일 생성 중 오류: {str(e)}",
            style_applied=request.style_name
        )

# ========================================
# FastAPI-MCP 설정
# ========================================
mcp = FastApiMCP(app)
mcp.mount_http()  # Streamable HTTP transport 사용 (POST 지원)

# ========================================
# 서버 실행
# ========================================
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)

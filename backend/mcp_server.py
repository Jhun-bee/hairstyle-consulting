"""
Hair Omakase MCP Server
AI 헤어 컨설팅 서비스를 MCP 도구로 제공합니다.

PlayMCP 공모전 출품용
"""

from fastmcp import FastMCP
import os
import json
import base64
import httpx
from dotenv import load_dotenv

load_dotenv()

# Initialize MCP Server
mcp = FastMCP("hair-omakase")

# Load styles database
BACKEND_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BACKEND_ROOT, "app", "data")
STYLES_JSON_PATH = os.path.join(DATA_DIR, "styles.json")

with open(STYLES_JSON_PATH, "r", encoding="utf-8") as f:
    STYLES_DB = json.load(f)

# Import Gemini client for AI functionality
from app.services.gemini_client import GeminiClient
gemini_client = GeminiClient()


@mcp.tool()
def get_available_styles(gender: str = "all") -> list:
    """
    사용 가능한 헤어스타일 목록을 조회합니다.
    
    Args:
        gender: 성별 필터 ("male", "female", "all")
    
    Returns:
        스타일 목록 (id, name, tags, thumbnail_url)
    """
    if gender == "male":
        filtered = [s for s in STYLES_DB if s['id'].startswith('m_')]
    elif gender == "female":
        filtered = [s for s in STYLES_DB if s['id'].startswith('w_')]
    else:
        filtered = STYLES_DB
    
    # Return simplified style info
    return [
        {
            "id": s["id"],
            "name": s["name"],
            "tags": s.get("tags", []),
            "description": s.get("prompt_modifier", "")[:100]
        }
        for s in filtered
    ]


@mcp.tool()
async def analyze_face(image_base64: str) -> dict:
    """
    사용자 얼굴을 분석하여 얼굴형, 피부톤, 현재 헤어 상태를 파악합니다.
    
    Args:
        image_base64: base64로 인코딩된 이미지 데이터
    
    Returns:
        분석 결과 (face_shape, skin_tone, hair_length, hair_texture, hair_color, feature_summary)
    """
    import tempfile
    import uuid
    
    # Decode base64 image and save temporarily
    try:
        image_data = base64.b64decode(image_base64)
        temp_filename = f"temp_{uuid.uuid4().hex}.jpg"
        temp_path = os.path.join(BACKEND_ROOT, "uploads", temp_filename)
        
        os.makedirs(os.path.join(BACKEND_ROOT, "uploads"), exist_ok=True)
        
        with open(temp_path, "wb") as f:
            f.write(image_data)
        
        # Analyze using Gemini
        result = await gemini_client.analyze_face(temp_path)
        
        # Add temp file reference for later use
        result["image_id"] = temp_filename
        
        return result
        
    except Exception as e:
        return {
            "error": str(e),
            "face_shape": "Unknown",
            "skin_tone": "Unknown",
            "hair_length": "Unknown",
            "hair_texture": "Unknown",
            "hair_color": "Unknown",
            "feature_summary": "분석 중 오류가 발생했습니다."
        }


@mcp.tool()
async def recommend_styles(
    face_shape: str,
    skin_tone: str,
    hair_length: str,
    hair_texture: str,
    gender: str = "all"
) -> dict:
    """
    얼굴 분석 결과를 기반으로 맞춤 헤어스타일을 추천합니다.
    
    Args:
        face_shape: 얼굴형 (계란형, 둥근형, 각진형 등)
        skin_tone: 피부톤 (웜톤, 쿨톤 등)
        hair_length: 현재 머리 기장
        hair_texture: 모질 (직모, 곱슬 등)
        gender: 성별 필터 ("male", "female", "all")
    
    Returns:
        추천 스타일 3개와 전문가 코멘트
    """
    # Build analysis dict
    analysis = {
        "face_shape": face_shape,
        "skin_tone": skin_tone,
        "hair_length": hair_length,
        "hair_texture": hair_texture,
        "hair_color": "Unknown",
        "feature_summary": f"{face_shape} 얼굴형, {skin_tone} 피부"
    }
    
    # Filter styles by gender
    if gender == "male":
        filtered_styles = [s for s in STYLES_DB if s['id'].startswith('m_')]
    elif gender == "female":
        filtered_styles = [s for s in STYLES_DB if s['id'].startswith('w_')]
    else:
        filtered_styles = STYLES_DB
    
    # Get recommendations from Gemini
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
        
        return {
            "recommendations": recommendations,
            "consultant_comment": rec_result.get('comment', rec_result.get('consultant_comment', "추천 스타일입니다."))
        }
    except Exception as e:
        # Fallback recommendations
        fallback = filtered_styles[:3] if len(filtered_styles) >= 3 else filtered_styles
        return {
            "recommendations": [{"id": s["id"], "name": s["name"], "tags": s.get("tags", [])} for s in fallback],
            "consultant_comment": f"기본 추천 스타일입니다. (오류: {str(e)})"
        }


@mcp.tool()
async def generate_hairstyle(image_base64: str, style_name: str, gender: str = "female") -> dict:
    """
    선택한 헤어스타일을 적용한 가상 피팅 이미지를 생성합니다.
    
    Args:
        image_base64: base64로 인코딩된 원본 이미지
        style_name: 적용할 헤어스타일 이름 (예: "레이어드 컷", "투블럭")
        gender: 성별 ("male", "female")
    
    Returns:
        생성된 이미지 (base64)
    """
    import tempfile
    import uuid
    
    try:
        # Decode and save input image
        image_data = base64.b64decode(image_base64)
        temp_filename = f"input_{uuid.uuid4().hex}.jpg"
        temp_path = os.path.join(BACKEND_ROOT, "uploads", temp_filename)
        
        os.makedirs(os.path.join(BACKEND_ROOT, "uploads"), exist_ok=True)
        os.makedirs(os.path.join(BACKEND_ROOT, "results"), exist_ok=True)
        
        with open(temp_path, "wb") as f:
            f.write(image_data)
        
        # Generate using Gemini
        result_id, result_url = gemini_client.generate_quick_fitting_hairstyle(
            original_image_path=temp_path,
            style_description=style_name,
            gender=gender
        )
        
        # Read result image and convert to base64
        result_path = os.path.join(BACKEND_ROOT, "results", f"{result_id}.jpg")
        
        if os.path.exists(result_path):
            with open(result_path, "rb") as f:
                result_base64 = base64.b64encode(f.read()).decode('utf-8')
            
            return {
                "success": True,
                "style_applied": style_name,
                "result_image_base64": result_base64
            }
        else:
            return {
                "success": False,
                "error": "Generated image not found",
                "style_applied": style_name
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "style_applied": style_name
        }



# ------------------------------------------------------------------------------
# PlayMCP Integration (FastAPI Wrapper)
# ------------------------------------------------------------------------------
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI app
app = FastAPI(title="Hair Omakase MCP Server")

# Add CORS middleware (Required for PlayMCP)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for PlayMCP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    """Root endpoint for health check"""
    return {
        "status": "healthy", 
        "service": "Hair Omakase MCP Server",
        "endpoints": {
            "sse": "/sse",
            "messages": "/messages"
        }
    }

# Mount MCP Server to FastAPI app
# mcp.http_app() returns the underlying Starlette/FastAPI app configured by FastMCP
mcp_app = mcp.http_app()
app.mount("/", mcp_app)

# Run the server
if __name__ == "__main__":
    # Railway sets the PORT environment variable
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)

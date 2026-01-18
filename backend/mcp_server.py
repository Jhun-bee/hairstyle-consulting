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
# PlayMCP Integration (SSE Transport with endpoint event)
# ------------------------------------------------------------------------------
import uvicorn
import uuid
import asyncio
import json
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response, StreamingResponse

# Create FastAPI app
app = FastAPI(title="Hair Omakase MCP Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active sessions
sessions = {}

@app.api_route("/", methods=["GET", "POST"])
async def health_check():
    """Root endpoint for health check"""
    return {
        "status": "healthy",
        "service": "Hair Omakase MCP Server",
        "version": "0.6.19",
        "transport": "sse",
        "endpoints": {
            "sse": "/sse"
        }
    }

async def sse_event_generator(session_id: str, base_url: str):
    """Generate SSE events for MCP protocol"""
    # Send endpoint event first (required by PlayMCP)
    endpoint_uri = f"{base_url}/sse?sessionId={session_id}"
    yield f"event: endpoint\ndata: {endpoint_uri}\n\n"
    
    # Keep connection alive with periodic pings
    try:
        while True:
            await asyncio.sleep(30)
            yield f": keepalive\n\n"
    except asyncio.CancelledError:
        pass

@app.get("/sse")
async def handle_sse_get(request: Request):
    """SSE Stream Endpoint - Returns text/event-stream with endpoint event"""
    session_id = str(uuid.uuid4())
    sessions[session_id] = {"created": True}
    
    # Get base URL from request and force HTTPS (Railway proxy uses HTTPS)
    base_url = str(request.base_url).rstrip("/")
    if base_url.startswith("http://"):
        base_url = base_url.replace("http://", "https://", 1)
    
    return StreamingResponse(
        sse_event_generator(session_id, base_url),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.post("/sse")
async def handle_sse_post(request: Request):
    """Handle JSON-RPC messages via POST"""
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    method = payload.get("method")
    params = payload.get("params", {})
    msg_id = payload.get("id")
    
    if not method:
        raise HTTPException(status_code=400, detail="Missing method")

    result = None
    error = None
    
    try:
        if method == "initialize":
            result = {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {"listChanged": True},
                    "prompts": {"listChanged": True},
                    "resources": {"subscribe": False, "listChanged": True}
                },
                "serverInfo": {"name": "hair-omakase", "version": "0.6.19"}
            }
        elif method == "notifications/initialized":
            return Response(status_code=200)
        elif method == "ping":
            result = {}
        elif method == "tools/list":
            result = {"tools": [
                {
                    "name": "get_available_styles",
                    "description": "사용 가능한 헤어스타일 목록을 조회합니다.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "gender": {"type": "string", "enum": ["male", "female", "all"], "default": "all"}
                        }
                    }
                },
                {
                    "name": "analyze_face",
                    "description": "사용자 얼굴을 분석하여 얼굴형, 피부톤, 현재 헤어 상태를 파악합니다.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "image_base64": {"type": "string", "description": "base64로 인코딩된 이미지 데이터"}
                        },
                        "required": ["image_base64"]
                    }
                },
                {
                    "name": "recommend_styles",
                    "description": "얼굴 분석 결과를 기반으로 맞춤 헤어스타일을 추천합니다.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "face_shape": {"type": "string"},
                            "skin_tone": {"type": "string"},
                            "hair_length": {"type": "string"},
                            "hair_texture": {"type": "string"},
                            "gender": {"type": "string", "default": "all"}
                        },
                        "required": ["face_shape", "skin_tone", "hair_length", "hair_texture"]
                    }
                },
                {
                    "name": "generate_hairstyle",
                    "description": "선택한 헤어스타일을 적용한 가상 피팅 이미지를 생성합니다.",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "image_base64": {"type": "string"},
                            "style_name": {"type": "string"},
                            "gender": {"type": "string", "default": "female"}
                        },
                        "required": ["image_base64", "style_name"]
                    }
                }
            ]}
        elif method == "tools/call":
            name = params.get("name")
            args = params.get("arguments", {})
            
            if name == "get_available_styles":
                tool_result = get_available_styles(**args)
            elif name == "analyze_face":
                tool_result = await analyze_face(**args)
            elif name == "recommend_styles":
                tool_result = await recommend_styles(**args)
            elif name == "generate_hairstyle":
                tool_result = await generate_hairstyle(**args)
            else:
                error = {"code": -32601, "message": f"Tool not found: {name}"}
                tool_result = None
            
            if tool_result is not None:
                result = {"content": [{"type": "text", "text": json.dumps(tool_result, ensure_ascii=False)}]}
        else:
            error = {"code": -32601, "message": "Method not found"}

    except Exception as e:
        error = {"code": -32603, "message": str(e)}

    response_body = {
        "jsonrpc": "2.0",
        "id": msg_id,
    }
    if error:
        response_body["error"] = error
    else:
        response_body["result"] = result
        
    return JSONResponse(content=response_body)

# Run the server
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)



from pydantic import BaseModel
from typing import List, Optional

class FaceAnalysisResult(BaseModel):
    face_shape: str
    skin_tone: str
    hair_length: str
    hair_texture: str
    hair_color: str
    feature_summary: str
    file_id: Optional[str] = None # Added for tracking the file path

class StyleDebug(BaseModel):
    id: str
    name: str
    description: str
    image_url: str

class RecommendationResponse(BaseModel):
    analysis: FaceAnalysisResult
    recommendations: List[StyleDebug]
    consultant_comment: str

class FittingRequest(BaseModel):
    style_id: str
    user_image_path: str # In real app, this might be an upload ID

# === Advanced Image Generation Requests ===

class TimeChangeRequest(BaseModel):
    """시간 변화 (머리 자람) 이미지 생성 요청"""
    base_image_url: str      # 피팅 결과 이미지 URL
    user_image_path: str     # 원본 사용자 이미지 파일명
    style_name: str          # 헤어스타일 이름

class MultiAngleRequest(BaseModel):
    """다각도 (앞/옆/뒤) 이미지 생성 요청"""
    base_image_url: str
    user_image_path: str
    style_name: str

class PoseRequest(BaseModel):
    """포즈 (화보 컷) 이미지 생성 요청"""
    base_image_url: str
    user_image_path: str
    style_name: str
    scene_type: str  # "studio" | "outdoor" | "runway"

class PhotoBoothRequest(BaseModel):
    """인생세컷 합성 요청"""
    image_urls: List[str]  # 선택된 3개 이미지 URL
    style_name: str

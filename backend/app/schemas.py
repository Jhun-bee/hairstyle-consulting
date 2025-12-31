from pydantic import BaseModel
from typing import List, Optional

class FaceAnalysisResult(BaseModel):
    face_shape: str
    skin_tone: str
    hair_length: str
    hair_texture: str
    hair_color: str
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

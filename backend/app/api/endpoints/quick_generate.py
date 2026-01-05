from fastapi import APIRouter
from pydantic import BaseModel
from app.services.quick_generate_service import quick_generate_service

router = APIRouter()

class GenerateRequest(BaseModel):
    image_id: str
    style: str
    gender: str = "person" # Default to person if not provided

@router.post("")
def generate_hair(request: GenerateRequest):
    result_url = quick_generate_service.generate(request.image_id, request.style, request.gender)
    return {"result_image": result_url}

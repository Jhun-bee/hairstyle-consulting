from pydantic import BaseModel

class ConsultRequest(BaseModel):
    image_id: str

class ConsultResponse(BaseModel):
    consultation: str
    recommended_styles: list[str]

class GenerateRequest(BaseModel):
    consult_id: str
    style_index: int

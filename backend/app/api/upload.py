from fastapi import APIRouter

router = APIRouter()

@router.post("/")
def upload_image():
    return {"message": "Upload endpoint"}

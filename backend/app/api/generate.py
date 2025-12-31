from fastapi import APIRouter

router = APIRouter()

@router.post("/")
def generate_hair():
    return {"message": "Generate endpoint"}

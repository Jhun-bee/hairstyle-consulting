from fastapi import APIRouter

router = APIRouter()

@router.post("/")
def consult_hair():
    return {"message": "Consult endpoint"}

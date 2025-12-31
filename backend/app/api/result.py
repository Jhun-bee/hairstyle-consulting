from fastapi import APIRouter

router = APIRouter()

@router.get("/{result_id}")
def get_result(result_id: str):
    return {"message": "Result endpoint"}

from fastapi import APIRouter, UploadFile, File
from app.services.quick_file_service import quick_file_service

router = APIRouter()


@router.post("")
def upload_image(file: UploadFile = File(...)):
    print(f"Debug: Received upload request. Filename: {file.filename}, Content-Type: {file.content_type}")
    try:
        file_id, file_url = quick_file_service.save_upload(file)
        print(f"Debug: File saved successfully. ID: {file_id}")
        return {
            "message": "Image uploaded successfully",
            "image_id": file_id,
            "url": file_url
        }
    except Exception as e:
        print(f"Debug: Upload Failed. Error: {e}")
        raise e

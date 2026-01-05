import shutil
import uuid
from pathlib import Path
from fastapi import UploadFile
from app.api.endpoints.consultant import UPLOADS_DIR

# Reusing UPLOADS_DIR from consultant.py to avoid redefining paths
# Or we can define it here if needed.
# For simplicity, let's use the one from existing config if available, 
# but consultant.py defined it locally.
# Let's verify if 'app.core.config' exists in my project. I didn't see it.
# So I will adapt it to use os.path like consultant.py or just use the same dir.

import os
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOADS_DIR_PATH = os.path.join(BACKEND_ROOT, "uploads")

class FileService:
    def save_upload(self, file: UploadFile) -> tuple[str, str]:
        """
        Save uploaded file to disk.
        Returns: (file_id, file_path)
        """
        file_id = str(uuid.uuid4())
        extension = file.filename.split(".")[-1]
        filename = f"{file_id}.{extension}"
        
        upload_dir = Path(UPLOADS_DIR_PATH)
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = upload_dir / filename
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return file_id, f"/uploads/{filename}"

quick_file_service = FileService()

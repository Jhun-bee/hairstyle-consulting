from pydantic import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hair Consulting AI"
    UPLOAD_DIR: str = "uploads"
    RESULT_DIR: str = "results"
    
    class Config:
        env_file = ".env"

settings = Settings()

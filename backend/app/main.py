from fastapi import FastAPI
from app.api import upload, consult, generate, result
from app.core.config import settings

app = FastAPI(title="Hair Consulting AI")

# Include routers
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(consult.router, prefix="/api/consult", tags=["Consult"])
app.include_router(generate.router, prefix="/api/generate", tags=["Generate"])
app.include_router(result.router, prefix="/api/result", tags=["Result"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Hair Consulting AI API"}

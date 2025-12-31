from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.api.endpoints import consultant

app = FastAPI(title="Hair Omakase API", version="1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
RESULTS_DIR = os.path.join(BASE_DIR, "results")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

# Mount Static
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.mount("/results", StaticFiles(directory=RESULTS_DIR), name="results")

# Remote Static for placeholder images (Optional, can be used for mock data serving)
# app.mount("/static", StaticFiles(directory="static"), name="static")

# Routes
app.include_router(consultant.router, prefix="/api/consultant", tags=["consultant"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Hair Omakase API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

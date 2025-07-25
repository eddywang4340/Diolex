# backend/app/main.py - Main application entry point

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.api.router import api_router
from app.agent.tts_service import initialize_tts

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# --- CORS Configuration ---
origins = [
    "http://localhost:5173", # Vite default URL 
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

@app.on_event("startup")
async def startup_event():
    """Initialize TTS on startup"""
    try:
        initialize_tts()
        logger.info("TTS service initialized successfully")
        logger.info("InterviewPrepAgent initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize TTS and InterviewPrepAgent: {e}")

@app.get("/")
async def read_root():
    return {"message": "Hello from FastAPI Backend with WebSocket support!"}
    
    
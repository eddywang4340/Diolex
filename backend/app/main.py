# backend/app/main.py - Enhanced with WebSocket support

from fastapi import FastAPI, HTTPException, Query, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, Dict, List
import random
import logging
import json
import asyncio
from datetime import datetime

from app.db.database import get_db
from app.db.models.problems import Problem
from app.agent.agent import InterviewPrepAgent
from app.agent.tts_service import initialize_tts, speak

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

# # Global instances
interview_agent = InterviewPrepAgent()

@app.on_event("startup")
async def startup_event():
    """Initialize TTS on startup"""
    try:
        initialize_tts()
        logger.info("TTS service initialized successfully")
        logger.info("InterviewPrepAgent initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize TTS and InterviewPrepAgent: {e}")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"Client {client_id} disconnected")

    async def send_personal_message(self, message: dict, client_id: str):
        websocket = self.active_connections.get(client_id)
        if websocket:
            await websocket.send_text(json.dumps(message))

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_text(json.dumps(message))

manager = ConnectionManager()

# Mock AI responses for demo purposes
AI_RESPONSES = [
    "That's an interesting approach! Can you walk me through your thinking?",
    "Have you considered the time complexity of that solution?",
    "What edge cases should we think about for this problem?",
    "That's on the right track. Can you optimize it further?",
    "Good question! Let me clarify that for you...",
    "Try running through the example step by step with your approach.",
    "What data structures would be most efficient here?",
    "Can you think of any alternative approaches to solve this?",
    "That's a great observation about the problem constraints.",
    "How would your solution handle the worst-case scenario?"
]

def serialize_problem(problem: Problem) -> dict:
    """Helper function to serialize a problem instance"""
    return {
        "id": problem.id,
        "title": problem.title,
        "description": problem.description,
        "is_premium": bool(problem.is_premium),
        "difficulty": problem.difficulty,
        "solution_link": problem.solution_link,
        "url": problem.url,
        "companies": problem.companies,
        "related_topics": problem.related_topics,
        "similar_questions": problem.similar_questions
    }

# WebSocket endpoint for real-time communication
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            logger.info(f"Received from {client_id}: {message_data}")
            
            # Process different message types
            if message_data.get("type") == "speech":
                await handle_speech_message(message_data, client_id)
            elif message_data.get("type") == "chat":
                await handle_chat_message(message_data, client_id)
            elif message_data.get("type") == "ping":
                await manager.send_personal_message({"type": "pong"}, client_id)
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for {client_id}: {e}")
        manager.disconnect(client_id)

async def handle_speech_message(message_data: dict, client_id: str):
    """Handle speech-to-text messages"""
    transcript = message_data.get("data", "")
    is_final = message_data.get("isFinal", False)
    
    if is_final and transcript.strip():
        # Log the speech input
        logger.info(f"Final speech from {client_id}: {transcript}")
        
        # Echo back the transcribed message as user message
        user_message = {
            "type": "user_message",
            "message": transcript,
            "timestamp": datetime.now().isoformat(),
            "source": "speech"
        }
        await manager.send_personal_message(user_message, client_id)
        
        # Simulate AI processing delay
        await asyncio.sleep(1)
        
        # Generate AI response
        ai_response = interview_agent.send_message(user_message["message"])
        ai_message = {
            "type": "ai_message", 
            "message": ai_response,
            "timestamp": datetime.now().isoformat(),
            "messageType": "response"
        }
        await manager.send_personal_message(ai_message, client_id)

        # Speak with TTS
        speak(ai_response)
        
    elif not is_final:
        # Send interim transcript for real-time display
        interim_message = {
            "type": "interim_speech",
            "message": transcript,
            "timestamp": datetime.now().isoformat()
        }
        await manager.send_personal_message(interim_message, client_id)

async def handle_chat_message(message_data: dict, client_id: str):
    """Handle regular chat messages"""
    message = message_data.get("message", "")
    
    if message.strip():
        # Echo back as user message
        user_message = {
            "type": "user_message",
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "source": "text"
        }
        await manager.send_personal_message(user_message, client_id)
        
        # Simulate AI response
        await asyncio.sleep(1)
        ai_response = random.choice(AI_RESPONSES)
        ai_message = {
            "type": "ai_message",
            "message": ai_response, 
            "timestamp": datetime.now().isoformat(),
            "messageType": "response"
        }
        await manager.send_personal_message(ai_message, client_id)

# --- Existing endpoints remain the same ---

@app.get("/")
async def read_root():
    return {"message": "Hello from FastAPI Backend with WebSocket support!"}

@app.get("/api/greeting")
async def get_greeting():
    return {"message": "Greetings from the API endpoint!"}

@app.get("/api/problems/random")
async def get_random_problem(
    difficulty: Optional[str] = Query(None, description="Filter by difficulty: Easy, Medium, or Hard"),
    company: Optional[str] = Query(None, description="Filter by company (checks if company is in the companies array)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a random problem based on filters using SQLAlchemy ORM.
    
    Args:
        difficulty: Problem difficulty level (Easy, Medium, Hard)
        company: Company to filter by (searches within companies array)
    
    Returns:
        A random problem matching the filters or error message if none found
    """
    try:
        # Validate difficulty if provided
        valid_difficulties = ["Easy", "Medium", "Hard"]
        if difficulty and difficulty not in valid_difficulties:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid difficulty. Must be one of: {', '.join(valid_difficulties)}"
            )
        
        # Build the query using SQLAlchemy ORM
        query = select(Problem)
        
        # Apply difficulty filter
        if difficulty:
            query = query.where(Problem.difficulty == difficulty)
        
        # Apply company filter (PostgreSQL array contains)
        if company:
            query = query.where(Problem.companies.any(company))
        
        # Execute the query
        result = await db.execute(query)
        problems = result.scalars().all()
        
        if not problems:
            # No problems found matching the criteria
            filter_info = []
            if difficulty:
                filter_info.append(f"difficulty: {difficulty}")
            if company:
                filter_info.append(f"company: {company}")
            
            filter_str = " and ".join(filter_info) if filter_info else "no filters"
            
            return {
                "success": False,
                "message": f"No problems found matching criteria ({filter_str})",
                "data": None
            }
        
        # Select a random problem from the results
        random_problem = random.choice(problems)
        
        return {
            "success": True,
            "message": f"Found {len(problems)} matching problem(s), returning random selection",
            "data": serialize_problem(random_problem),
            "total_matches": len(problems)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching random problem: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/problems/{problem_id}")
async def get_problem(problem_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get a specific problem by ID.
    """
    try:
        result = await db.execute(select(Problem).where(Problem.id == problem_id))
        problem = result.scalar_one_or_none()
        
        if not problem:
            raise HTTPException(status_code=404, detail="Problem not found")
        
        return {
            "success": True,
            "data": serialize_problem(problem)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching problem {problem_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/problems")
async def get_problems(
    skip: int = Query(0, ge=0, description="Number of problems to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of problems to return"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    company: Optional[str] = Query(None, description="Filter by company"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a paginated list of problems with optional filters.
    """
    try:
        # Validate difficulty if provided
        valid_difficulties = ["Easy", "Medium", "Hard"]
        if difficulty and difficulty not in valid_difficulties:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid difficulty. Must be one of: {', '.join(valid_difficulties)}"
            )
        
        # Build the base query
        query = select(Problem)
        count_query = select(func.count(Problem.id))
        
        # Apply filters
        if difficulty:
            query = query.where(Problem.difficulty == difficulty)
            count_query = count_query.where(Problem.difficulty == difficulty)
        
        if company:
            query = query.where(Problem.companies.any(company))
            count_query = count_query.where(Problem.companies.any(company))
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        # Execute queries
        problems_result = await db.execute(query)
        problems = problems_result.scalars().all()
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        return {
            "success": True,
            "data": [serialize_problem(problem) for problem in problems],
            "pagination": {
                "skip": skip,
                "limit": limit,
                "total": total,
                "has_more": skip + limit < (total if total is not None else 0)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching problems: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
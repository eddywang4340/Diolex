# backend/app/main.py - Enhanced with WebSocket support

from fastapi import FastAPI, HTTPException, Query, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import Optional, Dict, List
import random
import logging
import json
import asyncio
from datetime import datetime

from app.db.database import get_db
from app.db.models.problems import Problem
from app.agent.interview_agent import InterviewAgent
from app.agent.tts_service import initialize_tts, speak, stop_audio

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

# Global interview agent - will be reinitialized with each new problem
interview_agent = InterviewAgent()

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
    stop_audio()
    transcript = message_data.get("data", "")
    is_final = message_data.get("isFinal", False)
    code_context = message_data.get("codeContext", "")

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
        ai_response = interview_agent.send_message(user_message["message"], user_code=code_context)
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
    code_context = message_data.get("codeContext", "")
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
    company: Optional[str] = Query(None, description="Filter by company"),
    problem_type: Optional[str] = Query(None, description="Filter by problem type"),
    db: AsyncSession = Depends(get_db)
):
    try:
        # First, let's check what difficulties actually exist in your DB
        difficulty_check = await db.execute(text("SELECT DISTINCT difficulty FROM problems"))
        existing_difficulties = [row[0] for row in difficulty_check.fetchall()]
        logger.info(f"Existing difficulties in DB: {existing_difficulties}")
        
        # Use the actual case from your database (capitalize first letter)
        valid_difficulties = ['Easy', 'Medium', 'Hard']
        if difficulty:
            # Capitalize the difficulty to match DB format
            formatted_difficulty = difficulty.capitalize()
            if formatted_difficulty not in valid_difficulties:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid difficulty. Must be one of: {', '.join([d.lower() for d in valid_difficulties])}"
                )
        
        # Build the query using SQLAlchemy ORM
        query = select(Problem)
        
        # Apply difficulty filter (exact match with proper capitalization)
        if difficulty:
            formatted_difficulty = difficulty.capitalize()  # easy -> Easy
            query = query.where(Problem.difficulty == formatted_difficulty)
        
        # Apply company filter (PostgreSQL array contains - fixed syntax)
        if company:
            # Use PostgreSQL array contains operator
            query = query.where(text(f"'{company}' = ANY(companies)"))
        
        # Apply problem type filter to related_topics array
        if problem_type and problem_type != 'all':
            # Map frontend types to database topics
            topic_mapping = {
                'arrays-hashing': ['Array', 'Hash Table', 'String', 'Sort'],
                'two-pointers': ['Two Pointers'],
                'sliding-window': ['Sliding Window'],
                'stack': ['Stack', 'Queue'],
                'binary-search': ['Binary Search'],
                'linked-list': ['Linked List'],
                'trees': ['Tree', 'Binary Search Tree', 'Depth-first Search', 'Breadth-first Search'],
                'tries': ['Trie'],
                'heap-priority-queue': ['Heap'],
                'backtracking': ['Backtracking', 'Recursion'],
                'graphs': ['Graph', 'Union Find'],
                'advanced-graphs': ['Topological Sort'],
                '1d-dp': ['Dynamic Programming', 'Memoization'],
                'greedy': ['Greedy'],
                'math-geometry': ['Math', 'Geometry'],
                'bit-manipulation': ['Bit Manipulation'],
            }
            
            db_topics = topic_mapping.get(problem_type, [])
            if db_topics:
                # Use OR condition for multiple topics
                topic_conditions = [f"'{topic}' = ANY(related_topics)" for topic in db_topics]
                query = query.where(text(f"({' OR '.join(topic_conditions)})"))
            else:
                # Fallback to direct match
                query = query.where(text(f"'{problem_type}' = ANY(related_topics)"))
        
        # Execute the query
        result = await db.execute(query)
        problems = result.scalars().all()
        
        if not problems:
            filter_info = []
            if difficulty:
                filter_info.append(f"difficulty: {difficulty}")
            if company:
                filter_info.append(f"company: {company}")
            if problem_type and problem_type != 'all':
                filter_info.append(f"type: {problem_type}")
            
            filter_str = " and ".join(filter_info) if filter_info else "no filters"
            
            return {
                "success": False,
                "message": f"No problems found matching criteria ({filter_str})",
                "data": None,
                "available_difficulties": existing_difficulties
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
# Add endpoint to get filter options with company counts
@app.get("/api/problems/filters")
async def get_filter_options(db: AsyncSession = Depends(get_db)):
    """Get available filter options from the database with company counts"""
    try:
        # Get difficulties
        difficulty_result = await db.execute(
            text("SELECT DISTINCT difficulty FROM problems WHERE difficulty IS NOT NULL ORDER BY difficulty")
        )
        difficulties = [row[0] for row in difficulty_result.fetchall()]
        
        # Get companies with counts
        company_count_query = """
        SELECT company, COUNT(*) as count 
        FROM (
            SELECT unnest(companies) as company 
            FROM problems 
            WHERE companies IS NOT NULL
        ) as company_list
        GROUP BY company
        HAVING COUNT(*) >= 10
        ORDER BY count DESC, company
        """
        
        company_result = await db.execute(text(company_count_query))
        company_counts = [{"company": row[0], "count": row[1]} for row in company_result.fetchall()]
        
        # Also keep a simple company list for compatibility
        companies = [cc["company"] for cc in company_counts]
        
        # Get topics
        topic_result = await db.execute(
            text("SELECT DISTINCT unnest(related_topics) as topic FROM problems WHERE related_topics IS NOT NULL ORDER BY topic")
        )
        topics = [row[0] for row in topic_result.fetchall()]
        
        return {
            "success": True,
            "data": {
                "difficulties": difficulties,
                "companies": companies,
                "companyCounts": company_counts,
                "topics": topics
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching filter options: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    
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

@app.post("/end")
async def end():
    stop_audio()
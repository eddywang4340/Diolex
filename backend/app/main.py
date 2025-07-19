# backend/main.py

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
import random
import logging

from app.db.database import get_db
from app.db.models.problems import Problem

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
# --- End CORS Configuration ---


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


@app.get("/")
async def read_root():
    return {"message": "Hello from FastAPI Backend!"}


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
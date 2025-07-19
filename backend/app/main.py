# backend/main.py

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware # Import CORS middleware
from typing import Optional, List, Dict, Any
import random
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# --- CORS Configuration ---
# Define allowed origins. For local development, you'll allow your React app's URL.
# In production, you'd replace '*' with your actual frontend domain(s).
origins = [
    "http://localhost:5173", # Vite default URL (or 3000 if using Create React App)
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # List of origins that can access the API
    allow_credentials=True,         # Allow cookies to be sent with requests
    allow_methods=["*"],            # Allow all standard HTTP methods (GET, POST, etc.)
    allow_headers=["*"],            # Allow all headers
)
# --- End CORS Configuration ---


@app.get("/")
async def read_root():
    return {"message": "Hello from FastAPI Backend!"}

@app.get("/api/greeting")
async def get_greeting():
    return {"message": "Greetings from the API endpoint!"}

@app.get("/api/problems/random")
async def get_random_problem(
    difficulty: Optional[str] = Query(None, description="Filter by difficulty: Easy, Medium, or Hard"),
    company: Optional[str] = Query(None, description="Filter by company (checks if company is in the companies array)")
):
    """
    Get a random problem based on filters.
    
    Args:
        difficulty: Problem difficulty level (Easy, Medium, Hard)
        company: Company to filter by (searches within companies array)
    
    Returns:
        A random problem matching the filters or error message if none found
    """
    try:
        async with db.get_connection() as conn:
            # Build the query dynamically based on filters
            query = "SELECT * FROM problems WHERE 1=1"
            params = []
            param_count = 0
            
            if difficulty:
                param_count += 1
                query += f" AND difficulty = ${param_count}"
                params.append(difficulty)
            
            if company:
                param_count += 1
                # Use ANY to check if company exists in the companies array
                query += f" AND ${param_count} = ANY(companies)"
                params.append(company)
            
            # Execute query
            rows = await conn.fetch(query, *params)
            
            if not rows:
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
            random_problem = random.choice(rows)
            
            # Convert row to dictionary
            problem_dict = dict(random_problem)
            
            return {
                "success": True,
                "message": f"Found {len(rows)} matching problem(s), returning random selection",
                "data": problem_dict,
                "total_matches": len(rows)
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching random problem: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
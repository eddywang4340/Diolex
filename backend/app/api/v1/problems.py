from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import Optional
import random
import logging

from app.db.database import get_db
from app.db.models.problems import Problem
from app.api.shared import interview_agent, serialize_problem

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/random")
async def get_random_problem(
    difficulty: Optional[str] = Query(None, description="Filter by difficulty: Easy, Medium, or Hard"),
    company: Optional[str] = Query(None, description="Filter by company"),
    problem_type: Optional[str] = Query(None, description="Filter by problem type"),
    db: AsyncSession = Depends(get_db)
):
    
    # HARDCODED FOR DEMO - Two Sum problem
    hardcoded_two_sum = {
        "id": 1,
        "title": "Two Sum",
        "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.\n\nExample 1:\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].\n\nExample 2:\nInput: nums = [3,2,4], target = 6\nOutput: [1,2]\n\nExample 3:\nInput: nums = [3,3], target = 6\nOutput: [0,1]\n\nConstraints:\n2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.",
        "is_premium": False,
        "difficulty": "Easy",
        "solution_link": None,
        "url": "https://leetcode.com/problems/two-sum/",
        "companies": ["Amazon", "Google", "Microsoft", "Apple", "Facebook"],
        "related_topics": ["Array", "Hash Table"],
        "similar_questions": "3Sum, 4Sum"
    }

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
        problem_data = serialize_problem(random_problem)

        # Initialize the interview agent with the selected problem
        interview_agent.update_problem(hardcoded_two_sum)
        
        return {
            "success": True,
            "message": f"Found {len(problems)} matching problem(s), returning random selection",
            "data": hardcoded_two_sum,
            "total_matches": len(problems)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching random problem: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/filters")
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

@router.get("")
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

from fastapi import APIRouter
from app.api.v1.problems import router as problems_router
from app.api.v1.interview import router as interview_router

# API routes (with /api prefix)
api_router = APIRouter(prefix="/api")
api_router.include_router(problems_router, prefix="/problems", tags=["problems"])
api_router.include_router(interview_router, prefix="/interview", tags=["interview"])


"""
Shared global instances and utilities for the API
"""
from app.agent.interview_agent import InterviewAgent
from app.agent.feedback_agent import FeedbackAgent

# Global interview agent - will be reinitialized with each new problem
interview_agent = InterviewAgent()
feedback_agent = FeedbackAgent()

def serialize_problem(problem) -> dict:
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


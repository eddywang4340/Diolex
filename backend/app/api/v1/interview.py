from fastapi import APIRouter, HTTPException
import json
import logging

from app.api.shared import interview_agent, feedback_agent
from app.agent.tts_service import stop_audio

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/end")
async def end_interview():
    try:
        # Stop any ongoing audio
        stop_audio()
        
        # Extract data from request
        code_context = interview_agent.user_code
        # Get the current problem details from the interview agent
        current_problem = {
            'description': interview_agent.problem_description,
            'title': getattr(interview_agent, 'problem_title', 'Unknown Problem')
        }
        
        # Get the formatted chat history from the interview agent
        chat_history = interview_agent.get_formatted_history()
        
        logger.info(f"Ending interview with code context length: {len(code_context)}")
        logger.info(f"Chat history length: {len(chat_history)}")
        logger.info(f"Problem: {current_problem.get('title', 'Unknown')}")
        
        # Update the feedback agent with all context
        feedback_agent.update_context(
            problem_data=current_problem,
            chat_history=chat_history,
            final_code=code_context
        )
        
        # Generate and return the feedback JSON
        feedback_json = feedback_agent.generate_feedback_json()
        
        # Parse the JSON string to return as proper JSON response
        feedback_data = json.loads(feedback_json)
        print("Feedback data generated:", feedback_data)
        return {
            "success": True,
            "feedback": feedback_data,
            "message": "Interview ended and feedback generated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error ending interview: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate feedback: {str(e)}")

import os
from dotenv import load_dotenv
import google.genai as genai
from google.genai import types
from pydantic import BaseModel
from typing import Literal
from .prompt import feedback_system_prompt

load_dotenv()


class FeedbackScore(BaseModel):
    clarification: int
    reasoning: int
    solution: int
    total: int
    recommendation: Literal["Strong Hire", "Hire", "No Hire", "Strong No Hire"]
    explanation: str


class FeedbackAgent:
    def __init__(self):
        """
        Initialize the feedback agent.
        """
        self.chat_history_context = "No chat history provided yet."
        self.problem_description = "No problem provided"
        self.final_code = "No code provided"
        self.client = genai.Client()
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        # Wait for update_context before starting chat session
        self.chat_session = None
    
    def update_context(self, problem_data: dict, chat_history: str, final_code: str):
        self.problem_description = problem_data.get('description', 'No problem provided')
        self.chat_history_context = chat_history if chat_history else "No chat history provided."
        self.final_code = final_code if final_code else "No code provided"
        
        # Generate system instruction with all context
        self.system_instruction = feedback_system_prompt.format(
            problem=self.problem_description,
            chat_history=self.chat_history_context,
            final_code=self.final_code
        )
        
        print("Feedback session created")
        self.chat_session = self.client.chats.create(
            model='gemini-2.5-flash',
            config=types.GenerateContentConfig(
                system_instruction=self.system_instruction
            )
        )
        
    def generate_feedback_json(self) -> str:
        """
        Generate comprehensive feedback based on the provided context.
        
        Returns:
            str: Comprehensive feedback analysis in JSON format
        """
        if not self.chat_session:
            return "Error: Context not initialized. Please call update_context first."
        
        try:
            # Send a message to generate feedback based on the system instruction context
            feedback_request = "Please provide a comprehensive evaluation of this candidate's performance based on the problem, chat history, and final code provided in the context."
            
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=feedback_request,
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': FeedbackScore,
                    'system_instruction': self.system_instruction
                }
            )
            
            # Return the structured response as a JSON string
            return response.parsed.model_dump_json()
            
        except Exception as e:
            return f"An error occurred while generating feedback: {e}"
    
    def generate_feedback(self) -> str:
        """
        Generate comprehensive feedback based on the provided context.
        
        Returns:
            str: Comprehensive feedback analysis with structured scores
        """
        if not self.chat_session:
            return "Error: Context not initialized. Please call update_context first."
        
        try:
            # Send a message to generate feedback based on the system instruction context
            feedback_request = "Please provide a comprehensive evaluation of this candidate's interview performance based on the problem, chat history, and final code provided in the context."
            
            # Use structured output with Pydantic model
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=feedback_request,
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': FeedbackScore,
                    'system_instruction': self.system_instruction
                }
            )
            
            # Parse the structured response
            structured_feedback = response.parsed
            
            # Return formatted feedback with structured scores
            return self._format_feedback_response(structured_feedback, response.text)
            
        except Exception as e:
            return f"An error occurred while generating feedback: {e}"
    
    def _format_feedback_response(self, parsed_feedback: FeedbackScore, full_text: str) -> str:
        """
        Format the structured feedback response into a readable format.
        
        Args:
            parsed_feedback: The parsed Pydantic model with structured scores
            full_text: The full text response from the model
            
        Returns:
            str: Formatted feedback response
        """
        formatted_response = f"""
INTERVIEW PERFORMANCE EVALUATION
================================

{full_text}

STRUCTURED SCORES:
------------------
Clarification & Requirements: {parsed_feedback.clarification}/5
Reasoning & Communication: {parsed_feedback.reasoning}/5
Solution Quality & Optimality: {parsed_feedback.solution}/5
Total Score: {parsed_feedback.total}/15

RECOMMENDATION: {parsed_feedback.recommendation}

EXPLANATION: {parsed_feedback.explanation}
        """
        
        return formatted_response.strip()
    
    def get_structured_scores(self) -> dict:
        """
        Generate feedback and return only the structured scores as a dictionary.
        
        Returns:
            dict: Dictionary containing the structured scores
        """
        if not self.chat_session:
            return {"error": "Context not initialized. Please call update_context first."}
        
        try:
            feedback_request = "Please provide a comprehensive evaluation of this candidate's interview performance based on the problem, chat history, and final code provided in the context."
            
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=feedback_request,
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': FeedbackScore,
                    'system_instruction': self.system_instruction
                }
            )
            
            # Return the parsed response as a dictionary
            return response.parsed.model_dump()
            
        except Exception as e:
            return {"error": f"An error occurred while generating feedback: {e}"}
    
    # def generate_specific_feedback(self, focus_area: str) -> str:

    #     if not self.chat_session:
    #         return "Error: Context not initialized. Please call update_context first."
        
    #     try:
    #         feedback_request = f"Please provide detailed feedback specifically focused on the candidate's {focus_area} during this interview."
            
    #         response = self.chat_session.send_message(feedback_request)
    #         return response.text
            
    #     except Exception as e:
    #         return f"An error occurred while generating specific feedback: {e}"


# --- Main Execution for Testing ---
if __name__ == "__main__":
    print("Testing FeedbackAgent with structured output...")
    
    # Initialize the agent
    agent = FeedbackAgent()
    
    # Sample data for testing
    problem_data = {
        "description": "Given an integer array nums and an integer target, return the indices of the two distinct numbers whose sum equals target (exactly one such pair exists) in any order."
    }
    
    sample_chat_history = """
USER: Before coding: constraints? Max length of nums? Are numbers negative? Any duplicates? Exactly one valid pair always guaranteed? 
ASSISTANT: Length up to 10^5, values can be negative, duplicates allowed, exactly one pair.
USER: Edge cases: minimal length 2, large length, negative + positive pairing, same value used twice only if it appears twice. I'll restate: find indices i≠j with nums[i]+nums[j]==target; guaranteed unique solution.
ASSISTANT: Correct.
USER: Approaches: 
 - Brute force O(n^2) nested loops.
 - Sort + two pointers O(n log n) but loses original indices unless we track them.
 - Optimal: one-pass hash map storing value→index; for each x check if target - x seen. O(n) time, O(n) space.
Choosing one-pass hash for minimal passes.
ASSISTANT: Sounds good.
USER: Complexity: Time O(n), Space O(n). Will code with early return. I'll also mention no need for extra validation since guarantee exists.
ASSISTANT: Proceed.
USER: Implemented; adding small test mentally: nums=[2,7,11,15], target=9 => store 2, see 7 complement 2 -> return [0,1]; works with negatives e.g. [3,-1,4], target=3 => see 3 store, see -1 store, see 4 complement -1 -> indices (1,2).
ASSISTANT: Show code.
USER: (pastes code)
ASSISTANT: Any pitfalls?
USER: Only risk would be overwriting earlier index if duplicates, but since we check complement before insertion it's safe.
    """
    
    sample_final_code = """
    def twoSum(nums, target):
    index_of = {}
    for i, x in enumerate(nums):
        need = target - x
        if need in index_of:
            return [index_of[need], i]
        index_of[x] = i
    # Given guarantee, should never reach here:
    return []
    """
    
    try:
        # Test update_context method
        print("✓ Testing update_context...")
        agent.update_context(problem_data, sample_chat_history, sample_final_code)
        print("✓ Context updated successfully!")
        
        print("\n✓ Testing generate_feedback_json...")
        print(agent.generate_feedback_json())
        
        # # Test structured scores method
        # print("\n✓ Testing get_structured_scores...")
        # structured_scores = agent.get_structured_scores()
        # print("Structured Scores:")
        # print(structured_scores)
        
        # # Test full feedback generation
        # print("\n✓ Testing generate_feedback...")
        # feedback = agent.generate_feedback()
        # print("\nGenerated Feedback:")
        # print("=" * 60)
        # print(feedback)
        
    except Exception as e:
        print(f"✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
    
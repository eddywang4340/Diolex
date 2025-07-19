import os
import google.generativeai as genai
from typing import List, Optional
from prompt import feedback_system_prompt


class FeedbackAgent:
    def __init__(self, api_key: str = None):
     
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=self.api_key)
        

        # Create the feedback model with specialized system instruction
        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-pro",
            system_instruction=self._g
        )
    
    def generate_feedback(self, gemini_chat_history, final_code: str) -> str:
        """
        Generate comprehensive feedback based on Gemini chat history and final code.
        
        Args:
            gemini_chat_history: Gemini's native chat history format (list of Content objects)
            final_code (str): The candidate's final code implementation
            
        Returns:
            str: Comprehensive feedback analysis
        """
        # Format chat history from Gemini's native format
        formatted_history = self._format_gemini_chat_history(gemini_chat_history)
        
        # Use the feedback prompt with .format()
        full_prompt = feedback_system_prompt.format(
            chat_history=formatted_history,
            final_code=final_code
        )
        
        try:
            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            return f"An error occurred while generating feedback: {e}"
    
    def _format_gemini_chat_history(self, gemini_history) -> str:
        if not gemini_history:
            return "No conversation history available."
            
        formatted_messages = []
        
        for content in gemini_history:
            # Gemini chat history contains Content objects with 'role' and 'parts'
            role = content.role.upper() if hasattr(content, 'role') else 'UNKNOWN'
            
            # Extract text from parts (Gemini stores message content in parts)
            if hasattr(content, 'parts') and content.parts:
                # Join all parts into a single message
                message_text = ""
                for part in content.parts:
                    if hasattr(part, 'text'):
                        message_text += part.text
                
                if message_text.strip():
                    formatted_messages.append(f"{role}: {message_text.strip()}")
        
        return "\n\n".join(formatted_messages)

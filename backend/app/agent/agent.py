import os
import subprocess
from abc import ABC, abstractmethod
from dotenv import load_dotenv
import google.generativeai as genai
# Assuming 'prompt.py' exists with: interview_prep_prompt = "Some prompt with {user_code_context}"
# For this example, I'll define it here.
interview_prep_prompt = """
You are "Ace", an expert AI programming interview coach. Your goal is to help a user prepare for their technical interviews.
You are friendly, encouraging, and highly knowledgeable about data structures, algorithms, system design, and behavioral questions.

If the user provides code, you MUST use it as the primary context for the conversation. Analyze it for improvements, ask questions about their design choices, and suggest alternative approaches.

User's current code for context:
---
{user_code_context}
---
"""


load_dotenv()

class InterviewPrepAgent:
    """
    A stateful interview prep agent using Gemini that can incorporate user's current code.
    """
    
    def __init__(self, api_key: str = None, user_code: str = None):
        """
        Initialize the interview prep agent.
        
        Args:
            api_key (str): Gemini API key. If None, will load from environment.
            user_code (str): User's current code to provide as context.
        """
        # Configure the API key
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found. Please set it in your .env file or pass it as an argument.")
        genai.configure(api_key=self.api_key)
        
        # Store user code context
        self.user_code = user_code or "No code provided yet."
        
        # Create dynamic system instruction with user code context
        self.system_instruction = self._build_system_instruction()
        
        # Initialize the generative model
        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash", # Using a more recent model
            system_instruction=self.system_instruction
        )
        
        # Start a chat session
        self.chat_session = self.model.start_chat()
        
    def _build_system_instruction(self) -> str:
        """
        Build the system instruction with user code context if available.
        """
        return interview_prep_prompt.format(user_code_context=self.user_code)
    
    def update_user_code(self, new_code: str):
        """
        Update the user's code context. This will create a new chat session with updated context
        while preserving the existing chat history.
        
        Args:
            new_code (str): The updated code to use as context.
        """
        print("🤖 Ace: Re-calibrating with your new code...")

        # 1. Extract the history from the old session.
        # The history object contains `glm.Content` objects, which is the ideal format.
        old_history = []
        if self.chat_session and hasattr(self.chat_session, 'history'):
             old_history = self.chat_session.history

        # 2. Update the internal state and create the new system instruction.
        self.user_code = new_code
        self.system_instruction = self._build_system_instruction()
        
        # 3. Create a new model instance with the updated system instruction.
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=self.system_instruction
        )
        
        # 4. Start a NEW chat session, crucially passing the OLD history to it.
        # This re-establishes the conversation with the new underlying system prompt.
        self.chat_session = self.model.start_chat(history=old_history)
        
        print("🤖 Ace: Context updated! I'm now referencing your new code. Let's continue.")
        
    def send_message(self, message: str) -> str:
        """
        Send a message to the agent and get a response.
        
        Args:
            message (str): The user's message.
            
        Returns:
            str: The agent's response.
        """
        try:
            # The model will automatically handle sending the history.
            response = self.chat_session.send_message(message)
            return response.text
        except Exception as e:
            return f"An error occurred: {e}"
    
    def get_chat_history(self) -> list:
        """
        Get the current chat history in a simple format.
        
        Returns:
            list: List of chat messages as dictionaries.
        """
        if hasattr(self.chat_session, 'history'):
            return [
                {"role": msg.role, "content": msg.parts[0].text.strip()}
                for msg in self.chat_session.history
            ]
        return []
    
    def start_interactive_session(self):
        """
        Start an interactive command-line session with the agent.
        """
        while True:
            # Get user input from the command line
            user_query = input("You: ").strip()

            # Check for an exit command
            if user_query.lower() in ["exit", "quit", "goodbye"]:
                print("🤖 Ace: Great work today! Best of luck with your interview. Goodbye!")
                break
            
            # Special command to update code context
            if user_query.lower() == "/update-code": # Made command simpler
                print("🤖 Ace: Please paste your updated code (press Enter, then Ctrl+D on Linux/macOS or Ctrl+Z+Enter on Windows when done):")
                import sys
                code_lines = sys.stdin.readlines()
                
                new_code = "".join(code_lines)
                if not new_code.strip():
                    print("🤖 Ace: No code was entered. Sticking with the old context.")
                    continue

                self.update_user_code(new_code)
                continue

            # Send the user's query to the model and get the response
            response = self.send_message(user_query)
            print(f"🤖 Ace: {response}")


# --- Main Execution ---
if __name__ == "__main__":
    # Example usage with sample code
    sample_code = """
def is_palindrome(s: str) -> bool:
    # A simple implementation using string slicing.
    return s == s[::-1]
"""
    
    # Create agent with sample code context
    agent = InterviewPrepAgent(user_code=sample_code)
    
    # Start interactive session
    agent.start_interactive_session()
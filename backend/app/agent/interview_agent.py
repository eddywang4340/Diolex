import os
import subprocess
from abc import ABC, abstractmethod
from dotenv import load_dotenv
import google.genai as genai
from google.genai import types
from google.genai.types import GenerateContentConfig
from .prompt import interview_system_prompt

load_dotenv()

class InterviewAgent:
    def __init__(self):
        
        # Store user code context
        self.user_code = "No code provided yet."
        self.problem_description = "No problem provided"
        self.history = []
        self.client = genai.Client()
        
        # Create dynamic system instruction with user code context
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        # Wait for update problem before starting chat session
        self.chat_session = None
    
    def update_problem(self, problem_data: dict):
        """
        Update the problem data and regenerate the system instruction.
        
        Args:
            problem_data (dict): New problem data from the API
        """
        self.problem_description = problem_data.get('description', 'No problem provided')
        
        # Regenerate system instruction with new problem
        self.system_instruction = interview_system_prompt.format(
            problem=self.problem_description
        )
        
        print("Session created")
        self.chat_session = self.client.chats.create(
            model='gemini-2.5-flash',  # Using a standard, available model
            config=types.GenerateContentConfig(
                system_instruction=self.system_instruction
            )
        )
        
    def send_message_agent(self, message: str, user_code) -> str:
        """
        Send a message to the Gemini model and return the response.
        Also manually tracks the conversation in self.history.
        """
        try:
            # Ensure chat session exists
            if self.chat_session is None:
                # Initialize with default problem if not already done
                self.update_problem({"description": "No problem provided yet"})
                
            # Build context with chat history (don't add current message to history yet)
            context_parts = []
            
            # Add conversation history if it exists
            if self.history:  # Check if there's any existing history
                # Get last 5 messages for context (adjust number as needed)
                recent_history = self.get_last_n_messages(5)
                
                if recent_history:
                    # Temporarily set history to just the recent messages for formatting
                    original_history = self.history.copy()
                    self.history = recent_history
                    
                    # Use existing formatting function
                    chat_history = self.get_formatted_history()
                    
                    # Restore full history
                    self.history = original_history
                    
                    if chat_history:
                        context_parts.append(f"Previous Conversation:\n{chat_history}")
            
            # Add current user code context
            if user_code and user_code.strip() != "No code provided yet.":
                context_parts.append(f"Current User Code:\n{user_code}")
            
            # Build the full message
            if context_parts:
                full_message = f"{message}\n\n" + "\n\n".join(context_parts)
            else:
                full_message = message
            
            response = self.chat_session.send_message(full_message)
            
            self.user_code = user_code  # Update user code context
            
            # Add user message to manual history (after sending to avoid including it in context)
            self.history.append({
                "role": "user",
                "content": message,
                "user_code": user_code,
            })
            
            # Add AI response to manual history
            self.history.append({
                "role": "assistant",
                "content": response.text,
            })
            
            return response.text
        
        except Exception as e:
            error_message = f"An error occurred: {e}"
            # Also add error to history for tracking
            self.history.append({
                "role": "system",
                "content": error_message,
                "timestamp": self._get_timestamp()
            })
            return error_message
    
    def _get_timestamp(self):
        """Helper method to get current timestamp for history entries."""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def clear_history(self):
        self.history.clear()
    
    def get_last_n_messages(self, n: int) -> list:
        """Get the last n messages from manual history."""
        return self.history[-n:] if n <= len(self.history) else self.history.copy()
    
    def get_chat_history(self) -> list:
        return self.history.copy()  # Return a copy to prevent external modification
    
    def start_interactive_session(self):
        while True:
            # Get user input from the command line
            user_query = input("You: ").strip()
            
            # Initalize the agent for the testing purpose
            self.update_problem(problem_data={"description": "Given an integer array nums and an integer target, return the indices of the two distinct numbers whose sum equals target (exactly one such pair exists) in any order."})

            # Check for an exit command
            if user_query.lower() in ["exit", "quit", "goodbye"]:
                print("🤖 Ace: Session ended. Good luck with your interview preparation!")
                break
            
            # Command to print formatted chat history
            if user_query.lower() == "/history":
                self.print_formatted_history()
                continue
                
            # Command to clear manual history
            if user_query.lower() == "/clear-history":
                self.clear_history()
                continue
            
            # Send the user's query to the model and get the response
            response = self.send_message_agent(user_query, "hi")
            print(f"🤖 Ace: {response}")
    
    def get_formatted_history(self):
        """
        Build and return the formatted chat shistory string using manual history.
        Returns an empty string if no messages.
        """
        if not self.history:
            return ""

        out = []
        for msg in self.history:
            role = msg["role"].upper()
            content = msg["content"].strip()
            if content:
            # Include user code context for user messages
                if role == "USER" and "user_code" in msg:
                    user_code = msg["user_code"].strip()
                    if user_code and user_code != "No code provided yet.":
                        out.append(f"{role}: {content}\n\nUser Code Context:\n{user_code}")
                    else:
                        out.append(f"{role}: {content}")
                else:
                    out.append(f"{role}: {content}")
                    
        return "\n\n".join(out)
    
    def print_formatted_history(self, mode="formatted", truncate=200):
        print("="*60)
        formatted = self.get_formatted_history()
        if formatted:
            print(formatted)
        else:
            print("(No usable messages.)")
        print("\n" + "="*60)


# --- Main Execution ---
if __name__ == "__main__":
    # Example usage with sample code
    
    # Create agent with sample code context
    agent = InterviewAgent()
    
    # Start interactive session
    agent.start_interactive_session()
    agent.print_formatted_history()
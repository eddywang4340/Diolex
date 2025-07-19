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
    """
    A stateful interview prep agent using Gemini that can incorporate user's current code.
    """
    
    def __init__(self, question: str = None):
        """
        Initialize the interview prep agent.
        
        Args:
            api_key (str): Gemini API key. If None, will load from environment.
            user_code (str): User's current code to provide as context.
        """
        
        # Store user code context
        self.user_code = "No code provided yet."
        
        self.client = genai.Client()
        
        # Create dynamic system instruction with user code context
        self.system_instruction = interview_system_prompt.format(user_code_context=self.user_code)
        
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        # Initialize the generative model
        self.chat_session = self.client.chats.create(
            model='gemini-2.5-flash',  # Using a standard, available model
        )
        
        
    def send_message(self, message: str) -> str:
        """
        Send a message to the Gemini model and return the response.
        """
        try:
            # The model will automatically handle sending the history.
            full_message = f"{message}\n\nUser Code Context:\n{self.user_code}"
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=self.system_instruction + "\n\n" + full_message)
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
        while True:
            # Get user input from the command line
            user_query = input("You: ").strip()

            # Check for an exit command
            if user_query.lower() in ["exit", "quit", "goodbye"]:
                print("🤖 Ace: Session ended. Good luck with your interview preparation!")
                break
            
            # Command to print formatted chat history
            if user_query.lower() == "/history":
                self.print_formatted_history()
                continue
                
            # Command to print raw Gemini history
            if user_query.lower() == "/debug-history":
                self.print_gemini_history()
                continue
            
            # Send the user's query to the model and get the response
            response = self.send_message(message=self.system_instruction + "\n\n" + user_query,
                                         user_code=self.user_code)
            print(f"🤖 Ace: {response}")
    
    def get_formatted_history(self):
        """
        Build and return the formatted chat history string (FeedbackAgent style).
        Returns an empty string if no usable messages.
        """
        if not hasattr(self.chat_session, "history") or not self.chat_session.history:
            return ""

        out = []
        for content in self.chat_session.history:
            role = getattr(content, "role", "UNKNOWN").upper()
            parts = getattr(content, "parts", [])
            if not parts:
                continue
            buf = []
            for part in parts:
                txt = getattr(part, "text", None)
                if txt:
                    buf.append(txt)
            joined = "".join(buf).strip()
            if joined:
                out.append(f"{role}: {joined}")
        return "\n\n".join(out)
    
    def print_formatted_history(self, mode="formatted", truncate=200):
        """
        Print chat history.
        
        mode:
        - "formatted": prints the FeedbackAgent-formatted history.
        - "raw": prints message-by-message with parts (like old print_gemini_history).
        truncate: number of characters to show per part in raw mode (None for no truncation).
        """
        if not hasattr(self.chat_session, "history") or not self.chat_session.history:
            print("📝 No chat history available.")
            return
        
        print("\n" + "="*60)
        if mode == "raw":
            print("📝 GEMINI CHAT HISTORY (raw)")
            print("="*60)
            for i, content in enumerate(self.chat_session.history, 1):
                print(f"\n--- Message {i} ---")
                print(f"Role: {getattr(content, 'role', 'UNKNOWN')}")
                parts = getattr(content, "parts", [])
                if not parts:
                    print("No parts found in this message")
                    continue
                for j, part in enumerate(parts, 1):
                    txt = getattr(part, "text", None)
                    if txt is not None:
                        display = txt
                        if truncate is not None and len(display) > truncate:
                            display = display[:truncate] + "..."
                        print(f"Part {j}: {display}")
                    else:
                        print(f"Part {j}: {type(part)} (non-text part)")
        else:
            print("📝 FORMATTED CHAT HISTORY (as sent to FeedbackAgent)")
            print("="*60)
            formatted = self.get_formatted_history()
            if formatted:
                print(formatted)
            else:
                print("(No usable text messages.)")
        print("\n" + "="*60)

        

# --- Main Execution ---
if __name__ == "__main__":
    # Example usage with sample code
    
    # Create agent with sample code context
    agent = InterviewAgent()
    
    # Start interactive session
    agent.start_interactive_session()
    agent.print_formatted_history()
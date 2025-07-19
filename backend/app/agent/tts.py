# Simple Reliable TTS - No hanging issues
# Install with: pip install pyttsx3

import pyttsx3
import threading
import time
from typing import Optional, Callable, List

class SimpleTTS:
    def __init__(self, voice_index: int = 1, rate: float = 1.3, volume: float = 0.9):
        """
        Simple TTS that creates a new engine for each speech to avoid hanging
        
        Args:
            voice_index: Which voice to use (0, 1, 2, etc.)
            rate: Speech rate (1.0 = normal, 1.5 = faster)
            volume: Volume (0.0 to 1.0)
        """
        self.voice_index = voice_index
        self.rate = rate
        self.volume = volume
        self.available_voices = []
        
        # Get available voices once
        self._get_available_voices()
        
        print(f"🔊 TTS Ready - Voice: {self.voice_index}, Rate: {rate}x, Volume: {int(volume*100)}%")
    
    def _get_available_voices(self):
        """Get list of available voices"""
        try:
            temp_engine = pyttsx3.init()
            self.available_voices = temp_engine.getProperty('voices')
            print("🔊 Available voices:")
            for i, voice in enumerate(self.available_voices):
                print(f"  {i}: {voice.name}")
            temp_engine.stop()
            del temp_engine
        except Exception as e:
            print(f"Error getting voices: {e}")
    
    def _create_configured_engine(self):
        """Create a fresh, configured engine for speech"""
        engine = pyttsx3.init()
        
        # Set voice
        if self.available_voices and 0 <= self.voice_index < len(self.available_voices):
            engine.setProperty('voice', self.available_voices[self.voice_index].id)
        
        # Set rate (convert multiplier to WPM)
        wpm = int(200 * self.rate)
        engine.setProperty('rate', wpm)
        
        # Set volume
        engine.setProperty('volume', self.volume)
        
        return engine
    
    def speak(self, text: str):
        """
        Speak text immediately (blocking)
        """
        if not text.strip():
            return
        
        print(f"🗣️ Speaking: {text[:50]}{'...' if len(text) > 50 else ''}")
        
        try:
            # Create fresh engine for this speech
            engine = self._create_configured_engine()
            engine.say(text)
            engine.runAndWait()
            engine.stop()
            del engine  # Clean up
            print("✅ Completed")
            
        except Exception as e:
            print(f"❌ Speech error: {e}")
    
    def speak_async(self, text: str):
        """
        Speak text in background (non-blocking)
        """
        thread = threading.Thread(target=self.speak, args=(text,), daemon=True)
        thread.start()
        return thread

class QueuedTTS:
    def __init__(self, voice_index: int = 1, rate: float = 1.3, volume: float = 0.9):
        """
        TTS with queue that actually works
        """
        self.simple_tts = SimpleTTS(voice_index, rate, volume)
        self.speech_queue = []
        self.is_processing = False
        self.lock = threading.Lock()
    
    def speak(self, text: str):
        """Add text to queue and process"""
        if not text.strip():
            return
        
        with self.lock:
            self.speech_queue.append(text)
            print(f"📝 Queued: {text[:30]}... (Queue size: {len(self.speech_queue)})")
        
        # Start processing if not already running
        if not self.is_processing:
            self._start_processing()
    
    def _start_processing(self):
        """Start processing the queue"""
        thread = threading.Thread(target=self._process_queue, daemon=True)
        thread.start()
    
    def _process_queue(self):
        """Process all items in queue"""
        self.is_processing = True
        
        while True:
            with self.lock:
                if not self.speech_queue:
                    self.is_processing = False
                    break
                text = self.speech_queue.pop(0)
                remaining = len(self.speech_queue)
            
            # Speak this item
            self.simple_tts.speak(text)
            
            if remaining > 0:
                print(f"📋 {remaining} remaining in queue...")
        
        print("🏁 Queue finished!")
    
    def clear_queue(self):
        """Clear all pending speech"""
        with self.lock:
            cleared = len(self.speech_queue)
            self.speech_queue.clear()
            if cleared > 0:
                print(f"🗑️ Cleared {cleared} items from queue")
    
    def get_queue_size(self):
        """Get current queue size"""
        with self.lock:
            return len(self.speech_queue)

# Integration functions
def create_simple_tts(voice_index: int = 1, rate: float = 1.3):
    """Create simple TTS (no queue, immediate speech)"""
    return SimpleTTS(voice_index, rate)

def create_queued_tts(voice_index: int = 1, rate: float = 1.3):
    """Create queued TTS (handles multiple rapid requests)"""
    return QueuedTTS(voice_index, rate)

def create_vellum_handler(use_queue: bool = True, voice_index: int = 1, rate: float = 1.3):
    """
    Create TTS handler for Vellum integration
    
    Args:
        use_queue: True for queue system, False for immediate speech
        voice_index: Voice to use (0=male, 1=female usually)
        rate: Speech speed (1.0=normal, 1.5=faster)
    """
    if use_queue:
        tts = create_queued_tts(voice_index, rate)
    else:
        tts = create_simple_tts(voice_index, rate)
    
    def handle_agent_response(text: str):
        """Call this when Vellum agent responds"""
        print(f"🤖 Agent: {text}")
        tts.speak(text)
    
    return tts, handle_agent_response

# Test both approaches
if __name__ == "__main__":
    print("🧪 Testing Simple Reliable TTS...")
    
    # Test data
    test_responses = [
        "Hello! I'm your AI interviewer.",
        "Let's start with arrays and hashing.",
        "Can you explain binary search?",
        "Great! Now implement it in code."
    ]
    
    print("\n" + "="*50)
    print("TEST 1: Immediate TTS (no queue)")
    print("="*50)
    
    simple_tts = create_simple_tts(voice_index=1, rate=1.4)
    
    for i, text in enumerate(test_responses):
        print(f"\n{i+1}. {text}")
        simple_tts.speak(text)  # This will block until done
    
    print("\n" + "="*50)
    print("TEST 2: Queued TTS (like Vellum rapid responses)")
    print("="*50)
    
    queued_tts = create_queued_tts(voice_index=1, rate=1.4)
    
    print("\nSending all responses rapidly...")
    for i, text in enumerate(test_responses):
        print(f"Sending {i+1}: {text[:30]}...")
        queued_tts.speak(text)  # Queue them all quickly
    
    print(f"\nWaiting for queue to finish... (Size: {queued_tts.get_queue_size()})")
    
    # Wait for completion
    while queued_tts.get_queue_size() > 0 or queued_tts.is_processing:
        time.sleep(0.5)
    
    print("\n✅ All tests completed!")
    print("\n🔗 For Vellum integration:")
    print("tts, speak_func = create_vellum_handler(use_queue=True)")
    print("speak_func('Your agent response here')")
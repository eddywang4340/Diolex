# backend/app/services/tts_service.py

import logging
import threading
import time
import re
from kokoro import KPipeline
import sounddevice as sd

logger = logging.getLogger(__name__)

# Global pipeline instance
_pipeline = None
_current_playback_thread = None
_stop_event = threading.Event()
_is_playing = False

def initialize_tts(lang_code: str = 'a'):
    """Initialize the TTS pipeline once"""
    global _pipeline
    try:
        _pipeline = KPipeline(lang_code=lang_code)
        logger.info("TTS pipeline initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize TTS pipeline: {e}")
        _pipeline = None

def preprocess_technical_text(text: str) -> str:
    """
    Convert technical programming text to spoken form
    
    Args:
        text (str): Raw text with programming notation
        
    Returns:
        str: Text converted to spoken form
    """
    # Store original text for logging
    original_text = text
    
    # Step 1: Handle complex patterns first (most specific to least specific)
    
    # Handle ASCII code patterns specifically
    text = re.sub(r'(\d+)\s*<=\s*([A-Z])\[(\w+)\]\.ASCIIcode\s*<=\s*(\d+)', 
                  r'\2 bracket \3 bracket dot ASCII code is between \1 and \4', text)
    
    # Handle other complex bracket patterns with ranges
    text = re.sub(r'(\d+)\s*<=\s*(\w+)\[(\w+)\]\.(\w+)\s*<=\s*(\d+)', 
                  r'\2 bracket \3 bracket dot \4 is between \1 and \5', text)
    
    # Handle general range patterns with dot notation
    text = re.sub(r'(\d+)\s*<=\s*(\w+)\.length\s*<=\s*(\d+)', 
                  r'\2 dot length is between \1 and \3', text)
    
    # Handle general range patterns (broader match)
    text = re.sub(r'(\d+)\s*<=\s*(\w+)\s*<=\s*(\d+)', 
                  r'\2 is between \1 and \3', text)
    
    # Step 2: Handle remaining dot notation
    text = re.sub(r'(\w+)\.length', r'\1 dot length', text)
    text = re.sub(r'(\w+)\.(\w+)', r'\1 dot \2', text)
    
    # Step 3: Handle array/bracket notation (after complex patterns)
    text = re.sub(r'(\w+)\[(\w+)\]', r'\1 bracket \2 bracket', text)
    text = re.sub(r'(\w+)\[(\d+)\]', r'\1 bracket \2 bracket', text)
    
    # Step 4: Handle single comparison operators
    text = re.sub(r'(\w+(?:\s+\w+)*)\s*<=\s*(\d+)', r'\1 is less than or equal to \2', text)
    text = re.sub(r'(\w+(?:\s+\w+)*)\s*>=\s*(\d+)', r'\1 is greater than or equal to \2', text)
    text = re.sub(r'(\w+(?:\s+\w+)*)\s*<\s*(\d+)', r'\1 is less than \2', text)
    text = re.sub(r'(\w+(?:\s+\w+)*)\s*>\s*(\d+)', r'\1 is greater than \2', text)
    
    # Step 5: Handle remaining operators and special characters
    replacements = {
        # Remaining comparison operators
        r'<=': ' less than or equal to ',
        r'>=': ' greater than or equal to ',
        r'==': ' equals ',
        r'!=': ' not equal to ',
        r'<': ' less than ',
        r'>': ' greater than ',
        
        # Math operators
        r'\+': ' plus ',
        r'-': ' minus ',
        r'\*': ' times ',
        r'/': ' divided by ',
        r'%': ' modulo ',
        
        # Common constraint language
        r'\b(\w+)\s*contains\s*only\b': r'\1 contains only',
        r'\blower-case\b': 'lowercase',
        r'\bupper-case\b': 'uppercase',
        r"doesn't contain": "does not contain",
        r"doesn't": "does not",
        
        # Handle quote characters and backslashes
        r'\\\\': ' backslash ',
        r'\\"': ' double quote ',
        r"\\'": ' single quote ',
        r'"': ' quote ',
        r"'": ' quote ',
        
        # Common programming patterns
        r'\bO\(([^)]+)\)': r'O of \1',  # Big O notation
        
        # Special characters
        r'_': ' underscore ',
        r'#': ' hash ',
        r'@': ' at ',
        r'&': ' and ',
        r'\|': ' or ',
        r'\^': ' to the power of ',
        r'~': ' tilde ',
    }
    
    # Apply replacements
    for pattern, replacement in replacements.items():
        text = re.sub(pattern, replacement, text)
    
    # Clean up extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Log the transformation if significant changes were made
    if text != original_text:
        logger.debug(f"Text preprocessing: '{original_text[:100]}...' -> '{text[:100]}...'")
    
    return text

def preprocess_constraints_text(text: str) -> str:
    """
    Special preprocessing for constraint descriptions to make them more natural
    
    Args:
        text (str): Constraint text
        
    Returns:
        str: More naturally spoken constraint text
    """
    
    # Handle numbered constraints
    text = re.sub(r'^(\d+)\.\s*`([^`]+)`', r'\1. \2', text, flags=re.MULTILINE)
    
    # Convert backticks to spoken form
    text = re.sub(r'`([^`]+)`', r'\1', text)
    
    # Make constraint language more natural
    conversions = {
        r'(\w+) contains only lower-case English letters': r'\1 contains only lowercase English letters',
        r'(\w+) contains only lower-case English letters and spaces': r'\1 contains only lowercase English letters and spaces',
        r'(\w+) does not contain any leading or trailing spaces': r'\1 does not contain any leading or trailing spaces',
        r'All the words in (\w+) are separated by a single space': r'All the words in \1 are separated by a single space',
        r'(\d+) <= (\w+)\.length <= (\d+)': r'\2 dot length is between \1 and \3',
        r'(\d+) <= (\w+) <= (\d+)': r'\2 is between \1 and \3',
    }
    
    for pattern, replacement in conversions.items():
        text = re.sub(pattern, replacement, text)
    
    return text

def _play_audio_thread(text: str, voice: str):
    """Internal function to play audio in a separate thread"""
    global _pipeline, _stop_event, _is_playing
    
    try:
        _is_playing = True
        if _pipeline is None:
            logger.error("TTS pipeline is not initialized")
            return
            
        # Preprocess the text before generating audio
        processed_text = preprocess_technical_text(text)
        processed_text = preprocess_constraints_text(processed_text)
        
        generator = _pipeline(processed_text, voice=voice)
        
        for i, (gs, ps, audio) in enumerate(generator):
            # Check if we should stop before playing this chunk
            if _stop_event.is_set():
                logger.info(f"Playback stopped at chunk {i}")
                break
            
            logger.debug(f"Playing audio chunk {i}: gs={gs}, ps={ps}")
            sd.play(audio, 24000)
            
            # Wait for this chunk to finish, but check for stop event periodically
            while sd.get_stream().active:
                if _stop_event.is_set():
                    sd.stop()  # Stop the current chunk immediately
                    logger.info(f"Audio interrupted during chunk {i}")
                    break
                time.sleep(0.01)  # Check every 10ms
        
        logger.debug("Audio playback completed")
        
    except Exception as e:
        logger.error(f"Error generating/playing audio: {e}")
    finally:
        _is_playing = False

def speak(text: str, voice: str = 'af_heart') -> bool:
    """
    Convert text to speech and play it (interruptible)
    
    Args:
        text (str): Text to speak
        voice (str): Voice to use
        
    Returns:
        bool: True if started successfully, False otherwise
    """
    global _current_playback_thread, _stop_event
    
    if not _pipeline:
        logger.error("TTS pipeline not initialized")
        return False
    
    # Stop any currently playing audio
    stop_audio()
    
    # Reset the stop event for new playback
    _stop_event.clear()
    
    try:
        # Start playback in a separate thread
        _current_playback_thread = threading.Thread(
            target=_play_audio_thread,
            args=(text, voice),
            daemon=True
        )
        _current_playback_thread.start()
        
        logger.info(f"Started TTS playback: {text[:50]}...")
        return True
        
    except Exception as e:
        logger.error(f"Error starting audio playback: {e}")
        return False

def stop_audio():
    """Stop any currently playing audio immediately"""
    global _current_playback_thread, _stop_event, _is_playing
    
    logger.info("Stopping audio playback...")
    
    # Signal the playback thread to stop
    _stop_event.set()
    
    # Stop any active sounddevice playback
    try:
        sd.stop()
    except Exception as e:
        logger.warning(f"Error stopping sounddevice: {e}")
    
    # Wait for the playback thread to finish (with timeout)
    if _current_playback_thread and _current_playback_thread.is_alive():
        _current_playback_thread.join(timeout=1.0)
        if _current_playback_thread.is_alive():
            logger.warning("Playback thread did not stop within timeout")
    
    _is_playing = False
    logger.info("Audio playback stopped")

def is_playing() -> bool:
    """Check if audio is currently playing"""
    return _is_playing
# backend/app/services/tts_service.py

import logging
from kokoro import KPipeline
import sounddevice as sd

logger = logging.getLogger(__name__)

# Global pipeline instance
_pipeline = None

def initialize_tts(lang_code: str = 'a'):
    """Initialize the TTS pipeline once"""
    global _pipeline
    try:
        _pipeline = KPipeline(lang_code=lang_code)
        logger.info("TTS pipeline initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize TTS pipeline: {e}")
        _pipeline = None

def speak(text: str, voice: str = 'af_heart') -> bool:
    """
    Convert text to speech and play it
    
    Args:
        text (str): Text to speak
        voice (str): Voice to use
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not _pipeline:
        logger.error("TTS pipeline not initialized")
        return False
    
    try:
        generator = _pipeline(text, voice=voice)
        
        for i, (gs, ps, audio) in enumerate(generator):
            logger.debug(f"Playing audio chunk {i}: gs={gs}, ps={ps}")
            sd.play(audio, 24000)
            sd.wait()
        
        return True
        
    except Exception as e:
        logger.error(f"Error generating/playing audio: {e}")
        return False

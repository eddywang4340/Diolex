# backend/app/services/tts_service.py

import logging
import threading
import time
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

def _play_audio_thread(text: str, voice: str):
    """Internal function to play audio in a separate thread"""
    global _pipeline, _stop_event, _is_playing
    
    try:
        _is_playing = True
        generator = _pipeline(text, voice=voice)
        
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
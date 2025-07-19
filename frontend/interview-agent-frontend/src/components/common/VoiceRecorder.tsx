// components/common/VoiceRecorder.tsx
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

const VoiceRecorder = ({
  onTranscript,
  disabled = false,
  className = '',
}: VoiceRecorderProps) => {
  const {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const [isPressed, setIsPressed] = useState(false);

  // Handle transcript changes
  useEffect(() => {
    if (transcript && !isListening) {
      onTranscript(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, onTranscript, resetTranscript]);

  // Handle keyboard shortcuts (Ctrl/Cmd + D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && !disabled) {
        e.preventDefault();
        if (!isPressed && !isListening) {
          setIsPressed(true);
          startListening();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') || 
          e.key === 'Control' || e.key === 'Meta') {
        if (isPressed) {
          setIsPressed(false);
          stopListening();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [disabled, isPressed, isListening, startListening, stopListening]);

  // Handle mouse events for click-and-hold
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled && !isPressed) {
      setIsPressed(true);
      startListening();
    }
  };

  const handleMouseUp = () => {
    if (isPressed) {
      setIsPressed(false);
      stopListening();
    }
  };

  const handleMouseLeave = () => {
    if (isPressed) {
      setIsPressed(false);
      stopListening();
    }
  };

  if (!isSupported) {
    return (
      <div className={`text-center p-4 ${className}`}>
        <div className="text-red-400 text-sm">
          Speech recognition not supported in this browser
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Voice Button */}
      <Button
        variant="outline"
        size="lg"
        disabled={disabled}
        className={`
          relative h-16 w-16 rounded-full border-2 transition-all duration-200
          ${isListening 
            ? 'bg-red-500 border-red-400 text-white animate-pulse' 
            : 'bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {isListening ? (
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          </div>
        ) : (
          <svg 
            className="w-8 h-8" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
            />
          </svg>
        )}
        
        {/* Recording animation rings */}
        {isListening && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping animation-delay-75" />
          </>
        )}
      </Button>

      {/* Status Text */}
      <div className="text-center">
        {isListening ? (
          <div className="text-sm text-red-400 font-medium">
            Listening...
          </div>
        ) : (
          <div className="text-xs text-slate-400">
            Hold to speak or press Ctrl/⌘ + D
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-xs text-red-400 text-center max-w-xs">
          {error}
        </div>
      )}

      {/* Transcript Preview (for debugging) */}
      {transcript && (
        <div className="text-xs text-slate-400 text-center max-w-xs italic">
          "{transcript}"
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
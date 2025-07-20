import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  timestamp: Date;
  type?: 'question' | 'hint' | 'clarification' | 'feedback' | 'response';
  source?: 'speech' | 'text';
}

type UseContinuousSpeechProps = {
  currentCode?: string;
}

interface UseContinuousSpeechReturn {
  isSupported: boolean;
  isListening: boolean;
  isConnected: boolean;
  currentTranscript: string;
  messages: Message[];
  error: string | null;
  sendTextMessage: (message: string) => void;
  clearMessages: () => void;
  startInterview: () => void;
  endInterview: () => void;
}

// Extend the Window interface to include webkit speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useContinuousSpeech = (props?: UseContinuousSpeechProps): UseContinuousSpeechReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [interviewStarted, setInterviewStarted] = useState(false);

  // Store the latest code in a ref to access in callbacks
  const currentCodeRef = useRef<string>(props?.currentCode || '');
  
  // Update ref when props change
  useEffect(() => {
    if (props?.currentCode !== undefined) {
      currentCodeRef.current = props.currentCode;
      console.log('Code context updated:', currentCodeRef.current.length > 0 ? 
        `${currentCodeRef.current.slice(0, 100)}... (${currentCodeRef.current.length} chars)` : 
        '(empty)');
    }
  }, [props?.currentCode]);

  const websocketRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clientId = useRef<string>(crypto.randomUUID());

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // WebSocket connection management
  const connect = useCallback(() => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `ws://localhost:8000/ws/${clientId.current}`;
      websocketRef.current = new WebSocket(wsUrl);

      websocketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        
        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      websocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (e) {
          console.error('Error parsing WebSocket message:', e);
        }
      };

      websocketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Only attempt to reconnect if interview is still active
        if (interviewStarted) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };

      websocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error. Retrying...');
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setError('Failed to connect to server');
    }
  }, [interviewStarted]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'user_message':
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          sender: 'user',
          message: data.message,
          timestamp: new Date(data.timestamp),
          type: 'question',
          source: data.source
        }]);
        break;

      case 'ai_message':
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          sender: 'ai',
          message: data.message,
          timestamp: new Date(data.timestamp),
          type: data.messageType || 'response'
        }]);
        break;

      case 'interim_speech':
        setCurrentTranscript(data.message);
        break;

      case 'pong':
        // Handle ping/pong for connection health
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, []);

  // Send message via WebSocket
  const sendMessage = useCallback((type: string, data: any) => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      // Always access the latest code from the ref
      const currentCode = currentCodeRef.current;
      const payload = { ...data, codeContext: currentCode };
      
      console.log(`Sending ${type} with code context length:`, 
        currentCode ? `${currentCode.length} chars` : '0 chars');
      
      websocketRef.current.send(JSON.stringify({ type, ...payload }));
    } else {
      console.error('WebSocket not connected. Message not sent.');
      setError('Not connected to server');
    }
  }, []);

  const sendTextMessage = useCallback((message: string) => {
    if (message.trim()) {
      console.log('Sending text message with code context length:', 
        currentCodeRef.current ? currentCodeRef.current.length : 0);
      
      sendMessage('chat', { message: message.trim() });
    }
  }, [sendMessage]);

  // Speech recognition setup
  useEffect(() => {
    if (!isSupported || !interviewStarted) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update current transcript for display
      setCurrentTranscript(interimTranscript);

      // Send final transcript to server
      if (finalTranscript) {
          console.log('Sending final speech with code context length:', 
            currentCodeRef.current ? currentCodeRef.current.length : 0);
          
          sendMessage('speech', {
            data: finalTranscript,
            isFinal: true
          });
          setCurrentTranscript('');
        } else if (interimTranscript) {
          sendMessage('speech', {
            data: interimTranscript,
            isFinal: false
          });
        }
      };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      
      // Auto-restart on certain errors
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setTimeout(() => {
          if (interviewStarted && isConnected) {
            try {
              recognition.start();
            } catch (e) {
              console.log('Could not restart recognition:', e);
            }
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      
      // Auto-restart if interview is still active
      if (interviewStarted && isConnected) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.log('Could not restart recognition:', e);
          }
        }, 100);
      }
    };

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isSupported, sendMessage, interviewStarted, isConnected]);

  // Start interview - connects WebSocket and starts speech
  const startInterview = useCallback(() => {
    setInterviewStarted(true);
    setError(null);
    
    // Connect WebSocket
    connect();
    
    // Start speech recognition once connected
    setTimeout(() => {
      if (isSupported && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          setError('Failed to start speech recognition');
        }
      }
    }, 1000); // Give WebSocket time to connect
  }, [isSupported, connect]);

  // End interview - stops everything
  const endInterview = useCallback(() => {
    setInterviewStarted(false);
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    
    // Disconnect WebSocket
    disconnect();
  }, [disconnect]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      endInterview();
    };
  }, [endInterview]);

  return {
    isSupported,
    isListening,
    isConnected,
    currentTranscript,
    messages,
    error,
    sendTextMessage,
    clearMessages,
    startInterview,
    endInterview,
  };
};
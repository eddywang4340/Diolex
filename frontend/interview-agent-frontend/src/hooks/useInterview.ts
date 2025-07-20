import { useState, useCallback, useEffect } from 'react';
import type { InterviewState, InterviewSettings, Problem, ConversationMessage } from '../types/interview';
import { useContinuousSpeech } from './useContinuousSpeech';

const initialSettings: InterviewSettings = {
  difficulty: 'easy',
  problemType: 'all',
  company: 'general',
  timeLimit: 45,
};

const initialState: InterviewState = {
  isActive: false,
  currentProblem: null,
  settings: initialSettings,
  conversation: [],
  userCode: '',
  timeRemaining: 45 * 60,
  hasStarted: false,
};

// Accept initial code as an argument to initialize userCode
export const useInterview = (initialCode: string = '') => {
  const [state, setState] = useState<InterviewState>({
    ...initialState,
    userCode: initialCode
  });

  // Pass the userCode from our own state to the speech hook
  const { 
    isSupported: isSpeechSupported, 
    isListening, 
    isConnected, 
    currentTranscript, 
    messages: speechHookMessages, 
    error: speechError, 
    sendTextMessage, 
    clearMessages: clearSpeechMessages, 
    startInterview: startSpeech, 
    endInterview: endSpeech 
  } = useContinuousSpeech({ currentCode: state.userCode });

  // Sync messages from the speech hook to the main interview state
  useEffect(() => {
    if (speechHookMessages.length !== state.conversation.length) {
      console.log('Syncing messages:', { 
        speechHookMessages, 
        currentLength: state.conversation.length,
        newMessages: speechHookMessages.length
      });
      
      setState(prev => ({
        ...prev,
        conversation: speechHookMessages
          .filter(msg => 
            msg.type === 'question' ||
            msg.type === 'hint' ||
            msg.type === 'clarification' ||
            msg.type === 'feedback' ||
            msg.type === undefined
          )
          .map(msg => ({
            ...msg,
            type: msg.type === 'response' ? undefined : msg.type
          })) as ConversationMessage[],
      }));
    }
  }, [speechHookMessages, state.conversation.length]);

  const updateSettings = useCallback((newSettings: Partial<InterviewSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  }, []);

  const startInterview = useCallback((problem: Problem, settings?: InterviewSettings) => {
    clearSpeechMessages();
    // Use provided settings or fall back to current settings
    const updatedSettings = settings || state.settings;
    const newTime = updatedSettings.timeLimit * 60;
    setState({
      isActive: true,
      hasStarted: true,
      currentProblem: problem,
      settings: updatedSettings,
      // Use problem's starter code if available (handle type issue)
      userCode: (problem as any).starterCode || state.userCode || '',
      timeRemaining: newTime,
      conversation: [
        {
          id: crypto.randomUUID(),
          sender: 'ai',
          message: `Hello! Let's begin with "${problem.title}". Take a moment to read the description. You can ask me questions or explain your approach at any time.`,
          timestamp: new Date(),
          type: 'question'
        }
      ]
    });
    startSpeech();
  }, [startSpeech, clearSpeechMessages, state.settings, state.userCode]);

  const endInterview = useCallback(() => {
    endSpeech();
    setState(prev => ({ ...prev, isActive: false }));
  }, [endSpeech]);

  const updateCode = useCallback((code: string) => {
    console.log(`[useInterview] Updating code: ${code.length} chars`);
    setState(prev => ({ ...prev, userCode: code }));
  }, []);

  const resetInterview = useCallback(() => {
    setState(initialState);
    clearSpeechMessages();
  }, [clearSpeechMessages]);

  return {
    state,
    updateSettings,
    startInterview,
    endInterview,
    updateCode,
    resetInterview,
    isSpeechSupported,
    isListening,
    isConnected,
    currentTranscript,
    speechError,
    sendTextMessage,
  };
};
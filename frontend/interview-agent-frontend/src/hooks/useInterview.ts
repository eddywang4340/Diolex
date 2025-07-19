// hooks/useInterview.ts
import { useState, useCallback } from 'react';
import type { InterviewState, InterviewSettings, Problem, ConversationMessage } from '../types/interview';

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

interface UseInterviewReturn {
  state: InterviewState;
  updateSettings: (settings: Partial<InterviewSettings>) => void;
  startInterview: (problem: Problem) => void;
  endInterview: () => void;
  addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => void;
  updateCode: (code: string) => void;
  resetInterview: () => void;
}

export const useInterview = (): UseInterviewReturn => {
  const [state, setState] = useState<InterviewState>(initialState);

  const updateSettings = useCallback((newSettings: Partial<InterviewSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  }, []);

  const startInterview = useCallback((problem: Problem) => {
    setState(prev => ({
      ...prev,
      isActive: true,
      hasStarted: true,
      currentProblem: problem,
      timeRemaining: prev.settings.timeLimit * 60,
      conversation: [
        {
          id: crypto.randomUUID(),
          sender: 'ai',
          message: `Hello! I'm your AI interviewer today. I've given you the "${problem.title}" problem to solve. Take a moment to read through it, and feel free to ask me any clarifying questions about the requirements.`,
          timestamp: new Date(),
          type: 'question'
        }
      ]
    }));
  }, []);

  const endInterview = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false
    }));
  }, []);

  const addMessage = useCallback((message: Omit<ConversationMessage, 'id' | 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      conversation: [
        ...prev.conversation,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date()
        }
      ]
    }));
  }, []);

  const updateCode = useCallback((code: string) => {
    setState(prev => ({
      ...prev,
      userCode: code
    }));
  }, []);

  const resetInterview = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    updateSettings,
    startInterview,
    endInterview,
    addMessage,
    updateCode,
    resetInterview,
  };
};
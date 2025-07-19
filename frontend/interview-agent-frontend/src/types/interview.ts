export interface Problem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: string;
  description: string;
  examples: string[];
  companies: string[];
  constraints?: string[];
  followUp?: string[];
}

export interface InterviewSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  problemType: string;
  company: string;
  timeLimit: number; // in minutes
}

export interface ConversationMessage {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  timestamp: Date;
  type?: 'question' | 'hint' | 'clarification' | 'feedback';
}

export interface InterviewState {
  isActive: boolean;
  currentProblem: Problem | null;
  settings: InterviewSettings;
  conversation: ConversationMessage[];
  userCode: string;
  timeRemaining: number;
  hasStarted: boolean;
}

export type ProblemType = 
  | 'all'
  | 'arrays-hashing'
  | 'two-pointers'
  | 'sliding-window'
  | 'stack'
  | 'binary-search'
  | 'linked-list'
  | 'trees'
  | 'tries'
  | 'heap-priority-queue'
  | 'backtracking'
  | 'graphs'
  | 'advanced-graphs'
  | '1d-dp'
  | '2d-dp'
  | 'greedy'
  | 'intervals'
  | 'math-geometry'
  | 'bit-manipulation';

export type Company = 
  | 'general'
  | 'google'
  | 'meta'
  | 'amazon'
  | 'microsoft'
  | 'apple'
  | 'netflix'
  | 'bloomberg'
  | 'goldman-sachs'
  | 'uber'
  | 'airbnb'
  | 'linkedin'
  | 'twitter'
  | 'salesforce'
  | 'palantir';
// pages/InterviewPage.tsx
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CodeEditor  from '@/components/interview/CodeEditor';
import Timer from '../components/common/Timer';
import VoiceRecorder from '@/components/common/VoiceRecorder';
import { useInterview } from '../hooks/useInterview';
import type { Problem, ConversationMessage } from '../types/interview';

interface LocationState {
  problem: Problem;
  settings: any;
}

const InterviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, addMessage, updateCode, endInterview } = useInterview();
  
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  // Get problem and settings from navigation state
  const locationState = location.state as LocationState;
  const problem = locationState?.problem;
  const settings = locationState?.settings;

  // Redirect if no problem data
  useEffect(() => {
    if (!problem) {
      navigate('/');
      return;
    }
  }, [problem, navigate]);

  // Initialize interview on mount
  useEffect(() => {
    if (problem && !state.hasStarted) {
      // Start the interview with the selected problem
      // In a real app, you'd call your interview hook's startInterview method
    }
  }, [problem, state.hasStarted]);

  const handleSendMessage = useCallback(() => {
    if (!currentMessage.trim()) return;

    // Add user message
    addMessage({
      sender: 'user',
      message: currentMessage,
      type: 'question'
    });

    // Simulate AI typing
    setIsTyping(true);
    setCurrentMessage('');

    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      const responses = [
        "That's a good question! Let me help clarify that for you.",
        "Have you considered what the time complexity would be for that approach?",
        "What edge cases do you think we should consider for this problem?",
        "Try walking through your algorithm with the given example. What happens step by step?",
        "That's on the right track! Can you think of a way to optimize that further?"
      ];
      
      addMessage({
        sender: 'ai',
        message: responses[Math.floor(Math.random() * responses.length)],
        type: 'hint'
      });
      setIsTyping(false);
    }, 1500);
  }, [currentMessage, addMessage]);

  const handleVoiceTranscript = useCallback((transcript: string) => {
    if (transcript.trim()) {
      addMessage({
        sender: 'user',
        message: transcript,
        type: 'question'
      });

      // Simulate AI response to voice input
      setIsTyping(true);
      setTimeout(() => {
        addMessage({
          sender: 'ai',
          message: "I heard you mention: \"" + transcript + "\". Let me respond to that...",
          type: 'clarification'
        });
        setIsTyping(false);
      }, 1000);
    }
  }, [addMessage]);

  const handleRunCode = useCallback(async (code: string, language: string): Promise<string> => {
    // In a real app, this would send code to your backend for execution
    console.log('Running code:', { code, language });
    updateCode(code);
    return 'Code executed successfully!';
  }, [updateCode]);

  const handleSubmitCode = useCallback((code: string, language: string) => {
    // In a real app, this would submit the final solution
    console.log('Submitting code:', { code, language });
    updateCode(code);
    
    addMessage({
      sender: 'ai',
      message: "Thanks for submitting your solution! Let me review it and provide feedback.",
      type: 'feedback'
    });
  }, [updateCode, addMessage]);

  const handleEndInterview = useCallback(() => {
    endInterview();
    navigate('/results', { 
      state: { 
        problem, 
        code: state.userCode,
        conversation: state.conversation 
      } 
    });
  }, [endInterview, navigate, problem, state.userCode, state.conversation]);

  const handleTimeUp = useCallback(() => {
    addMessage({
      sender: 'ai',
      message: "Time's up! Let's wrap up the interview and review your solution.",
      type: 'feedback'
    });
    
    setTimeout(() => {
      handleEndInterview();
    }, 3000);
  }, [addMessage, handleEndInterview]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-300';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300';
      case 'hard': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!problem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Compact Header */}
      <div className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                ← Back
              </Button>
              <div>
                <h1 className="text-lg font-bold text-white">{problem.title}</h1>
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(problem.difficulty)}>
                    {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-800 text-slate-400 text-xs">
                    {problem.type}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Timer
                initialTime={settings?.timeLimit * 60 || 45 * 60}
                onTimeUp={handleTimeUp}
                autoStart={true}
                className=""
              />
              <Button
                onClick={handleEndInterview}
                variant="destructive"
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                End Interview
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-4 h-[calc(100vh-140px)]">
          {/* Left Panel - Problem Description */}
          <div className="w-1/4 flex flex-col">
            <Card className="bg-slate-900/50 border-slate-800 h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white">Problem Description</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <div className="prose prose-invert max-w-none">
                  <p className="text-slate-300 leading-relaxed mb-4 text-sm">
                    {problem.description}
                  </p>
                  
                  {problem.examples && problem.examples.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-white font-semibold text-sm">Examples:</h4>
                      {problem.examples.map((example, index) => (
                        <div key={index} className="bg-slate-950/50 p-3 rounded-lg">
                          <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                            {example}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}

                  {problem.constraints && problem.constraints.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-white font-semibold mb-2 text-sm">Constraints:</h4>
                      <ul className="text-slate-300 text-xs space-y-1">
                        {problem.constraints.map((constraint, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-slate-500 mt-1">•</span>
                            <span>{constraint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Code Editor */}
          <div className={`transition-all duration-300 ${isChatCollapsed ? 'flex-1' : 'flex-1'}`}>
            <CodeEditor
              value={state.userCode}
              onChange={updateCode}
              onRun={handleRunCode}
              onSubmit={handleSubmitCode}
              className="h-full"
            />
          </div>

          {/* Right Panel - Collapsible Chat */}
          <div className={`transition-all duration-300 ${
            isChatCollapsed ? 'w-12' : 'w-1/3'
          } flex flex-col gap-4 relative`}>
            
            {/* Collapse Toggle Button */}
            <Button
              onClick={() => setIsChatCollapsed(!isChatCollapsed)}
              variant="outline"
              size="sm"
              className={`absolute top-0 ${
                isChatCollapsed ? 'left-2' : 'right-2'
              } z-10 bg-slate-800 border-slate-600 text-white hover:bg-slate-700 w-8 h-8 p-0`}
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isChatCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>

            {!isChatCollapsed && (
              <>
                {/* Chat History */}
                <Card className="bg-slate-900/50 border-slate-800 flex-1 flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">AI</span>
                      </div>
                      Interview Chat
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                      {/* Initial AI Message */}
                      <div className="flex gap-2">
                        <div className="w-5 h-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex-shrink-0 flex items-center justify-center">
                          <span className="text-xs font-bold">AI</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-300">
                            Hello! I've given you the "{problem.title}" problem. Take a moment to read it and ask any clarifying questions.
                          </p>
                          <span className="text-xs text-slate-500">Just now</span>
                        </div>
                      </div>

                      {/* Conversation Messages */}
                      {state.conversation.map((message) => (
                        <div key={message.id} className="flex gap-2">
                          <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${
                            message.sender === 'ai' 
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                              : 'bg-slate-700'
                          }`}>
                            <span className="text-xs font-bold">
                              {message.sender === 'ai' ? 'AI' : 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-slate-300">{message.message}</p>
                            <span className="text-xs text-slate-500">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Typing Indicator */}
                      {isTyping && (
                        <div className="flex gap-2">
                          <div className="w-5 h-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex-shrink-0 flex items-center justify-center">
                            <span className="text-xs font-bold">AI</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse" />
                              <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse animation-delay-200" />
                              <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse animation-delay-400" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask a question..."
                        className="flex-1 bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!currentMessage.trim()}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 h-8 w-8 p-0"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Voice Recorder */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardContent className="py-3">
                    <VoiceRecorder
                      onTranscript={handleVoiceTranscript}
                      className="w-full"
                    />
                  </CardContent>
                </Card>
              </>
            )}

            {isChatCollapsed && (
              <div className="flex-1 flex items-center justify-center">
                <div className="writing-mode-vertical text-slate-400 text-sm font-medium transform rotate-90">
                  Interview Chat
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;
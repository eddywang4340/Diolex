// pages/InterviewPage.tsx - Simplified with auto-start and minimal UI
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CodeEditor  from '@/components/interview/CodeEditor';
import Timer from '../components/common/Timer';
import { useInterview } from '../hooks/useInterview';
import { useContinuousSpeech } from '../hooks/useContinuousSpeech';
import type { Problem } from '../types/interview';

interface LocationState {
  problem: Problem;
  settings: any;
}

const InterviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, addMessage, updateCode, endInterview } = useInterview();
  
  const [currentMessage, setCurrentMessage] = useState('');
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [hasStartedInterview, setHasStartedInterview] = useState(false);

  // Initialize continuous speech
  const {
    isSupported: speechSupported,
    isListening,
    isConnected,
    currentTranscript,
    messages: speechMessages,
    error: speechError,
    sendTextMessage,
    startInterview: startSpeechInterview,
    endInterview: endSpeechInterview,
  } = useContinuousSpeech();

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

  const handleStartInterview = useCallback(() => {
    setHasStartedInterview(true);
    
    // Start the speech/WebSocket connection
    startSpeechInterview();
    
    // Add initial AI message to interview state
    addMessage({
      sender: 'ai',
      message: `Hello! Welcome to your interview. I've prepared the "${problem.title}" problem for you. Take a moment to read through it, and feel free to think out loud as you work through the solution. I'm listening and here to help!`,
      type: 'question'
    });
  }, [startSpeechInterview, addMessage, problem?.title]);

  const handleSendMessage = useCallback(() => {
    if (!currentMessage.trim()) return;

    // Send via WebSocket
    sendTextMessage(currentMessage);
    setCurrentMessage('');
  }, [currentMessage, sendTextMessage]);

  const handleRunCode = useCallback(async (code: string, language: string): Promise<string> => {
    console.log('Running code:', { code, language });
    updateCode(code);
    
    // Optionally send code execution to AI
    sendTextMessage(`I'm running my ${language} code to test it.`);
    
    return 'Code executed successfully!';
  }, [updateCode, sendTextMessage]);

  const handleSubmitCode = useCallback((code: string, language: string) => {
    console.log('Submitting code:', { code, language });
    updateCode(code);
    
    // Send submission via WebSocket
    sendTextMessage(`I'm submitting my final solution in ${language}. Please review it and let me know what you think.`);
  }, [updateCode, sendTextMessage]);

  const handleEndInterview = useCallback(() => {
    endSpeechInterview();
    endInterview();
    navigate('/results', { 
      state: { 
        problem, 
        code: state.userCode,
        conversation: [...state.conversation, ...speechMessages]
      } 
    });
  }, [endSpeechInterview, endInterview, navigate, problem, state.userCode, state.conversation, speechMessages]);

  const handleTimeUp = useCallback(() => {
    sendTextMessage("Time's up! Let me wrap up my solution.");
    
    setTimeout(() => {
      handleEndInterview();
    }, 3000);
  }, [sendTextMessage, handleEndInterview]);

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

  // Combine all messages for display
  const allMessages = [
    ...state.conversation,
    ...speechMessages
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (!problem) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show start interview screen
  if (!hasStartedInterview) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Ready to Start Your Interview?</h1>
              <p className="text-slate-400">Problem: {problem.title}</p>
            </div>

            <Card className="bg-slate-900/50 border-slate-800 mb-8">
              <CardHeader>
                <CardTitle className="text-white">Problem Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getDifficultyColor(problem.difficulty)}>
                      {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                    </Badge>
                    <Badge variant="secondary" className="bg-slate-800 text-slate-400">
                      {problem.type}
                    </Badge>
                  </div>
                  
                  <p className="text-slate-300 leading-relaxed">
                    {problem.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button
                onClick={handleStartInterview}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-8 text-lg"
              >
                Start Interview
              </Button>
              
              <div className="mt-4 text-sm text-slate-400">
                {speechSupported ? (
                  <p>✅ Speech recognition is supported. The AI will listen to you automatically.</p>
                ) : (
                  <p>⚠️ Speech recognition not supported. You can still type to communicate.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header with minimal listening indicator */}
      <div className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 bg-slate-800"
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
            
            <div className="flex items-center gap-4">
              {/* Minimal listening indicator */}
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`} />
                {isListening && (
                  <span className="text-green-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                    Listening
                  </span>
                )}
                {!isConnected && (
                  <span className="text-red-400 text-xs">Disconnected</span>
                )}
                {speechError && (
                  <span className="text-yellow-400 text-xs">⚠️</span>
                )}
              </div>

              <Timer
                initialTime={settings?.timeLimit * 60 || 45 * 60}
                onTimeUp={handleTimeUp}
                autoStart={true}
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
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={state.userCode}
              onChange={updateCode}
              onRun={handleRunCode}
              onSubmit={handleSubmitCode}
              className="h-full"
            />
          </div>

          {/* Right Panel - Chat */}
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
                    <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                      {/* Current transcript preview */}
                      {currentTranscript && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                          <div className="text-xs text-blue-300 italic">
                            Speaking: "{currentTranscript}"
                          </div>
                        </div>
                      )}

                      {/* All messages */}
                      {allMessages.map((message) => (
                        <div key={message.id} className="flex gap-2">
                          <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center ${
                            message.sender === 'ai' 
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                              : 'bg-slate-700'
                          }`}>
                            <span className="text-xs font-bold">
                              {message.sender === 'ai' ? 'AI' : 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-300">{message.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500">
                                {formatTime(message.timestamp)}
                              </span>
                              {message.source === 'speech' && (
                                <span className="text-xs text-blue-400">🎤</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!currentMessage.trim() || !isConnected}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </Button>
                    </div>
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
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CodeEditor from '@/components/interview/CodeEditor';
import Timer from '@/components/Timer';
import { useInterview } from '@/hooks/useInterview';
// We're not using useContinuousSpeech directly, we're using it via useInterview
import type { Problem } from '@/types/interview';

interface LocationState {
  problem: Problem;
  settings: any;
}

const InterviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { problem, settings } = (location.state as LocationState) || {};

  const [hasStartedInterview, setHasStartedInterview] = useState(false);
  const [isEndingInterview, setIsEndingInterview] = useState(false);

  const { 
    state, 
    startInterview,
    endInterview,
    updateCode,
    sendTextMessage,
    isSpeechSupported: speechSupported,
    isListening,
    isConnected,
    currentTranscript,
    speechError,
  } = useInterview();

  const [textInput, setTextInput] = useState('');
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Redirect if no problem data is available on component mount
  useEffect(() => {
    if (!problem) {
      navigate('/');
    }
  }, [problem, navigate]);

  // Manually start the interview
  const handleStartInterview = useCallback(() => {
    setHasStartedInterview(true);
    startInterview(problem, settings);
  }, [startInterview, problem, settings]);
  
  // Auto-start the interview if user refreshes after starting
  useEffect(() => {
    if (problem && state.hasStarted && !hasStartedInterview) {
      setHasStartedInterview(true);
    }
  }, [problem, state.hasStarted, hasStartedInterview]);

  // Scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.conversation]);

  const handleSendMessage = useCallback(() => {
    if (!textInput.trim()) return;
    sendTextMessage(textInput);
    setTextInput('');
  }, [textInput, sendTextMessage]);

  const handleRunCode = useCallback(async (code: string): Promise<string> => {
    console.log('Running code, length:', code.length);
    updateCode(code); // Update the state immediately
    // In a real scenario, you would call an API to execute the code.
    // For now, we just notify the AI.
    // setTimeout(() => {
    //   // Use timeout to ensure code state is updated before sending message
    //   sendTextMessage(`I'm running my code to test it.`);
    // }, 100);
    return 'Code execution simulation complete.';
  }, [updateCode, sendTextMessage]);

  const handleSubmitCode = useCallback((code: string) => {
    console.log('Submitting code, length:', code.length);
    updateCode(code);
    // Small delay to ensure the state is updated before sending message
    // setTimeout(() => {
    //   sendTextMessage(`I'm submitting my final solution. Please review it.`);
    // }, 100);
    // You might want to trigger the end of the interview here or after a final AI response.
  }, [updateCode, sendTextMessage]);

  const handleEndAndReview = useCallback(async () => {
    try {
      // Show loading immediately
      setIsEndingInterview(true);
      
      // Stop the interview first
      endInterview();
      
      // Call the /end endpoint to get AI feedback
      const response = await fetch('http://localhost:8000/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Navigate to results with the AI feedback
        navigate('/results', { 
          state: { 
            problem,
            code: state.userCode,
            conversation: state.conversation,
            duration: settings.timeLimit * 60,
            aiFeedback: result.feedback, // Pass the AI-generated feedback
          } 
        });
      } else {
        console.error('Failed to get feedback:', result);
        // Still navigate but without AI feedback
        navigate('/results', { 
          state: { 
            problem,
            code: state.userCode,
            conversation: state.conversation,
            duration: settings.timeLimit * 60,
          } 
        });
      }
    } catch (error) {
      console.error('Error calling /end endpoint:', error);
      // Still navigate but without AI feedback
      navigate('/results', { 
        state: { 
          problem,
          code: state.userCode,
          conversation: state.conversation,
          duration: settings.timeLimit * 60,
        } 
      });
    }
  }, [endInterview, navigate, problem, state.userCode, state.conversation, settings, setIsEndingInterview]);

  const handleTimeUp = useCallback(() => {
    sendTextMessage("Time's up! Let me wrap up my solution.");
    setIsEndingInterview(true); // Show loading immediately
    setTimeout(() => {
      handleEndAndReview();
    }, 3000);
  }, [sendTextMessage, handleEndAndReview, setIsEndingInterview]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-300';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300';
      case 'hard': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!problem) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Preparing your interview...</div>
      </div>
    );
  }
  
  if (isEndingInterview) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-slate-600 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-xl font-light">Finishing your interview...</p>
        <p className="mt-2 text-sm text-slate-400">We're analyzing your performance and generating feedback</p>
      </div>
    );
  }
  
  if (!hasStartedInterview) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-20">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold text-white">{problem.title}</h1>
                <Badge className={getDifficultyColor(problem.difficulty)}>
                  {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs">
                  <span className="text-slate-400 mr-2">Time limit:</span>
                  <span>{settings?.timeLimit || 45} minutes</span>
                </div>
                <div className="text-xs">
                  <span className="text-slate-400 mr-2">Voice support:</span>
                  <span>{speechSupported ? 'Available' : 'Unavailable (Switch to Chrome for voice support)'}</span>
                </div>
      
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Problem Description */}
        <main className="container mx-auto px-4 py-4 flex-1 overflow-auto">
          <Card className="bg-slate-900/50 border-slate-800 max-w-4xl mx-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-white">Problem Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-4">
                {/* Main description */}
                <div className="text-sm">
                  {problem.description.split(/(`[^`]+`)/).map((part, index) => {
                    if (part.startsWith('`') && part.endsWith('`')) {
                      return (
                        <code key={index} className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded text-xs font-mono">
                          {part.slice(1, -1)}
                        </code>
                      );
                    }
                    return <span key={index}>{part}</span>;
                  })}
                </div>
                
                {/* Examples */}
                {problem.examples && problem.examples.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-white font-semibold mb-3 text-sm">Examples:</h4>
                    <div className="space-y-3">
                      {problem.examples.map((example, index) => (
                        <div key={index} className="bg-slate-950/50 p-3 rounded-lg">
                          <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                            {example}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints && problem.constraints.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-white font-semibold mb-3 text-sm">Constraints:</h4>
                    <ul className="text-slate-300 text-xs space-y-1">
                      {problem.constraints.map((constraint, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-slate-500 mt-1">•</span>
                          <span>
                            {constraint.split(/(`[^`]+`)/).map((part, partIndex) => {
                              if (part.startsWith('`') && part.endsWith('`')) {
                                return (
                                  <code key={partIndex} className="bg-slate-800 text-blue-300 px-1 py-0.5 rounded text-xs font-mono">
                                    {part.slice(1, -1)}
                                  </code>
                                );
                              }
                              return <span key={partIndex}>{part}</span>;
                            })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="bg-blue-900/20 border border-blue-800/30 text-blue-300 p-3 rounded-lg text-sm mt-6">
                  <p>Once you start, the timer will begin and you'll be connected with your AI interviewer. Good luck!</p>
                </div>
                
                <div className="flex justify-center pt-4">
                  <Button onClick={handleStartInterview} size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
                    Start Interview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-white">{problem.title}</h1>
              <Badge className={getDifficultyColor(problem.difficulty)}>
                {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full transition-colors ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                {isListening && <span className="text-green-400">Listening...</span>}
                {speechError && <span className="text-yellow-400">Mic Error</span>}
              </div>
              <Timer initialTime={settings?.timeLimit * 60 || 45 * 60} onTimeUp={handleTimeUp} autoStart={true} />
              <Button onClick={handleEndAndReview} variant="destructive" size="sm">End & Review</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 overflow-hidden">
        <div className="h-full flex gap-4">
          {/* Left Panel - Problem Description */}
          <div className="w-1/3 flex flex-col">
            <Card className="bg-slate-900/50 border-slate-800 h-full flex flex-col h-[calc(100vh-200px)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white">Problem Description</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
                  <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-4">
                    {/* Main description */}
                    <div className="text-sm">
                      {problem.description.split(/(`[^`]+`)/).map((part, index) => {
                        if (part.startsWith('`') && part.endsWith('`')) {
                          return (
                            <code key={index} className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded text-xs font-mono">
                              {part.slice(1, -1)}
                            </code>
                          );
                        }
                        return <span key={index}>{part}</span>;
                      })}
                    </div>
                    
                    {/* Examples */}
                    {problem.examples && problem.examples.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-white font-semibold mb-3 text-sm">Examples:</h4>
                        <div className="space-y-3">
                          {problem.examples.map((example, index) => (
                            <div key={index} className="bg-slate-950/50 p-3 rounded-lg">
                              <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                                {example}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Constraints */}
                    {problem.constraints && problem.constraints.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-white font-semibold mb-3 text-sm">Constraints:</h4>
                        <ul className="text-slate-300 text-xs space-y-1">
                          {problem.constraints.map((constraint, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-slate-500 mt-1">•</span>
                              <span>
                                {constraint.split(/(`[^`]+`)/).map((part, partIndex) => {
                                  if (part.startsWith('`') && part.endsWith('`')) {
                                    return (
                                      <code key={partIndex} className="bg-slate-800 text-blue-300 px-1 py-0.5 rounded text-xs font-mono">
                                        {part.slice(1, -1)}
                                      </code>
                                    );
                                  }
                                  return <span key={partIndex}>{part}</span>;
                                })}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Code Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            <CodeEditor value={state.userCode} onChange={updateCode} onRun={handleRunCode} onSubmit={handleSubmitCode} className="h-full" />
          </div>

          {/* Right Panel - Chat */}
          <div className={`transition-all duration-300 ${
            isChatCollapsed ? 'w-12' : 'w-1/3'
          } flex flex-col gap-4 relative h-full`}>
            
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
                <Card className="bg-slate-900/50 border-slate-800 flex flex-col h-[calc(100vh-200px)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">AI</span>
                      </div>
                      Interview Chat
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 overflow-hidden">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0">

                      {/* Current transcript preview */}
                      {currentTranscript && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                          <div className="text-xs text-blue-300 italic">
                            Speaking: "{currentTranscript}"
                          </div>
                        </div>
                      )}

                      {/* All messages */}
                      {state.conversation.map((message) => (
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
                            <p className="text-sm text-slate-300 break-words">{message.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500">
                                {formatTime(message.timestamp)}
                              </span>
                              {message.source === 'speech' && (
                                <span className="text-xs text-blue-400">🎤</span>
                              )}
                              {message.type && (
                                <span className="text-xs text-purple-400">{message.type}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!textInput.trim() || !isConnected}
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewPage;
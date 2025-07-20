import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CodeEditor from '@/components/interview/CodeEditor';
import Timer from '@/components/Timer';
import { useInterview } from '@/hooks/useInterview';
import type { Problem, ConversationMessage } from '../types/interview';

interface LocationState {
  problem: Problem;
  settings: any;
}

const InterviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { problem, settings } = (location.state as LocationState) || {};

  const { 
    state, 
    startInterview,
    endInterview,
    updateCode,
    sendTextMessage,
    isSpeechSupported,
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

  // Automatically start the interview when the component mounts with a problem
  useEffect(() => {
    if (problem && !state.hasStarted) {
      startInterview(problem, settings);
    }
  }, [problem, settings, state.hasStarted, startInterview]);

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
    setTimeout(() => {
      // Use timeout to ensure code state is updated before sending message
      sendTextMessage(`I'm running my code to test it.`);
    }, 100);
    return 'Code execution simulation complete.';
  }, [updateCode, sendTextMessage]);

  const handleSubmitCode = useCallback((code: string) => {
    console.log('Submitting code, length:', code.length);
    updateCode(code);
    // Small delay to ensure the state is updated before sending message
    setTimeout(() => {
      sendTextMessage(`I'm submitting my final solution. Please review it.`);
    }, 100);
    // You might want to trigger the end of the interview here or after a final AI response.
  }, [updateCode, sendTextMessage]);

  const handleEndAndReview = useCallback(() => {
    endInterview();
    navigate('/results', { 
      state: { 
        problem,
        code: state.userCode,
        conversation: state.conversation,
        duration: settings.timeLimit * 60,
      } 
    });
  }, [endInterview, navigate, problem, state.userCode, state.conversation, settings]);

  const handleTimeUp = useCallback(() => {
    sendTextMessage("Time's up! Let me wrap up my solution.");
    setTimeout(() => {
      handleEndAndReview();
    }, 3000);
  }, [sendTextMessage, handleEndAndReview]);

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

  if (!problem || !state.hasStarted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Preparing your interview...</div>
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
      <main className="container mx-auto px-4 py-4 flex-1 overflow-hidden">
        <div className="flex gap-4 h-full">
          {/* Left Panel - Problem Description */}
          <div className="w-1/3 flex flex-col">
            <Card className="bg-slate-900/50 border-slate-800 h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white">Problem Description</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
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
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Code Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            <CodeEditor value={state.userCode} onChange={updateCode} onRun={handleRunCode} onSubmit={handleSubmitCode} className="h-full" />
          </div>

          {/* Right Panel - Chat */}
          <div className={`transition-all duration-300 ${isChatCollapsed ? 'w-12' : 'w-1/3'} flex flex-col gap-4 relative`}>
            <Button onClick={() => setIsChatCollapsed(!isChatCollapsed)} variant="outline" size="icon" className="absolute top-2 right-2 z-10 bg-slate-800 border-slate-600 hover:bg-slate-700 w-8 h-8">
              {isChatCollapsed ? '‹' : '›'}
            </Button>
            {!isChatCollapsed && (
              <Card className="bg-slate-900/50 border-slate-800 flex-1 flex flex-col min-h-0">
                <CardHeader className="pb-3"><CardTitle className="text-base text-white">Interview Chat</CardTitle></CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {state.conversation.map((msg: ConversationMessage) => (
                      <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        <div className={`flex flex-col max-w-xs md:max-w-md ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`px-3 py-2 rounded-xl ${msg.sender === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-slate-800 rounded-bl-none'}`}>
                            <p className="text-sm">{msg.message}</p>
                          </div>
                          <span className="text-xs text-slate-500 mt-1">{formatTime(msg.timestamp)} {msg.source === 'speech' && '🎤'}</span>
                        </div>
                      </div>
                    ))}
                    {currentTranscript && (
                      <div className="text-sm text-blue-300 italic p-2">"{currentTranscript}"</div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-800">
                    <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type a message..." className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none" />
                    <Button onClick={handleSendMessage} disabled={!textInput.trim() || !isConnected} className="bg-purple-600 hover:bg-purple-700">Send</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewPage;
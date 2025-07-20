import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AIEvaluation, ConversationMessage } from '@/types/interview';

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { problem, code, conversation, duration, aiFeedback } = location.state || {};
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  
  useEffect(() => {
    // Use AI feedback if available
    if (aiFeedback) {
      // Transform AI feedback to expected format
      const transformedEvaluation: AIEvaluation = {
        clarification: aiFeedback.clarification,
        reasoning: aiFeedback.reasoning,
        solution: aiFeedback.solution,
        total: aiFeedback.total,
        score: Math.round((aiFeedback.total / 15) * 100), // Convert 0-15 scale to 0-100 percentage
        recommendation: aiFeedback.recommendation,
        explanation: aiFeedback.explanation,
        // For compatibility with existing UI
        overallFeedback: aiFeedback.explanation,
        // strengths: ["Solution correctness achieved"],
        // improvements: ["Focus on communication and clarification skills"],
        codeQuality: "Code reviewed by AI"
      };
      
      setEvaluation(transformedEvaluation);
      setLoading(false);
    } else if (problem && code && conversation) {
      // Fallback to mock data if no AI feedback available
      const mockEvaluation: AIEvaluation = {
        clarification: 3,
        reasoning: 3,
        solution: 4,
        total: 10,
        score: 75,
        recommendation: "Hire",
        explanation: "Mock evaluation - AI feedback not available",
        overallFeedback: "Mock evaluation - AI feedback was not provided",
        strengths: ["Problem-solving approach", "Code implementation"],
        improvements: ["Communication", "Clarification process"],
        codeQuality: "Adequate code structure"
      };
      
      setEvaluation(mockEvaluation);
      setLoading(false);
    } else {
      // No data available, redirect home
      navigate('/');
    }
  }, [problem, code, conversation, aiFeedback, navigate]);
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-500/20 text-green-300';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300';
      case 'hard': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-slate-600 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-xl font-light">Analyzing your interview...</p>
        <p className="mt-2 text-sm text-slate-400">We're evaluating your code and conversation</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Interview Complete!
          </h1>
          <p className="text-slate-400 text-lg">Great job tackling this problem. Here's your feedback.</p>
        </div>
        
        {/* Problem Overview Card */}
        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl text-white">{problem?.title}</CardTitle>
              <div className="flex gap-2 mt-1">
                <Badge className={getDifficultyColor(problem?.difficulty)}>
                  {problem?.difficulty?.charAt(0).toUpperCase() + problem?.difficulty?.slice(1)}
                </Badge>
                <Badge variant="secondary" className="bg-slate-800 text-slate-400">
                  {problem?.type}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Interview Duration</div>
              <div className="text-xl font-semibold text-white">{formatDuration(duration)}</div>
            </div>
          </CardHeader>
        </Card>
        
        {/* Score/Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-slate-900/50 border-slate-800 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Overall Score</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 40 * (evaluation?.score || 0) / 100} ${2 * Math.PI * 40 * (1 - (evaluation?.score || 0) / 100)}`}
                    strokeDashoffset={2 * Math.PI * 40 * 0.25}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">{evaluation?.score || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-800 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Interaction</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Messages</span>
                  <span className="text-white font-medium">{conversation?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">AI Responses</span>
                  <span className="text-white font-medium">{conversation?.filter(msg => msg.sender === 'ai').length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Communication</span>
                  <span className="text-purple-400 font-medium">{evaluation?.recommendation === 'Strong Hire' || evaluation?.recommendation === 'Hire' ? 'Good' : 'Needs Work'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-slate-800 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Clarification</span>
                  <div className="flex">
                    {Array(5).fill(0).map((_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < (evaluation?.clarification || 0) ? 'text-blue-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Reasoning</span>
                  <div className="flex">
                    {Array(5).fill(0).map((_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < (evaluation?.reasoning || 0) ? 'text-green-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Solution</span>
                  <div className="flex">
                    {Array(5).fill(0).map((_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < (evaluation?.solution || 0) ? 'text-yellow-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Feedback Scores Section */}
        {aiFeedback && evaluation && (
          <Card className="bg-slate-900/50 border-slate-800 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">AI</span>
                </div>
                Interview Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Individual Scores */}
                <div className="bg-slate-950/50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-400">{evaluation.clarification}/5</div>
                  <div className="text-sm text-slate-400">Clarification</div>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">{evaluation.reasoning}/5</div>
                  <div className="text-sm text-slate-400">Reasoning</div>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-400">{evaluation.solution}/5</div>
                  <div className="text-sm text-slate-400">Solution</div>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-400">{evaluation.total}/15</div>
                  <div className="text-sm text-slate-400">Total Score</div>
                </div>
              </div>
              
              {/* Recommendation */}
              <div className="bg-slate-950/50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-slate-400">Recommendation:</span>
                  <Badge className={`${
                    evaluation.recommendation === 'Strong Hire' ? 'bg-green-600 text-white' :
                    evaluation.recommendation === 'Hire' ? 'bg-blue-600 text-white' :
                    evaluation.recommendation === 'No Hire' ? 'bg-yellow-600 text-white' :
                    'bg-red-600 text-white'
                  }`}>
                    {evaluation.recommendation}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Detailed Feedback */}
        <Card className="bg-slate-900/50 border-slate-800 mb-8">
          <CardHeader className="pb-2 border-b border-slate-800">
            <div className="flex">
              <button 
                className={`px-4 py-2 font-medium text-sm ${activeTab === 'summary' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setActiveTab('summary')}
              >
                Summary
              </button>
              <button 
                className={`px-4 py-2 font-medium text-sm ${activeTab === 'feedback' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setActiveTab('feedback')}
              >
                Detailed Feedback
              </button>
              <button 
                className={`px-4 py-2 font-medium text-sm ${activeTab === 'code' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setActiveTab('code')}
              >
                Your Solution
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Overall Assessment</h3>
                  <p className="text-slate-300 leading-relaxed">
                    {evaluation?.overallFeedback || 'No assessment available'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Strengths</h3>
                    <ul className="space-y-2">
                      {evaluation?.strengths?.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="mt-1 text-green-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-slate-300">{strength}</span>
                        </li>
                      )) || <li className="text-slate-400">No strengths listed</li>}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-3">Areas to Improve</h3>
                    <ul className="space-y-2">
                      {evaluation?.improvements?.map((improvement, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="mt-1 text-amber-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <span className="text-slate-300">{improvement}</span>
                        </li>
                      )) || <li className="text-slate-400">No improvements listed</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Feedback Tab */}
            {activeTab === 'feedback' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Code Quality</h3>
                  <p className="text-slate-300 leading-relaxed">
                    {evaluation?.codeQuality || 'No code quality assessment available'}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Interview Conversation</h3>
                  <div className="bg-slate-950 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {conversation?.map((msg, i) => (
                      <div key={i} className="mb-4 last:mb-0">
                        <div className="flex gap-2 items-center mb-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            msg.role === 'assistant' 
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                              : 'bg-slate-700'
                          }`}>
                            <span className="text-xs font-bold">
                              {msg.role === 'assistant' ? 'AI' : 'U'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 ml-8">
                          {msg.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Code Tab */}
            {activeTab === 'code' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Your Solution</h3>
                  <div className="bg-slate-950 rounded-lg overflow-hidden">
                    <pre className="p-4 text-sm text-slate-300 overflow-x-auto">
                      <code>{code || 'No code submitted'}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Return Home
          </Button>
          <Button
            onClick={() => navigate('/interview', { state: { problem, settings: { timeLimit: duration / 60 } } })}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
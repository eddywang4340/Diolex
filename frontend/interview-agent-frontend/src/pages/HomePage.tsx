// pages/HomePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import ProblemSetup from '../components/interview/ProblemSetup';
import { useInterview } from '../hooks/useInterview';
import type { Problem } from '../types/interview';

// API base URL - change this based on your environment
const API_URL = 'http://localhost:8000';

const HomePage = () => {
  const navigate = useNavigate();
  const { state, updateSettings } = useInterview();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomProblem = async (): Promise<Problem | null> => {
    const { difficulty, problemType, company } = state.settings;
    
    // Build query parameters
    const params = new URLSearchParams();
    
    // Only add parameters that are selected (not the default values)
    if (difficulty !== 'all') {
      // Convert from lowercase to title case for the API
      const formattedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
      params.append('difficulty', formattedDifficulty);
    }
    
    if (company !== 'general') {
      params.append('company', company);
    }

    if (problemType !== 'all') {
      params.append('problem_type', problemType);
    }
    
    try {
      const response = await fetch(`${API_URL}/api/problems/random?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data) {
        setError(data.message || 'No problems found with the selected criteria');
        return null;
      }
      
      // Convert the API response to our Problem type
      const apiProblem = data.data;
      return {
        id: apiProblem.id.toString(),
        title: apiProblem.title,
        difficulty: apiProblem.difficulty.toLowerCase(),
        type: apiProblem.related_topics?.[0] || 'general',
        description: extractMainDescription(apiProblem.description),
        examples: extractExamples(apiProblem.description),
        companies: apiProblem.companies || [],
        constraints: extractConstraints(apiProblem.description),
      };
    } catch (err) {
      console.error('Error fetching problem:', err);
      setError('Failed to fetch a problem. Please try again.');
      return null;
    }
  };

  // Helper functions to parse the description for examples and constraints
  const extractMainDescription = (description: string): string => {
    // Split at the first occurrence of "Example" or "Constraints"
    const parts = description.split(/(?=Example \d+:|Constraints:)/);
    return parts[0].trim();
  };
  const extractExamples = (description: string): string[] => {
    const examples = [];
    const exampleRegex = /Example \d+:([\s\S]*?)(?=Example \d+:|Constraints:|$)/g;
    let match;
    
    while ((match = exampleRegex.exec(description)) !== null) {
      examples.push(match[1].trim());
    }
    
    return examples.length > 0 ? examples : [description];
  };
  
  const extractConstraints = (description: string): string[] => {
    const constraintsRegex = /(Constraints|Note):([\s\S]*?)(?=Example \d+:|Examples:|$)/i;
    const match = constraintsRegex.exec(description);
    
    if (match && match[2]) {
      return match[2]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('Example'));
    }
    
    return [];
  };

  const handleStartInterview = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const selectedProblem = await fetchRandomProblem();
      
      if (selectedProblem) {
        // Navigate to interview page with the selected problem
        navigate('/interview', { 
          state: { 
            problem: selectedProblem,
            settings: state.settings 
          } 
        });
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      setError('Failed to start the interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error when settings change
  useEffect(() => {
    setError(null);
  }, [state.settings]);

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            {/* <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div> */}
            <div>
              <h1 className="text-6xl font-bold text-white">Diolex</h1>
              <p className="text-slate-400 text-lg">Start training like it's real.</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Left Panel - Setup */}
          <div className="lg:col-span-1">
            <ProblemSetup
              settings={state.settings}
              onSettingsChange={updateSettings}
              onStartInterview={handleStartInterview}
              isLoading={isLoading}
            />
            
            {error && (
              <div className="mt-4">
                <div className="bg-red-500/10 text-red-500 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13h-2v6h2V5zm0 8h-2v2h2v-2z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Welcome Content */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900/50 border-slate-800 h-full">
              <CardContent className="p-8">
                <div className="space-y-8">
                  {/* Welcome Message */}
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Welcome to Your AI Interview Coach
                    </h2>
                    <p className="text-slate-300 text-lg leading-relaxed">
                      Practice technical interviews with our AI-powered platform. 
                      Get real-time feedback, hints, and personalized coaching to ace your next interview.
                    </p>
                  </div>

                  {/* Features Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white">Real-time Feedback</h3>
                      </div>
                      <p className="text-slate-300">
                        Get instant feedback on your approach, code quality, and problem-solving methodology.
                      </p>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white">Smart Hints</h3>
                      </div>
                      <p className="text-slate-300">
                        Receive contextual hints that guide you toward the solution without giving it away.
                      </p>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white">Company-Specific</h3>
                      </div>
                      <p className="text-slate-300">
                        Practice with problems commonly asked at top tech companies like Google, Meta, and Amazon.
                      </p>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-white">Timed Practice</h3>
                      </div>
                      <p className="text-slate-300">
                        Simulate real interview conditions with customizable time limits and pressure.
                      </p>
                    </div>
                  </div>

                  {/* Getting Started */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-6 border border-purple-500/20">
                    <h3 className="text-xl font-semibold text-white mb-3">Ready to Start?</h3>
                    <p className="text-slate-300 mb-4">
                      Configure your interview settings on the left and click "Start Interview" when you're ready. 
                      Choose your difficulty level, problem type, and target company to get personalized practice.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-purple-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Tip: Start with easier problems to build confidence, then gradually increase difficulty.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
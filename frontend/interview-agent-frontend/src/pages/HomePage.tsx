// pages/HomePage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import ProblemSetup from '../components/interview/ProblemSetup';
import { useInterview } from '../hooks/useInterview';
import type { Problem } from '../types/interview';

// Sample problems - in a real app, this would come from your API/database
const sampleProblems: Problem[] = [
  {
    id: '1',
    title: 'Two Sum',
    difficulty: 'easy',
    type: 'arrays-hashing',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    examples: [
      'Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].'
    ],
    companies: ['google', 'amazon', 'microsoft', 'apple'],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ]
  },
  {
    id: '2',
    title: 'Valid Parentheses',
    difficulty: 'easy',
    type: 'stack',
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
    examples: [
      'Input: s = "()"\nOutput: true',
      'Input: s = "()[]{}"\nOutput: true',
      'Input: s = "(]"\nOutput: false'
    ],
    companies: ['meta', 'google', 'amazon'],
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only \'()[]{}\''
    ]
  },
  {
    id: '3',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'medium',
    type: 'sliding-window',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    examples: [
      'Input: s = "abcabcbb"\nOutput: 3\nExplanation: The answer is "abc", with the length of 3.',
      'Input: s = "bbbbb"\nOutput: 1\nExplanation: The answer is "b", with the length of 1.'
    ],
    companies: ['amazon', 'microsoft', 'bloomberg'],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.'
    ]
  }
];

const HomePage = () => {
  const navigate = useNavigate();
  const { state, updateSettings } = useInterview();
  const [isLoading, setIsLoading] = useState(false);

  const getRandomProblem = (): Problem => {
    const { difficulty, problemType, company } = state.settings;
    
    let filteredProblems = sampleProblems;
    
    // Filter by difficulty
    if (difficulty !== 'easy') { // Assuming we want to filter
      filteredProblems = filteredProblems.filter(p => p.difficulty === difficulty);
    }
    
    // Filter by problem type
    if (problemType !== 'all') {
      filteredProblems = filteredProblems.filter(p => p.type === problemType);
    }
    
    // Filter by company
    if (company !== 'general') {
      filteredProblems = filteredProblems.filter(p => 
        p.companies.includes(company as any)
      );
    }
    
    // If no problems match criteria, return all problems
    if (filteredProblems.length === 0) {
      filteredProblems = sampleProblems;
    }
    
    return filteredProblems[Math.floor(Math.random() * filteredProblems.length)];
  };

  const handleStartInterview = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const selectedProblem = getRandomProblem();
      
      // Navigate to interview page with the selected problem
      navigate('/interview', { 
        state: { 
          problem: selectedProblem,
          settings: state.settings 
        } 
      });
    } catch (error) {
      console.error('Error starting interview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">TechInterview.AI</h1>
              <p className="text-slate-400 text-lg">Practice like it's the real thing</p>
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
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { InterviewSettings, ProblemType, Company } from '@/types/interview';

interface ProblemSetupProps {
  settings: InterviewSettings;
  onSettingsChange: (settings: Partial<InterviewSettings>) => void;
  onStartInterview: () => void;
  isLoading?: boolean;
}

// API base URL - should match your backend
const API_URL = 'http://localhost:8000';

interface CompanyCount {
  company: string;
  count: number;
}

// Problem types that match the backend's topic_mapping
const PROBLEM_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'arrays-hashing', label: 'Arrays & Hashing' },
  { value: 'two-pointers', label: 'Two Pointers' },
  { value: 'sliding-window', label: 'Sliding Window' },
  { value: 'stack', label: 'Stacks & Queues' },
  { value: 'binary-search', label: 'Binary Search' },
  { value: 'linked-list', label: 'Linked Lists' },
  { value: 'trees', label: 'Trees' },
  { value: 'tries', label: 'Tries' },
  { value: 'heap-priority-queue', label: 'Heaps & Priority Queues' },
  { value: 'backtracking', label: 'Backtracking' },
  { value: 'graphs', label: 'Graphs' },
  { value: 'advanced-graphs', label: 'Advanced Graphs' },
  { value: '1d-dp', label: 'Dynamic Programming' },
  { value: 'greedy', label: 'Greedy' },
  { value: 'math-geometry', label: 'Math & Geometry' },
  { value: 'bit-manipulation', label: 'Bit Manipulation' }
];

const ProblemSetup = ({
  settings,
  onSettingsChange,
  onStartInterview,
  isLoading = false,
}: ProblemSetupProps) => {
  const [companySearch, setCompanySearch] = useState('');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyCount[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  // Fetch companies with problem counts when component mounts
  useEffect(() => {
    const fetchCompanyData = async () => {
      setIsLoadingCompanies(true);
      try {
        const response = await fetch(`${API_URL}/api/problems/filters`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.companyCounts) {
            setCompanyData(data.data.companyCounts);
          } else {
            console.error("Company count data missing or in unexpected format", data);
            setCompanyData([]);
          }
        } else {
          console.error("Failed to fetch company data:", response.statusText);
          setCompanyData([]);
        }
      } catch (error) {
        console.error("Failed to load company data:", error);
        setCompanyData([]);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    
    fetchCompanyData();
  }, []);

  // Filter and sort companies based on search
  const filteredCompanies = companyData
    .filter(item => item.company.toLowerCase().includes(companySearch.toLowerCase()))
    .sort((a, b) => b.count - a.count); // Sort by count (highest first)

  // Get label for selected company
  const getSelectedCompanyLabel = () => {
    if (settings.company === 'general') return 'General';
    return settings.company || 'Select company';
  };

  // Get difficulty badge color
  const getDifficultyBadgeClass = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'hard': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-slate-600/30 text-slate-300 border-slate-500/30';
    }
  };

  // Get problem type label from value
  const getProblemTypeLabel = (type: string): string => {
    const foundType = PROBLEM_TYPES.find(t => t.value === type);
    return foundType ? foundType.label : type;
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="text-xl text-white">Interview Setup</CardTitle>
      </CardHeader>
      
      <CardContent className="px-6 space-y-6">
        {/* Difficulty Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Problem Difficulty
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['all', 'easy', 'medium', 'hard'].map((difficulty) => (
              <Button
                key={difficulty}
                variant="ghost"
                size="sm"
                className={`${
                  settings.difficulty === difficulty
                    ? getDifficultyBadgeClass(difficulty)
                    : 'hover:bg-slate-700 text-slate-400'
                } justify-center`}
                onClick={() => onSettingsChange({ difficulty: difficulty as InterviewSettings['difficulty'] })}
              >
                {difficulty === 'all' ? 'All' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Problem Type Selection - Updated to match backend */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Problem Type
          </label>
          <Select
            value={settings.problemType}
            onValueChange={(value: ProblemType) =>
              onSettingsChange({ problemType: value })
            }
          >
            <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
              <SelectValue placeholder="Select problem type">
                {getProblemTypeLabel(settings.problemType)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600 max-h-72 overflow-y-auto">
              {PROBLEM_TYPES.map((type) => (
                <SelectItem 
                  key={type.value} 
                  value={type.value}
                  className="text-white hover:bg-slate-700"
                >
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Company with Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Company Focus
          </label>
          <div className="relative">
            <Select
              value={settings.company}
              onValueChange={(value: Company) =>
                onSettingsChange({ company: value })
              }
              onOpenChange={setIsCompanyDropdownOpen}
            >
              <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                <SelectValue placeholder="Select company">
                  {getSelectedCompanyLabel()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {/* Search input */}
                <div className="p-2 border-b border-slate-600 sticky top-0 bg-slate-800 z-10">
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1 text-sm text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                
                {/* General option */}
                <SelectItem 
                  value="general"
                  className="text-white hover:bg-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <span>General</span>
                    <Badge variant="secondary" className="bg-slate-700 text-white text-xs">All</Badge>
                  </div>
                </SelectItem>
                
                {/* Loading state */}
                {isLoadingCompanies && (
                  <div className="p-3 text-center text-slate-400 text-sm flex justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Loading companies...
                  </div>
                )}
                
                {/* Filtered companies */}
                {!isLoadingCompanies && (
                  <div className="max-h-60 overflow-y-auto">
                    {filteredCompanies.map((item) => (
                      <SelectItem 
                        key={item.company} 
                        value={item.company}
                        className="text-white hover:bg-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <span>{item.company}</span>
                          <Badge variant="secondary" className="bg-slate-700 text-white text-xs">
                            {item.count}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                )}
                
                {filteredCompanies.length === 0 && companySearch && !isLoadingCompanies && (
                  <div className="p-3 text-center text-slate-400 text-sm">
                    No companies found
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-slate-500">
            Only showing companies with 10+ problems
          </p>
        </div>
        
        {/* Time Limit */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Time Limit
          </label>
          <Select
            value={settings.timeLimit ? `${settings.timeLimit}min` : '45min'}
            onValueChange={(value: string) =>
              onSettingsChange({ timeLimit: parseInt(value.replace('min', ''), 10) })
            }
          >
            <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
              <SelectValue placeholder="Select time limit" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="20min" className="text-white hover:bg-slate-700">
                20 minutes
              </SelectItem>
              <SelectItem value="30min" className="text-white hover:bg-slate-700">
                30 minutes
              </SelectItem>
              <SelectItem value="45min" className="text-white hover:bg-slate-700">
                45 minutes
              </SelectItem>
              <SelectItem value="60min" className="text-white hover:bg-slate-700">
                60 minutes
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Current Settings Display */}
        <div className="pt-4 border-t border-slate-600">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-slate-700 text-white">
              {getProblemTypeLabel(settings.problemType)}
            </Badge>
            <Badge variant="secondary" className="bg-slate-700 text-white">
              {settings.company === 'general' ? 'General' : settings.company}
            </Badge>
            <Badge variant="secondary" className={getDifficultyBadgeClass(settings.difficulty)}>
              {settings.difficulty === 'all' ? 'All Difficulties' : 
               settings.difficulty.charAt(0).toUpperCase() + settings.difficulty.slice(1)}
            </Badge>
            <Badge variant="secondary" className="bg-slate-700 text-white">
              {settings.timeLimit}min
            </Badge>
          </div>
        </div>
        
        {/* Start Interview Button */}
        <Button
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          onClick={onStartInterview}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Loading...
            </>
          ) : (
            'Start Interview'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProblemSetup;
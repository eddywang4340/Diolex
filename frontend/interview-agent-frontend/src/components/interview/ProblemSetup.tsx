// components/interview/ProblemSetup.tsx
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

const problemTypes: { value: ProblemType; label: string }[] = [
  { value: 'all', label: 'All Problems' },
  { value: 'arrays-hashing', label: 'Arrays & Hashing' },
  { value: 'two-pointers', label: 'Two Pointers' },
  { value: 'sliding-window', label: 'Sliding Window' },
  { value: 'stack', label: 'Stack' },
  { value: 'binary-search', label: 'Binary Search' },
  { value: 'linked-list', label: 'Linked List' },
  { value: 'trees', label: 'Trees' },
  { value: 'tries', label: 'Tries' },
  { value: 'heap-priority-queue', label: 'Heap / Priority Queue' },
  { value: 'backtracking', label: 'Backtracking' },
  { value: 'graphs', label: 'Graphs' },
  { value: 'advanced-graphs', label: 'Advanced Graphs' },
  { value: '1d-dp', label: '1-D Dynamic Programming' },
  { value: '2d-dp', label: '2-D Dynamic Programming' },
  { value: 'greedy', label: 'Greedy' },
  { value: 'intervals', label: 'Intervals' },
  { value: 'math-geometry', label: 'Math & Geometry' },
  { value: 'bit-manipulation', label: 'Bit Manipulation' },
];

const companies: { value: Company; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'google', label: 'Google' },
  { value: 'meta', label: 'Meta' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'microsoft', label: 'Microsoft' },
  { value: 'apple', label: 'Apple' },
  { value: 'netflix', label: 'Netflix' },
  { value: 'bloomberg', label: 'Bloomberg' },
  { value: 'goldman-sachs', label: 'Goldman Sachs' },
  { value: 'uber', label: 'Uber' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'salesforce', label: 'Salesforce' },
  { value: 'palantir', label: 'Palantir' },
];

const ProblemSetup = ({
  settings,
  onSettingsChange,
  onStartInterview,
  isLoading = false,
}: ProblemSetupProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/20 text-green-300 hover:bg-green-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30';
      case 'hard':
        return 'bg-red-500/20 text-red-300 hover:bg-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-cyan-400 flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          Interview Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Problem Type */}
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
              <SelectValue placeholder="Select problem type" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {problemTypes.map((type) => (
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

        {/* Company */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Company Focus
          </label>
          <Select
            value={settings.company}
            onValueChange={(value: Company) =>
              onSettingsChange({ company: value })
            }
          >
            <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {companies.map((company) => (
                <SelectItem 
                  key={company.value} 
                  value={company.value}
                  className="text-white hover:bg-slate-700"
                >
                  {company.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Difficulty */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
              <Button
                key={difficulty}
                variant={settings.difficulty === difficulty ? 'default' : 'outline'}
                size="sm"
                className={`${getDifficultyColor(difficulty)} border ${
                  settings.difficulty === difficulty 
                    ? 'ring-2 ring-white/50' 
                    : 'border-slate-600'
                }`}
                onClick={() => onSettingsChange({ difficulty })}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Time Limit */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Time Limit
          </label>
          <Select
            value={settings.timeLimit.toString()}
            onValueChange={(value) =>
              onSettingsChange({ timeLimit: parseInt(value) })
            }
          >
            <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="30" className="text-white hover:bg-slate-700">30 minutes</SelectItem>
              <SelectItem value="45" className="text-white hover:bg-slate-700">45 minutes</SelectItem>
              <SelectItem value="60" className="text-white hover:bg-slate-700">60 minutes</SelectItem>
              <SelectItem value="90" className="text-white hover:bg-slate-700">90 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Button */}
        <Button
          onClick={onStartInterview}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Starting Interview...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-10V9a3 3 0 01-3 3H8a3 3 0 01-3-3V4a3 3 0 013-3h8a3 3 0 013 3z" />
              </svg>
              Start Interview
            </div>
          )}
        </Button>

        {/* Current Settings Display */}
        <div className="pt-4 border-t border-slate-600">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-slate-700 text-slate-300">
              {problemTypes.find(t => t.value === settings.problemType)?.label}
            </Badge>
            <Badge variant="secondary" className="bg-slate-700 text-slate-300">
              {companies.find(c => c.value === settings.company)?.label}
            </Badge>
            <Badge variant="secondary" className={getDifficultyColor(settings.difficulty)}>
              {settings.difficulty.charAt(0).toUpperCase() + settings.difficulty.slice(1)}
            </Badge>
            <Badge variant="secondary" className="bg-slate-700 text-slate-300">
              {settings.timeLimit}min
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProblemSetup;
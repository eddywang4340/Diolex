// components/common/Timer.tsx
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTimer } from '../hooks/useTimer';

interface TimerProps {
  initialTime?: number; // in seconds
  onTimeUp?: () => void;
  autoStart?: boolean;
  className?: string;
}

const Timer = ({
  initialTime = 45 * 60, // 45 minutes default
  onTimeUp,
  autoStart = false,
  className = '',
}: TimerProps) => {
  const {
    timeRemaining,
    isRunning,
    isFinished,
    formattedTime,
    start,
    pause,
    reset,
  } = useTimer(initialTime);

  // Call onTimeUp when timer finishes
  useEffect(() => {
    if (isFinished && onTimeUp) {
      onTimeUp();
    }
  }, [isFinished, onTimeUp]);

  // Auto start if specified
  useEffect(() => {
    if (autoStart && !isRunning && timeRemaining > 0) {
      start();
    }
  }, [autoStart, isRunning, timeRemaining, start]);

  const getTimerColor = () => {
    const percentage = timeRemaining / initialTime;
    if (percentage > 0.5) return 'text-cyan-400';
    if (percentage > 0.25) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = () => {
    const percentage = timeRemaining / initialTime;
    if (percentage > 0.5) return 'bg-cyan-500';
    if (percentage > 0.25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const progressPercentage = (timeRemaining / initialTime) * 100;

  return (
    <div className={`flex items-center gap-3 bg-slate-900/50 rounded-lg px-4 py-2 border border-slate-700 ${className}`}>
      {/* Timer Display */}
      <div className="flex items-center gap-2">
        <div className={`text-xl font-mono font-bold ${getTimerColor()}`}>
          {formattedTime}
        </div>
        <div className={`w-2 h-2 rounded-full ${
          isRunning ? 'bg-green-400 animate-pulse' : 
          isFinished ? 'bg-red-400' : 'bg-slate-400'
        }`} />
      </div>

      {/* Compact Progress Bar */}
      <div className="flex-1 bg-slate-800 rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all duration-1000 ${getProgressColor()}`}
          style={{ width: `${Math.max(0, progressPercentage)}%` }}
        />
      </div>

      {/* Compact Control Buttons */}
      <div className="flex gap-1">
        {!isRunning ? (
          <Button
            onClick={start}
            disabled={isFinished}
            size="sm"
            className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700 text-white"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </Button>
        ) : (
          <Button
            onClick={pause}
            size="sm"
            className="h-7 w-7 p-0 bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </Button>
        )}

        <Button
          onClick={() => reset()}
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0 border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default Timer;
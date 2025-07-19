// components/common/Timer.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTimer } from '../../hooks/useTimer';

interface TimerProps {
  initialTime?: number; // in seconds
  onTimeUp?: () => void;
  autoStart?: boolean;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  initialTime = 45 * 60, // 45 minutes default
  onTimeUp,
  autoStart = false,
  className = '',
}) => {
  const {
    timeRemaining,
    isRunning,
    isFinished,
    formattedTime,
    start,
    pause,
    stop,
    reset,
  } = useTimer(initialTime);

  // Call onTimeUp when timer finishes
  React.useEffect(() => {
    if (isFinished && onTimeUp) {
      onTimeUp();
    }
  }, [isFinished, onTimeUp]);

  // Auto start if specified
  React.useEffect(() => {
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
    <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
      <CardContent className="p-6">
        <div className="text-center">
          {/* Timer Display */}
          <div className="mb-4">
            <div className={`text-4xl font-bold font-mono ${getTimerColor()}`}>
              {formattedTime}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              {isFinished ? 'Time\'s up!' : 'Time Remaining'}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor()}`}
              style={{ width: `${Math.max(0, progressPercentage)}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-2">
            {!isRunning ? (
              <Button
                onClick={start}
                disabled={isFinished}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Start
              </Button>
            ) : (
              <Button
                onClick={pause}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Pause
              </Button>
            )}

            <Button
              onClick={stop}
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop
            </Button>

            <Button
              onClick={() => reset()}
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Reset
            </Button>
          </div>

          {/* Status Indicator */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-green-400 animate-pulse' : 
              isFinished ? 'bg-red-400' : 'bg-slate-400'
            }`} />
            <span className="text-xs text-slate-400">
              {isRunning ? 'Running' : isFinished ? 'Finished' : 'Paused'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
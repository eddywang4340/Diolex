// hooks/useTimer.ts
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  isFinished: boolean;
  formattedTime: string;
  start: () => void;
  pause: () => void;
  stop: () => void;
  reset: (newTime?: number) => void;
}

export const useTimer = (initialTime: number = 45 * 60): UseTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isFinished = timeRemaining <= 0;

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const formattedTime = formatTime(timeRemaining);

  const start = useCallback(() => {
    if (timeRemaining > 0) {
      setIsRunning(true);
    }
  }, [timeRemaining]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback((newTime?: number) => {
    stop();
    setTimeRemaining(newTime ?? initialTime);
  }, [initialTime, stop]);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  // Auto-stop when time reaches 0
  useEffect(() => {
    if (timeRemaining <= 0) {
      setIsRunning(false);
    }
  }, [timeRemaining]);

  return {
    timeRemaining,
    isRunning,
    isFinished,
    formattedTime,
    start,
    pause,
    stop,
    reset,
  };
};
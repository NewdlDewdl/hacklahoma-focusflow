'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [focusScore, setFocusScore] = useState(85);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [distractionCount, setDistractionCount] = useState(0);

  // Mock data generator - simulates attention fluctuation
  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      // Random focus score between 60-100
      const newScore = Math.floor(Math.random() * 40) + 60;
      setFocusScore(newScore);
      
      // Simulate distraction detection
      if (newScore < 70) {
        setDistractionCount(prev => prev + 1);
      }

      // Increment session time
      setSessionTime(prev => prev + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  const startSession = () => {
    setIsSessionActive(true);
    setSessionTime(0);
    setDistractionCount(0);
    setFocusScore(95);
  };

  const endSession = () => {
    setIsSessionActive(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            FocusFlow
          </h1>
          <p className="text-purple-200 text-lg">
            AI-powered focus coaching with real-time feedback
          </p>
        </div>

        {/* Focus Score Display */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-6 border border-white/20">
          <div className="text-center mb-6">
            <div className="inline-block">
              <div className={`text-8xl font-bold transition-all duration-500 ${
                focusScore >= 80 ? 'text-green-400' :
                focusScore >= 60 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {focusScore}
              </div>
              <div className="text-purple-200 text-xl mt-2">Focus Score</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                focusScore >= 80 ? 'bg-green-400' :
                focusScore >= 60 ? 'bg-yellow-400' :
                'bg-red-400'
              }`}
              style={{ width: `${focusScore}%` }}
            />
          </div>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {formatTime(sessionTime)}
            </div>
            <div className="text-purple-200">Session Time</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {distractionCount}
            </div>
            <div className="text-purple-200">Distractions</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {Math.floor(sessionTime * focusScore / 100)}s
            </div>
            <div className="text-purple-200">Focused Time</div>
          </div>
        </div>

        {/* Session Controls */}
        <div className="flex gap-4 justify-center">
          {!isSessionActive ? (
            <button
              onClick={startSession}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-12 py-4 rounded-2xl text-xl font-semibold transition-all transform hover:scale-105 shadow-xl"
            >
              Start Focus Session
            </button>
          ) : (
            <button
              onClick={endSession}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-12 py-4 rounded-2xl text-xl font-semibold transition-all transform hover:scale-105 shadow-xl"
            >
              End Session
            </button>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 text-center text-purple-300 text-sm">
          <p>🔒 Not recording - only analyzing focus. Frames discarded immediately.</p>
          <p className="mt-2 text-purple-400/60">Camera indicator: {isSessionActive ? '🟢 Active' : '⚫ Inactive'}</p>
        </div>
      </div>
    </main>
  );
}

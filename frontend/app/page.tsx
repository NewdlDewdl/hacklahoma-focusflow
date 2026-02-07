'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useFocusSession } from '@/hooks/useFocusSession';
import { calculateFocusScore, getAttentionState } from '@/lib/humanConfig';
import { AnimatedNumber } from '@/components/AnimatedNumber';

// @ts-ignore - Human.js loaded via CDN in layout
declare const Human: any;

export default function Home() {
  const { isConnected, joinSession, onFocusUpdate, onNudge } = useSocket();
  const { session, user, isActive, startSession, endSession, sendFocusUpdate } = useFocusSession();
  
  const [focusScore, setFocusScore] = useState(95);
  const [sessionTime, setSessionTime] = useState(0);
  const [distractionCount, setDistractionCount] = useState(0);
  const [lastNudge, setLastNudge] = useState<string | null>(null);
  const [tokensEarned, setTokensEarned] = useState<number | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const humanRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Human.js
  useEffect(() => {
    if (typeof window === 'undefined' || !Human) return;

    const config = {
      backend: 'webgl',
      modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
      face: { 
        enabled: true, 
        detector: { rotation: true },
        mesh: { enabled: false },
        iris: { enabled: false }, 
        description: { enabled: false },
        emotion: { enabled: false }
      },
      body: { enabled: false },
      hand: { enabled: false },
      object: { enabled: false },
      gesture: { enabled: false }
    };

    humanRef.current = new Human.Human(config);
    humanRef.current.load().then(() => {
      console.log('✅ Human.js loaded');
    });
  }, []);

  // Listen for real-time focus updates from backend
  useEffect(() => {
    onFocusUpdate((data) => {
      setFocusScore(data.focusScore);
      if (data.attentionState === 'distracted') {
        setDistractionCount(prev => prev + 1);
      }
    });

    onNudge((data) => {
      console.log('🔔 Nudge received:', data.message);
      setLastNudge(data.message);
      
      // Play ElevenLabs TTS audio (base64 data URI from backend)
      if (data.audio) {
        try {
          const audio = new Audio(data.audio);
          audio.play().catch(err => console.warn('Audio play blocked:', err));
        } catch (err) {
          console.warn('Audio creation failed:', err);
        }
      }
      
      setTimeout(() => setLastNudge(null), 5000);
    });
  }, [onFocusUpdate, onNudge]);

  // Session timer
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  // Human.js attention tracking loop
  useEffect(() => {
    if (!isActive || !humanRef.current || !videoRef.current) return;

    const detectLoop = async () => {
      try {
        const result = await humanRef.current.detect(videoRef.current);
        
        if (result.face && result.face.length > 0) {
          const face = result.face[0];
          const rotation = face.rotation?.angle || { yaw: 0, pitch: 0, roll: 0 };
          
          const score = calculateFocusScore(rotation.yaw, rotation.pitch);
          const state = getAttentionState(score);
          
          // Send to backend
          await sendFocusUpdate(score, state, {
            yaw: rotation.yaw,
            pitch: rotation.pitch,
            roll: rotation.roll
          });
          
          // Update local state
          setFocusScore(score);
        }
      } catch (err) {
        console.error('Human.js detection error:', err);
      }
    };

    const interval = setInterval(detectLoop, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [isActive, sendFocusUpdate]);

  const handleStartSession = async () => {
    try {
      // Request webcam permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      // Start backend session
      const newSession = await startSession('solo');
      
      // Join socket room for real-time updates
      joinSession(newSession._id);
      
      // Reset stats
      setSessionTime(0);
      setDistractionCount(0);
      setFocusScore(95);
      setTokensEarned(null);
    } catch (err) {
      console.error('Failed to start session:', err);
      alert('Camera permission required to start focus tracking');
    }
  };

  const handleEndSession = async () => {
    try {
      // Stop webcam
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // End backend session
      const result = await endSession();
      if (result) {
        setTokensEarned(result.tokensEarned);
      }
    } catch (err) {
      console.error('Failed to end session:', err);
    }
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
          <div className="mt-2 text-sm text-purple-300/60">
            Socket: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>

        {/* Nudge Alert */}
        {lastNudge && (
          <div className="mb-6 bg-yellow-500/20 border border-yellow-500/50 rounded-2xl p-4 text-center animate-pulse">
            <p className="text-yellow-200 text-lg font-semibold">
              🔔 {lastNudge}
            </p>
          </div>
        )}

        {/* Webcam (hidden) */}
        <div className="hidden">
          <video ref={videoRef} autoPlay muted playsInline />
          <canvas ref={canvasRef} />
        </div>

        {/* Focus Score Display */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 mb-6 border border-white/20">
          <div className="text-center mb-6">
            <div className="inline-block">
              <AnimatedNumber
                value={Math.round(focusScore)}
                className={`text-8xl font-bold transition-all duration-500 ${
                  focusScore >= 80 ? 'text-green-400' :
                  focusScore >= 60 ? 'text-yellow-400' :
                  'text-red-400'
                }`}
              />
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

        {/* Tokens Earned (after session ends) */}
        {tokensEarned !== null && (
          <div className="mb-6 bg-green-500/20 border border-green-500/50 rounded-2xl p-6 text-center">
            <p className="text-green-200 text-2xl font-bold mb-2">
              🪙 {tokensEarned} FOCUS Tokens Earned!
            </p>
            <p className="text-green-300/80 text-sm">
              {user?.currentStreak || 0} day streak
            </p>
          </div>
        )}

        {/* Session Controls */}
        <div className="flex gap-4 justify-center">
          {!isActive ? (
            <button
              onClick={handleStartSession}
              disabled={!isConnected}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-12 py-4 rounded-2xl text-xl font-semibold transition-all transform hover:scale-105 shadow-xl"
            >
              Start Focus Session
            </button>
          ) : (
            <button
              onClick={handleEndSession}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-12 py-4 rounded-2xl text-xl font-semibold transition-all transform hover:scale-105 shadow-xl"
            >
              End Session
            </button>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 text-center text-purple-300 text-sm">
          <p>🔒 Not recording - only analyzing focus. Frames discarded immediately.</p>
          <p className="mt-2 text-purple-400/60">
            Camera: {isActive ? '🟢 Active' : '⚫ Inactive'} | 
            Session: {isActive ? '🟢 Active' : '⚫ Inactive'}
          </p>
        </div>
      </div>
    </main>
  );
}

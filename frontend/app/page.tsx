'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { useFocusSession } from '@/hooks/useFocusSession';
import { useRoom } from '@/hooks/useRoom';
import { calculateFocusScore, getAttentionState } from '@/lib/humanConfig';
import { AnimatedScore } from '@/components/AnimatedScore';
import { FocusChart } from '@/components/FocusChart';
import { FocusScoreRing } from '@/components/FocusScoreRing';
import { RoomLobby } from '@/components/RoomLobby';
import { RoomLeaderboard } from '@/components/RoomLeaderboard';
import { StatCard } from '@/components/StatCard';

export default function Home() {
  const { socket, isConnected, joinSession, onFocusUpdate, onNudge } = useSocket();
  const { session, user, isActive, startSession, endSession, sendFocusUpdate } = useFocusSession();
  const { room, lobby, isInRoom, peerScores, fetchLobby, createRoom, joinRoom, leaveRoom } = useRoom(socket);

  const [focusScore, setFocusScore] = useState(95);
  const [sessionTime, setSessionTime] = useState(0);
  const [distractionCount, setDistractionCount] = useState(0);
  const [lastNudge, setLastNudge] = useState<string | null>(null);
  const [tokensEarned, setTokensEarned] = useState<number | null>(null);
  const [focusHistory, setFocusHistory] = useState<{ time: string; score: number; nudge?: boolean }[]>([]);
  const [mode, setMode] = useState<'solo' | 'multiplayer'>('solo');
  const [displayName, setDisplayName] = useState('');
  const [userId] = useState(() => typeof window !== 'undefined' ? `user_${Math.random().toString(36).slice(2, 8)}` : 'user_anon');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const humanRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Human.js (wait for CDN script to load)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initHuman = () => {
      // @ts-ignore
      if (!window.Human) {
        console.log('⏳ Waiting for Human.js CDN...');
        setTimeout(initHuman, 100);
        return;
      }

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

      // @ts-ignore
      humanRef.current = new window.Human.Human(config);
      humanRef.current.load().then(() => {
        console.log('✅ Human.js loaded and ready');
      });
    };

    initHuman();
  }, []);

  // Listen for real-time focus updates from backend
  useEffect(() => {
    onFocusUpdate((data) => {
      setFocusScore(data.focusScore);
      if (data.attentionState === 'distracted') {
        setDistractionCount(prev => prev + 1);
      }

      // Track focus history for chart
      setFocusHistory(prev => [
        ...prev,
        {
          time: formatTime(sessionTime),
          score: data.focusScore,
        }
      ]);
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

          // Broadcast to room if in multiplayer
          if (isInRoom && room && socket) {
            socket.emit('focus:broadcast', {
              roomId: room.id,
              userId,
              displayName: displayName || 'Anonymous',
              focusScore: score,
            });
          }
        }
      } catch (err) {
        console.error('Human.js detection error:', err);
      }
    };

    const interval = setInterval(detectLoop, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [isActive, sendFocusUpdate, isInRoom, room, socket, userId, displayName]);

  // Room handlers
  const handleCreateRoom = async (name: string) => {
    const roomId = await createRoom(name);
    if (roomId) {
      await joinRoom(roomId, userId, displayName || 'Anonymous');
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    await joinRoom(roomId, userId, displayName || 'Anonymous');
  };

  const handleLeaveRoom = async () => {
    if (room) {
      await leaveRoom(room.id, userId);
      setMode('solo');
    }
  };

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
      setFocusHistory([]);
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
    <main className="min-h-screen bg-background map-lines p-8 text-foreground">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4 tracking-tight font-title-serif">
            FocusFlow
          </h1>
          <p className="text-[color:var(--muted-foreground)] text-lg">
            AI-powered focus coaching with real-time feedback
          </p>
          {!isConnected && (
            <div className="mt-2 text-sm text-[#B36B4C]/80">
              ⚠️ Connecting to server...
            </div>
          )}
        </div>

        {/* Mode Toggle (only when not in active session) */}
        {!isActive && (
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setMode('solo')}
              className={`px-6 py-2 rounded-xl font-semibold transition-all border ${
                mode === 'solo'
                  ? 'bg-[color:var(--accent)] text-[color:var(--foreground)] border-[color:var(--border)] shadow-sm'
                  : 'bg-[color:var(--card)]/70 text-[color:var(--muted-foreground)] border-[color:var(--border)]/60 hover:bg-[color:var(--card)]'
              }`}
            >
              🎯 Solo Focus
            </button>
            <button
              onClick={() => { setMode('multiplayer'); fetchLobby(); }}
              className={`px-6 py-2 rounded-xl font-semibold transition-all border ${
                mode === 'multiplayer'
                  ? 'bg-[color:var(--accent)] text-[color:var(--foreground)] border-[color:var(--border)] shadow-sm'
                  : 'bg-[color:var(--card)]/70 text-[color:var(--muted-foreground)] border-[color:var(--border)]/60 hover:bg-[color:var(--card)]'
              }`}
            >
              🎮 Multiplayer
            </button>
          </div>
        )}

        {/* Display Name Input (multiplayer) */}
        {mode === 'multiplayer' && !isInRoom && !isActive && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Your display name..."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full max-w-xs mx-auto block bg-[color:var(--card)] border border-[color:var(--border)] rounded-xl px-4 py-3 text-[color:var(--foreground)] placeholder-[color:var(--muted-foreground)]/60 focus:outline-none focus:border-[color:var(--ring)] text-center"
              maxLength={20}
            />
          </div>
        )}

        {/* Room Lobby (multiplayer, not yet in room) */}
        {mode === 'multiplayer' && !isInRoom && !isActive && (
          <div className="mb-8">
            <RoomLobby
              lobby={lobby}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onRefresh={fetchLobby}
            />
          </div>
        )}

        {/* Room Leaderboard (in room, during session) */}
        {isInRoom && room && (
          <div className="mb-6">
            <RoomLeaderboard
              roomName={room.name}
              roomCode={room.id}
              myDisplayName={displayName || 'Anonymous'}
              myScore={focusScore}
              peerScores={peerScores}
              onLeave={handleLeaveRoom}
            />
          </div>
        )}

        {/* Nudge Alert */}
        {lastNudge && (
          <div className="mb-6 bg-[#C2A15E]/20 border border-[#C2A15E]/50 rounded-2xl p-4 text-center animate-pulse">
            <p className="text-[color:var(--foreground)] text-lg font-semibold">
              🔔 {lastNudge}
            </p>
          </div>
        )}

        {/* Webcam (hidden) */}
        <div className="hidden">
          <video ref={videoRef} autoPlay muted playsInline />
          <canvas ref={canvasRef} />
        </div>

        {/* Focus Score Ring — hide in multiplayer lobby when not in session */}
        <div className={`flex justify-center mb-8 ${mode === 'multiplayer' && !isInRoom && !isActive ? 'hidden' : ''}`}>
          <FocusScoreRing score={focusScore} size={260} />
        </div>

        {/* Session Stats — hide in multiplayer lobby */}
        <div className={`grid grid-cols-3 gap-4 mb-8 ${mode === 'multiplayer' && !isInRoom && !isActive ? 'hidden' : ''}`}>
          <StatCard value={formatTime(sessionTime)} label="Session Time" delay={0.1} />
          <StatCard value={distractionCount} label="Distractions" delay={0.2} />
          <StatCard value={formatTime(Math.floor(sessionTime * focusScore / 100))} label="Focused Time" delay={0.3} />
        </div>

        {/* Focus Timeline Chart (only show during active session with history) */}
        {isActive && focusHistory.length > 0 && (
          <FocusChart data={focusHistory} className="mb-8" />
        )}

        {/* Tokens Earned (after session ends) */}
        {tokensEarned !== null && (
          <div className="mb-6 bg-[#7C8B6F]/15 border border-[#7C8B6F]/40 rounded-2xl p-6 text-center paper-texture">
            <p className="text-[color:var(--foreground)] text-2xl font-bold mb-2">
              🪙 {tokensEarned} FOCUS Tokens Earned!
            </p>
            <p className="text-[color:var(--muted-foreground)]/70 text-sm">
              {user?.currentStreak || 0} day streak
            </p>
          </div>
        )}

        {/* Session Controls */}
        <div className="flex gap-4 justify-center">
          {!isActive ? (
            <motion.button
              onClick={handleStartSession}
              disabled={!isConnected}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="action-button relative bg-gradient-to-r from-[#C2A15E] to-[#B36B4C] disabled:from-[#B8B1A3] disabled:to-[#9B9284] disabled:cursor-not-allowed text-[color:var(--foreground)] px-14 py-4 rounded-2xl text-xl font-semibold shadow-xl overflow-hidden"
            >
              <span className="relative z-10">Start Focus Session</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/30 to-[#B36B4C]/20 opacity-0 hover:opacity-100 transition-opacity"
                animate={{ opacity: [0, 0.25, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.button>
          ) : (
            <motion.button
              onClick={handleEndSession}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="action-button bg-gradient-to-r from-[#B36B4C] to-[#8B7A5A] text-[color:var(--foreground)] px-14 py-4 rounded-2xl text-xl font-semibold shadow-xl"
            >
              End Session
            </motion.button>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 text-center text-[color:var(--muted-foreground)] text-sm">
          <p>🔒 Not recording - only analyzing focus. Frames discarded immediately.</p>
          <p className="mt-2 text-[color:var(--muted-foreground)]/60">
            Camera: {isActive ? '🟢 Active' : '⚫ Inactive'} |
            Session: {isActive ? '🟢 Active' : '⚫ Inactive'}
          </p>
        </div>
      </div>
    </main>
  );
}

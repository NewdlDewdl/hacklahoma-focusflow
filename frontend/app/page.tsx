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
import { NavBar } from '@/components/NavBar';

type Tab = 'dashboard' | 'solo' | 'multiplayer' | 'settings';

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
  const [activeTab, setActiveTab] = useState<Tab>('solo');
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
      setActiveTab('solo');
    }
  };

  const handleStartSession = async () => {
    try {
      // DEV MODE: Skip camera requirement for testing
      const isDev = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
      
      if (!isDev) {
        // Request webcam permission (production mode)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } else {
        console.log('🔧 DEV MODE: Skipping camera requirement');
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
      <NavBar 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'multiplayer') fetchLobby();
        }} 
        isConnected={isConnected} 
      />

      <div className="max-w-4xl mx-auto pt-24">
        {/* Dashboard Placeholder */}
        {activeTab === 'dashboard' && (
          <div className="text-center py-12">
            <h2 className="text-4xl font-bold mb-4 font-title-serif">Your Dashboard</h2>
            <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="bg-card paper-texture p-6 rounded-2xl border border-border">
                <div className="text-3xl font-bold mb-1">7</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Day Streak</div>
              </div>
              <div className="bg-card paper-texture p-6 rounded-2xl border border-border">
                <div className="text-3xl font-bold mb-1">1,240</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Total Focus Minutes</div>
              </div>
            </div>
            <p className="mt-8 text-muted-foreground">More stats coming soon...</p>
          </div>
        )}

        {/* Settings Placeholder */}
        {activeTab === 'settings' && (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4 font-title-serif">Settings</h2>
            <div className="max-w-md mx-auto bg-card paper-texture p-8 rounded-2xl border border-border">
              <div className="flex justify-between items-center mb-4">
                <span>Dark Mode</span>
                <span className="text-muted-foreground text-sm">System Default</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span>Camera Source</span>
                <span className="text-muted-foreground text-sm">FaceTime HD</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Notifications</span>
                <span className="text-green-600 font-bold">Enabled</span>
              </div>
            </div>
          </div>
        )}

        {/* Solo & Multiplayer Content */}
        {(activeTab === 'solo' || activeTab === 'multiplayer') && (
          <>
            {/* Header - only show if not active session */}
            {!isActive && (
              <div className="text-center mb-12">
                <h1 className="text-5xl font-bold text-foreground mb-4 tracking-tight font-title-serif">
                  {activeTab === 'solo' ? 'Solo Focus' : 'Multiplayer Arena'}
                </h1>
                <p className="text-[color:var(--muted-foreground)] text-lg">
                  {activeTab === 'solo' 
                    ? 'Deep work with AI coaching' 
                    : 'Compete with friends in real-time'}
                </p>
              </div>
            )}

            {/* Display Name Input (multiplayer setup) */}
            {activeTab === 'multiplayer' && !isInRoom && !isActive && (
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

            {/* Room Lobby (multiplayer setup) */}
            {activeTab === 'multiplayer' && !isInRoom && !isActive && (
              <div className="mb-8">
                <RoomLobby
                  lobby={lobby}
                  onCreateRoom={handleCreateRoom}
                  onJoinRoom={handleJoinRoom}
                  onRefresh={fetchLobby}
                />
              </div>
            )}

            {/* Room Leaderboard (multiplayer active) */}
            {activeTab === 'multiplayer' && isInRoom && room && (
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

            {/* Focus Score Ring */}
            {/* Show in Solo (always if active, or setup) AND Multiplayer (only if active/in-room) */}
            <div className={`flex justify-center mb-8 ${
              (activeTab === 'multiplayer' && !isInRoom && !isActive) ? 'hidden' : ''
            }`}>
              <FocusScoreRing score={focusScore} size={260} />
            </div>

            {/* Session Stats */}
            <div className={`grid grid-cols-3 gap-4 mb-8 ${
              (activeTab === 'multiplayer' && !isInRoom && !isActive) ? 'hidden' : ''
            }`}>
              <StatCard value={formatTime(sessionTime)} label="Session Time" delay={0.1} />
              <StatCard value={distractionCount} label="Distractions" delay={0.2} />
              <StatCard value={formatTime(Math.floor(sessionTime * focusScore / 100))} label="Focused Time" delay={0.3} />
            </div>

            {/* Focus Timeline Chart */}
            {isActive && focusHistory.length > 0 && (
              <FocusChart data={focusHistory} className="mb-8" />
            )}

            {/* Tokens Earned */}
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
                // Only show Start button if NOT in multiplayer lobby (lobby handles its own join)
                // Actually multiplayer lobby joins a ROOM, but the SESSION starts when?
                // The current logic: join room -> session starts?
                // Re-reading handleJoinRoom: it just joins room.
                // The room logic in backend probably handles start?
                // Wait, handleStartSession starts a SOLO session.
                // Does multiplayer have a "Start" button?
                // In previous logic: "Start Focus Session" was shown when !isActive.
                // If in multiplayer room, do we show "Start"?
                // The RoomLeaderboard is shown if isInRoom.
                // Logic seems: Join Room -> Active?
                // Let's check handleJoinRoom again.
                // It just joins socket room.
                // isActive comes from useFocusSession hook.
                // Multiplayer might need a "Ready" check or auto-start.
                // For now, I'll hide "Start Focus Session" button if activeTab is multiplayer.
                // Users in multiplayer join room and maybe session starts automatically?
                // Or maybe they click "Start" individually?
                // The previous code showed "Start Focus Session" for everyone if !isActive.
                // But in multiplayer, you join a room first.
                activeTab === 'solo' && (
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
                )
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
          </>
        )}
      </div>
    </main>
  );
}

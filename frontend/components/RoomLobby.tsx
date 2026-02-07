'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoomListing {
  id: string;
  name: string;
  userCount: number;
  maxUsers: number;
}

interface RoomLobbyProps {
  lobby: RoomListing[];
  onCreateRoom: (name: string) => void;
  onJoinRoom: (roomId: string) => void;
  onRefresh: () => void;
}

export function RoomLobby({ lobby, onCreateRoom, onJoinRoom, onRefresh }: RoomLobbyProps) {
  const [roomName, setRoomName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [tab, setTab] = useState<'join' | 'create'>('join');

  useEffect(() => {
    onRefresh();
    const interval = setInterval(onRefresh, 5000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card paper-texture rounded-3xl p-8 border border-border"
    >
      <h2 className="text-2xl font-bold text-[color:var(--foreground)] mb-6 text-center">
        🎮 Multiplayer Focus
      </h2>

      {/* Tab Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('join')}
          className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
            tab === 'join'
              ? 'bg-[#7C8B6F] text-[color:var(--foreground)]'
              : 'bg-[color:var(--card)]/80 text-[color:var(--muted-foreground)] hover:bg-[color:var(--card)]'
          }`}
        >
          Join Room
        </button>
        <button
          onClick={() => setTab('create')}
          className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
            tab === 'create'
              ? 'bg-[#7C8B6F] text-[color:var(--foreground)]'
              : 'bg-[color:var(--card)]/80 text-[color:var(--muted-foreground)] hover:bg-[color:var(--card)]'
          }`}
        >
          Create Room
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'join' ? (
          <motion.div
            key="join"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {/* Join by Code */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Enter room code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.trim())}
                className="flex-1 bg-[color:var(--card)]/80 border border-[color:var(--border)] rounded-xl px-4 py-3 text-[color:var(--foreground)] placeholder-[color:var(--muted-foreground)]/60 focus:outline-none focus:border-[color:var(--ring)] font-mono text-lg tracking-wider"
                maxLength={8}
              />
              <button
                onClick={() => joinCode && onJoinRoom(joinCode)}
                disabled={!joinCode}
                className="bg-[#7C8B6F] hover:bg-[#6D8D8A] disabled:bg-[#B8B1A3] disabled:cursor-not-allowed text-[color:var(--foreground)] px-6 py-3 rounded-xl font-semibold transition-all"
              >
                Join
              </button>
            </div>

            {/* Active Rooms */}
            {lobby.length > 0 ? (
              <div className="space-y-3">
                <p className="text-[color:var(--muted-foreground)]/70 text-sm uppercase tracking-wide">Active Rooms</p>
                {lobby.map((room) => (
                  <motion.button
                    key={room.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onJoinRoom(room.id)}
                    disabled={room.userCount >= room.maxUsers}
                    className="w-full flex items-center justify-between bg-[color:var(--card)]/80 hover:bg-[color:var(--card)] disabled:opacity-50 border border-[color:var(--border)] rounded-xl p-4 transition-all text-left"
                  >
                    <div>
                      <p className="text-[color:var(--foreground)] font-semibold">{room.name}</p>
                      <p className="text-[color:var(--muted-foreground)]/70 text-sm font-mono">{room.id}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${room.userCount >= room.maxUsers ? 'text-[#B36B4C]' : 'text-[#7C8B6F]'}`}>
                        {room.userCount}/{room.maxUsers}
                      </p>
                      <p className="text-[color:var(--muted-foreground)]/70 text-xs">
                        {room.userCount >= room.maxUsers ? 'Full' : 'Open'}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <p className="text-center text-[color:var(--muted-foreground)]/50 py-4">
                No active rooms — create one!
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <input
              type="text"
              placeholder="Room name (e.g. 'Study Sesh')"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-[color:var(--card)]/80 border border-[color:var(--border)] rounded-xl px-4 py-3 text-[color:var(--foreground)] placeholder-[color:var(--muted-foreground)]/60 focus:outline-none focus:border-[color:var(--ring)] mb-4"
              maxLength={30}
            />
            <button
              onClick={() => {
                onCreateRoom(roomName || 'Study Room');
                setRoomName('');
              }}
              className="w-full bg-gradient-to-r from-[#C2A15E] to-[#B36B4C] hover:from-[#C2A15E] hover:to-[#B36B4C] text-[color:var(--foreground)] py-3 rounded-xl font-semibold transition-all shadow-lg"
            >
              Create & Join
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

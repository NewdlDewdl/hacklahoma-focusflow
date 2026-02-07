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
      className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20"
    >
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        🎮 Multiplayer Focus
      </h2>

      {/* Tab Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('join')}
          className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
            tab === 'join'
              ? 'bg-purple-500 text-white'
              : 'bg-white/5 text-purple-300 hover:bg-white/10'
          }`}
        >
          Join Room
        </button>
        <button
          onClick={() => setTab('create')}
          className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
            tab === 'create'
              ? 'bg-purple-500 text-white'
              : 'bg-white/5 text-purple-300 hover:bg-white/10'
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
                className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 font-mono text-lg tracking-wider"
                maxLength={8}
              />
              <button
                onClick={() => joinCode && onJoinRoom(joinCode)}
                disabled={!joinCode}
                className="bg-purple-500 hover:bg-purple-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all"
              >
                Join
              </button>
            </div>

            {/* Active Rooms */}
            {lobby.length > 0 ? (
              <div className="space-y-3">
                <p className="text-purple-300/60 text-sm uppercase tracking-wide">Active Rooms</p>
                {lobby.map((room) => (
                  <motion.button
                    key={room.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onJoinRoom(room.id)}
                    disabled={room.userCount >= room.maxUsers}
                    className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 rounded-xl p-4 transition-all text-left"
                  >
                    <div>
                      <p className="text-white font-semibold">{room.name}</p>
                      <p className="text-purple-300/60 text-sm font-mono">{room.id}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${room.userCount >= room.maxUsers ? 'text-red-400' : 'text-green-400'}`}>
                        {room.userCount}/{room.maxUsers}
                      </p>
                      <p className="text-purple-300/60 text-xs">
                        {room.userCount >= room.maxUsers ? 'Full' : 'Open'}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <p className="text-center text-purple-300/40 py-4">
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
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 mb-4"
              maxLength={30}
            />
            <button
              onClick={() => {
                onCreateRoom(roomName || 'Study Room');
                setRoomName('');
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white py-3 rounded-xl font-semibold transition-all shadow-lg"
            >
              Create & Join
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

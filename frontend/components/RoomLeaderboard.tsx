'use client';

import { motion } from 'framer-motion';
import { AnimatedScore } from './AnimatedScore';

interface PeerScore {
  displayName: string;
  focusScore: number;
}

interface RoomLeaderboardProps {
  roomName: string;
  roomCode: string;
  myDisplayName: string;
  myScore: number;
  peerScores: Record<string, PeerScore>;
  onLeave: () => void;
}

export function RoomLeaderboard({
  roomName,
  roomCode,
  myDisplayName,
  myScore,
  peerScores,
  onLeave,
}: RoomLeaderboardProps) {
  // Combine self + peers, sort by score descending
  const allUsers = [
    { displayName: myDisplayName, focusScore: myScore, isMe: true },
    ...Object.values(peerScores).map(p => ({ ...p, isMe: false })),
  ].sort((a, b) => b.focusScore - a.focusScore);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#7C8B6F]';
    if (score >= 60) return 'text-[#C2A15E]';
    return 'text-[#B36B4C]';
  };

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card paper-texture rounded-3xl p-6 border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-[color:var(--foreground)]">{roomName}</h3>
          <p className="text-[color:var(--muted-foreground)]/70 text-sm font-mono">
            Code: {roomCode} · {allUsers.length} studying
          </p>
        </div>
        <button
          onClick={onLeave}
          className="text-[color:var(--muted-foreground)]/70 hover:text-[#B36B4C] text-sm transition-colors"
        >
          Leave Room
        </button>
      </div>

      <div className="space-y-2">
        {allUsers.map((user, i) => (
          <motion.div
            key={user.displayName}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center justify-between p-3 rounded-xl transition-all ${
              user.isMe
                ? 'bg-[#7C8B6F]/15 border border-[#7C8B6F]/40'
                : 'bg-[color:var(--card)]/80 border border-[color:var(--border)]/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg w-8 text-center">{getMedal(i)}</span>
              <span className={`font-semibold ${user.isMe ? 'text-[color:var(--foreground)]' : 'text-[color:var(--foreground)]'}`}>
                {user.displayName}
                {user.isMe && <span className="text-[#B36B4C] text-xs ml-1">(you)</span>}
              </span>
            </div>
            <div className={`font-bold text-xl ${getScoreColor(user.focusScore)}`}>
              <AnimatedScore value={user.focusScore} className="font-mono" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

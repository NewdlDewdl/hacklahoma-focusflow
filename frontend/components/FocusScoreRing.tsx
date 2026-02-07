'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FocusScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function FocusScoreRing({ score, size = 240, strokeWidth = 8, className = '' }: FocusScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Animated score number
  const spring = useSpring(0, { stiffness: 60, damping: 15 });
  const displayScore = useTransform(spring, (v) => Math.round(v));
  const [rendered, setRendered] = useState(0);

  useEffect(() => {
    spring.set(score);
    const unsub = displayScore.on('change', (v) => setRendered(v));
    return unsub;
  }, [score, spring, displayScore]);

  // Color based on score
  const getColor = (s: number) => {
    if (s >= 80) return { ring: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)', text: 'text-green-400' };
    if (s >= 60) return { ring: '#eab308', glow: 'rgba(234, 179, 8, 0.3)', text: 'text-yellow-400' };
    return { ring: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)', text: 'text-red-400' };
  };

  const color = getColor(score);
  const progress = score / 100;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Outer glow */}
      <div
        className="absolute rounded-full blur-2xl opacity-60 transition-all duration-1000"
        style={{
          width: size + 40,
          height: size + 40,
          background: `radial-gradient(circle, ${color.glow} 0%, transparent 70%)`,
        }}
      />

      {/* SVG ring */}
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color.ring}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 8px ${color.glow})`,
          }}
        />
      </svg>

      {/* Score text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-7xl font-bold tabular-nums ${color.text}`}>
          {rendered}
        </span>
        <span className="text-purple-300/80 text-sm mt-1 uppercase tracking-widest">
          Focus Score
        </span>
      </div>
    </div>
  );
}

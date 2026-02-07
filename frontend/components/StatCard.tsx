'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  delay?: number;
}

export function StatCard({ value, label, icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="group relative bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 text-center overflow-hidden transition-all hover:bg-white/8 hover:border-white/20 hover:shadow-lg hover:shadow-purple-500/5"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500" />
      
      <div className="relative z-10">
        {icon && <div className="text-purple-400/60 mb-2">{icon}</div>}
        <div className="text-3xl font-bold text-white mb-1 tabular-nums">
          {value}
        </div>
        <div className="text-purple-300/60 text-sm uppercase tracking-wider">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

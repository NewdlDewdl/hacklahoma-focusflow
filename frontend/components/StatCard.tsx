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
      whileHover={{ scale: 1.02, y: -1 }}
      className="group relative bg-[color:var(--card)] rounded-2xl p-6 border border-[color:var(--border)] text-center overflow-hidden transition-all"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#C2A15E]/0 to-[#B36B4C]/0 group-hover:from-[#C2A15E]/6 group-hover:to-[#B36B4C]/6 transition-all duration-500" />
      
      <div className="relative z-10">
        {icon && <div className="text-[color:var(--muted-foreground)]/70 mb-2">{icon}</div>}
        <div className="text-3xl font-bold text-[color:var(--foreground)] mb-1 tabular-nums font-mono">
          {value}
        </div>
        <div className="text-[color:var(--muted-foreground)]/80 text-sm uppercase tracking-wider">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

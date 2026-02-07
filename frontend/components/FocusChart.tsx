'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';

interface FocusDataPoint {
  time: string; // e.g. "0:30", "1:00"
  score: number;
  nudge?: boolean;
}

interface FocusChartProps {
  data: FocusDataPoint[];
  className?: string;
}

export function FocusChart({ data, className = '' }: FocusChartProps) {
  if (data.length < 2) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 ${className}`}
    >
      <h3 className="text-white text-lg font-semibold mb-4">Focus Timeline</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="time"
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
            }}
            formatter={(value: number) => [`${value}`, 'Focus Score']}
          />
          {/* Threshold lines */}
          <ReferenceLine y={80} stroke="rgba(74,222,128,0.4)" strokeDasharray="5 5" label="" />
          <ReferenceLine y={50} stroke="rgba(250,204,21,0.4)" strokeDasharray="5 5" label="" />
          {/* Focus score line with gradient effect */}
          <Line
            type="monotone"
            dataKey="score"
            stroke="url(#focusGradient)"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }}
          />
          <defs>
            <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

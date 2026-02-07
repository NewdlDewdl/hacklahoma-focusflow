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
      className={`bg-card paper-texture rounded-2xl p-6 border border-border ${className}`}
    >
      <h3 className="text-[color:var(--foreground)] text-lg font-semibold mb-4">Focus Timeline</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(43,43,43,0.12)" />
          <XAxis
            dataKey="time"
            stroke="rgba(43,43,43,0.6)"
            tick={{ fill: 'rgba(43,43,43,0.6)', fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="rgba(43,43,43,0.6)"
            tick={{ fill: 'rgba(43,43,43,0.6)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#F9F5EA',
              border: '1px solid #D8CFBE',
              borderRadius: '8px',
              color: '#2B2B2B',
            }}
            formatter={(value: number) => [`${value}`, 'Focus Score']}
          />
          {/* Threshold lines */}
          <ReferenceLine y={80} stroke="rgba(124,139,111,0.4)" strokeDasharray="5 5" label="" />
          <ReferenceLine y={50} stroke="rgba(194,161,94,0.4)" strokeDasharray="5 5" label="" />
          {/* Focus score line with gradient effect */}
          <Line
            type="monotone"
            dataKey="score"
            stroke="url(#focusGradient)"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#C2A15E', stroke: '#2B2B2B', strokeWidth: 2 }}
          />
          <defs>
            <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C8B6F" />
              <stop offset="50%" stopColor="#C2A15E" />
              <stop offset="100%" stopColor="#B36B4C" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { API_URL } from '@/lib/api';
import { StatCard } from './StatCard';

interface DashboardData {
  source: string;
  globalStats: {
    totalSessions?: number;
    completedSessions?: number;
    avgFocusScore?: number;
    peakFocusScore?: number;
    totalTokensEarned?: number;
    avgDurationMinutes?: number;
    totalNudges?: number;
  };
  topUsers: Array<{
    userId: string;
    displayName: string;
    sessionCount: number;
    avgScore: number;
    totalTokens: number;
    streak: number;
  }>;
  focusDistribution: Array<{
    _id: number | string;
    count: number;
    avgTokens: number;
  }>;
  distractionBreakdown: Record<string, number>;
  recentSessions: Array<{
    _id: string;
    status: string;
    startedAt: string;
    avgFocusScore: number;
    tokensEarned: number;
    displayName: string;
    durationMinutes: number | null;
  }>;
  hourlyPatterns: Array<{
    hour: number;
    avgScore: number;
    readingCount: number;
  }>;
}

const COLORS = ['#7C8B6F', '#C2A15E', '#B36B4C', '#8B7A5A', '#D4AF37'];

const bucketLabels: Record<string, string> = {
  '0': '0–20',
  '20': '20–40',
  '40': '40–60',
  '60': '60–80',
  '80': '80–100',
};

export function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch(`${API_URL}/api/analytics/dashboard`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="inline-block w-8 h-8 border-2 border-[#C2A15E] border-t-transparent rounded-full"
        />
        <p className="text-muted-foreground mt-4">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[#B36B4C] mb-2">Failed to load analytics</p>
        <p className="text-muted-foreground text-sm">{error}</p>
        <p className="text-muted-foreground text-xs mt-2">Make sure the backend is running</p>
      </div>
    );
  }

  if (!data) return null;

  const stats = data.globalStats;
  const hasData = (stats.totalSessions ?? 0) > 0;

  // Format distraction data for pie chart
  const distractionData = Object.entries(data.distractionBreakdown || {})
    .filter(([, val]) => val > 0)
    .map(([key, val]) => ({
      name: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
      value: val,
    }));

  // Format focus distribution for bar chart
  const distributionData = (data.focusDistribution || []).map(item => ({
    range: bucketLabels[String(item._id)] || String(item._id),
    sessions: item.count,
    avgTokens: Math.round(item.avgTokens || 0),
  }));

  // Format hourly patterns
  const hourlyData = (data.hourlyPatterns || []).map(item => ({
    hour: `${item.hour}:00`,
    avgScore: item.avgScore,
    readings: item.readingCount,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-2 font-title-serif">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          {data.source === 'mongodb' ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7C8B6F] inline-block" />
              Live from MongoDB Atlas
            </span>
          ) : (
            <span className="text-[#C2A15E]">In-memory fallback (no database)</span>
          )}
        </p>
      </div>

      {/* Global Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard value={stats.totalSessions ?? 0} label="Total Sessions" />
        <StatCard value={stats.avgFocusScore ? `${stats.avgFocusScore}%` : '—'} label="Avg Focus Score" />
        <StatCard value={stats.totalTokensEarned ?? 0} label="Tokens Earned" />
        <StatCard value={stats.totalNudges ?? 0} label="AI Nudges Given" />
      </div>

      {hasData ? (
        <>
          {/* Focus Distribution (Bar Chart) */}
          {distributionData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card paper-texture rounded-2xl p-6 border border-border"
            >
              <h3 className="text-lg font-semibold mb-4">Focus Score Distribution</h3>
              <p className="text-muted-foreground text-xs mb-4">MongoDB $bucket aggregation — sessions grouped by score range</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(43,43,43,0.1)" />
                  <XAxis dataKey="range" tick={{ fill: 'rgba(43,43,43,0.6)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'rgba(43,43,43,0.6)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#F9F5EA',
                      border: '1px solid #D8CFBE',
                      borderRadius: '8px',
                      color: '#2B2B2B',
                    }}
                  />
                  <Bar dataKey="sessions" fill="#C2A15E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Two-column: Hourly Patterns + Distractions */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Hourly Focus Patterns */}
            {hourlyData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card paper-texture rounded-2xl p-6 border border-border"
              >
                <h3 className="text-lg font-semibold mb-4">Focus by Hour</h3>
                <p className="text-muted-foreground text-xs mb-4">$group + $hour aggregation</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(43,43,43,0.1)" />
                    <XAxis dataKey="hour" tick={{ fill: 'rgba(43,43,43,0.6)', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'rgba(43,43,43,0.6)', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#F9F5EA',
                        border: '1px solid #D8CFBE',
                        borderRadius: '8px',
                        color: '#2B2B2B',
                      }}
                    />
                    <Line type="monotone" dataKey="avgScore" stroke="#7C8B6F" strokeWidth={2} dot={{ fill: '#7C8B6F', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Distraction Breakdown (Pie Chart) */}
            {distractionData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card paper-texture rounded-2xl p-6 border border-border"
              >
                <h3 className="text-lg font-semibold mb-4">Distraction Types</h3>
                <p className="text-muted-foreground text-xs mb-4">$group aggregation breakdown</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={distractionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={35}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {distractionData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>

          {/* Recent Sessions Table */}
          {data.recentSessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card paper-texture rounded-2xl p-6 border border-border"
            >
              <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
              <p className="text-muted-foreground text-xs mb-4">$lookup cross-collection join with users</p>
              <div className="space-y-2">
                {data.recentSessions.slice(0, 8).map((s, i) => (
                  <div key={s._id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-sm w-6">{i + 1}.</span>
                      <span className="font-medium">{s.displayName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.status === 'completed' 
                          ? 'bg-[#7C8B6F]/15 text-[#7C8B6F]' 
                          : 'bg-[#C2A15E]/15 text-[#C2A15E]'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {s.durationMinutes !== null && (
                        <span className="text-muted-foreground">{s.durationMinutes}m</span>
                      )}
                      <span className={`font-mono font-bold ${
                        (s.avgFocusScore ?? 0) >= 80 ? 'text-[#7C8B6F]' :
                        (s.avgFocusScore ?? 0) >= 60 ? 'text-[#C2A15E]' : 'text-[#B36B4C]'
                      }`}>
                        {s.avgFocusScore ?? '—'}%
                      </span>
                      {(s.tokensEarned ?? 0) > 0 && (
                        <span className="text-[#D4AF37] text-xs">🪙 {s.tokensEarned}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Top Users Leaderboard */}
          {data.topUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card paper-texture rounded-2xl p-6 border border-border"
            >
              <h3 className="text-lg font-semibold mb-4">🏆 Top Focusers</h3>
              <p className="text-muted-foreground text-xs mb-4">$facet parallel pipeline with $lookup join</p>
              <div className="space-y-3">
                {data.topUsers.map((user, i) => (
                  <div key={user.userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${
                        i === 0 ? 'text-[#D4AF37]' : i === 1 ? 'text-[#B8B1A3]' : i === 2 ? 'text-[#B36B4C]' : 'text-muted-foreground'
                      }`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                      </span>
                      <div>
                        <span className="font-medium">{user.displayName}</span>
                        {user.streak > 0 && (
                          <span className="ml-2 text-xs text-[#B36B4C]">🔥 {user.streak} day streak</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">{user.sessionCount} sessions</span>
                      <span className="font-mono font-bold text-[#7C8B6F]">{user.avgScore}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      ) : (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-card paper-texture rounded-2xl border border-border"
        >
          <p className="text-4xl mb-4">📊</p>
          <p className="text-lg font-semibold mb-2">No sessions yet</p>
          <p className="text-muted-foreground">Start a focus session to see your analytics here.</p>
          <p className="text-muted-foreground text-xs mt-4">
            Powered by MongoDB aggregation pipelines: $facet, $bucket, $lookup, $group, $dateToString
          </p>
        </motion.div>
      )}

      {/* MongoDB Features Badge */}
      <div className="text-center pb-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7C8B6F]/10 rounded-full border border-[#7C8B6F]/20">
          <span className="text-xs font-mono text-muted-foreground">
            MongoDB Features: $facet · $bucket · $lookup · $group · Change Streams · TTL Indexes · Compound Indexes
          </span>
        </div>
      </div>
    </div>
  );
}

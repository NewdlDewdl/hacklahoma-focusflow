'use client';

import { motion } from 'framer-motion';

type Tab = 'dashboard' | 'solo' | 'multiplayer' | 'settings';

interface NavBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isConnected: boolean;
}

export function NavBar({ activeTab, onTabChange, isConnected }: NavBarProps) {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'solo', label: 'Focus Solo', icon: '🎯' },
    { id: 'multiplayer', label: 'Multiplayer', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border paper-texture px-6 py-3 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C2A15E] to-[#B36B4C] flex items-center justify-center text-white font-bold shadow-sm">
          F
        </div>
        <span className="font-title-serif text-2xl font-bold text-foreground tracking-tight">
          FocusFlow
        </span>
      </div>

      {/* Tabs */}
      <div className="flex bg-secondary/50 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'text-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-card rounded-lg shadow-sm"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <span>{tab.icon}</span>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#7C8B6F] shadow-[0_0_8px_rgba(124,139,111,0.6)]' : 'bg-[#B36B4C] animate-pulse'}`} />
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          {isConnected ? 'Connected' : 'Connecting...'}
        </span>
      </div>
    </nav>
  );
}

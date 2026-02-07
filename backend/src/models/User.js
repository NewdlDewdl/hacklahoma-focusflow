const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Simple anonymous user — no auth for hackathon MVP
  displayName: { type: String, default: 'Anonymous' },
  
  // Solana integration
  solanaWallet: { type: String, default: null }, // pubkey if connected
  focusTokensEarned: { type: Number, default: 0 },
  
  // Streaks
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastSessionDate: { type: Date, default: null },
  
  // Stats
  totalSessions: { type: Number, default: 0 },
  totalFocusMinutes: { type: Number, default: 0 },
  avgFocusScore: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

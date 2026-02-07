const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Session config
  mode: { type: String, enum: ['solo', 'multiplayer'], default: 'solo' },
  roomId: { type: String, default: null }, // for multiplayer
  targetDuration: { type: Number, default: 25 }, // minutes (pomodoro default)
  
  // Session state
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  
  // Aggregated results (computed on session end)
  avgFocusScore: { type: Number, default: 0 },
  peakFocusScore: { type: Number, default: 0 },
  totalNudges: { type: Number, default: 0 },
  distractionBreakdown: {
    phone: { type: Number, default: 0 },
    lookingAway: { type: Number, default: 0 },
    drowsy: { type: Number, default: 0 },
    talking: { type: Number, default: 0 },
    absent: { type: Number, default: 0 },
  },
  
  // Solana reward
  tokensEarned: { type: Number, default: 0 },
  tokenTxSignature: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);

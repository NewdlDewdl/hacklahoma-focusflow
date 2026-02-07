const mongoose = require('mongoose');

// Time-series style — one doc per analysis frame
const readingSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  timestamp: { type: Date, default: Date.now, index: true },
  
  // Gemini analysis results
  focusScore: { type: Number, required: true, min: 0, max: 100 },
  distractionType: { type: String, enum: ['none', 'phone', 'looking_away', 'drowsy', 'talking', 'absent'], default: 'none' },
  confidence: { type: Number, min: 0, max: 1, default: 0.8 },
  
  // Trend (computed from recent readings)
  trend: { type: String, enum: ['improving', 'declining', 'stable'], default: 'stable' },
  
  // Whether a nudge was triggered
  nudgeTriggered: { type: Boolean, default: false },
});

// Compound index for efficient session timeline queries
readingSchema.index({ sessionId: 1, timestamp: 1 });

module.exports = mongoose.model('Reading', readingSchema);

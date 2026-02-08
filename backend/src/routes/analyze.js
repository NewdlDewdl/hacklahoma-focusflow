const express = require('express');
const router = express.Router();
const { getCoachingMessage } = require('../services/gemini');
const { generateSpeechBase64 } = require('../services/elevenlabs');
const { z } = require('zod');
const mongoose = require('mongoose');

// Lazy-load models only if DB is connected
let Reading, Session;
function getModels() {
  if (!Reading) Reading = require('../models/Reading');
  if (!Session) Session = require('../models/Session');
}

const dbConnected = () => mongoose.connection.readyState === 1;

// Nudge cooldown: 1 per 30 seconds per session
const lastNudgeTime = new Map();

// In-memory session store (fallback when no DB)
const memSessions = new Map();
function getOrCreateMemSession(sessionId) {
  if (!memSessions.has(sessionId)) {
    memSessions.set(sessionId, {
      _id: sessionId,
      userId: `user_${sessionId.slice(0, 6)}`,
      roomId: null,
      type: 'solo',
    });
  }
  return memSessions.get(sessionId);
}

// Schema validation
const analyzeSchema = z.object({
  sessionId: z.string(),
  focusScore: z.number().min(0).max(100),
  attentionState: z.enum(['focused', 'distracted']).optional(),
  distractionType: z.enum(['none', 'phone', 'looking_away', 'drowsy', 'talking', 'absent']).optional(),
  metadata: z.object({
    yaw: z.number().optional(),
    pitch: z.number().optional(),
  }).optional(),
});

router.post('/', async (req, res) => {
  try {
    // 1. Validate
    const { sessionId, focusScore, attentionState, distractionType: inputDistraction, metadata } = analyzeSchema.parse(req.body);
    
    // 2. Fetch session (DB or in-memory fallback)
    let session;
    if (dbConnected()) {
      getModels();
      session = await Session.findById(sessionId);
    }
    if (!session) {
      session = getOrCreateMemSession(sessionId);
    }

    // 3. Determine distraction type
    let distractionType = inputDistraction || 'none';
    if (!inputDistraction) {
      if (attentionState === 'distracted') {
        const yaw = Math.abs(metadata?.yaw || 0);
        const pitch = Math.abs(metadata?.pitch || 0);
        if (yaw > 0.35 || pitch > 0.35) distractionType = 'looking_away';
        else distractionType = 'phone';
      } else {
        distractionType = 'none';
      }
    }

    // 4. Save Reading (if DB available)
    let readingId = null;
    if (dbConnected()) {
      getModels();
      const reading = new Reading({
        sessionId,
        userId: session.userId,
        focusScore,
        distractionType,
        timestamp: new Date(),
        nudgeTriggered: false,
      });
      await reading.save();
      readingId = reading._id;
    }

    // 5. Real-time broadcast
    const io = req.app.get('io');
    // Socket room naming convention:
    // - session updates: `session:<sessionId>`
    // - multiplayer rooms: `<roomId>` (no prefix)
    const channel = session.roomId ? session.roomId : `session:${sessionId}`;

    const finalAttention = attentionState || (distractionType === 'none' ? 'focused' : 'distracted');
    io.to(channel).emit('focus:update', {
      userId: session.userId,
      focusScore,
      attentionState: finalAttention,
      distractionType,
      timestamp: new Date(),
    });

    // 6. Nudge Logic (30s cooldown + Gemini + ElevenLabs TTS)
    const now = Date.now();
    const lastNudge = lastNudgeTime.get(sessionId) || 0;
    if (focusScore < 50 && (now - lastNudge) > 30000) {
      lastNudgeTime.set(sessionId, now);
      (async () => {
        try {
          const message = await getCoachingMessage(focusScore, 'declining', distractionType);
          const audioBase64 = await generateSpeechBase64(message);
          io.to(channel).emit('nudge:triggered', {
            userId: session.userId,
            message,
            audio: audioBase64,
          });
        } catch (err) {
          console.error('Nudge pipeline failed:', err);
        }
      })();
    }

    res.json({ success: true, readingId });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Allow external code to register in-memory sessions
router.registerSession = (sessionId, data) => {
  memSessions.set(sessionId, { ...getOrCreateMemSession(sessionId), ...data });
};

module.exports = router;

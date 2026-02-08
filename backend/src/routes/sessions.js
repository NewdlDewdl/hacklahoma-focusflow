const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { calculateReward, getMintAddress } = require('../services/solana');

// Lazy-load models
let Session, User, Reading;
function getModels() {
  if (!Session) Session = require('../models/Session');
  if (!User) User = require('../models/User');
  if (!Reading) Reading = require('../models/Reading');
}

const dbConnected = () => mongoose.connection.readyState === 1;

// In-memory fallback stores
const memSessions = new Map();
const memUsers = new Map();

// POST /api/sessions — start a new focus session
router.post('/', async (req, res) => {
  try {
    const { userId, mode = 'solo', roomId = null, targetDuration = 25, displayName = 'Anonymous' } = req.body;

    if (dbConnected()) {
      getModels();
      let user = userId ? await User.findById(userId) : null;
      if (!user) user = await User.create({ displayName });
      const session = await Session.create({ userId: user._id, mode, roomId, targetDuration });
      return res.status(201).json({ session, user });
    }

    // In-memory fallback
    const memUserId = userId || uuidv4().slice(0, 8);
    if (!memUsers.has(memUserId)) {
      memUsers.set(memUserId, {
        _id: memUserId,
        displayName,
        currentStreak: 1,
        totalSessions: 0,
        focusTokensEarned: 0,
      });
    }
    const user = memUsers.get(memUserId);

    const sessionId = uuidv4().slice(0, 12);
    const session = {
      _id: sessionId,
      userId: memUserId,
      mode,
      roomId,
      targetDuration,
      status: 'active',
      startedAt: new Date(),
      avgFocusScore: 0,
      tokensEarned: 0,
    };
    memSessions.set(sessionId, session);

    res.status(201).json({ session, user });
  } catch (err) {
    console.error('Session create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/:id/end — end a session
router.post('/:id/end', async (req, res) => {
  try {
    if (dbConnected()) {
      getModels();
      const session = await Session.findOneAndUpdate(
        { _id: req.params.id, status: 'active' },
        { status: 'completed', endedAt: new Date() },
        { new: true }
      );
      if (!session) return res.status(400).json({ error: 'Session not found or already ended' });

      const readings = await Reading.find({ sessionId: session._id }).sort({ timestamp: 1 });
      if (readings.length > 0) {
        const scores = readings.map(r => r.focusScore);
        session.avgFocusScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        session.peakFocusScore = Math.max(...scores);
        session.totalNudges = readings.filter(r => r.nudgeTriggered).length;
      }
      await session.save();

      const user = await User.findById(session.userId);
      let tokensEarned = 0;
      if (user) {
        const durationMinutes = (session.endedAt - session.startedAt) / 60000;
        user.totalSessions++;
        const reward = calculateReward(session.avgFocusScore, durationMinutes, user.currentStreak);
        tokensEarned = reward;
        session.tokensEarned = reward;
        user.focusTokensEarned += reward;
        await user.save();
        await session.save();
      }

      const io = req.app.get('io');
      if (io && session.roomId) {
        io.to(session.roomId).emit('session:complete', {
          sessionId: session._id,
          avgFocusScore: session.avgFocusScore,
          tokensEarned,
        });
      }

      return res.json({ session, tokensEarned });
    }

    // In-memory fallback
    const session = memSessions.get(req.params.id);
    if (!session || session.status !== 'active') {
      return res.status(400).json({ error: 'Session not found or already ended' });
    }

    session.status = 'completed';
    session.endedAt = new Date();
    const durationMinutes = (session.endedAt - session.startedAt) / 60000;
    const user = memUsers.get(session.userId);
    const streak = user ? user.currentStreak : 1;
    const tokensEarned = calculateReward(session.avgFocusScore || 75, durationMinutes, streak);
    session.tokensEarned = tokensEarned;

    if (user) {
      user.totalSessions++;
      user.focusTokensEarned += tokensEarned;
    }

    const io = req.app.get('io');
    if (io && session.roomId) {
      io.to(session.roomId).emit('session:complete', {
        sessionId: session._id,
        avgFocusScore: session.avgFocusScore,
        tokensEarned,
      });
    }

    res.json({ session, tokensEarned });
  } catch (err) {
    console.error('Session end error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req, res) => {
  try {
    if (dbConnected()) {
      getModels();
      const session = await Session.findById(req.params.id);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      const readings = await Reading.find({ sessionId: session._id }).sort({ timestamp: 1 });
      return res.json({ session, readings });
    }

    const session = memSessions.get(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ session, readings: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id/stats
router.get('/:id/stats', async (req, res) => {
  try {
    if (dbConnected()) {
      getModels();
      const readings = await Reading.find({ sessionId: req.params.id }).sort({ timestamp: -1 }).limit(50);
      if (readings.length === 0) return res.json({ avgScore: 0, trend: 'stable', readingCount: 0 });
      const scores = readings.map(r => r.focusScore);
      return res.json({
        avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        currentScore: scores[0],
        trend: 'stable',
        readingCount: readings.length,
        mintAddress: getMintAddress(),
      });
    }

    res.json({ avgScore: 0, trend: 'stable', readingCount: 0, mintAddress: getMintAddress() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

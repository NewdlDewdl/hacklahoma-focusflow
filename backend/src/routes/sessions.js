const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const User = require('../models/User');
const Reading = require('../models/Reading');
const { rewardTokens, calculateReward, getMintAddress } = require('../services/solana');

// POST /api/sessions — start a new focus session
router.post('/', async (req, res) => {
  try {
    const { userId, mode = 'solo', roomId = null, targetDuration = 25 } = req.body;

    // Auto-create anonymous user if none provided
    let user;
    if (userId) {
      user = await User.findById(userId);
    }
    if (!user) {
      user = await User.create({ displayName: 'Anonymous' });
    }

    const session = await Session.create({
      userId: user._id,
      mode,
      roomId,
      targetDuration,
    });

    res.status(201).json({ session, user });
  } catch (err) {
    console.error('Session create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/:id/end — end a session, compute stats, reward tokens
router.post('/:id/end', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status !== 'active') return res.status(400).json({ error: 'Session already ended' });

    // Compute aggregated stats from readings
    const readings = await Reading.find({ sessionId: session._id }).sort({ timestamp: 1 });

    if (readings.length > 0) {
      const scores = readings.map(r => r.focusScore);
      session.avgFocusScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      session.peakFocusScore = Math.max(...scores);
      session.totalNudges = readings.filter(r => r.nudgeTriggered).length;

      // Distraction breakdown
      for (const r of readings) {
        if (r.distractionType === 'phone') session.distractionBreakdown.phone++;
        else if (r.distractionType === 'looking_away') session.distractionBreakdown.lookingAway++;
        else if (r.distractionType === 'drowsy') session.distractionBreakdown.drowsy++;
        else if (r.distractionType === 'talking') session.distractionBreakdown.talking++;
        else if (r.distractionType === 'absent') session.distractionBreakdown.absent++;
      }
    }

    session.status = 'completed';
    session.endedAt = new Date();
    await session.save();

    // Update user stats + streak
    const user = await User.findById(session.userId);
    if (user) {
      const durationMinutes = (session.endedAt - session.startedAt) / 60000;
      user.totalSessions++;
      user.totalFocusMinutes += Math.round(durationMinutes);
      user.avgFocusScore = Math.round(
        ((user.avgFocusScore * (user.totalSessions - 1)) + session.avgFocusScore) / user.totalSessions
      );

      // Streak logic: session on consecutive days
      const today = new Date().toDateString();
      const lastDate = user.lastSessionDate ? user.lastSessionDate.toDateString() : null;
      if (lastDate === today) {
        // Same day, no streak change
      } else if (lastDate === new Date(Date.now() - 86400000).toDateString()) {
        user.currentStreak++;
      } else {
        user.currentStreak = 1;
      }
      user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
      user.lastSessionDate = new Date();

      // Solana reward
      const reward = calculateReward(session.avgFocusScore, durationMinutes, user.currentStreak);
      session.tokensEarned = reward;

      if (user.solanaWallet) {
        const sig = await rewardTokens(user.solanaWallet, reward);
        session.tokenTxSignature = sig;
        await session.save();
      }

      user.focusTokensEarned += reward;
      await user.save();
    }

    // Emit session complete via Socket.io
    const io = req.app.get('io');
    if (io && session.roomId) {
      io.to(session.roomId).emit('session:complete', {
        sessionId: session._id,
        avgFocusScore: session.avgFocusScore,
        tokensEarned: session.tokensEarned,
      });
    }

    res.json({ session, tokensEarned: session.tokensEarned });
  } catch (err) {
    console.error('Session end error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id — get session with readings
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const readings = await Reading.find({ sessionId: session._id })
      .sort({ timestamp: 1 })
      .select('timestamp focusScore distractionType trend nudgeTriggered');

    res.json({ session, readings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sessions/:id/stats — live session stats (for dashboard)
router.get('/:id/stats', async (req, res) => {
  try {
    const readings = await Reading.find({ sessionId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(50);

    if (readings.length === 0) return res.json({ avgScore: 0, trend: 'stable', readingCount: 0 });

    const scores = readings.map(r => r.focusScore);
    const recent5 = scores.slice(0, 5);
    const older5 = scores.slice(5, 10);
    const recentAvg = recent5.reduce((a, b) => a + b, 0) / recent5.length;
    const olderAvg = older5.length > 0 ? older5.reduce((a, b) => a + b, 0) / older5.length : recentAvg;

    let trend = 'stable';
    if (recentAvg - olderAvg > 5) trend = 'improving';
    else if (olderAvg - recentAvg > 5) trend = 'declining';

    res.json({
      avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      currentScore: scores[0],
      trend,
      readingCount: readings.length,
      mintAddress: getMintAddress(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

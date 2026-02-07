const express = require('express');
const router = express.Router();
const Reading = require('../models/Reading');
const Session = require('../models/Session');
const { getCoachingMessage } = require('../services/gemini');
const { generateSpeechBase64 } = require('../services/elevenlabs');
const { z } = require('zod');

// Nudge cooldown: 1 per 30 seconds per session
const lastNudgeTime = new Map();

// Schema validation
const analyzeSchema = z.object({
  sessionId: z.string(),
  focusScore: z.number().min(0).max(100),
  attentionState: z.enum(['focused', 'distracted']),
  metadata: z.object({
    yaw: z.number().optional(),
    pitch: z.number().optional(),
  }).optional(),
});

router.post('/', async (req, res) => {
  try {
    // 1. Validate
    const { sessionId, focusScore, attentionState, metadata } = analyzeSchema.parse(req.body);
    
    // 2. Fetch session (to verify user/room)
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // 3. Save Reading
    const reading = new Reading({
      sessionId,
      userId: session.userId,
      focusScore,
      distractionType: attentionState === 'focused' ? 'none' : 'looking_away', // Simple mapping for now
      timestamp: new Date()
    });
    await reading.save();

    // 4. Real-time broadcast (to session/room)
    const io = req.app.get('io');
    
    // Broadcast to the room (if multiplayer) or private session channel
    const channel = session.roomId || `session:${sessionId}`;
    
    io.to(channel).emit('focus:update', {
      userId: session.userId,
      focusScore,
      attentionState,
      timestamp: reading.timestamp
    });

    // 5. Nudge Logic (with 30s cooldown + ElevenLabs TTS)
    let nudge = null;
    const now = Date.now();
    const lastNudge = lastNudgeTime.get(sessionId) || 0;
    
    if (focusScore < 50 && (now - lastNudge) > 30000) {
      lastNudgeTime.set(sessionId, now);
      
      // Fire-and-forget: generate coaching text + audio, emit via socket
      (async () => {
        try {
          const message = await getCoachingMessage(focusScore, 'declining', reading.distractionType);
          const audioBase64 = await generateSpeechBase64(message);
          
          io.to(channel).emit('nudge:triggered', {
            userId: session.userId,
            message,
            audio: audioBase64, // base64 data URI, frontend can play directly
          });
          
          // Mark reading as nudge-triggered
          reading.nudgeTriggered = true;
          await reading.save();
        } catch (err) {
          console.error('Nudge pipeline failed:', err);
        }
      })();
    }

    res.json({ success: true, readingId: reading._id });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
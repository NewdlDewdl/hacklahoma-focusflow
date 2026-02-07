const express = require('express');
const router = express.Router();
const Reading = require('../models/Reading');
const Session = require('../models/Session');
const { z } = require('zod');

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

    // 5. Nudge Logic (Simple Threshold for now)
    // TODO: Integrate Gemini for smart coaching text here
    let nudge = null;
    if (focusScore < 40) {
        // Rate limit nudges? (For now, frontend handles speech throttling)
        nudge = "Focus checks failing. Let's reset.";
        io.to(channel).emit('nudge:triggered', { 
            userId: session.userId,
            message: nudge 
        });
    }

    res.json({ success: true, readingId: reading._id, nudge });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
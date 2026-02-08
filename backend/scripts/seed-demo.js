#!/usr/bin/env node
/**
 * Seed demo data into MongoDB for Analytics Dashboard showcase.
 * Run: node scripts/seed-demo.js
 * 
 * Creates realistic-looking focus sessions across multiple users
 * to populate charts: distribution, hourly patterns, leaderboard, etc.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://faze:f@cluster0.zhmrrvr.mongodb.net/focusflow?retryWrites=true&w=majority';

const userNames = [
  'Rohin', 'Adi', 'Vishnu', 'Clawd', 'Tom',
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve'
];

const distractionTypes = ['phone', 'lookingAway', 'drowsy', 'talking', 'absent'];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  const db = mongoose.connection.db;
  
  // Clear existing demo data (but keep real sessions)
  // We'll mark seeded docs with a field
  await db.collection('users').deleteMany({ seeded: true });
  await db.collection('sessions').deleteMany({ seeded: true });
  await db.collection('readings').deleteMany({ seeded: true });
  console.log('🧹 Cleared previous seed data');

  // Create users
  const users = [];
  for (const name of userNames) {
    const user = {
      _id: new mongoose.Types.ObjectId(),
      displayName: name,
      currentStreak: randInt(0, 14),
      longestStreak: randInt(5, 30),
      totalSessions: 0,
      totalFocusMinutes: 0,
      createdAt: new Date(Date.now() - randInt(1, 14) * 86400000),
      seeded: true,
    };
    users.push(user);
  }
  await db.collection('users').insertMany(users);
  console.log(`👤 Created ${users.length} users`);

  // Create sessions (30-50 per user variety)
  const sessions = [];
  const readings = [];

  for (const user of users) {
    const sessionCount = randInt(3, 12);
    user.totalSessions = sessionCount;

    for (let s = 0; s < sessionCount; s++) {
      const startedAt = new Date(Date.now() - randInt(0, 7 * 86400000));
      const durationMinutes = randInt(5, 45);
      const endedAt = new Date(startedAt.getTime() + durationMinutes * 60000);
      
      // Generate a realistic focus score (some users are more focused)
      const userSkill = rand(0.4, 0.95); // How good this user is
      const avgFocusScore = Math.min(100, Math.max(10, Math.round(userSkill * 100 + rand(-15, 15))));
      const peakFocusScore = Math.min(100, avgFocusScore + randInt(5, 20));
      
      const sessionId = new mongoose.Types.ObjectId();
      const tokensEarned = avgFocusScore >= 60 ? randInt(1, 10) : 0;
      const nudgeCount = avgFocusScore < 50 ? randInt(3, 8) : randInt(0, 3);

      // Distraction breakdown
      const distractionBreakdown = {};
      for (const d of distractionTypes) {
        distractionBreakdown[d] = avgFocusScore < 70 ? randInt(0, 5) : randInt(0, 2);
      }

      const session = {
        _id: sessionId,
        userId: user._id,
        mode: Math.random() > 0.3 ? 'solo' : 'multiplayer',
        status: Math.random() > 0.1 ? 'completed' : 'active',
        startedAt,
        endedAt,
        avgFocusScore,
        peakFocusScore,
        tokensEarned,
        totalNudges: nudgeCount,
        readingCount: Math.floor(durationMinutes * 60 / 2), // 1 reading per 2s
        distractionBreakdown,
        seeded: true,
      };
      sessions.push(session);

      // Generate readings for this session (every ~10s for variety)
      const readingInterval = 10; // seconds
      const readingCount = Math.floor(durationMinutes * 60 / readingInterval);
      
      for (let r = 0; r < Math.min(readingCount, 50); r++) { // Cap at 50 per session
        const timestamp = new Date(startedAt.getTime() + r * readingInterval * 1000);
        const focusScore = Math.min(100, Math.max(0, avgFocusScore + rand(-20, 20)));
        const isDistracted = focusScore < 50;

        readings.push({
          _id: new mongoose.Types.ObjectId(),
          sessionId,
          userId: user._id,
          focusScore: Math.round(focusScore),
          distractionType: isDistracted ? pick(distractionTypes) : 'none',
          attentionState: isDistracted ? 'distracted' : 'focused',
          nudgeTriggered: isDistracted && Math.random() > 0.6,
          timestamp,
          seeded: true,
        });
      }

      user.totalFocusMinutes += Math.round(durationMinutes * avgFocusScore / 100);
    }
  }

  // Batch insert
  if (sessions.length > 0) {
    await db.collection('sessions').insertMany(sessions);
    console.log(`📊 Created ${sessions.length} sessions`);
  }

  if (readings.length > 0) {
    // Insert in chunks to avoid hitting limits
    const chunkSize = 500;
    for (let i = 0; i < readings.length; i += chunkSize) {
      await db.collection('readings').insertMany(readings.slice(i, i + chunkSize));
    }
    console.log(`📈 Created ${readings.length} readings`);
  }

  // Update user totals
  for (const user of users) {
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { totalSessions: user.totalSessions, totalFocusMinutes: user.totalFocusMinutes } }
    );
  }

  console.log('\n✅ Seed complete! Dashboard should now show:');
  console.log(`   - ${users.length} users in leaderboard`);
  console.log(`   - ${sessions.length} sessions in distribution charts`);
  console.log(`   - ${readings.length} readings in hourly patterns`);
  console.log('\nRun the backend and visit /api/analytics/dashboard to verify.');
  
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

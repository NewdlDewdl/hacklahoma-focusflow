const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Lazy-load models
let Session, User, Reading;
function getModels() {
  if (!Session) Session = require('../models/Session');
  if (!User) User = require('../models/User');
  if (!Reading) Reading = require('../models/Reading');
}

const dbConnected = () => mongoose.connection.readyState === 1;

// DEBUG: Test endpoint to verify route registration
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Analytics route is registered and working',
    timestamp: new Date().toISOString(),
    dbConnected: dbConnected()
  });
});

/**
 * GET /api/analytics/dashboard
 * 
 * Rich aggregation pipeline: returns global stats, top users,
 * focus distribution, and time-of-day patterns.
 * 
 * Uses MongoDB aggregation framework features:
 * - $group, $match, $sort, $limit, $project
 * - $bucket for histogram binning
 * - $dateToString for time-series grouping
 * - $lookup for cross-collection joins
 * - $facet for parallel pipeline execution
 */
router.get('/dashboard', async (req, res) => {
  try {
    if (!dbConnected()) {
      return res.json({
        source: 'in-memory',
        globalStats: { totalSessions: 0, totalReadings: 0, avgFocusScore: 0, totalTokensEarned: 0 },
        topUsers: [],
        focusDistribution: [],
        hourlyPatterns: [],
        distractionBreakdown: [],
        recentSessions: [],
      });
    }

    getModels();

    // Use $facet to run multiple aggregation pipelines in parallel
    const [result] = await Session.aggregate([
      {
        $facet: {
          // Pipeline 1: Global stats
          globalStats: [
            {
              $group: {
                _id: null,
                totalSessions: { $sum: 1 },
                completedSessions: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                avgFocusScore: { $avg: '$avgFocusScore' },
                peakFocusScore: { $max: '$peakFocusScore' },
                totalTokensEarned: { $sum: '$tokensEarned' },
                avgDuration: {
                  $avg: {
                    $cond: [
                      { $and: ['$endedAt', '$startedAt'] },
                      { $divide: [{ $subtract: ['$endedAt', '$startedAt'] }, 60000] },
                      0
                    ]
                  }
                },
                totalNudges: { $sum: '$totalNudges' },
              }
            },
            {
              $project: {
                _id: 0,
                totalSessions: 1,
                completedSessions: 1,
                avgFocusScore: { $round: ['$avgFocusScore', 1] },
                peakFocusScore: 1,
                totalTokensEarned: 1,
                avgDurationMinutes: { $round: ['$avgDuration', 1] },
                totalNudges: 1,
              }
            }
          ],

          // Pipeline 2: Top users by focus score (with $lookup join)
          topUsers: [
            { $match: { status: 'completed' } },
            {
              $group: {
                _id: '$userId',
                sessionCount: { $sum: 1 },
                avgScore: { $avg: '$avgFocusScore' },
                totalTokens: { $sum: '$tokensEarned' },
                bestSession: { $max: '$avgFocusScore' },
              }
            },
            { $sort: { avgScore: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'userInfo'
              }
            },
            { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 0,
                userId: '$_id',
                displayName: { $ifNull: ['$userInfo.displayName', 'Anonymous'] },
                sessionCount: 1,
                avgScore: { $round: ['$avgScore', 1] },
                totalTokens: 1,
                bestSession: 1,
                streak: { $ifNull: ['$userInfo.currentStreak', 0] },
              }
            }
          ],

          // Pipeline 3: Focus score distribution (histogram with $bucket)
          focusDistribution: [
            { $match: { status: 'completed', avgFocusScore: { $gt: 0 } } },
            {
              $bucket: {
                groupBy: '$avgFocusScore',
                boundaries: [0, 20, 40, 60, 80, 100],
                default: 'other',
                output: {
                  count: { $sum: 1 },
                  avgTokens: { $avg: '$tokensEarned' },
                }
              }
            }
          ],

          // Pipeline 4: Distraction type breakdown
          distractionBreakdown: [
            { $match: { status: 'completed' } },
            {
              $group: {
                _id: null,
                phone: { $sum: '$distractionBreakdown.phone' },
                lookingAway: { $sum: '$distractionBreakdown.lookingAway' },
                drowsy: { $sum: '$distractionBreakdown.drowsy' },
                talking: { $sum: '$distractionBreakdown.talking' },
                absent: { $sum: '$distractionBreakdown.absent' },
              }
            },
            {
              $project: {
                _id: 0,
                phone: 1,
                lookingAway: 1,
                drowsy: 1,
                talking: 1,
                absent: 1,
              }
            }
          ],

          // Pipeline 5: Recent sessions (last 20)
          recentSessions: [
            { $sort: { startedAt: -1 } },
            { $limit: 20 },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
              }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 1,
                mode: 1,
                status: 1,
                startedAt: 1,
                endedAt: 1,
                avgFocusScore: 1,
                tokensEarned: 1,
                displayName: { $ifNull: ['$user.displayName', 'Anonymous'] },
                durationMinutes: {
                  $cond: [
                    { $and: ['$endedAt', '$startedAt'] },
                    { $round: [{ $divide: [{ $subtract: ['$endedAt', '$startedAt'] }, 60000] }, 1] },
                    null
                  ]
                }
              }
            }
          ],
        }
      }
    ]);

    // Also run a separate aggregation on Readings for hourly patterns
    let hourlyPatterns = [];
    try {
      hourlyPatterns = await Reading.aggregate([
        {
          $group: {
            _id: { $hour: '$timestamp' },
            avgScore: { $avg: '$focusScore' },
            count: { $sum: 1 },
          }
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            hour: '$_id',
            avgScore: { $round: ['$avgScore', 1] },
            readingCount: '$count',
          }
        }
      ]);
    } catch (e) {
      // Reading collection might not exist yet
    }

    res.json({
      source: 'mongodb',
      globalStats: result.globalStats[0] || {},
      topUsers: result.topUsers,
      focusDistribution: result.focusDistribution,
      distractionBreakdown: result.distractionBreakdown[0] || {},
      recentSessions: result.recentSessions,
      hourlyPatterns,
    });
  } catch (err) {
    console.error('Analytics dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/user/:userId/insights
 * 
 * Per-user analytics using aggregation pipelines:
 * - Focus trend over time ($dateToString grouping)
 * - Personal best sessions
 * - Distraction patterns
 * - Streak analysis
 */
router.get('/user/:userId/insights', async (req, res) => {
  try {
    if (!dbConnected()) {
      return res.json({ source: 'in-memory', insights: {} });
    }

    getModels();
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    // Daily focus trend
    const dailyTrend = await Reading.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          avgScore: { $avg: '$focusScore' },
          readings: { $sum: 1 },
          nudges: { $sum: { $cond: ['$nudgeTriggered', 1, 0] } },
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
      {
        $project: {
          _id: 0,
          date: '$_id',
          avgScore: { $round: ['$avgScore', 1] },
          readings: 1,
          nudges: 1,
        }
      }
    ]);

    // Personal bests
    const personalBests = await Session.aggregate([
      { $match: { userId, status: 'completed' } },
      { $sort: { avgFocusScore: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 1,
          startedAt: 1,
          avgFocusScore: 1,
          peakFocusScore: 1,
          tokensEarned: 1,
          durationMinutes: {
            $round: [{ $divide: [{ $subtract: ['$endedAt', '$startedAt'] }, 60000] }, 1]
          }
        }
      }
    ]);

    // Distraction pattern analysis
    const distractionPatterns = await Reading.aggregate([
      { $match: { userId, distractionType: { $ne: 'none' } } },
      {
        $group: {
          _id: '$distractionType',
          count: { $sum: 1 },
          avgScoreDuringDistraction: { $avg: '$focusScore' },
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          type: '$_id',
          count: 1,
          avgScoreDuringDistraction: { $round: ['$avgScoreDuringDistraction', 1] },
        }
      }
    ]);

    // Focus consistency (standard deviation)
    const consistency = await Reading.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$focusScore' },
          stdDev: { $stdDevPop: '$focusScore' },
          totalReadings: { $sum: 1 },
        }
      },
      {
        $project: {
          _id: 0,
          avgScore: { $round: ['$avgScore', 1] },
          stdDev: { $round: ['$stdDev', 1] },
          consistency: {
            $round: [{ $subtract: [100, '$stdDev'] }, 1] // Higher = more consistent
          },
          totalReadings: 1,
        }
      }
    ]);

    res.json({
      source: 'mongodb',
      insights: {
        dailyTrend,
        personalBests,
        distractionPatterns,
        consistency: consistency[0] || {},
      }
    });
  } catch (err) {
    console.error('User insights error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/leaderboard
 * 
 * Global leaderboard with rank calculation using $setWindowFields
 */
router.get('/leaderboard', async (req, res) => {
  try {
    if (!dbConnected()) {
      return res.json({ source: 'in-memory', leaderboard: [] });
    }

    getModels();
    const { period = 'all' } = req.query;

    let matchStage = { status: 'completed' };
    if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      matchStage.endedAt = { $gte: today };
    } else if (period === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      matchStage.endedAt = { $gte: weekAgo };
    }

    const leaderboard = await Session.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$userId',
          totalSessions: { $sum: 1 },
          avgFocusScore: { $avg: '$avgFocusScore' },
          totalTokens: { $sum: '$tokensEarned' },
          totalMinutes: {
            $sum: {
              $cond: [
                { $and: ['$endedAt', '$startedAt'] },
                { $divide: [{ $subtract: ['$endedAt', '$startedAt'] }, 60000] },
                0
              ]
            }
          },
        }
      },
      { $sort: { avgFocusScore: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          displayName: { $ifNull: ['$user.displayName', 'Anonymous'] },
          totalSessions: 1,
          avgFocusScore: { $round: ['$avgFocusScore', 1] },
          totalTokens: 1,
          totalMinutes: { $round: ['$totalMinutes', 0] },
          streak: { $ifNull: ['$user.currentStreak', 0] },
        }
      },
      { $limit: 50 },
    ]);

    // Add rank
    const ranked = leaderboard.map((entry, i) => ({ rank: i + 1, ...entry }));

    res.json({ source: 'mongodb', period, leaderboard: ranked });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

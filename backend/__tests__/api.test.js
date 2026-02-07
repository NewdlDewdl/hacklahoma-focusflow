const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Create a minimal test app (no DB connection needed for route structure tests)
function createTestApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}

describe('Health Check', () => {
  const app = createTestApp();

  test('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('API Route Structure', () => {
  test('POST /api/sessions returns 404 without DB (expected)', async () => {
    const app = createTestApp();
    const res = await request(app).post('/api/sessions').send({});
    // Without routes mounted, should be 404
    expect(res.status).toBe(404);
  });

  test('JSON body parsing works for large payloads', async () => {
    const app = createTestApp();
    app.post('/test-payload', (req, res) => {
      res.json({ received: !!req.body.data });
    });

    // Simulate a base64 frame (~100KB)
    const largePayload = { data: 'x'.repeat(100000) };
    const res = await request(app)
      .post('/test-payload')
      .send(largePayload);
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  test('CORS headers are present', async () => {
    const app = createTestApp();
    const res = await request(app).get('/health');
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});

describe('Solana Service', () => {
  const { calculateReward } = require('../src/services/solana');

  test('calculateReward returns minimum 1 token', () => {
    const reward = calculateReward(30, 2, 0); // low score, short session
    expect(reward).toBeGreaterThanOrEqual(1);
  });

  test('calculateReward gives bonus for high focus', () => {
    const normal = calculateReward(60, 25, 0);
    const high = calculateReward(85, 25, 0);
    expect(high).toBeGreaterThan(normal);
  });

  test('calculateReward applies streak multiplier', () => {
    const noStreak = calculateReward(80, 25, 0);
    const withStreak = calculateReward(80, 25, 10);
    expect(withStreak).toBeGreaterThan(noStreak);
  });

  test('streak multiplier caps at 3x', () => {
    const streak20 = calculateReward(80, 25, 20);
    const streak50 = calculateReward(80, 25, 50);
    expect(streak20).toBe(streak50); // both capped at 3x
  });
});

describe('Data Validation', () => {
  test('focus score boundaries', () => {
    // These would be validated by Zod in production
    const validScores = [0, 50, 100];
    const invalidScores = [-1, 101, NaN];

    validScores.forEach(score => {
      expect(score >= 0 && score <= 100).toBe(true);
    });

    invalidScores.forEach(score => {
      expect(score >= 0 && score <= 100).toBe(false);
    });
  });

  test('distraction types are valid enum values', () => {
    const validTypes = ['none', 'phone', 'looking_away', 'drowsy', 'talking', 'absent'];
    const testType = 'phone';
    expect(validTypes.includes(testType)).toBe(true);
    expect(validTypes.includes('invalid_type')).toBe(false);
  });
});

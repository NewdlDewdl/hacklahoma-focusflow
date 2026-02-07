// Human.js configuration for attention detection
export const humanConfig = {
  backend: 'webgl',
  modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
  face: { 
    enabled: true, 
    detector: { rotation: true },
    mesh: { enabled: false },
    iris: { enabled: false }, 
    description: { enabled: false },
    emotion: { enabled: false }
  },
  body: { enabled: false },
  hand: { enabled: false },
  object: { enabled: false },
  gesture: { enabled: false }
};

// Attention detection threshold (radians)
export const FOCUS_THRESHOLD = {
  YAW: 0.35,   // Left/Right head rotation
  PITCH: 0.35  // Up/Down head rotation
};

export function calculateFocusScore(yaw: number, pitch: number): number {
  // Calculate how "centered" the user is looking
  const yawDeviation = Math.abs(yaw) / FOCUS_THRESHOLD.YAW;
  const pitchDeviation = Math.abs(pitch) / FOCUS_THRESHOLD.PITCH;
  
  // Average deviation (0 = perfect, 1 = at threshold)
  const deviation = (yawDeviation + pitchDeviation) / 2;
  
  // Convert to 0-100 score (inverted)
  const score = Math.max(0, Math.min(100, (1 - deviation) * 100));
  
  return Math.round(score);
}

export function getAttentionState(focusScore: number): 'focused' | 'distracted' {
  return focusScore >= 70 ? 'focused' : 'distracted';
}

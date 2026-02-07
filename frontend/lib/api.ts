export const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export interface FocusReading {
  focusScore: number;
  distractionType: string;
  trend: 'improving' | 'declining' | 'stable';
  timestamp: string;
  nudgeTriggered: boolean;
}

export interface SessionStats {
  avgScore: number;
  currentScore: number;
  trend: 'improving' | 'declining' | 'stable';
  readingCount: number;
  mintAddress: string | null;
}

export async function getSessionStats(sessionId: string): Promise<SessionStats> {
  const res = await fetch(`${API_URL}/api/sessions/${sessionId}/stats`);
  return res.json();
}

export async function getSessionWithReadings(sessionId: string) {
  const res = await fetch(`${API_URL}/api/sessions/${sessionId}`);
  return res.json();
}

export async function connectWallet(userId: string, walletPubkey: string) {
  const res = await fetch(`${API_URL}/api/users/${userId}/wallet`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletPubkey }),
  });
  return res.json();
}

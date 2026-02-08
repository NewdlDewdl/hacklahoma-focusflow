'use client';

import { useState, useCallback, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface Session {
  _id: string;
  userId: string;
  mode: 'solo' | 'multiplayer';
  roomId: string | null;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: string;
}

interface User {
  _id: string;
  displayName: string;
  solanaWallet: string | null;
  focusTokensEarned: number;
  currentStreak: number;
}

interface SessionResult {
  session: Session;
  tokensEarned: number;
}

interface UseFocusSessionReturn {
  session: Session | null;
  user: User | null;
  isActive: boolean;
  startSession: (mode?: 'solo' | 'multiplayer', roomId?: string) => Promise<Session>;
  endSession: () => Promise<SessionResult | null>;
  sendFocusUpdate: (focusScore: number, attentionState: string, metadata?: object, distractionType?: string) => Promise<void>;
}

export function useFocusSession(): UseFocusSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const userIdRef = useRef<string | null>(null);

  // Persist userId across sessions (localStorage)
  const getUserId = () => {
    if (userIdRef.current) return userIdRef.current;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('focusflow_userId');
      if (stored) {
        userIdRef.current = stored;
        return stored;
      }
    }
    return null;
  };

  const startSession = useCallback(async (mode: 'solo' | 'multiplayer' = 'solo', roomId?: string) => {
    const res = await fetch(`${API_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: getUserId(),
        mode,
        roomId: roomId || null,
      }),
    });

    const data = await res.json();
    setSession(data.session);
    setUser(data.user);
    userIdRef.current = data.user._id;

    if (typeof window !== 'undefined') {
      localStorage.setItem('focusflow_userId', data.user._id);
    }

    return data.session;
  }, []);

  const endSession = useCallback(async () => {
    if (!session) return null;

    const res = await fetch(`${API_URL}/api/sessions/${session._id}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    setSession(null);
    return data as SessionResult;
  }, [session]);

  const sendFocusUpdate = useCallback(async (
    focusScore: number,
    attentionState: string,
    metadata?: object,
    distractionType?: string
  ) => {
    if (!session) return;

    const body: Record<string, unknown> = {
      sessionId: session._id,
      focusScore,
      attentionState,
      metadata,
    };
    if (distractionType) {
      body.distractionType = distractionType;
    }

    await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }, [session]);

  return {
    session,
    user,
    isActive: session?.status === 'active',
    startSession,
    endSession,
    sendFocusUpdate,
  };
}

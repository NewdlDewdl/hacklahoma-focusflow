'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface FocusUpdate {
  userId: string;
  focusScore: number;
  attentionState: 'focused' | 'distracted';
  timestamp: string;
}

interface Nudge {
  userId: string;
  message: string;
  audio?: string;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinSession: (sessionId: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  onFocusUpdate: (callback: (data: FocusUpdate) => void) => void;
  onNudge: (callback: (data: Nudge) => void) => void;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinSession = useCallback((sessionId: string) => {
    socketRef.current?.emit('join:room', `session:${sessionId}`);
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('join:room', roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('leave:room', roomId);
  }, []);

  const onFocusUpdate = useCallback((callback: (data: FocusUpdate) => void) => {
    socketRef.current?.on('focus:update', callback);
  }, []);

  const onNudge = useCallback((callback: (data: Nudge) => void) => {
    socketRef.current?.on('nudge:triggered', callback);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinSession,
    joinRoom,
    leaveRoom,
    onFocusUpdate,
    onNudge,
  };
}

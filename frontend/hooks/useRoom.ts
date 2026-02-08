'use client';

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface RoomUser {
  userId: string;
  displayName: string;
  joinedAt: string;
  focusScore?: number;
}

interface Room {
  id: string;
  name: string;
  maxUsers: number;
  users: RoomUser[];
  createdAt: string;
}

interface RoomListing {
  id: string;
  name: string;
  userCount: number;
  maxUsers: number;
}

export function useRoom(socket: Socket | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [lobby, setLobby] = useState<RoomListing[]>([]);
  const [isInRoom, setIsInRoom] = useState(false);
  const [peerScores, setPeerScores] = useState<Record<string, { displayName: string; focusScore: number }>>({});

  // Fetch active rooms for lobby
  const fetchLobby = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/rooms`);
      if (res.ok) {
        const data = await res.json();
        setLobby(data);
      }
    } catch (err) {
      console.error('Failed to fetch lobby:', err);
    }
  }, []);

  // Create a new room
  const createRoom = useCallback(async (name: string, maxUsers = 4): Promise<string | null> => {
    try {
      const res = await fetch(`${API_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, maxUsers }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.roomId;
      }
    } catch (err) {
      console.error('Failed to create room:', err);
    }
    return null;
  }, []);

  // Join a room
  const joinRoom = useCallback(async (roomId: string, userId: string, displayName: string) => {
    try {
      const res = await fetch(`${API_URL}/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, displayName }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
        setIsInRoom(true);

        // Join socket room for real-time events
        if (socket) {
          // Backend uses plain roomId for multiplayer rooms (no prefix)
          socket.emit('join:room', roomId);
        }
        return data.room;
      }
    } catch (err) {
      console.error('Failed to join room:', err);
    }
    return null;
  }, [socket]);

  // Leave a room
  const leaveRoom = useCallback(async (roomId: string, userId: string) => {
    try {
      await fetch(`${API_URL}/api/rooms/${roomId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setRoom(null);
      setIsInRoom(false);
      setPeerScores({});

      if (socket) {
        socket.emit('leave:room', `room:${roomId}`);
      }
    } catch (err) {
      console.error('Failed to leave room:', err);
    }
  }, [socket]);

  // Listen for room socket events
  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = (data: { userId: string; displayName: string; userCount: number }) => {
      setRoom(prev => {
        if (!prev) return prev;
        const exists = prev.users.find(u => u.userId === data.userId);
        if (exists) return prev;
        return {
          ...prev,
          users: [...prev.users, { userId: data.userId, displayName: data.displayName, joinedAt: new Date().toISOString() }],
        };
      });
    };

    const handleUserLeft = (data: { userId: string; userCount: number }) => {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          users: prev.users.filter(u => u.userId !== data.userId),
        };
      });
      setPeerScores(prev => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    };

    // Peer focus score broadcast
    const handlePeerFocus = (data: { userId: string; displayName: string; focusScore: number }) => {
      setPeerScores(prev => ({
        ...prev,
        [data.userId]: { displayName: data.displayName, focusScore: data.focusScore },
      }));
    };

    socket.on('room:user-joined', handleUserJoined);
    socket.on('room:user-left', handleUserLeft);
    socket.on('room:focus-update', handlePeerFocus);

    return () => {
      socket.off('room:user-joined', handleUserJoined);
      socket.off('room:user-left', handleUserLeft);
      socket.off('room:focus-update', handlePeerFocus);
    };
  }, [socket]);

  return {
    room,
    lobby,
    isInRoom,
    peerScores,
    fetchLobby,
    createRoom,
    joinRoom,
    leaveRoom,
  };
}

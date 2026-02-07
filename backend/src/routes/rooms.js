const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory room store (fine for hackathon MVP)
const rooms = new Map();

// POST /api/rooms — create a multiplayer study room
router.post('/', (req, res) => {
  const { name = 'Study Room', maxUsers = 4 } = req.body;
  const roomId = uuidv4().slice(0, 8); // short, shareable code
  
  rooms.set(roomId, {
    id: roomId,
    name,
    maxUsers,
    users: [],
    createdAt: new Date(),
  });

  res.status(201).json({ roomId, name, maxUsers });
});

// GET /api/rooms/:id — get room info
router.get('/:id', (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

// POST /api/rooms/:id/join — join a room
router.post('/:id/join', (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  
  const { userId, displayName = 'Anonymous' } = req.body;
  if (room.users.length >= room.maxUsers) {
    return res.status(400).json({ error: 'Room is full' });
  }

  // Prevent duplicate joins
  if (!room.users.find(u => u.userId === userId)) {
    room.users.push({ userId, displayName, joinedAt: new Date() });
  }

  // Broadcast join event via Socket.io
  const io = req.app.get('io');
  io.to(room.id).emit('room:user-joined', { userId, displayName, userCount: room.users.length });

  res.json({ room });
});

// POST /api/rooms/:id/leave — leave a room
router.post('/:id/leave', (req, res) => {
  const room = rooms.get(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { userId } = req.body;
  room.users = room.users.filter(u => u.userId !== userId);

  const io = req.app.get('io');
  io.to(room.id).emit('room:user-left', { userId, userCount: room.users.length });

  // Clean up empty rooms
  if (room.users.length === 0) {
    rooms.delete(room.id);
  }

  res.json({ success: true });
});

// GET /api/rooms — list active rooms (for lobby)
router.get('/', (req, res) => {
  const activeRooms = Array.from(rooms.values()).map(r => ({
    id: r.id,
    name: r.name,
    userCount: r.users.length,
    maxUsers: r.maxUsers,
  }));
  res.json(activeRooms);
});

module.exports = router;

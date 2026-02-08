require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const { initSolana } = require('./services/solana');
const { initElevenLabs } = require('./services/elevenlabs');
const { initGemini } = require('./services/gemini');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Rate limiting — generous for demo, protective for prod
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/rooms', require('./routes/rooms'));
try {
  app.use('/api/analytics', require('./routes/analytics'));
  console.log('📊 Analytics routes loaded');
} catch (err) {
  console.error('❌ Analytics route failed to load:', err.message);
  // Fallback: return informative error instead of silent 404
  app.use('/api/analytics', (req, res) => {
    res.status(503).json({ error: 'Analytics unavailable', reason: err.message });
  });
}

// Debug: list all registered routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({ path: middleware.route.path, methods: Object.keys(middleware.route.methods) });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({ path: handler.route.path, methods: Object.keys(handler.route.methods) });
        }
      });
    }
  });
  res.json({ routes, registeredAt: new Date().toISOString() });
});

// Socket.io for real-time focus updates + multiplayer
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  socket.on('join:room', (roomId) => {
    socket.join(roomId);
    console.log(`👥 ${socket.id} joined room ${roomId}`);
  });
  
  socket.on('leave:room', (roomId) => {
    socket.leave(roomId);
  });

  // Broadcast focus score to room peers
  socket.on('focus:broadcast', (data) => {
    if (data.roomId) {
      // Multiplayer room sockets join the plain roomId (no prefix)
      socket.to(data.roomId).emit('room:focus-update', {
        userId: data.userId,
        displayName: data.displayName,
        focusScore: data.focusScore,
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Start
const PORT = process.env.PORT || 3001;

async function start() {
  // IMPORTANT: start accepting traffic immediately.
  // External services (Mongo/Solana) should never block server startup.
  server.listen(PORT, () => {
    console.log(`🚀 FocusFlow backend running on port ${PORT}`);
  });

  // Kick off initializers in the background (best-effort)
  (async () => {
    try {
      await connectDB();
      console.log('🗄️  MongoDB ready');
      
      // MongoDB Change Streams — real-time session updates pushed via Socket.io
      // Showcases advanced MongoDB features (replica set required, Atlas provides it)
      try {
        const Session = require('./models/Session');
        const changeStream = Session.watch([
          { $match: { 'operationType': { $in: ['insert', 'update'] } } }
        ], { fullDocument: 'updateLookup' });
        
        changeStream.on('change', (change) => {
          if (change.fullDocument) {
            io.emit('session:change', {
              type: change.operationType,
              session: {
                _id: change.fullDocument._id,
                status: change.fullDocument.status,
                avgFocusScore: change.fullDocument.avgFocusScore,
                tokensEarned: change.fullDocument.tokensEarned,
              }
            });
          }
        });
        
        changeStream.on('error', (err) => {
          console.warn('⚠️  Change stream error (non-fatal):', err.message);
        });
        
        console.log('📡 MongoDB Change Streams active');
      } catch (csErr) {
        console.warn('⚠️  Change Streams not available:', csErr.message);
      }
    } catch (err) {
      console.warn('⚠️  MongoDB not connected:', err.message);
      console.log('   Continuing without DB (dev fallback enabled)');
    }
  })();

  (async () => {
    try {
      await initSolana();
      console.log('🪙 Solana ready');
    } catch (err) {
      console.warn('⚠️  Solana not initialized:', err.message);
      console.log('   Continuing without Solana (dev fallback enabled)');
    }
  })();

  initElevenLabs();
  initGemini();
}

start();

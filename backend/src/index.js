require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
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
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Start
const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await connectDB();
    console.log('🗄️  MongoDB ready');
  } catch (err) {
    console.warn('⚠️  MongoDB not connected:', err.message);
    console.log('   Server will start without DB (for dev)');
  }
  
  try {
    await initSolana();
    console.log('🪙 Solana ready');
  } catch (err) {
    console.warn('⚠️  Solana not initialized:', err.message);
    console.log('   Server will start without Solana (for dev)');
  }

  initElevenLabs();

  // Init Gemini
  initGemini();
  
  server.listen(PORT, () => {
    console.log(`🚀 FocusFlow backend running on port ${PORT}`);
  });
}

start();

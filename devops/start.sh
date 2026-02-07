#!/bin/sh
# Start both backend and frontend
echo "🚀 Starting FocusFlow..."

# Start backend in background
cd /app/backend && node src/index.js &
BACKEND_PID=$!

# Start Next.js standalone server
cd /app/frontend && node server.js &
FRONTEND_PID=$!

echo "✅ Backend running on :3001, Frontend on :3000"

# Wait for either to exit
wait $BACKEND_PID $FRONTEND_PID

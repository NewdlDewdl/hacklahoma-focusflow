FROM node:20-alpine

WORKDIR /app

# Backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --production

COPY backend/ ./backend/

# Frontend (built assets)
COPY frontend/.next/standalone ./frontend/standalone
COPY frontend/.next/static ./frontend/standalone/.next/static
COPY frontend/public ./frontend/standalone/public

EXPOSE 3001

CMD ["node", "backend/src/index.js"]

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV NEXT_PUBLIC_API_URL=REPLACE_AT_RUNTIME
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app

# Backend deps
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --production

# Backend source
COPY backend/ ./backend/

# Frontend standalone build
COPY --from=frontend-build /app/frontend/.next/standalone ./frontend/
COPY --from=frontend-build /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-build /app/frontend/public ./frontend/public

# Start script
COPY devops/start.sh ./start.sh
RUN chmod +x start.sh

EXPOSE 3000 3001

CMD ["./start.sh"]

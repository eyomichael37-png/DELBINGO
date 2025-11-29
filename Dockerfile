# Multi-stage build for production
FROM node:20-alpine AS builder

# Build client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./

# Copy audio files
COPY audio /app/audio

# Production image
FROM node:20-alpine
WORKDIR /app

# Copy server files
COPY --from=builder /app/server ./
COPY --from=builder /app/audio ./audio

# Serve client build (optional - you can serve separately)
COPY --from=builder /app/client/dist ./public

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "src/index.js"]




# Base image
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for build
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client (Daemon might use it? Or shared-types? Usually Daemon uses API, but let's check deps. 
# Daemon depends on shared-types. Safe to generate shared libs.)
# Actually Daemon connects to API via HTTP, doesn't direct connect to DB usually.
# But build might require types.
RUN npx prisma generate --schema=libs/db/prisma/schema.prisma

# Build the Daemon
RUN npx nx build daemon --configuration=production

# Production image
FROM node:20-slim AS runner

WORKDIR /app

# Install runtime dependencies and SteamCMD requirements
# SteamCMD needs 32-bit libraries
RUN dpkg --add-architecture i386 && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    lib32gcc-s1 \
    lib32stdc++6 \
    libsdl2-2.0-0:i386 \
    steamcmd \
    && rm -rf /var/lib/apt/lists/*

# Link steamcmd to path
RUN ln -s /usr/games/steamcmd /usr/bin/steamcmd

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Copy necessary files from builder
COPY --from=builder /app/dist/apps/daemon ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Install production deps
RUN npm install --omit=dev

# Run as root (Daemon requirement for Docker access usually)
# USER root

EXPOSE 3001

CMD ["node", "dist/main.js"]


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
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies
# Daemon might need stronger tools if it does local operations, but mostly it talks to Docker Socket.
RUN apk add --no-cache openssl curl iputils

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Copy necessary files from builder
COPY --from=builder /app/dist/apps/daemon ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./

# Install production deps
RUN npm install --omit=dev

# Create non-root user?
# DAEMON NEEDS ROOT usually to access /var/run/docker.sock properly without complex group logic, 
# OR we add it to the docker group.
# For now, let's run as root to avoid "permission denied" on docker socket, 
# or ensure the user has same GID as host docker group (tricky).
# Safer: Run as root for accessing socket, or use specific GID.
# Let's try running as root first for "Muscle", can harden later.
# Or: addgroup docker, adduser zedhosting docker. (But GID must match host).
# I'll stick to root for Daemon for now to minimize friction, adding a comment.
# USER root (default)

EXPOSE 3001

CMD ["node", "dist/main.js"]

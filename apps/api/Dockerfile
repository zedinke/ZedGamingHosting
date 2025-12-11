
# Base image
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for build (python/make for gyp if needed)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate --schema=libs/db/prisma/schema.prisma

# Build the API
RUN npx nx build api --configuration=production

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache openssl

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files from builder
COPY --from=builder /app/dist/apps/api ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
# We need node_modules for production dependencies
# Optimally, we would run 'npm ci --only=production' here, but verify if dist includes bundled deps?
# Nx webpack build usually bundles dependencies unless specified otherwise.
# Let's verify package.json content to be sure. 
# For safety, we install production deps.
RUN npm install --only=production

# Copy Prisma schema and generated client
COPY --from=builder /app/libs/db/prisma ./prisma
COPY --from=builder /app/libs/db/src/generated ./libs/db/src/generated

# Copy Prisma Client from node_modules (if needed)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create non-root user
RUN addgroup -S zedhosting && adduser -S zedhosting -G zedhosting
USER zedhosting

EXPOSE 3000

CMD ["node", "dist/main.js"]

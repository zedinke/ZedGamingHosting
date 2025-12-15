
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

# Copy Prisma Client from node_modules (engines included)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Ensure Prisma Query Engine is available next to the generated client for musl
# If present in node_modules, copy it into libs/db/src/generated so bundlers can find it
RUN set -e \
	&& ENGINE_PATH=$(find ./node_modules -path "*/.prisma/client/libquery_engine-*.so.node" | head -n 1 || true) \
	&& if [ -n "$ENGINE_PATH" ]; then \
			 echo "Copying Prisma engine: $ENGINE_PATH -> ./libs/db/src/generated/"; \
			 cp "$ENGINE_PATH" ./libs/db/src/generated/; \
		 else \
			 echo "Prisma engine binary not found in node_modules/.prisma/client"; \
		 fi

# Copy i18n locale files (needed at runtime) to the path expected by the app
COPY --from=builder /app/apps/api/src/i18n/locales ./dist/locales

# Create non-root user
RUN addgroup -S zedhosting && adduser -S zedhosting -G zedhosting
USER zedhosting

EXPOSE 3000

CMD ["node", "dist/main.js"]

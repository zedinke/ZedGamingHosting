
FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source files
# Copy root files
COPY package.json package-lock.json tsconfig.base.json nx.json ./
# Copy libs
COPY libs ./libs
# Copy web app
COPY apps/web ./apps/web

# Build
ENV NEXT_TELEMETRY_DISABLED 1
# Build Next.js app - must be in the app directory
WORKDIR /app/apps/web
RUN node scripts/validate-locales.js
RUN npx next build --no-lint

# Runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Copy standalone build
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]

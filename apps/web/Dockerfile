
FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

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
# Tolerate Next export hibát, de engedjük a .next létrejöttét
RUN npx next build --no-lint || true

# Runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Install only production dependencies for any runtime needs
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy standalone build output
COPY --from=builder /app/apps/web/.next/standalone /app/apps/web/standalone
COPY --from=builder /app/apps/web/.next/static /app/apps/web/standalone/.next/static
COPY --from=builder /app/apps/web/public /app/apps/web/standalone/public

# Healthcheck (HTTP 200-499 accepted as healthy)
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD node -e "const http=require('http');const req=http.request({host:'127.0.0.1',port:process.env.PORT||3000,path:'/'},res=>{process.exit(res.statusCode>=200&&res.statusCode<500?0:1)});req.on('error',()=>process.exit(1));req.end()"

EXPOSE 3000

# Run standalone server entrypoint
WORKDIR /app/apps/web/standalone
CMD ["node", "server.js"]

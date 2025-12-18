#!/bin/sh
set -e

echo "Running Prisma migrations..."
cd /app
npx prisma migrate deploy --schema=prisma/schema.prisma || echo "Migration failed, continuing anyway..."

echo "Starting application..."
exec node dist/main.js

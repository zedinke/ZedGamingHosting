#!/bin/bash
cd /root/ZedGamingHosting-latest
# Fix MANAGER_URL
sed -i 's|MANAGER_URL="http://localhost:3000"|MANAGER_URL="http://api:3000"|' .env
# Verify
echo "=== Current URL configuration ==="
grep -E "MANAGER_URL|BACKEND_URL" .env
# Rebuild daemon with corrected envs
echo ""
echo "=== Rebuilding daemon ==="
docker compose up -d --no-deps --build --force-recreate daemon

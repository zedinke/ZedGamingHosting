#!/usr/bin/env bash
set -euo pipefail

token="$1"
echo "Verifying token: $token"
cat > /tmp/verify.json <<EOF
{"token":"$token"}
EOF
cat /tmp/verify.json | docker exec -i zed-api sh -c "cat > /tmp/verify.json"
docker exec -i zed-api wget -qO- --header="Content-Type: application/json" --post-file=/tmp/verify.json http://127.0.0.1:3000/api/auth/verify-email

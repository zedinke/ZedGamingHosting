#!/bin/bash

# Login and get token
TOKEN=$(curl -s -X POST 'https://116.203.226.140/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@zed.local","password":"adminpass123"}' \
  -k | jq -r '.accessToken // empty')

if [ -z "$TOKEN" ]; then
  echo "Login failed, no token received"
  exit 1
fi

echo "Token: ${TOKEN:0:20}..."

# Get nodes to find nodeId
NODES=$(curl -s -X GET 'https://116.203.226.140/api/nodes' \
  -H "Authorization: Bearer $TOKEN" \
  -k)

echo "Nodes response: $NODES"

NODE_ID=$(echo "$NODES" | jq -r '.[0].id // empty')

if [ -z "$NODE_ID" ]; then
  echo "No node found"
  exit 1
fi

echo "Node ID: $NODE_ID"

# Create Minecraft server
echo "Creating Minecraft server..."
curl -X POST 'https://116.203.226.140/api/servers' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"name\": \"Test Minecraft Server\",
    \"gameType\": \"MINECRAFT\",
    \"nodeId\": \"$NODE_ID\",
    \"resources\": {
      \"cpuLimit\": 2,
      \"ramLimit\": 2048,
      \"diskLimit\": 10
    }
  }" \
  -k | jq '.'

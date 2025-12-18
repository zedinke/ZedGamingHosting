#!/bin/bash

# Create Node record in database via API agent/register endpoint
curl -s -k -X POST https://116.203.226.140/api/agent/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer golO4lGeUmrUVEIpTG_lve2tgGMk2fX7uTu5Z8CEurO9Hxi9" \
  -d '{
    "nodeId": "550e8400-e29b-41d4-a716-446655441111",
    "daemonVersion": "1.0.0",
    "systemInfo": {
      "cpu": 0,
      "memory": {"used": 0, "total": 0, "percent": 0},
      "disk": [],
      "network": {"in": 0, "out": 0},
      "containerCount": 0
    }
  }' | jq .

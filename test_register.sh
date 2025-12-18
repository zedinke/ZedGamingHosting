#!/bin/bash
curl -v -X POST http://api:3000/api/agent/register \
  -H "Content-Type: application/json" \
  -d '{"nodeId":"test-node-001","daemonVersion":"1.0.0","systemInfo":{"cpu":0,"memory":{"used":0,"total":0,"percent":0},"disk":[],"network":{"in":0,"out":0},"containerCount":0}}'

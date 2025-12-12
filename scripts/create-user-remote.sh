#!/bin/bash
curl -X POST https://zedgaminghosting.hu/api/auth/create-test-user \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zedgaminghosting.hu","password":"Admin123!"}'


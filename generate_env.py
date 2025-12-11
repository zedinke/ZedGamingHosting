#!/usr/bin/env python3
import secrets
import uuid
import sys

# Generate secure random values
db_pass = secrets.token_urlsafe(32)[:32]
redis_pass = secrets.token_urlsafe(32)[:32]
jwt_sec = secrets.token_urlsafe(48)[:48]
enc_key = secrets.token_urlsafe(32)[:32]
hash_sec = secrets.token_urlsafe(32)[:32]
api_key = secrets.token_urlsafe(48)[:48]
license_key = str(uuid.uuid4())
node_id = str(uuid.uuid4())
license_public_key = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890abcdef"

env_content = f"""# Database
MYSQL_ROOT_PASSWORD={db_pass}
MYSQL_DATABASE=zedhosting
DATABASE_URL=mysql://zedin:Gele007ta...@mysql:3306/zedhosting

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD={redis_pass}
REDIS_DB=0

# Security
JWT_SECRET={jwt_sec}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY={enc_key}
HASH_SECRET={hash_sec}

# Licensing
LICENSE_KEY={license_key}
LICENSE_SERVER_URL=https://license.zedhosting.com
LICENSE_PUBLIC_KEY={license_public_key}

# API
API_PORT=3000
API_HOST=0.0.0.0
API_URL=https://116.203.226.140

# Daemon (required by validation)
MANAGER_URL=https://116.203.226.140
API_KEY={api_key}
NODE_ID={node_id}

# Traefik
TRAEFIK_ACME_EMAIL=admin@zedhosting.com

# Application
NODE_ENV=production
LOG_LEVEL=info
"""

print(env_content)


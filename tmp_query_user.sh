#!/usr/bin/env bash
set -euo pipefail

docker exec -i zed-mysql mysql -uroot -prT3Y8Au6KBNJ8zpp7uyMJhSeXgV8q1Wt zedhosting <<'SQL'
SELECT id,email,emailVerified FROM User WHERE email='testbilling5527@test.com';
SELECT id,userId FROM BillingProfile ORDER BY createdAt DESC LIMIT 1;
SQL

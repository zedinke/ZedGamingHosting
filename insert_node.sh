#!/bin/bash

# Insert Node record into MySQL via docker exec
docker exec zed-mysql mysql -uroot -prT3Y8Au6KBNJ8zpp7uyMJhSeXgV8q1Wt zedhosting -e "
INSERT IGNORE INTO Node (id, name, apiKey, ipAddress, publicFqdn, totalRam, totalCpu, diskType, status, createdAt, updatedAt)
VALUES (
  '550e8400-e29b-41d4-a716-446655441111',
  'Brain-One',
  'golO4lGeUmrUVEIpTG_lve2tgGMk2fX7uTu5Z8CEurO9Hxi9',
  '116.203.226.140',
  '116.203.226.140',
  32000,
  16,
  'NVME',
  'PROVISIONING',
  NOW(),
  NOW()
);

SELECT id, name, apiKey, status FROM Node WHERE id = '550e8400-e29b-41d4-a716-446655441111';
"

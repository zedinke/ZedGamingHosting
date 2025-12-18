DELETE FROM node WHERE id = 'node-primary-001';

INSERT INTO node (id, name, ipAddress, status, capacity, usedCapacity, createdAt, updatedAt, lastHeartbeat)
VALUES ('550e8400-e29b-41d4-a716-446655441111', 'Primary Node', '116.203.226.140', 'OFFLINE', 100, 0, NOW(), NOW(), NULL)
ON DUPLICATE KEY UPDATE
  ipAddress = '116.203.226.140',
  updatedAt = NOW();

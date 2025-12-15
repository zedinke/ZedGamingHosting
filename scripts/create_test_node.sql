-- Create a test node for daemon
INSERT INTO node (
  id,
  name,
  ipAddress,
  status,
  capacity,
  usedCapacity,
  createdAt,
  updatedAt,
  lastHeartbeat
) VALUES (
  'node-primary-001',
  'Primary Node',
  '116.203.226.140',
  'OFFLINE',
  100,
  0,
  NOW(),
  NOW(),
  NULL
)
ON DUPLICATE KEY UPDATE
  ipAddress = '116.203.226.140',
  updatedAt = NOW();

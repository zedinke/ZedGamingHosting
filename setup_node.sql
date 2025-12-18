-- Insert test node
INSERT INTO Node (id, name, apiKey, ipAddress, publicFqdn, totalRam, totalCpu, diskType, status, createdAt, updatedAt) 
VALUES 
('test-node-001', 'TestNode', 'test-api-key-12345', '116.203.226.140', '116.203.226.140', 32768, 16, 'NVME', 'ONLINE', NOW(), NOW());

-- Verify
SELECT id, name, status, ipAddress FROM Node;

DELETE FROM User WHERE email = 'admin@zedgaminghosting.hu';
INSERT INTO User (id, email, passwordHash, role, createdAt, updatedAt) VALUES 
('admin-123', 'admin@zedgaminghosting.hu', '$2a$10$4eQgDSDZZMzHaZBqk5LuTuDkAVCPG1V3gNGhKEVCpI8WUKqeYKwWe', 'SUPERADMIN', NOW(), NOW());
SELECT id, email FROM User;

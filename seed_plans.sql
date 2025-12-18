-- Seed Plans for ZedGamingHosting
-- Run this after migration: docker exec -i zed-mysql mysql -uroot -p<PASSWORD> zedhosting < seed_plans.sql

-- Minecraft Plans
INSERT INTO Plan (id, name, slug, gameType, status, ramMb, cpuCores, diskGb, maxSlots, monthlyPrice, setupFee, features, description, isPopular, sortOrder, createdAt, updatedAt) VALUES
  (UUID(), 'Minecraft Basic', 'minecraft-basic', 'MINECRAFT', 'ACTIVE', 2048, 2, 10, 10, 299000, 0, '["24/7 Support", "Automatic Backups", "DDoS Protection", "Easy Mod Installation"]', 'Perfect for small groups of friends playing vanilla Minecraft', false, 10, NOW(), NOW()),
  (UUID(), 'Minecraft Standard', 'minecraft-standard', 'MINECRAFT', 'ACTIVE', 4096, 3, 20, 25, 499000, 0, '["24/7 Support", "Automatic Backups", "DDoS Protection", "Easy Mod Installation", "Plugin Support", "MySQL Database"]', 'Great for medium-sized communities with mods and plugins', true, 5, NOW(), NOW()),
  (UUID(), 'Minecraft Premium', 'minecraft-premium', 'MINECRAFT', 'ACTIVE', 8192, 4, 40, 50, 799000, 0, '["24/7 Priority Support", "Automatic Backups", "DDoS Protection", "Easy Mod Installation", "Plugin Support", "MySQL Database", "Free Subdomain", "Dedicated Resources"]', 'Best for large servers with heavy modpacks', false, 1, NOW(), NOW());

-- Rust Plans
INSERT INTO Plan (id, name, slug, gameType, status, ramMb, cpuCores, diskGb, maxSlots, monthlyPrice, setupFee, features, description, isPopular, sortOrder, createdAt, updatedAt) VALUES
  (UUID(), 'Rust Starter', 'rust-starter', 'RUST', 'ACTIVE', 4096, 2, 20, 50, 599000, 0, '["24/7 Support", "Automatic Backups", "DDoS Protection", "Oxide/uMod Support"]', 'Ideal for small Rust servers', false, 10, NOW(), NOW()),
  (UUID(), 'Rust Pro', 'rust-pro', 'RUST', 'ACTIVE', 6144, 3, 40, 100, 899000, 0, '["24/7 Priority Support", "Automatic Backups", "DDoS Protection", "Oxide/uMod Support", "MySQL Database", "Free Subdomain"]', 'Perfect for medium-sized Rust communities', true, 5, NOW(), NOW()),
  (UUID(), 'Rust Elite', 'rust-elite', 'RUST', 'ACTIVE', 12288, 4, 80, 200, 149900, 0, '["24/7 Priority Support", "Automatic Backups", "DDoS Protection", "Oxide/uMod Support", "MySQL Database", "Free Subdomain", "Dedicated Resources", "Custom Wipe Schedule"]', 'Best for large populated Rust servers', false, 1, NOW(), NOW());

-- Counter-Strike 2 Plans
INSERT INTO Plan (id, name, slug, gameType, status, ramMb, cpuCores, diskGb, maxSlots, monthlyPrice, setupFee, features, description, isPopular, sortOrder, createdAt, updatedAt) VALUES
  (UUID(), 'CS2 Basic', 'cs2-basic', 'CS2', 'ACTIVE', 2048, 2, 15, 12, 349000, 0, '["24/7 Support", "Automatic Backups", "DDoS Protection", "SourceMod/MetaMod"]', 'Perfect for casual 10v10 matches', false, 10, NOW(), NOW()),
  (UUID(), 'CS2 Standard', 'cs2-standard', 'CS2', 'ACTIVE', 4096, 3, 25, 24, 549000, 0, '["24/7 Support", "Automatic Backups", "DDoS Protection", "SourceMod/MetaMod", "MySQL Database", "Custom Maps"]', 'Great for competitive matches', true, 5, NOW(), NOW());

-- Palworld Plans
INSERT INTO Plan (id, name, slug, gameType, status, ramMb, cpuCores, diskGb, maxSlots, monthlyPrice, setupFee, features, description, isPopular, sortOrder, createdAt, updatedAt) VALUES
  (UUID(), 'Palworld Basic', 'palworld-basic', 'PALWORLD', 'ACTIVE', 6144, 3, 30, 16, 799000, 0, '["24/7 Support", "Automatic Backups", "DDoS Protection", "Easy Configuration"]', 'Perfect for friends to play together', false, 10, NOW(), NOW()),
  (UUID(), 'Palworld Pro', 'palworld-pro', 'PALWORLD', 'ACTIVE', 12288, 4, 60, 32, 119900, 0, '["24/7 Priority Support", "Automatic Backups", "DDoS Protection", "Easy Configuration", "Dedicated Resources"]', 'Best for larger Palworld communities', true, 5, NOW(), NOW());

-- ARK Plans
INSERT INTO Plan (id, name, slug, gameType, status, ramMb, cpuCores, diskGb, maxSlots, monthlyPrice, setupFee, features, description, isPopular, sortOrder, createdAt, updatedAt) VALUES
  (UUID(), 'ARK Basic', 'ark-basic', 'ARK', 'ACTIVE', 6144, 3, 40, 20, 799000, 0, '["24/7 Support", "Automatic Backups", "DDoS Protection", "Mod Support"]', 'Great for small ARK servers', false, 10, NOW(), NOW()),
  (UUID(), 'ARK Cluster', 'ark-cluster', 'ARK', 'ACTIVE', 10240, 4, 80, 50, 149900, 0, '["24/7 Priority Support", "Automatic Backups", "DDoS Protection", "Mod Support", "Cluster Storage", "Multiple Maps", "Dedicated Resources"]', 'Perfect for ARK clusters', true, 5, NOW(), NOW());

-- Valheim Plans
INSERT INTO Plan (id, name, slug, gameType, status, ramMb, cpuCores, diskGb, maxSlots, monthlyPrice, setupFee, features, description, isPopular, sortOrder, createdAt, updatedAt) VALUES
  (UUID(), 'Valheim Basic', 'valheim-basic', 'VALHEIM', 'ACTIVE', 4096, 2, 20, 10, 449000, 0, '["24/7 Support", "Automatic Backups", "DDoS Protection", "Mod Support"]', 'Perfect for small Viking groups', false, 10, NOW(), NOW()),
  (UUID(), 'Valheim Standard', 'valheim-standard', 'VALHEIM', 'ACTIVE', 6144, 3, 40, 20, 699000, 0, '["24/7 Support", "Automatic Backups", "DDoS Protection", "Mod Support", "Priority Support"]', 'Great for larger Viking communities', true, 5, NOW(), NOW());

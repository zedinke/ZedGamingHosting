#!/bin/bash
# Script to create a test user in the database
# Usage: ./scripts/create-test-user.sh <email> <password>

EMAIL=${1:-"admin@zedgaminghosting.hu"}
PASSWORD=${2:-"Admin123!"}

echo "Creating test user..."
echo "Email: $EMAIL"

docker compose exec -T mysql mysql -u zedin -pGele007ta... zedhosting <<EOF
SET @email = '$EMAIL';
SET @password_hash = (SELECT SHA2(CONCAT('bcrypt:', SHA2('$PASSWORD', 256)), 256)); -- This is a placeholder, we need bcrypt

-- For now, use a simple approach with bcrypt from Node.js
-- We'll use the API container to generate the hash
EOF

# Use the API container to create the user via Prisma
docker compose exec -T api node <<NODE_SCRIPT
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createUser() {
  try {
    const hashedPassword = await bcrypt.hash('$PASSWORD', 12);
    
    const user = await prisma.user.create({
      data: {
        email: '$EMAIL',
        passwordHash: hashedPassword,
        role: 'SUPERADMIN',
      },
    });
    
    console.log('✅ User created successfully!');
    console.log('Email:', user.email);
    console.log('ID:', user.id);
    console.log('Role:', user.role);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
}

createUser();
NODE_SCRIPT


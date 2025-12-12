#!/usr/bin/env ts-node
/**
 * Seed script to create a test user
 * Usage: npx ts-node scripts/seed-user.ts <email> <password>
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser(email: string, password: string) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`User with email ${email} already exists!`);
      process.exit(1);
    }

    // Hash password (cost factor 12, same as in auth.service.ts)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: 'SUPERADMIN', // SUPERADMIN, RESELLER_ADMIN, USER, or SUPPORT
      },
    });

    console.log(`✅ Test user created successfully!`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Created at: ${user.createdAt}`);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get arguments from command line
const email = process.argv[2] || 'admin@zedgaminghosting.hu';
const password = process.argv[3] || 'Admin123!';

console.log(`Creating test user...`);
console.log(`Email: ${email}`);
createTestUser(email, password);


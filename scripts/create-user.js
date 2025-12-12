const { PrismaClient } = require('@zed-hosting/db');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createUser() {
  const email = process.env.EMAIL || 'admin@zedgaminghosting.hu';
  const password = process.env.PASSWORD || 'Admin123!';

  try {
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`❌ User with email ${email} already exists!`);
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: 'SUPERADMIN',
      },
    });

    console.log('✅ User created successfully!');
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Role: ${user.role}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();


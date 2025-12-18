const { PrismaClient } = require('/app/node_modules/@prisma/client');
const bcrypt = require('/app/node_modules/bcrypt');

(async () => {
  const prisma = new PrismaClient();
  const existing = await prisma.user.findUnique({ where: { email: 'test@zed.local' } });
  if (!existing) {
    const hashed = await bcrypt.hash('testpass123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'test@zed.local',
        username: 'testuser',
        password: hashed,
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        emailVerified: true,
        balance: 10000
      }
    });
    console.log('✅ Test user created:', user.email, 'id:', user.id);
  } else {
    console.log('✅ Test user exists:', existing.email, 'id:', existing.id);
  }
  await prisma.$disconnect();
})().catch(console.error);

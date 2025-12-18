const bcrypt = require('/app/node_modules/bcrypt');
const { PrismaClient } = require('/app/dist/database/prisma.service.js').PrismaClient || require('/app/node_modules/.prisma/client/index.js').PrismaClient;

(async () => {
  try {
    const prisma = new PrismaClient();
    const newPassword = 'TestPass123!';
    const hashed = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { email: 'admin@zedgaminghosting.hu' },
      data: { password: hashed }
    });
    
    console.log('✅ Admin password updated to:', newPassword);
    await prisma.$disconnect();
  } catch(err) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  }
})();

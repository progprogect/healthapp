const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkClientProfile() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'client@test.io' },
      include: { clientProfile: true }
    });
    
    if (!user) {
      console.log('❌ User client@test.io not found');
      return;
    }
    
    console.log('✅ User found:', {
      email: user.email,
      role: user.role,
      status: user.status,
      hasClientProfile: !!user.clientProfile,
      clientProfileUserId: user.clientProfile?.userId
    });
  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientProfile();

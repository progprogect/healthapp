const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestClient() {
  try {
    const passwordHash = await hash('Passw0rd!', 12);
    
    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email: 'client@test.io' }
    });
    
    if (existingUser) {
      console.log('✅ User client@test.io already exists');
      return;
    }
    
    // Создаем пользователя с профилем клиента
    const clientUser = await prisma.user.create({
      data: {
        email: 'client@test.io',
        passwordHash,
        role: 'CLIENT',
        status: 'ACTIVE',
        clientProfile: {
          create: {
            displayName: 'Test Client',
          }
        }
      }
    });
    
    console.log('✅ User client@test.io created successfully');
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestClient();


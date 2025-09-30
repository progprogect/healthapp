const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating E2E test data...');

  try {
    // Создаем заявки для тестирования
    const clientUser = await prisma.user.findUnique({
      where: { email: 'client@test.io' }
    });

    if (!clientUser) {
      console.log('❌ Client user not found');
      return;
    }

    const category = await prisma.category.findFirst({
      where: { slug: 'psychologist' }
    });

    if (!category) {
      console.log('❌ Psychologist category not found');
      return;
    }

    // Создаем тестовые заявки
    const request1 = await prisma.request.create({
      data: {
        clientId: clientUser.id,
        title: 'Нужна помощь с тревожностью',
        description: 'Ищу опытного психолога для работы с тревожными расстройствами. Предпочтительно онлайн консультации.',
        categorySlug: 'psychologist',
        budgetMinCents: 4000,
        budgetMaxCents: 7000,
        onlineOnly: true,
        status: 'OPEN',
      }
    });

    const request2 = await prisma.request.create({
      data: {
        clientId: clientUser.id,
        title: 'Консультация по питанию',
        description: 'Нужна помощь в составлении плана питания для похудения',
        categorySlug: 'nutritionist',
        budgetMinCents: 3000,
        budgetMaxCents: 5000,
        onlineOnly: false,
        city: 'Москва',
        status: 'OPEN',
      }
    });

    console.log('✅ Test requests created:', request1.id, request2.id);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();


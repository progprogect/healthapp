const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating test users and data...');

  try {
    const passwordHash = await hash('Passw0rd!', 12);

    // Создаем или получаем категории
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { slug: 'psychologist' },
        update: {},
        create: { slug: 'psychologist', name: 'Психолог' }
      }),
      prisma.category.upsert({
        where: { slug: 'nutritionist' },
        update: {},
        create: { slug: 'nutritionist', name: 'Нутрициолог' }
      }),
      prisma.category.upsert({
        where: { slug: 'personal-trainer' },
        update: {},
        create: { slug: 'personal-trainer', name: 'Персональный тренер' }
      }),
      prisma.category.upsert({
        where: { slug: 'health-coach' },
        update: {},
        create: { slug: 'health-coach', name: 'Коуч по здоровью' }
      }),
      prisma.category.upsert({
        where: { slug: 'physiotherapist' },
        update: {},
        create: { slug: 'physiotherapist', name: 'Физиотерапевт' }
      }),
    ]);

    console.log('✅ Categories created');

    // Создаем или получаем тестовых пользователей
    const clientUser = await prisma.user.upsert({
      where: { email: 'client@test.io' },
      update: {},
      create: {
        email: 'client@test.io',
        passwordHash,
        role: 'CLIENT',
        status: 'ACTIVE',
        clientProfile: {
          create: {
            displayName: 'Тестовый Клиент',
          }
        }
      }
    });

    const specialistUser = await prisma.user.upsert({
      where: { email: 'specv@test.io' },
      update: {},
      create: {
        email: 'specv@test.io',
        passwordHash,
        role: 'SPECIALIST',
        status: 'ACTIVE',
        specialistProfile: {
          create: {
            displayName: 'Верифицированный Специалист',
            bio: 'Сертифицированный психолог с 10-летним опытом работы',
            experienceYears: 10,
            onlineOnly: false,
            city: 'Москва',
            priceMinCents: 5000,
            priceMaxCents: 8000,
            verified: true,
          }
        }
      }
    });

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@test.io' },
      update: {},
      create: {
        email: 'admin@test.io',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    console.log('✅ Test users created');

    // Добавляем категории к специалисту
    await prisma.specialistCategory.upsert({
      where: {
        specialistUserId_categoryId: {
          specialistUserId: specialistUser.id,
          categoryId: categories[0].id
        }
      },
      update: {},
      create: {
        specialistUserId: specialistUser.id,
        categoryId: categories[0].id // psychologist category
      }
    });

    console.log('✅ Specialist categories assigned');

    // Создаем тестовые заявки
    const request1 = await prisma.request.create({
      data: {
        clientUserId: clientUser.id,
        categoryId: categories[0].id, // psychologist
        title: 'Нужна помощь с тревожностью',
        description: 'Ищу опытного психолога для работы с тревожными расстройствами. Предпочтительно онлайн консультации.',
        preferredFormat: 'ONLINE',
        budgetMinCents: 4000,
        budgetMaxCents: 7000,
        city: null,
        status: 'OPEN',
      }
    });

    const request2 = await prisma.request.create({
      data: {
        clientUserId: clientUser.id,
        categoryId: categories[1].id, // nutritionist
        title: 'Консультация по питанию',
        description: 'Нужна помощь в составлении плана питания для похудения',
        preferredFormat: 'OFFLINE',
        budgetMinCents: 3000,
        budgetMaxCents: 5000,
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

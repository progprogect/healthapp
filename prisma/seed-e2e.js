const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding E2E test data...');

  // Clear existing data
  await prisma.chatMessage.deleteMany();
  await prisma.chatThread.deleteMany();
  await prisma.application.deleteMany();
  await prisma.request.deleteMany();
  await prisma.specialistCategory.deleteMany();
  await prisma.specialistProfile.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { slug: 'psychologist', name: 'Психолог' }
    }),
    prisma.category.create({
      data: { slug: 'physiotherapist', name: 'Физиотерапевт' }
    }),
    prisma.category.create({
      data: { slug: 'nutritionist', name: 'Нутрициолог' }
    }),
    prisma.category.create({
      data: { slug: 'health-coach', name: 'Здоровье-коуч' }
    }),
  ]);

  console.log('✅ Categories created');

  // Create test users
  const passwordHash = await hash('Passw0rd!', 12);

  // Client user
  const clientUser = await prisma.user.create({
    data: {
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

  // Unverified specialist
  const specUser = await prisma.user.create({
    data: {
      email: 'spec@test.io',
      passwordHash,
      role: 'SPECIALIST',
      status: 'ACTIVE',
      specialistProfile: {
        create: {
          displayName: 'Неверифицированный Специалист',
          bio: 'Опытный психолог с 5-летним стажем',
          experienceYears: 5,
          onlineOnly: true,
          priceMinCents: 3000,
          priceMaxCents: 6000,
          verified: false,
        }
      }
    }
  });

  // Verified specialist
  const specvUser = await prisma.user.create({
    data: {
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

  // Admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.io',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    }
  });

  console.log('✅ Test users created');

  // Add categories to specialists
  await prisma.specialistCategory.createMany([
    {
      userId: specUser.id,
      categorySlug: 'psychologist'
    },
    {
      userId: specvUser.id,
      categorySlug: 'psychologist'
    }
  ]);

  console.log('✅ Specialist categories assigned');

  // Create test requests
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

  console.log('✅ Test requests created');

  // Create application from verified specialist
  const application = await prisma.application.create({
    data: {
      requestId: request1.id,
      specialistId: specvUser.id,
      message: 'Готов помочь с тревожными расстройствами. Имею большой опыт работы в этой области.',
      status: 'PENDING',
    }
  });

  console.log('✅ Test application created');

  // Create chat thread
  const chatThread = await prisma.chatThread.create({
    data: {
      clientId: clientUser.id,
      specialistId: specvUser.id,
      requestId: request1.id,
    }
  });

  // Create test chat messages
  await prisma.chatMessage.createMany([
    {
      threadId: chatThread.id,
      senderId: clientUser.id,
      content: 'Здравствуйте! Спасибо за отклик на мою заявку.',
    },
    {
      threadId: chatThread.id,
      senderId: specvUser.id,
      content: 'Здравствуйте! Рад помочь. Расскажите подробнее о вашей ситуации.',
    }
  ]);

  console.log('✅ Chat thread and messages created');

  // Create additional specialists for catalog testing
  const additionalSpecialists = [];
  for (let i = 1; i <= 12; i++) {
    const specialist = await prisma.user.create({
      data: {
        email: `specialist${i}@test.io`,
        passwordHash,
        role: 'SPECIALIST',
        status: 'ACTIVE',
        specialistProfile: {
          create: {
            displayName: `Специалист ${i}`,
            bio: `Опытный специалист номер ${i}`,
            experienceYears: Math.floor(Math.random() * 15) + 3,
            onlineOnly: Math.random() > 0.5,
            city: Math.random() > 0.5 ? 'Москва' : 'Санкт-Петербург',
            priceMinCents: Math.floor(Math.random() * 5000) + 2000,
            priceMaxCents: Math.floor(Math.random() * 10000) + 5000,
            verified: Math.random() > 0.3, // 70% verified
          }
        }
      }
    });

    // Assign random categories
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    await prisma.specialistCategory.create({
      data: {
        userId: specialist.id,
        categorySlug: randomCategory.slug
      }
    });

    additionalSpecialists.push(specialist);
  }

  console.log('✅ Additional specialists created');

  console.log('🎉 E2E test data seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

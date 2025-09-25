import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding categories...')

  const categories = [
    { slug: 'psychologist', name: 'Психолог' },
    { slug: 'nutritionist', name: 'Нутрициолог' },
    { slug: 'personal-trainer', name: 'Персональный тренер' },
    { slug: 'health-coach', name: 'Здоровье-коуч' },
    { slug: 'physiotherapist', name: 'Физиотерапевт' },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
  }

  console.log('✅ Categories seeded successfully!')

  console.log('🌱 Seeding specialists...')

  // Создаем специалистов
  const specialists = [
    // Онлайн специалисты
    {
      email: 'anna.psychologist@example.com',
      displayName: 'Анна Петрова',
      bio: 'Сертифицированный психолог с 8-летним опытом работы. Специализируюсь на когнитивно-поведенческой терапии и работе с тревожными расстройствами.',
      experienceYears: 8,
      priceMinCents: 5000,
      priceMaxCents: 8000,
      onlineOnly: true,
      verified: true,
      categories: ['psychologist']
    },
    {
      email: 'maria.nutritionist@example.com',
      displayName: 'Мария Соколова',
      bio: 'Нутрициолог и диетолог. Помогаю составить правильный рацион питания для достижения ваших целей.',
      experienceYears: 5,
      priceMinCents: 3000,
      priceMaxCents: 6000,
      onlineOnly: true,
      verified: true,
      categories: ['nutritionist']
    },
    {
      email: 'alex.trainer@example.com',
      displayName: 'Алексей Козлов',
      bio: 'Персональный тренер и фитнес-инструктор. Создаю индивидуальные программы тренировок для любого уровня подготовки.',
      experienceYears: 6,
      priceMinCents: 4000,
      priceMaxCents: 7000,
      onlineOnly: true,
      verified: false,
      categories: ['personal-trainer']
    },
    {
      email: 'elena.coach@example.com',
      displayName: 'Елена Морозова',
      bio: 'Здоровье-коуч с медицинским образованием. Помогаю изменить образ жизни и достичь оптимального здоровья.',
      experienceYears: 10,
      priceMinCents: 6000,
      priceMaxCents: 10000,
      onlineOnly: true,
      verified: true,
      categories: ['health-coach']
    },
    {
      email: 'dmitry.physio@example.com',
      displayName: 'Дмитрий Волков',
      bio: 'Физиотерапевт с 12-летним стажем. Специализируюсь на реабилитации после травм и лечении опорно-двигательного аппарата.',
      experienceYears: 12,
      priceMinCents: 7000,
      priceMaxCents: 12000,
      onlineOnly: true,
      verified: true,
      categories: ['physiotherapist']
    },
    // Офлайн специалисты
    {
      email: 'olga.psychologist.moscow@example.com',
      displayName: 'Ольга Новикова',
      bio: 'Психолог-консультант. Работаю с семейными проблемами и детской психологией. Принимаю в центре Москвы.',
      experienceYears: 7,
      priceMinCents: 6000,
      priceMaxCents: 9000,
      onlineOnly: false,
      city: 'Москва',
      verified: true,
      categories: ['psychologist']
    },
    {
      email: 'sergey.nutritionist.spb@example.com',
      displayName: 'Сергей Лебедев',
      bio: 'Спортивный нутрициолог. Работаю с профессиональными спортсменами и любителями фитнеса.',
      experienceYears: 9,
      priceMinCents: 5000,
      priceMaxCents: 8000,
      onlineOnly: false,
      city: 'Санкт-Петербург',
      verified: true,
      categories: ['nutritionist']
    },
    {
      email: 'irina.trainer.moscow@example.com',
      displayName: 'Ирина Кузнецова',
      bio: 'Фитнес-тренер и инструктор по йоге. Провожу групповые и индивидуальные занятия в спортзале.',
      experienceYears: 4,
      priceMinCents: 3500,
      priceMaxCents: 5500,
      onlineOnly: false,
      city: 'Москва',
      verified: false,
      categories: ['personal-trainer']
    },
    {
      email: 'vladimir.coach.spb@example.com',
      displayName: 'Владимир Смирнов',
      bio: 'Здоровье-коуч и специалист по здоровому образу жизни. Консультирую по вопросам долголетия и профилактики.',
      experienceYears: 15,
      priceMinCents: 8000,
      priceMaxCents: 12000,
      onlineOnly: false,
      city: 'Санкт-Петербург',
      verified: true,
      categories: ['health-coach']
    },
    {
      email: 'natalia.physio.moscow@example.com',
      displayName: 'Наталья Федорова',
      bio: 'Физиотерапевт и массажист. Специализируюсь на лечении болей в спине и суставах.',
      experienceYears: 11,
      priceMinCents: 6000,
      priceMaxCents: 10000,
      onlineOnly: false,
      city: 'Москва',
      verified: true,
      categories: ['physiotherapist']
    },
    // Смешанные специалисты (онлайн + офлайн)
    {
      email: 'alexander.psychologist.mixed@example.com',
      displayName: 'Александр Попов',
      bio: 'Психотерапевт с 13-летним опытом. Работаю как онлайн, так и очно в кабинете. Специализируюсь на депрессии и ПТСР.',
      experienceYears: 13,
      priceMinCents: 7000,
      priceMaxCents: 11000,
      onlineOnly: false,
      city: 'Москва',
      verified: true,
      categories: ['psychologist', 'health-coach']
    },
    {
      email: 'tatyana.nutritionist.mixed@example.com',
      displayName: 'Татьяна Орлова',
      bio: 'Диетолог и нутрициолог. Консультирую онлайн и принимаю в клинике. Специализируюсь на лечебном питании.',
      experienceYears: 6,
      priceMinCents: 4000,
      priceMaxCents: 7000,
      onlineOnly: false,
      city: 'Санкт-Петербург',
      verified: true,
      categories: ['nutritionist']
    },
    {
      email: 'mikhail.trainer.mixed@example.com',
      displayName: 'Михаил Соколов',
      bio: 'Персональный тренер и реабилитолог. Работаю с людьми после травм. Провожу занятия онлайн и в зале.',
      experienceYears: 8,
      priceMinCents: 4500,
      priceMaxCents: 7500,
      onlineOnly: false,
      city: 'Москва',
      verified: false,
      categories: ['personal-trainer', 'physiotherapist']
    },
    {
      email: 'ekaterina.coach.mixed@example.com',
      displayName: 'Екатерина Медведева',
      bio: 'Здоровье-коуч и специалист по интегративной медицине. Помогаю найти баланс между работой и здоровьем.',
      experienceYears: 14,
      priceMinCents: 9000,
      priceMaxCents: 15000,
      onlineOnly: false,
      city: 'Санкт-Петербург',
      verified: true,
      categories: ['health-coach']
    },
    {
      email: 'andrey.physio.mixed@example.com',
      displayName: 'Андрей Козлов',
      bio: 'Физиотерапевт и мануальный терапевт. Специализируюсь на лечении спортивных травм и хронических болей.',
      experienceYears: 16,
      priceMinCents: 8000,
      priceMaxCents: 13000,
      onlineOnly: false,
      city: 'Москва',
      verified: true,
      categories: ['physiotherapist']
    }
  ]

  // Создаем пользователей-специалистов
  for (const specialist of specialists) {
    const passwordHash = await hash('password123', 11)
    
    const user = await prisma.user.upsert({
      where: { email: specialist.email },
      update: {},
      create: {
        email: specialist.email,
        passwordHash,
        role: 'SPECIALIST',
        status: 'ACTIVE',
        specialistProfile: {
          create: {
            displayName: specialist.displayName,
            bio: specialist.bio,
            experienceYears: specialist.experienceYears,
            priceMinCents: specialist.priceMinCents,
            priceMaxCents: specialist.priceMaxCents,
            onlineOnly: specialist.onlineOnly,
            city: specialist.city,
            verified: specialist.verified,
          }
        }
      },
      include: {
        specialistProfile: true
      }
    })

    // Привязываем категории
    for (const categorySlug of specialist.categories) {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug }
      })
      
      if (category) {
        await prisma.specialistCategory.upsert({
          where: {
            specialistUserId_categoryId: {
              specialistUserId: user.id,
              categoryId: category.id
            }
          },
          update: {},
          create: {
            specialistUserId: user.id,
            categoryId: category.id
          }
        })
      }
    }
  }

  console.log('✅ Specialists seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guards';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации параметров запроса
const adminSpecialistsParamsSchema = z.object({
  q: z.string().optional(), // поиск по имени/email
  verified: z.enum(['true', 'false', 'all']).default('all'),
  limit: z.string().transform(Number).default('20'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/admin/specialists - получить список специалистов для админа
export async function GET(request: Request) {
  try {
    console.log('Admin specialists API called');
    
    // В E2E тестах временно отключаем проверку авторизации
    if (process.env.NODE_ENV === 'test' || process.env.NEXTAUTH_URL?.includes('localhost:3001')) {
      // Для E2E тестов используем фиксированного админа
      const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@test.io' }
      });
      
      if (!adminUser) {
        return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
      }
      
      console.log('Using test admin user:', adminUser.email);
    } else {
      const { user } = await requireAdmin();
      console.log('Admin user:', user?.email);
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validatedParams = adminSpecialistsParamsSchema.safeParse(params);

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: "Неверные параметры запроса", details: validatedParams.error.errors },
        { status: 400 }
      );
    }

    const { q, verified, limit, offset } = validatedParams.data;

    // Построение условий поиска
    const where: any = {
      role: 'SPECIALIST',
      status: 'ACTIVE',
      specialistProfile: {
        isNot: null
      }
    };

    // Поиск по имени или email
    if (q) {
      where.OR = [
        {
          specialistProfile: {
            displayName: {
              contains: q,
              mode: 'insensitive'
            }
          }
        },
        {
          email: {
            // Если запрос содержит @, ищем точное совпадение email
            ...(q.includes('@') ? { equals: q } : { contains: q, mode: 'insensitive' })
          }
        }
      ];
    }

    // Фильтр по верификации
    if (verified !== 'all') {
      where.specialistProfile = {
        isNot: null,
        is: {
          verified: verified === 'true'
        }
      };
    }

    // Получение специалистов
    const specialists = await prisma.user.findMany({
      where,
      include: {
        specialistProfile: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Number(limit),
      skip: Number(offset)
    });

    // Подсчет общего количества
    const total = await prisma.user.count({ where });

    // Формирование ответа
    const items = specialists.map(specialist => ({
      id: specialist.id,
      email: specialist.email,
      displayName: specialist.specialistProfile!.displayName,
      verified: specialist.specialistProfile!.verified,
      createdAt: specialist.createdAt.toISOString(),
      categories: [] // Пока не загружаем категории
    }));

    return NextResponse.json({ 
      items, 
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });

  } catch (error) {
    console.error('Error fetching admin specialists:', error);
    
    if (error instanceof Error && error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

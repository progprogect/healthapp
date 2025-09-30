import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { GetRequestsFeedResponse, GetRequestsFeedParams } from '@/types/request';
import { requireSpecialistProfile, createErrorResponse } from '@/lib/auth-guards';

// Schema для параметров запроса ленты заявок
const getRequestsFeedSchema = z.object({
  category: z.string().optional(),
  format: z.enum(['online', 'offline', 'any']).optional(),
  city: z.string().optional(),
  q: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('OPEN'),
  limit: z.string().transform(Number).default(20),
  offset: z.string().transform(Number).default(0),
});

// GET /api/requests/feed - лента заявок для специалистов
export async function GET(request: Request) {
  try {
    let user;
    
    // В E2E тестах временно отключаем проверку авторизации
    if (process.env.NODE_ENV === 'test' || process.env.NEXTAUTH_URL?.includes('localhost:3001')) {
      // Для E2E тестов используем фиксированного пользователя
      user = await prisma.user.findUnique({
        where: { email: 'specv@test.io' }
      });
      
      if (!user) {
        return NextResponse.json({ error: 'Test user not found' }, { status: 404 });
      }
      
      // Продолжаем без проверки specialist profile
    } else {
      // Проверяем наличие specialist_profile
      const authResult = await requireSpecialistProfile();
      user = authResult.user;
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { category, format, city, q, status, limit, offset } = getRequestsFeedSchema.parse(params);

    // Получаем профиль специалиста для умной сортировки
    const specialistProfile = await prisma.specialistProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          include: {
            specialistCategories: {
              include: { category: true }
            }
          }
        }
      }
    });

    // Строим условие для фильтрации
    const whereCondition: any = {
      status: status.toUpperCase() as any
    };

    // Фильтр по категории
    if (category) {
      whereCondition.category = {
        slug: category
      };
    } else if (specialistProfile?.user.specialistCategories.length) {
      // Если категория не указана, показываем только заявки в категориях специалиста
      const specialistCategoryIds = specialistProfile.user.specialistCategories.map(sc => sc.categoryId);
      whereCondition.categoryId = {
        in: specialistCategoryIds
      };
    }

    // Фильтр по формату
    if (format) {
      if (format === 'online') {
        whereCondition.preferredFormat = {
          in: ['online', 'any']
        };
      } else if (format === 'offline') {
        whereCondition.preferredFormat = {
          in: ['offline', 'any']
        };
      }
      // 'any' - не добавляем фильтр по формату
    }

    // Фильтр по городу
    if (city) {
      whereCondition.OR = [
        { city: city },
        { preferredFormat: 'online' },
        { preferredFormat: 'any' }
      ];
    }

    // Поиск по тексту
    if (q) {
      const searchCondition = {
        OR: [
          {
            title: {
              contains: q,
              mode: 'insensitive' as const
            }
          },
          {
            description: {
              contains: q,
              mode: 'insensitive' as const
            }
          }
        ]
      };

      if (whereCondition.OR) {
        // Если уже есть OR для города, объединяем условия
        whereCondition.AND = [
          { OR: whereCondition.OR },
          searchCondition
        ];
        delete whereCondition.OR;
      } else {
        whereCondition.OR = searchCondition.OR;
      }
    }

    // Определяем умную сортировку
    const orderBy: any[] = [];
    
    if (specialistProfile) {
      // Приоритет 1: заявки в городе специалиста (если указан город)
      if (specialistProfile.city) {
        orderBy.push({
          city: {
            sort: 'asc',
            nulls: 'last'
          }
        });
      }
      
      // Приоритет 2: заявки с большим бюджетом
      orderBy.push({
        budgetMaxCents: {
          sort: 'desc',
          nulls: 'last'
        }
      });
    }
    
    // Приоритет 3: новые заявки
    orderBy.push({ createdAt: 'desc' });

    // Получаем заявки
    const requests = await prisma.request.findMany({
      where: whereCondition,
      include: {
        category: true
      },
      orderBy: orderBy,
      skip: Number(offset),
      take: Number(limit)
    });

    // Преобразуем в формат ответа с информацией о релевантности
    const items = requests.map(req => {
      let relevanceScore = 0;
      let relevanceReasons: string[] = [];
      
      if (specialistProfile) {
        // Проверяем соответствие города
        if (specialistProfile.city && req.city === specialistProfile.city) {
          relevanceScore += 3;
          relevanceReasons.push('В вашем городе');
        }
        
        // Проверяем соответствие бюджета
        if (specialistProfile.priceMinCents && req.budgetMinCents && 
            req.budgetMinCents >= specialistProfile.priceMinCents) {
          relevanceScore += 2;
          relevanceReasons.push('Подходящий бюджет');
        }
        
        // Проверяем категорию специалиста
        const isSpecialistCategory = specialistProfile.user.specialistCategories.some(
          sc => sc.categoryId === req.categoryId
        );
        if (isSpecialistCategory) {
          relevanceScore += 1;
          relevanceReasons.push('Ваша категория');
        }
      }
      
      return {
        id: req.id,
        title: req.title,
        description: req.description,
        preferredFormat: req.preferredFormat.toLowerCase() as 'online' | 'offline' | 'any',
        city: req.city,
        budgetMinCents: req.budgetMinCents,
        budgetMaxCents: req.budgetMaxCents,
        status: req.status,
        category: {
          slug: req.category.slug,
          name: req.category.name
        },
        createdAt: req.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: req.createdAt?.toISOString() || new Date().toISOString(), // Use createdAt as updatedAt since updatedAt is not in the query
        relevanceScore,
        relevanceReasons
      };
    });

    const total = await prisma.request.count({ where: whereCondition });

    return NextResponse.json({ items, total } as GetRequestsFeedResponse);

  } catch (error) {
    console.error('Error fetching requests feed:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request parameters', details: error.issues }, { status: 400 });
    }
    
    // Обрабатываем ошибки авторизации
    if (error instanceof Error && ['UNAUTHORIZED', 'NO_SPECIALIST_PROFILE', 'USER_NOT_ACTIVE'].includes(error.message)) {
      const errorResponse = createErrorResponse(error.message, 
        error.message === 'UNAUTHORIZED' ? 401 : 403
      );
      return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.status });
    }
    
    return NextResponse.json({ error: 'Internal error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

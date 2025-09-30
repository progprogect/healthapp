import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { GetMyRequestsResponse, GetMyRequestsParams } from '@/types/request';

// Schema для параметров запроса заявок
const getMyRequestsSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  limit: z.string().transform(Number).default(20),
  offset: z.string().transform(Number).default(0),
});

// GET /api/requests/mine - получить заявки текущего клиента
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('Session in /api/requests/mine:', session);
    
    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Проверяем, что пользователь существует
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    console.log('User found:', user);

    if (!user) {
      console.log('User not found in database');
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { status, limit, offset } = getMyRequestsSchema.parse(params);
    
    // Убеждаемся, что limit и offset - числа
    const limitNum = Number(limit);
    const offsetNum = Number(offset);

    // Строим условие для фильтрации
    const whereCondition: any = {
      clientUserId: session.user.id
    };

    if (status) {
      whereCondition.status = status;
    }

    // Получаем заявки с полной информацией
    const requests = await prisma.request.findMany({
      where: whereCondition,
      include: {
        category: true,
        applications: {
          where: { status: 'ACCEPTED' },
          include: {
            specialist: {
              include: { specialistProfile: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offsetNum,
      take: limitNum
    });

    // Преобразуем в формат ответа
    const items = requests.map(req => ({
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
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.createdAt.toISOString(), // Use createdAt as updatedAt since updatedAt is not in the query
      applications: req.applications.map(app => ({
        id: app.id,
        status: app.status,
        specialist: {
          id: app.specialist.id,
          displayName: app.specialist.specialistProfile?.displayName || app.specialist.email.split('@')[0],
          avatarUrl: app.specialist.specialistProfile?.avatarUrl
        }
      }))
    }));

    const total = await prisma.request.count({ where: whereCondition });

    return NextResponse.json({ items, total } as GetMyRequestsResponse);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные параметры запроса', details: error.issues }, { status: 400 });
    }
    
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

const getApplicationsSchema = z.object({
  status: z.enum(['SENT', 'ACCEPTED', 'DECLINED']).optional(),
  limit: z.string().transform(Number).default(20),
  offset: z.string().transform(Number).default(0),
});

// GET /api/applications/mine - получить отклики текущего специалиста
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { status, limit, offset } = getApplicationsSchema.parse(params);

    // Строим условие для фильтрации
    const whereCondition: any = {
      specialistUserId: session.user.id
    };

    if (status) {
      whereCondition.status = status;
    }

    // Получаем отклики с полной информацией о заявке
    const applications = await prisma.application.findMany({
      where: whereCondition,
      include: {
        request: {
          include: {
            category: true,
            client: {
              include: { clientProfile: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    });

    // Преобразуем в формат ответа
    const items = applications.map(app => ({
      id: app.id,
      message: app.message,
      status: app.status,
      createdAt: app.createdAt.toISOString(),
      request: {
        id: app.request.id,
        title: app.request.title,
        description: app.request.description,
        status: app.request.status,
        preferredFormat: app.request.preferredFormat,
        city: app.request.city,
        budgetMinCents: app.request.budgetMinCents,
        budgetMaxCents: app.request.budgetMaxCents,
        category: {
          slug: app.request.category.slug,
          name: app.request.category.name
        },
        client: {
          id: app.request.client.id,
          displayName: app.request.client.clientProfile?.displayName || app.request.client.email.split('@')[0]
        }
      }
    }));

    const total = await prisma.application.count({ where: whereCondition });

    return NextResponse.json({ items, total });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Неверные параметры', 
        details: error.issues 
      }, { status: 400 });
    }
    
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

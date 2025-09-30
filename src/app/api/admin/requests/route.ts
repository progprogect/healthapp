import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

const getAdminRequestsSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  category: z.string().optional(),
  clientId: z.string().optional(),
  specialistId: z.string().optional(),
  limit: z.string().transform(Number).default(50),
  offset: z.string().transform(Number).default(0),
});

// GET /api/admin/requests - получить все заявки (только для админов)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Проверяем, что пользователь - админ
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { status, category, clientId, specialistId, limit, offset } = getAdminRequestsSchema.parse(params);

    // Строим условие для фильтрации
    const whereCondition: any = {};

    if (status) {
      whereCondition.status = status;
    }

    if (category) {
      whereCondition.category = {
        slug: category
      };
    }

    if (clientId) {
      whereCondition.clientUserId = clientId;
    }

    if (specialistId) {
      whereCondition.applications = {
        some: {
          specialistUserId: specialistId,
          status: 'ACCEPTED'
        }
      };
    }

    // Получаем заявки с полной информацией
    const requests = await prisma.request.findMany({
      where: whereCondition,
      include: {
        category: true,
        client: {
          include: { clientProfile: true }
        },
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
      skip: offset,
      take: limit
    });

    // Преобразуем в формат ответа
    const items = requests.map(req => ({
      id: req.id,
      title: req.title,
      description: req.description,
      status: req.status,
      preferredFormat: req.preferredFormat,
      city: req.city,
      budgetMinCents: req.budgetMinCents,
      budgetMaxCents: req.budgetMaxCents,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.createdAt.toISOString(), // Use createdAt as updatedAt since updatedAt is not in the query
      category: {
        slug: req.category.slug,
        name: req.category.name
      },
      client: {
        id: req.client.id,
        email: req.client.email,
        displayName: req.client.clientProfile?.displayName || req.client.email.split('@')[0],
        status: req.client.status
      },
      specialist: req.applications[0] ? {
        id: req.applications[0].specialist.id,
        email: req.applications[0].specialist.email,
        displayName: req.applications[0].specialist.specialistProfile?.displayName || req.applications[0].specialist.email.split('@')[0],
        status: req.applications[0].specialist.status
      } : null,
      applicationsCount: req.applications.length
    }));

    const total = await prisma.request.count({ where: whereCondition });

    return NextResponse.json({ items, total });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Неверные параметры', 
        details: error.issues 
      }, { status: 400 });
    }
    
    console.error('Error fetching admin requests:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

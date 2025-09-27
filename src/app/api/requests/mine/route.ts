import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { GetMyRequestsResponse, GetMyRequestsParams } from '@/types/request';

// Schema для параметров запроса заявок
const getMyRequestsSchema = z.object({
  status: z.enum(['open', 'matched', 'closed', 'cancelled']).optional(),
  limit: z.string().transform(Number).default('20'),
  offset: z.string().transform(Number).default('0'),
});

// GET /api/requests/mine - получить заявки текущего клиента
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Проверяем, что пользователь - клиент
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { clientProfile: true }
    });

    if (!user || user.role !== 'CLIENT' || !user.clientProfile) {
      return NextResponse.json({ error: 'Только клиенты могут просматривать свои заявки' }, { status: 403 });
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

    // Получаем заявки
    const requests = await prisma.request.findMany({
      where: whereCondition,
      include: {
        category: true
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
      preferredFormat: req.preferredFormat,
      city: req.city,
      budgetMinCents: req.budgetMinCents,
      budgetMaxCents: req.budgetMaxCents,
      status: req.status,
      category: {
        slug: req.category.slug,
        name: req.category.name
      },
      createdAt: req.createdAt.toISOString()
    }));

    const total = await prisma.request.count({ where: whereCondition });

    return NextResponse.json({ items, total } as GetMyRequestsResponse);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные параметры запроса', details: error.errors }, { status: 400 });
    }
    
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

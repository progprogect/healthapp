import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { CreateApplicationRequest, CreateApplicationResponse, GetApplicationsResponse } from '@/types/request';

// Schema для создания отклика
const createApplicationSchema = z.object({
  message: z.string().min(1, 'Сообщение обязательно').max(1000, 'Сообщение не должно превышать 1000 символов'),
});

// POST /api/requests/:id/applications - создать отклик (только для специалистов)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Проверяем, что пользователь - специалист
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { specialistProfile: true }
    });

    if (!user || user.role !== 'SPECIALIST' || !user.specialistProfile) {
      return NextResponse.json({ error: 'Только специалисты могут создавать отклики' }, { status: 403 });
    }

    const { id: requestId } = await params;
    const body = await request.json();
    const { message } = createApplicationSchema.parse(body);

    // Проверяем, что заявка существует и открыта
    const requestRecord = await prisma.request.findUnique({
      where: { id: requestId },
      include: { category: true }
    });

    if (!requestRecord) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
    }

    if (requestRecord.status !== 'OPEN') {
      return NextResponse.json({ error: 'Заявка не принимает отклики' }, { status: 400 });
    }

    // Проверяем, что специалист еще не откликался на эту заявку
    const existingApplication = await prisma.application.findFirst({
      where: {
        requestId: requestId,
        specialistUserId: session.user.id,
        status: 'SENT'
      }
    });

    if (existingApplication) {
      return NextResponse.json({ error: 'Вы уже откликнулись на эту заявку' }, { status: 409 });
    }

    // Создаем отклик
    const newApplication = await prisma.application.create({
      data: {
        requestId: requestId,
        specialistUserId: session.user.id,
        message: message,
        status: 'SENT'
      }
    });

    return NextResponse.json({
      id: newApplication.id,
      status: newApplication.status,
      createdAt: newApplication.createdAt.toISOString()
    } as CreateApplicationResponse, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Ошибка валидации', 
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }
    
    console.error('Error creating application:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// GET /api/requests/:id/applications - получить отклики (только для автора заявки)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id: requestId } = await params;

    // Проверяем, что заявка существует и пользователь - её автор
    const requestRecord = await prisma.request.findUnique({
      where: { id: requestId },
      include: { 
        client: {
          include: { clientProfile: true }
        }
      }
    });

    if (!requestRecord) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
    }

    // Проверяем, что пользователь - автор заявки
    if (requestRecord.clientUserId !== session.user.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Получаем отклики
    const applications = await prisma.application.findMany({
      where: { requestId: requestId },
      include: {
        specialist: {
          include: {
            specialistProfile: true,
            specialistCategories: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Преобразуем в формат ответа
    const items = applications.map(app => ({
      id: app.id,
      message: app.message,
      status: app.status.toLowerCase() as 'sent' | 'accepted' | 'declined',
      createdAt: app.createdAt.toISOString(),
      specialist: {
        id: app.specialist.id,
        displayName: app.specialist.specialistProfile!.displayName,
        bio: app.specialist.specialistProfile!.bio,
        experienceYears: app.specialist.specialistProfile!.experienceYears,
        priceMinCents: app.specialist.specialistProfile!.priceMinCents,
        priceMaxCents: app.specialist.specialistProfile!.priceMaxCents,
        onlineOnly: app.specialist.specialistProfile!.onlineOnly,
        city: app.specialist.specialistProfile!.city,
        verified: app.specialist.specialistProfile!.verified,
        categories: app.specialist.specialistCategories.map(sc => ({
          slug: sc.category.slug,
          name: sc.category.name
        }))
      }
    }));

    const total = applications.length;

    return NextResponse.json({ items, total } as GetApplicationsResponse);

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { RequestStatus } from '@prisma/client';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
});

// PUT /api/requests/[id]/status - изменить статус заявки
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id: requestId } = await params;
    const body = await request.json();
    const { status } = updateStatusSchema.parse(body);

    // Проверяем, что заявка существует и пользователь имеет права
    const requestRecord = await prisma.request.findFirst({
      where: {
        id: requestId,
        OR: [
          { clientUserId: session.user.id }, // Клиент может изменить статус
          { 
            applications: {
              some: {
                specialistUserId: session.user.id,
                status: 'ACCEPTED'
              }
            }
          } // Специалист может изменить статус только если его заявка принята
        ]
      },
      include: {
        applications: {
          where: { specialistUserId: session.user.id },
          select: { status: true }
        }
      }
    });

    if (!requestRecord) {
      return NextResponse.json({ error: 'Заявка не найдена или нет прав' }, { status: 404 });
    }

    // Проверяем бизнес-логику смены статусов
    const currentStatus = requestRecord.status;
    
    // Клиент может: OPEN -> CANCELLED, IN_PROGRESS -> COMPLETED
    // Специалист может: IN_PROGRESS -> COMPLETED (если его заявка принята)
    const isClient = requestRecord.clientUserId === session.user.id;
    const isSpecialist = requestRecord.applications.some(app => app.status === 'ACCEPTED');

    if (isClient) {
      if (!['OPEN', 'IN_PROGRESS'].includes(currentStatus)) {
        return NextResponse.json({ error: 'Нельзя изменить статус завершенной заявки' }, { status: 400 });
      }
      if (status === 'COMPLETED' && currentStatus !== 'IN_PROGRESS') {
        return NextResponse.json({ error: 'Можно завершить только заявку в работе' }, { status: 400 });
      }
    } else if (isSpecialist) {
      if (currentStatus !== 'IN_PROGRESS' || status !== 'COMPLETED') {
        return NextResponse.json({ error: 'Специалист может только завершить заявку в работе' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Нет прав для изменения статуса' }, { status: 403 });
    }

    // Обновляем статус
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: { status: status as RequestStatus },
      include: {
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
      }
    });

    // Если заявка завершена, создаем возможность оставить отзыв
    if (status === 'COMPLETED') {
      // Проверяем, есть ли уже отзыв
      const existingReview = await prisma.review.findFirst({
        where: {
          specialistId: updatedRequest.applications[0]?.specialistUserId,
          clientId: updatedRequest.clientUserId,
          requestId: requestId
        }
      });

      if (!existingReview) {
        // Создаем запись для отзыва (пользователь сможет его заполнить позже)
        await prisma.review.create({
          data: {
            specialistId: updatedRequest.applications[0]?.specialistUserId || '',
            clientId: updatedRequest.clientUserId,
            requestId: requestId,
            rating: 0, // Пока не оценено
            comment: '',
            isVerified: false,
            isPublic: false
          }
        });
      }
    }

    return NextResponse.json({
      id: updatedRequest.id,
      status: updatedRequest.status,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные данные' }, { status: 400 });
    }
    
    console.error('Error updating request status:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

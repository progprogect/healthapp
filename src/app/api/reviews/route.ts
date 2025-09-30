import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

const createReviewSchema = z.object({
  specialistId: z.string().min(1, 'ID специалиста обязателен'),
  requestId: z.string().optional(),
  rating: z.number().min(1, 'Оценка должна быть от 1 до 5').max(5, 'Оценка должна быть от 1 до 5'),
  comment: z.string().min(10, 'Комментарий должен содержать минимум 10 символов').max(500, 'Комментарий не должен превышать 500 символов').optional()
});

// POST /api/reviews - создать отзыв
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { specialistId, requestId, rating, comment } = createReviewSchema.parse(body);

    // Проверяем, что пользователь имеет право оставить отзыв
    // (только клиенты, которые работали с этим специалистом)
    const hasWorkedWithSpecialist = await prisma.request.findFirst({
      where: {
        clientUserId: session.user.id,
        status: 'COMPLETED',
        applications: {
          some: {
            specialistUserId: specialistId,
            status: 'ACCEPTED'
          }
        }
      }
    });

    if (!hasWorkedWithSpecialist) {
      return NextResponse.json({ error: 'Вы можете оставить отзыв только после завершения работы' }, { status: 403 });
    }

    // Проверяем, не оставлял ли уже отзыв
    const existingReview = await prisma.review.findFirst({
      where: {
        specialistId,
        clientId: session.user.id,
        requestId: requestId || null
      }
    });

    if (existingReview) {
      return NextResponse.json({ error: 'Вы уже оставили отзыв по этой заявке' }, { status: 400 });
    }

    // Создаем отзыв
    const review = await prisma.review.create({
      data: {
        specialistId,
        clientId: session.user.id,
        requestId: requestId || null,
        rating,
        comment: comment || '',
        isVerified: false,
        isPublic: true
      },
      include: {
        client: {
          include: { clientProfile: true }
        }
      }
    });

    // Обновляем рейтинг специалиста
    await updateSpecialistRating(specialistId);

    return NextResponse.json({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString()
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Неверные данные', 
        details: error.issues 
      }, { status: 400 });
    }
    
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// Функция для обновления рейтинга специалиста
async function updateSpecialistRating(specialistId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      specialistId,
      isPublic: true
    },
    select: { rating: true }
  });

  if (reviews.length === 0) return;

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  await prisma.specialistProfile.update({
    where: { userId: specialistId },
    data: {
      averageRating,
      totalReviews: reviews.length
    }
  });
}


import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/specialists/[id]/reviews - получить отзывы специалиста
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: specialistId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Проверяем, что специалист существует
    const specialist = await prisma.user.findFirst({
      where: {
        id: specialistId,
        role: 'SPECIALIST',
        status: 'ACTIVE',
        specialistProfile: {
          isNot: null
        }
      }
    });

    if (!specialist) {
      return NextResponse.json({ error: 'Специалист не найден' }, { status: 404 });
    }

    // Получаем отзывы
    const reviews = await prisma.review.findMany({
      where: {
        specialistId,
        isPublic: true
      },
      include: {
        client: {
          include: { clientProfile: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    });

    // Получаем общую статистику
    const stats = await prisma.review.aggregate({
      where: {
        specialistId,
        isPublic: true
      },
      _avg: { rating: true },
      _count: { rating: true }
    });

    const response = {
      reviews: reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        client: {
          id: review.client.id,
          displayName: review.client.clientProfile?.displayName || review.client.email.split('@')[0]
        }
      })),
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating || 0
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching specialist reviews:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}


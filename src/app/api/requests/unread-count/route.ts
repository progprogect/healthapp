import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/requests/unread-count - получить количество новых заявок в категориях специалиста
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    // Получаем категории специалиста
    const specialistCategories = await prisma.specialistCategory.findMany({
      where: { specialistUserId: session.user.id },
      select: { categoryId: true }
    });

    if (specialistCategories.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    const categoryIds = specialistCategories.map(sc => sc.categoryId);

    // Подсчитываем новые заявки в категориях специалиста
    const unreadCount = await prisma.request.count({
      where: {
        categoryId: {
          in: categoryIds
        },
        status: 'OPEN',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // За последние 24 часа
        }
      }
    });

    return NextResponse.json({ count: unreadCount });

  } catch (error) {
    console.error('Error fetching unread requests count:', error);
    return NextResponse.json({ count: 0 });
  }
}


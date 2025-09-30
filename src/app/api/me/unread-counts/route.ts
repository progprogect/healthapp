import { NextResponse } from 'next/server';
import { requireActiveUser } from '@/lib/auth-guards';
import { prisma } from '@/lib/prisma';
import { userCache } from '@/lib/cache';

// GET /api/me/unread-counts - получить все счетчики непрочитанных сообщений одним запросом
export async function GET() {
  try {
    const { user } = await requireActiveUser();
    
    // Проверяем кэш
    const cached = await userCache.getUnreadCounts(user.id);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Получаем все счетчики параллельно
    const [chatCount, applicationsCount, requestsCount] = await Promise.all([
      getChatUnreadCount(user.id),
      getApplicationsUnreadCount(user.id),
      getRequestsUnreadCount(user.id)
    ]);

    const result = {
      chat: chatCount,
      applications: applicationsCount,
      requests: requestsCount,
      total: chatCount + applicationsCount + requestsCount
    };

    // Кэшируем на 30 секунд
    await userCache.setUnreadCounts(user.id, result, 30);

    return NextResponse.json(result);

  } catch (error) {
    if (error instanceof Error && ['UNAUTHORIZED', 'USER_NOT_ACTIVE'].includes(error.message)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error fetching unread counts:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Подсчет непрочитанных сообщений в чатах
async function getChatUnreadCount(userId: string): Promise<number> {
  try {
    const unreadCount = await prisma.chatMessage.count({
      where: {
        thread: {
          OR: [
            { clientUserId: userId },
            { specialistUserId: userId }
          ]
        },
        isRead: false,
        senderUserId: { not: userId } // Не считаем собственные сообщения
      }
    });

    return unreadCount;
  } catch (error) {
    console.error('Error counting chat unread messages:', error);
    return 0;
  }
}

// Подсчет новых заявок на мои заявки (для клиентов)
async function getApplicationsUnreadCount(userId: string): Promise<number> {
  try {
    const unreadCount = await prisma.application.count({
      where: {
        request: {
          clientUserId: userId
        },
        status: 'SENT', // Только новые заявки
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // За последние 24 часа
        }
      }
    });

    return unreadCount;
  } catch (error) {
    console.error('Error counting unread applications:', error);
    return 0;
  }
}

// Подсчет новых заявок в категориях специалиста
async function getRequestsUnreadCount(userId: string): Promise<number> {
  try {
    // Получаем категории специалиста
    const specialistCategories = await prisma.specialistCategory.findMany({
      where: { specialistUserId: userId },
      select: { categoryId: true }
    });

    if (specialistCategories.length === 0) {
      return 0;
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

    return unreadCount;
  } catch (error) {
    console.error('Error counting unread requests:', error);
    return 0;
  }
}


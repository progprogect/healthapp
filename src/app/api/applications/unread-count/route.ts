import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/applications/unread-count - получить количество новых заявок на мои заявки
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    // Подсчитываем новые заявки на заявки клиента
    const unreadCount = await prisma.application.count({
      where: {
        request: {
          clientUserId: session.user.id
        },
        status: 'SENT', // Только новые заявки
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // За последние 24 часа
        }
      }
    });

    return NextResponse.json({ count: unreadCount });

  } catch (error) {
    console.error('Error fetching unread applications count:', error);
    return NextResponse.json({ count: 0 });
  }
}


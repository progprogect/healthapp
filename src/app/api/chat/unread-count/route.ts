import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/chat/unread-count - получить количество непрочитанных сообщений
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    // Подсчитываем непрочитанные сообщения в чатах пользователя
    const unreadCount = await prisma.chatMessage.count({
      where: {
        thread: {
          OR: [
            { clientUserId: session.user.id },
            { specialistUserId: session.user.id }
          ]
        },
        senderUserId: {
          not: session.user.id // Исключаем собственные сообщения
        },
        isRead: false
      }
    });

    return NextResponse.json({ count: unreadCount });

  } catch (error) {
    console.error('Error fetching unread chat count:', error);
    return NextResponse.json({ count: 0 });
  }
}


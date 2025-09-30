import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { MarkAsReadRequest, MarkAsReadResponse } from '@/types/chat';

// Schema для пометки как прочитанных
const markAsReadSchema = z.object({
  upToMessageId: z.string().optional(),
});

// POST /api/chat/threads/:id/read - пометить как прочитанные все сообщения, адресованные мне
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id: threadId } = await params;
    const body = await request.json();
    const { upToMessageId } = markAsReadSchema.parse(body);

    // Проверяем, что пользователь является участником треда
    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        OR: [
          { clientUserId: session.user.id },
          { specialistUserId: session.user.id }
        ]
      }
    });

    if (!thread) {
      return NextResponse.json({ error: 'Тред не найден' }, { status: 404 });
    }

    // Строим условие для обновления сообщений
    const whereCondition: any = {
      threadId: threadId,
      senderUserId: { not: session.user.id }, // Только сообщения от других пользователей
      isRead: false // Только непрочитанные
    };

    // Если указан upToMessageId, обновляем только до этого сообщения
    if (upToMessageId) {
      const upToMessage = await prisma.chatMessage.findUnique({
        where: { id: upToMessageId }
      });
      
      if (upToMessage) {
        whereCondition.createdAt = {
          lte: upToMessage.createdAt
        };
      }
    }

    // Обновляем сообщения как прочитанные
    const updateResult = await prisma.chatMessage.updateMany({
      where: whereCondition,
      data: { isRead: true }
    });

    // Эмитим событие прочтения сообщений через Socket.IO
    if (global.emitMessageRead && updateResult.count > 0) {
      global.emitMessageRead(threadId, session.user.id);
    }

    return NextResponse.json({
      success: true
    } as MarkAsReadResponse);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные параметры запроса', details: error.issues }, { status: 400 });
    }
    
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}


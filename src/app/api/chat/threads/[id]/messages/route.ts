import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { GetMessagesResponse, SendMessageRequest, SendMessageResponse } from '@/types/chat';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Schema для параметров запроса сообщений
const getMessagesSchema = z.object({
  limit: z.string().transform(Number).default('50'),
  beforeId: z.string().optional(),
});

// Schema для отправки сообщения
const sendMessageSchema = z.object({
  body: z.string().min(1).max(2000),
  attachmentUrl: z.string().url().optional(),
});

// GET /api/chat/threads/:id/messages - сообщения треда
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id: threadId } = await params;
    const { searchParams } = new URL(request.url);
    const params_query = Object.fromEntries(searchParams.entries());
    const { limit, beforeId } = getMessagesSchema.parse(params_query);

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

    // Строим условие для пагинации
    const whereCondition: any = {
      threadId: threadId
    };

    if (beforeId) {
      const beforeMessage = await prisma.chatMessage.findUnique({
        where: { id: beforeId }
      });
      
      if (beforeMessage) {
        whereCondition.createdAt = {
          lt: beforeMessage.createdAt
        };
      }
    }

    // Получаем сообщения
    const messages = await prisma.chatMessage.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Берем на 1 больше, чтобы проверить hasMore
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;

    // Преобразуем в формат ответа
    const responseItems = items.map(message => ({
      id: message.id,
      senderId: message.senderUserId,
      body: message.body,
      attachmentUrl: message.attachmentUrl,
      createdAt: message.createdAt.toISOString(),
      isRead: message.isRead
    })).reverse(); // Переворачиваем, чтобы старые сообщения были первыми

    return NextResponse.json({
      items: responseItems,
      hasMore
    } as GetMessagesResponse);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные параметры запроса', details: error.errors }, { status: 400 });
    }
    
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// POST /api/chat/threads/:id/messages - отправить сообщение
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
    const { body: messageBody, attachmentUrl } = sendMessageSchema.parse(body);

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

    // Создаем сообщение
    const message = await prisma.chatMessage.create({
      data: {
        threadId: threadId,
        senderUserId: session.user.id,
        body: messageBody,
        attachmentUrl: attachmentUrl,
        isRead: false
      }
    });

    // Обновляем lastMessageAt в треде
    await prisma.chatThread.update({
      where: { id: threadId },
      data: { lastMessageAt: message.createdAt }
    });

    // Эмитим событие нового сообщения через Socket.IO
    if (global.emitMessageNew) {
      global.emitMessageNew(threadId, {
        id: message.id,
        body: message.body,
        senderId: message.senderUserId,
        createdAt: message.createdAt.toISOString(),
      });
    }

    // Эмитим обновление треда
    if (global.emitThreadUpdated) {
      global.emitThreadUpdated(threadId, {
        id: message.id,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
        senderId: message.senderUserId,
      }, 0); // unreadCount будет пересчитан на клиенте
    }

    return NextResponse.json({
      id: message.id,
      createdAt: message.createdAt.toISOString()
    } as SendMessageResponse, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные параметры запроса', details: error.errors }, { status: 400 });
    }
    
    console.error('Error sending chat message:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}


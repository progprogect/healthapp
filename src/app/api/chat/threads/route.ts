import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { CreateThreadRequest, CreateThreadResponse, GetThreadsResponse } from '@/types/chat';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Schema для создания треда
const createThreadSchema = z.object({
  specialistId: z.string().min(1),
  requestId: z.string().nullable().optional(),
});

// Schema для параметров запроса списка тредов
const getThreadsSchema = z.object({
  limit: z.string().transform(Number).default(20),
  offset: z.string().transform(Number).default(0),
});

// POST /api/chat/threads - создать/получить тред
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { specialistId, requestId } = createThreadSchema.parse(body);

    // Проверяем, что пользователь - клиент
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { clientProfile: true }
    });

    if (!user || user.role !== 'CLIENT' || !user.clientProfile) {
      return NextResponse.json({ error: 'Только клиенты могут создавать треды' }, { status: 403 });
    }

    // Проверяем, что специалист существует
    const specialist = await prisma.user.findUnique({
      where: { 
        id: specialistId,
        role: 'SPECIALIST',
        status: 'ACTIVE'
      },
      include: { specialistProfile: true }
    });

    if (!specialist || !specialist.specialistProfile) {
      return NextResponse.json({ error: 'Специалист не найден' }, { status: 404 });
    }

    // Ищем существующий тред
    const existingThread = await prisma.chatThread.findFirst({
      where: {
        clientUserId: session.user.id,
        specialistUserId: specialistId,
        requestId: requestId || null,
      }
    });

    if (existingThread) {
      return NextResponse.json({ 
        thread: {
          id: existingThread.id,
          clientId: existingThread.clientUserId,
          specialistId: existingThread.specialistUserId,
          requestId: existingThread.requestId,
          createdAt: existingThread.createdAt.toISOString(),
          updatedAt: existingThread.createdAt.toISOString()
        }
      } as CreateThreadResponse);
    }

    // Создаем новый тред
    const newThread = await prisma.chatThread.create({
      data: {
        clientUserId: session.user.id,
        specialistUserId: specialistId,
        requestId: requestId || null,
        lastMessageAt: new Date(),
      }
    });

    return NextResponse.json({ 
      thread: {
        id: newThread.id,
        clientId: newThread.clientUserId,
        specialistId: newThread.specialistUserId,
        requestId: newThread.requestId,
        createdAt: newThread.createdAt.toISOString(),
        updatedAt: newThread.createdAt.toISOString()
      }
    } as CreateThreadResponse, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные параметры запроса', details: error.issues }, { status: 400 });
    }
    
    console.error('Error creating chat thread:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

// GET /api/chat/threads - список тредов текущего пользователя
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const { limit, offset } = getThreadsSchema.parse(params);

    // Получаем треды пользователя
    const threads = await prisma.chatThread.findMany({
      where: {
        OR: [
          { clientUserId: session.user.id },
          { specialistUserId: session.user.id }
        ]
      },
      include: {
        client: {
          include: { clientProfile: true }
        },
        specialist: {
          include: { specialistProfile: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            messages: {
              where: {
                senderUserId: { not: session.user.id },
                isRead: false
              }
            }
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' },
      skip: offset,
      take: limit
    });

    // Преобразуем в формат ответа
    const items = threads.map(thread => {
      const isClient = thread.clientUserId === session.user.id;
      const peer = isClient ? thread.specialist : thread.client;
      const peerProfile = isClient ? thread.specialist.specialistProfile : thread.client.clientProfile;
      
      return {
        id: thread.id,
        clientId: thread.clientUserId,
        specialistId: thread.specialistUserId,
        requestId: thread.requestId,
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.lastMessageAt.toISOString(),
        peer: {
          id: peer.id,
          displayName: peerProfile?.displayName || peer.email,
          avatarUrl: undefined // Пока нет аватаров
        },
        lastMessage: thread.messages[0] ? {
          id: thread.messages[0].id,
          threadId: thread.id,
          senderId: thread.messages[0].senderUserId,
          content: thread.messages[0].body,
          createdAt: thread.messages[0].createdAt.toISOString(),
          readAt: null
        } : undefined,
        unreadCount: thread._count.messages
      };
    });

    const total = await prisma.chatThread.count({
      where: {
        OR: [
          { clientUserId: session.user.id },
          { specialistUserId: session.user.id }
        ]
      }
    });

    return NextResponse.json({ threads: items, total } as GetThreadsResponse);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Неверные параметры запроса', details: error.issues }, { status: 400 });
    }
    
    console.error('Error fetching chat threads:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}


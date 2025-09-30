import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { AcceptApplicationResponse, DeclineApplicationResponse } from '@/types/request';

// POST /api/applications/:id/accept - принять отклик (только автор заявки)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id: applicationId } = await params;

    // Используем транзакцию для атомарности операций
    const result = await prisma.$transaction(async (tx) => {
      // Получаем отклик с заявкой
      const application = await tx.application.findUnique({
        where: { id: applicationId },
        include: {
          request: {
            include: {
              client: true
            }
          },
          specialist: true
        }
      });

      if (!application) {
        throw new Error('APPLICATION_NOT_FOUND');
      }

      // Проверяем, что пользователь - автор заявки
      if (application.request.clientUserId !== session.user.id) {
        throw new Error('FORBIDDEN');
      }

      // Проверяем статус отклика
      if (application.status !== 'SENT') {
        throw new Error('INVALID_STATUS');
      }

      // Проверяем статус заявки
      if (application.request.status !== 'OPEN') {
        throw new Error('REQUEST_NOT_OPEN');
      }

      // Обновляем статус отклика
      await tx.application.update({
        where: { id: applicationId },
        data: { status: 'ACCEPTED' }
      });

      // Обновляем статус заявки
      await tx.request.update({
        where: { id: application.request.id },
        data: { status: 'IN_PROGRESS' }
      });

      // Ищем существующий чат или создаем новый
      let chatThread = await tx.chatThread.findFirst({
        where: {
          clientUserId: application.request.clientUserId,
          specialistUserId: application.specialistUserId,
          requestId: application.request.id
        }
      });

      if (!chatThread) {
        // Создаем новый чат
        chatThread = await tx.chatThread.create({
          data: {
            clientUserId: application.request.clientUserId,
            specialistUserId: application.specialistUserId,
            requestId: application.request.id
          }
        });
      }

      return chatThread.id;
    });

    // Отправляем уведомление специалисту через Socket.IO
    if ((global as any).emitThreadUpdated) {
      (global as any).emitThreadUpdated(result, null, 0);
    }

    return NextResponse.json({
      threadId: result
    } as AcceptApplicationResponse, { status: 200 });

  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'APPLICATION_NOT_FOUND':
          return NextResponse.json({ error: 'Отклик не найден' }, { status: 404 });
        case 'FORBIDDEN':
          return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
        case 'INVALID_STATUS':
          return NextResponse.json({ error: 'Отклик уже обработан' }, { status: 400 });
        case 'REQUEST_NOT_OPEN':
          return NextResponse.json({ error: 'Заявка не принимает отклики' }, { status: 400 });
      }
    }
    
    console.error('Error accepting application:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { DeclineApplicationResponse } from '@/types/request';

// POST /api/applications/:id/decline - отклонить отклик (только автор заявки)
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

    // Получаем отклик с заявкой
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        request: {
          include: {
            clientUser: true
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: 'Отклик не найден' }, { status: 404 });
    }

    // Проверяем, что пользователь - автор заявки
    if (application.request.clientUserId !== session.user.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Проверяем статус отклика
    if (application.status !== 'PENDING') {
      return NextResponse.json({ error: 'Отклик уже обработан' }, { status: 400 });
    }

    // Обновляем статус отклика
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'REJECTED' }
    });

    return NextResponse.json({
      success: true
    } as DeclineApplicationResponse, { status: 200 });

  } catch (error) {
    console.error('Error declining application:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

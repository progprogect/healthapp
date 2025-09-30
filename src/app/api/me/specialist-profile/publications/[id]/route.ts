import { NextResponse } from 'next/server';
import { requireSpecialistProfile } from '@/lib/auth-guards';
import { prisma } from '@/lib/prisma';

// DELETE /api/me/specialist-profile/publications/[id] - удалить публикацию
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireSpecialistProfile();
    const { id } = await params;

    // Проверяем, что публикация принадлежит текущему специалисту
    const publication = await prisma.publication.findFirst({
      where: {
        id: id,
        specialistId: user.id
      }
    });

    if (!publication) {
      return NextResponse.json({ error: 'Публикация не найдена' }, { status: 404 });
    }

    await prisma.publication.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    if (error instanceof Error && ['UNAUTHORIZED', 'NO_SPECIALIST_PROFILE', 'USER_NOT_ACTIVE'].includes(error.message)) {
      const status = error.message === 'UNAUTHORIZED' ? 401 : 403;
      return NextResponse.json({ error: 'Unauthorized' }, { status });
    }
    
    console.error('Error deleting publication:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


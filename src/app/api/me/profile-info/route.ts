import { NextResponse } from 'next/server';
import { requireActiveUser } from '@/lib/auth-guards';
import { prisma } from '@/lib/prisma';

// GET /api/me/profile-info - получить информацию о профилях пользователя
export async function GET() {
  try {
    const { user } = await requireActiveUser();

    // Получаем информацию о профилях
    const userWithProfiles = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        clientProfile: true,
        specialistProfile: true
      }
    });

    if (!userWithProfiles) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      profile: {
        hasClientProfile: !!userWithProfiles.clientProfile,
        hasSpecialistProfile: !!userWithProfiles.specialistProfile
      }
    });

  } catch (error) {
    if (error instanceof Error && ['UNAUTHORIZED', 'USER_NOT_ACTIVE'].includes(error.message)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error fetching profile info:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

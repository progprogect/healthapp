import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST /api/me/become-specialist - стать специалистом (идемпотентно)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Используем транзакцию для атомарности операций
    const result = await prisma.$transaction(async (tx) => {
      // Получаем пользователя с профилями
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        include: {
          clientProfile: true,
          specialistProfile: true
        }
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Проверяем статус пользователя
      if (user.status !== 'ACTIVE') {
        throw new Error('USER_NOT_ACTIVE');
      }

      // Если профиль специалиста уже существует, возвращаем его (идемпотентность)
      if (user.specialistProfile) {
        return {
          ok: true,
          specialistProfileId: user.specialistProfile.userId,
          alreadyHadProfile: true
        };
      }

      // Создаем пустой профиль специалиста
      const specialistProfile = await tx.specialistProfile.create({
        data: {
          userId: user.id,
          displayName: user.clientProfile?.displayName || user.email.split('@')[0],
          bio: '',
          experienceYears: 0,
          priceMinCents: null,
          priceMaxCents: null,
          onlineOnly: true, // По умолчанию только онлайн
          city: null,
          verified: false
        }
      });

      // Логируем событие user_becomes_specialist
      console.log(`[ANALYTICS] user_becomes_specialist: userId=${user.id}, timestamp=${new Date().toISOString()}`);

      return {
        ok: true,
          specialistProfileId: specialistProfile.userId,
        alreadyHadProfile: false
      };
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'USER_NOT_FOUND':
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        case 'USER_NOT_ACTIVE':
          return NextResponse.json({ error: 'User is not active' }, { status: 403 });
      }
    }
    
    console.error('Error becoming specialist:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

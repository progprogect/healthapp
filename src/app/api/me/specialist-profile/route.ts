import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireActiveUser, createErrorResponse } from '@/lib/auth-guards';
import { SpecialistProfile } from '@/types/specialist';

// GET /api/me/specialist-profile - проверить наличие specialist profile
export async function GET() {
  try {
    const { user } = await requireActiveUser();

    // Проверяем, есть ли у пользователя specialist profile с полными данными
    const specialistProfile = await prisma.specialistProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          include: {
            specialistCategories: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    if (!specialistProfile) {
      return NextResponse.json({ error: 'Specialist profile not found' }, { status: 404 });
    }

    // Формируем полный профиль специалиста
    const profile: SpecialistProfile = {
      id: user.id,
      displayName: specialistProfile.displayName,
      bio: specialistProfile.bio,
      city: specialistProfile.city,
      onlineOnly: specialistProfile.onlineOnly,
      experienceYears: specialistProfile.experienceYears,
      priceMinCents: specialistProfile.priceMinCents,
      priceMaxCents: specialistProfile.priceMaxCents,
      categories: specialistProfile.user.specialistCategories.map(sc => ({
        slug: sc.category.slug,
        name: sc.category.name
      })),
      verified: specialistProfile.verified,
      avatarUrl: specialistProfile.avatarUrl,
      createdAt: specialistProfile.createdAt.toISOString()
    };

    return NextResponse.json(profile);

  } catch (error) {
    // Обрабатываем ошибки авторизации
    if (error instanceof Error && ['UNAUTHORIZED', 'USER_NOT_ACTIVE'].includes(error.message)) {
      const errorResponse = createErrorResponse(error.message, 
        error.message === 'UNAUTHORIZED' ? 401 : 403
      );
      return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.status });
    }
    
    console.error('Error checking specialist profile:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
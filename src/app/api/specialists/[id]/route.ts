import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SpecialistProfile } from '@/types/specialist';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Валидация ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Неверный ID специалиста' },
        { status: 400 }
      );
    }

    // Поиск специалиста с полными данными
    const specialist = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'SPECIALIST',
        status: 'ACTIVE',
        specialistProfile: {
          isNot: null
        }
      },
      include: {
        specialistProfile: true,
        specialistCategories: {
          include: {
            category: true
          }
        }
      }
    });

    // Если специалист не найден
    if (!specialist || !specialist.specialistProfile) {
      return NextResponse.json(
        { error: 'Специалист не найден' },
        { status: 404 }
      );
    }

    // Формирование ответа
    const profile: SpecialistProfile = {
      id: specialist.id,
      displayName: specialist.specialistProfile.displayName,
      bio: specialist.specialistProfile.bio,
      city: specialist.specialistProfile.city,
      onlineOnly: specialist.specialistProfile.onlineOnly,
      experienceYears: specialist.specialistProfile.experienceYears,
      priceMinCents: specialist.specialistProfile.priceMinCents,
      priceMaxCents: specialist.specialistProfile.priceMaxCents,
      categories: specialist.specialistCategories.map(sc => ({
        slug: sc.category.slug,
        name: sc.category.name
      })),
      verified: specialist.specialistProfile.verified,
      avatarUrl: specialist.specialistProfile.avatarUrl,
      createdAt: specialist.specialistProfile.createdAt.toISOString()
    };

    return NextResponse.json(profile, { status: 200 });

  } catch (error) {
    console.error('Error fetching specialist profile:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

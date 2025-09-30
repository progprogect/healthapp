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
        },
        education: {
          orderBy: { createdAt: 'desc' }
        },
        publications: {
          orderBy: { createdAt: 'desc' }
        },
        reviews: {
          where: { isPublic: true },
          include: {
            client: {
              include: { clientProfile: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
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
      
      // Новые поля
      videoPresentationUrl: specialistProfile.videoPresentationUrl || undefined,
      videoThumbnailUrl: specialistProfile.videoThumbnailUrl || undefined,
      galleryImages: specialistProfile.galleryImages as any[],
      languages: specialistProfile.languages as string[],
      ageGroups: specialistProfile.ageGroups as string[],
      timezone: specialistProfile.timezone || undefined,
      averageRating: specialistProfile.averageRating || 0,
      totalReviews: specialistProfile.totalReviews,
      
      // Связанные данные
      education: specialistProfile.education.map(edu => ({
        id: edu.id,
        title: edu.title,
        institution: edu.institution,
        degree: edu.degree || undefined,
        year: edu.year || undefined,
        documentUrl: edu.documentUrl || undefined,
        documentType: edu.documentType,
        isVerified: edu.isVerified,
        verifiedAt: edu.verifiedAt?.toISOString(),
        verifiedBy: edu.verifiedBy || undefined,
        createdAt: edu.createdAt.toISOString()
      })),
      
      publications: specialistProfile.publications.map(pub => ({
        id: pub.id,
        title: pub.title,
        url: pub.url,
        type: pub.type as any,
        year: pub.year || undefined,
        isVerified: pub.isVerified,
        createdAt: pub.createdAt.toISOString()
      })),
      
      reviews: specialistProfile.reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment || undefined,
        isVerified: review.isVerified,
        isPublic: review.isPublic,
        createdAt: review.createdAt.toISOString(),
        client: {
          id: review.client.id,
          displayName: review.client.clientProfile?.displayName || review.client.email
        }
      })),
      
      createdAt: specialistProfile.createdAt.toISOString(),
      updatedAt: specialistProfile.updatedAt.toISOString()
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

// PUT /api/me/specialist-profile - обновить профиль специалиста
export async function PUT(request: Request) {
  try {
    const { user } = await requireActiveUser();
    
    // Проверяем, что у пользователя есть профиль специалиста
    const specialistProfile = await prisma.specialistProfile.findUnique({
      where: { userId: user.id }
    });
    
    if (!specialistProfile) {
      return NextResponse.json({ error: 'Профиль специалиста не найден' }, { status: 404 });
    }

    const body = await request.json();
    
    // Валидация основных полей
    const updateData = {
      displayName: body.displayName?.trim(),
      bio: body.bio?.trim(),
      experienceYears: body.experienceYears,
      onlineOnly: body.onlineOnly,
      city: body.onlineOnly ? null : body.city?.trim() || null,
      priceMinCents: body.priceMinCents,
      priceMaxCents: body.priceMaxCents,
      
      // Новые поля
      videoPresentationUrl: body.videoPresentationUrl || null,
      galleryImages: body.galleryImages || [],
      languages: body.languages || [],
      ageGroups: body.ageGroups || [],
      timezone: body.timezone || null
    };

    // Обновляем профиль
    const updatedProfile = await prisma.specialistProfile.update({
      where: { userId: user.id },
      data: updateData,
      include: {
        user: {
          include: {
            specialistCategories: {
              include: {
                category: true
              }
            }
          }
        },
        education: {
          orderBy: { createdAt: 'desc' }
        },
        publications: {
          orderBy: { createdAt: 'desc' }
        },
        reviews: {
          where: { isPublic: true },
          include: {
            client: {
              include: { clientProfile: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    // Формируем ответ
    const profile: SpecialistProfile = {
      id: user.id,
      displayName: updatedProfile.displayName,
      bio: updatedProfile.bio,
      city: updatedProfile.city,
      onlineOnly: updatedProfile.onlineOnly,
      experienceYears: updatedProfile.experienceYears,
      priceMinCents: updatedProfile.priceMinCents,
      priceMaxCents: updatedProfile.priceMaxCents,
      categories: updatedProfile.user.specialistCategories.map(sc => ({
        slug: sc.category.slug,
        name: sc.category.name
      })),
      verified: updatedProfile.verified,
      avatarUrl: updatedProfile.avatarUrl,
      
      // Новые поля
      videoPresentationUrl: updatedProfile.videoPresentationUrl || undefined,
      videoThumbnailUrl: updatedProfile.videoThumbnailUrl || undefined,
      galleryImages: updatedProfile.galleryImages as any[],
      languages: updatedProfile.languages as string[],
      ageGroups: updatedProfile.ageGroups as string[],
      timezone: updatedProfile.timezone || undefined,
      averageRating: updatedProfile.averageRating || 0,
      totalReviews: updatedProfile.totalReviews,
      
      // Связанные данные
      education: updatedProfile.education.map(edu => ({
        id: edu.id,
        title: edu.title,
        institution: edu.institution,
        degree: edu.degree || undefined,
        year: edu.year || undefined,
        documentUrl: edu.documentUrl || undefined,
        documentType: edu.documentType,
        isVerified: edu.isVerified,
        verifiedAt: edu.verifiedAt?.toISOString(),
        verifiedBy: edu.verifiedBy || undefined,
        createdAt: edu.createdAt.toISOString()
      })),
      
      publications: updatedProfile.publications.map(pub => ({
        id: pub.id,
        title: pub.title,
        url: pub.url,
        type: pub.type as any,
        year: pub.year || undefined,
        isVerified: pub.isVerified,
        createdAt: pub.createdAt.toISOString()
      })),
      
      reviews: updatedProfile.reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment || undefined,
        isVerified: review.isVerified,
        isPublic: review.isPublic,
        createdAt: review.createdAt.toISOString(),
        client: {
          id: review.client.id,
          displayName: review.client.clientProfile?.displayName || review.client.email
        }
      })),
      
      createdAt: updatedProfile.createdAt.toISOString(),
      updatedAt: updatedProfile.updatedAt.toISOString()
    };

    return NextResponse.json(profile);

  } catch (error) {
    if (error instanceof Error && ['UNAUTHORIZED', 'NO_SPECIALIST_PROFILE', 'USER_NOT_ACTIVE'].includes(error.message)) {
      const status = error.message === 'UNAUTHORIZED' ? 401 : 403;
      return NextResponse.json({ error: 'Unauthorized' }, { status });
    }
    
    console.error('Error updating specialist profile:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
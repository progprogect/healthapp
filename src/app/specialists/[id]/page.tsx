import { notFound } from 'next/navigation';
import { SpecialistProfile } from '@/types/specialist';
import Link from 'next/link';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import StartChatButton from '@/components/StartChatButton';
import Providers from '@/components/Providers';
import AvatarImage from '@/components/AvatarImage';
import { prisma } from '@/lib/prisma';

// Lazy load тяжелых компонентов
const VideoPresentation = dynamic(() => import('@/components/specialist/VideoPresentation'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64" />
});

const ImageGalleryDisplay = dynamic(() => import('@/components/specialist/ImageGalleryDisplay'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-48" />
});

const EducationCard = dynamic(() => import('@/components/specialist/EducationCard'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-32" />
});

const PublicationCard = dynamic(() => import('@/components/specialist/PublicationCard'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-32" />
});

const ReviewCard = dynamic(() => import('@/components/specialist/ReviewCard'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-24" />
});

const RatingDisplay = dynamic(() => import('@/components/specialist/RatingDisplay'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-6 w-24" />
});

const SpecialistBadges = dynamic(() => import('@/components/specialist/SpecialistBadges'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-8 w-32" />
});

const TimezoneDisplay = dynamic(() => import('@/components/specialist/TimezoneDisplay'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-4 w-20" />
});

const ReviewsList = dynamic(() => import('@/components/ReviewsList'), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-32" />
});

// Функция для получения данных профиля специалиста через Prisma
async function getSpecialistProfile(id: string): Promise<SpecialistProfile | null> {
  try {
    // Валидация ID
    if (!id || typeof id !== 'string') {
      return null;
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
        specialistProfile: {
          include: {
            education: {
              where: { isVerified: true },
              orderBy: { createdAt: 'desc' }
            },
            publications: {
              where: { isVerified: true },
              orderBy: { createdAt: 'desc' }
            },
            reviews: {
              where: { 
                isPublic: true, 
                isVerified: true 
              },
              include: {
                client: {
                  include: {
                    clientProfile: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        },
        specialistCategories: {
          include: {
            category: true
          }
        }
      }
    });

    // Если специалист не найден
    if (!specialist || !specialist.specialistProfile) {
      return null;
    }

    // Формирование профиля
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
      createdAt: specialist.specialistProfile.createdAt.toISOString(),
      updatedAt: specialist.specialistProfile.updatedAt.toISOString(),
      
      // Новые поля
      videoPresentationUrl: specialist.specialistProfile.videoPresentationUrl || undefined,
      videoThumbnailUrl: specialist.specialistProfile.videoThumbnailUrl || undefined,
      galleryImages: specialist.specialistProfile.galleryImages as any[] || [],
      languages: specialist.specialistProfile.languages as string[] || [],
      ageGroups: specialist.specialistProfile.ageGroups as string[] || [],
      timezone: specialist.specialistProfile.timezone || undefined,
      averageRating: specialist.specialistProfile.averageRating || 0,
      totalReviews: specialist.specialistProfile.totalReviews || 0,
      
      // Связанные данные
      education: specialist.specialistProfile.education.map(edu => ({
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
      
      publications: specialist.specialistProfile.publications.map(pub => ({
        id: pub.id,
        title: pub.title,
        url: pub.url,
        type: pub.type as any,
        year: pub.year || undefined,
        isVerified: pub.isVerified,
        createdAt: pub.createdAt.toISOString()
      })),
      
      reviews: specialist.specialistProfile.reviews.map(review => ({
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
      }))
    };

    return profile;
  } catch (error) {
    console.error('Error fetching specialist profile:', error);
    return null;
  }
}

// Генерация мета-данных для SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const specialist = await getSpecialistProfile(id);

  if (!specialist) {
    return {
      title: 'Специалист не найден | HealthApp',
      description: 'Запрашиваемый специалист не найден',
    };
  }

  const categories = specialist.categories.map(cat => cat.name).join(', ');
  const location = specialist.onlineOnly ? 'Онлайн' : specialist.city || 'Онлайн + Офлайн';
  const languages = specialist.languages.length > 0 ? ` Языки: ${specialist.languages.join(', ')}.` : '';
  const rating = specialist.totalReviews > 0 ? ` Рейтинг: ${specialist.averageRating.toFixed(1)}/10 (${specialist.totalReviews} отзывов).` : '';
  
  const description = `${specialist.bio} ${categories}. ${location}. Опыт: ${specialist.experienceYears} лет.${languages}${rating}`;
  
  return {
    title: `${specialist.displayName} | ${categories} | HealthApp`,
    description: description,
    openGraph: {
      title: `${specialist.displayName} | ${categories}`,
      description: specialist.bio,
      type: 'profile',
      images: specialist.avatarUrl ? [
        {
          url: specialist.avatarUrl,
          width: 400,
          height: 400,
          alt: specialist.displayName,
        }
      ] : [],
    },
    twitter: {
      card: 'summary',
      title: `${specialist.displayName} | ${categories}`,
      description: specialist.bio,
      images: specialist.avatarUrl ? [specialist.avatarUrl] : [],
    },
  };
}

// Компонент профиля специалиста
async function SpecialistProfileComponent({ id }: { id: string }) {
  const specialist = await getSpecialistProfile(id);

  if (!specialist) {
    notFound();
  }

  const formatPrice = (cents: number | null) => {
    if (!cents) return null;
    return `$${(cents / 100).toFixed(0)}`;
  };

  const formatPriceRange = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Цена не указана';
    if (!min) return `до ${formatPrice(max)}`;
    if (!max) return `от ${formatPrice(min)}`;
    if (min === max) return formatPrice(min);
    return `${formatPrice(min)} - ${formatPrice(max)}`;
  };

  const getLocationText = () => {
    if (specialist.onlineOnly) return 'Только онлайн';
    if (specialist.city) return `Офлайн (${specialist.city})`;
    return 'Онлайн + Офлайн';
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 mb-6">
        <div className="flex items-start space-x-6 mb-6">
          <div className="flex-shrink-0">
            <AvatarImage
              src={specialist.avatarUrl}
              alt={specialist.displayName}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
            />
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {specialist.displayName}
              </h1>
              {specialist.verified && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 w-fit">
                  Verified
                </span>
              )}
            </div>
            
            {/* Rating */}
            <div className="mb-4">
              <RatingDisplay 
                rating={specialist.averageRating} 
                totalReviews={specialist.totalReviews}
              />
            </div>
            
            <div className="text-base sm:text-lg text-gray-600 mb-4">
              {specialist.bio}
            </div>

            {/* Categories */}
            {specialist.categories.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {specialist.categories.map((category, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages and Age Groups */}
            <SpecialistBadges 
              languages={specialist.languages}
              ageGroups={specialist.ageGroups}
            />
          </div>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center card-muted p-6">
            <div className="text-heading-2 text-indigo-600 mb-2">
              {specialist.experienceYears}
            </div>
            <div className="text-body-sm">лет опыта</div>
          </div>
          
          <div className="text-center card-muted p-6">
            <div className="text-heading-3 text-indigo-600 mb-2 break-words">
              {formatPriceRange(specialist.priceMinCents, specialist.priceMaxCents)}
            </div>
            <div className="text-body-sm">за сессию</div>
          </div>
          
          <div className="text-center card-muted p-6">
            <div className="text-heading-3 text-indigo-600 mb-2 break-words">
              {getLocationText()}
            </div>
            <div className="text-body-sm">формат работы</div>
          </div>

          {/* Timezone */}
          {specialist.timezone && (
            <div className="text-center card-muted p-6">
              <TimezoneDisplay timezone={specialist.timezone} />
            </div>
          )}
        </div>
      </div>

      {/* Video Presentation */}
      {specialist.videoPresentationUrl && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <VideoPresentation
            videoUrl={specialist.videoPresentationUrl}
            thumbnailUrl={specialist.videoThumbnailUrl}
            specialistName={specialist.displayName}
          />
        </div>
      )}

      {/* Gallery */}
      {specialist.galleryImages && specialist.galleryImages.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <ImageGalleryDisplay
            images={specialist.galleryImages}
            specialistName={specialist.displayName}
          />
        </div>
      )}

      {/* Education */}
      {specialist.education && specialist.education.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Образование и сертификаты</h3>
          <div className="space-y-4">
            {specialist.education.map((edu) => (
              <EducationCard key={edu.id} education={edu} />
            ))}
          </div>
        </div>
      )}

      {/* Publications */}
      {specialist.publications && specialist.publications.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Публикации</h3>
          <div className="space-y-4">
            {specialist.publications.map((pub) => (
              <PublicationCard key={pub.id} publication={pub} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <ReviewsList specialistId={specialist.id} className="mb-6" />

      {/* Actions */}
      <div className="card-elevated p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Providers>
            <StartChatButton specialistId={specialist.id} />
          </Providers>
          <button className="flex-1 btn btn-primary btn-lg">
            Записаться на консультацию
          </button>
        </div>
      </div>

      {/* Back to catalog */}
      <div className="mt-6">
        <Link 
          href="/specialists"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Вернуться к каталогу
        </Link>
      </div>
    </div>
  );
}

// Основной компонент страницы
export default async function SpecialistProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold text-gray-900">
                HealthApp
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/specialists"
                className="text-gray-600 hover:text-gray-900"
              >
                Каталог
              </Link>
              <Link
                href="/app"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Личный кабинет
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <SpecialistProfileComponent id={id} />
      </div>
    </div>
  );
}

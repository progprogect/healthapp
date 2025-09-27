import { Suspense } from 'react';
import { GetSpecialistsResponse, SpecialistCard } from '@/types/specialist';
import SpecialistCardComponent from '@/components/SpecialistCard';
import SpecialistCardSkeleton from '@/components/SpecialistCardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import SpecialistsFilters from '@/components/SpecialistsFilters';
import PaginationWrapper from '@/components/PaginationWrapper';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Zod schema для параметров поиска
const specialistSearchParamsSchema = z.object({
  category: z.string().optional(),
  format: z.enum(['online', 'offline', 'any']).default('any'),
  city: z.string().optional(),
  minExp: z.string().transform(Number).optional(),
  priceMin: z.string().transform(Number).optional(),
  priceMax: z.string().transform(Number).optional(),
  q: z.string().optional(),
  verifiedOnly: z.string().transform(val => val === 'true').default('true'),
  sort: z.enum(['recent', 'price_asc', 'price_desc']).default('recent'),
  limit: z.string().transform(Number).default('20'),
  offset: z.string().transform(Number).default('0'),
});

// Функция для получения данных специалистов через Prisma
async function getSpecialists(searchParams: Promise<{ [key: string]: string | string[] | undefined }>): Promise<GetSpecialistsResponse> {
  const resolvedParams = await searchParams;
  const params = Object.fromEntries(
    Object.entries(resolvedParams).filter(([_, value]) => value !== undefined && value !== '')
  );

  const validatedParams = specialistSearchParamsSchema.safeParse(params);
  if (!validatedParams.success) {
    throw new Error('Неверные параметры запроса');
  }

  const limit = validatedParams.data.limit;
  const offset = validatedParams.data.offset;

  const where: any = {
    role: 'SPECIALIST',
    status: 'ACTIVE',
  };

  // Применяем фильтры
  if (validatedParams.data.category) {
    where.specialistCategories = {
      some: {
        category: {
          slug: validatedParams.data.category
        }
      }
    };
  }

  // Создаем объект для фильтров specialistProfile
  const specialistProfileFilters: any = {};

  if (validatedParams.data.format === 'online') {
    specialistProfileFilters.onlineOnly = true;
  } else if (validatedParams.data.format === 'offline') {
    specialistProfileFilters.onlineOnly = false;
    if (validatedParams.data.city) {
      specialistProfileFilters.city = validatedParams.data.city;
    }
  }

  if (validatedParams.data.minExp !== undefined) {
    specialistProfileFilters.experienceYears = {
      gte: validatedParams.data.minExp
    };
  }

  if (validatedParams.data.priceMin !== undefined || validatedParams.data.priceMax !== undefined) {
    specialistProfileFilters.AND = [];
    if (validatedParams.data.priceMin !== undefined) {
      specialistProfileFilters.AND.push({
        priceMinCents: {
          gte: validatedParams.data.priceMin
        }
      });
    }
    if (validatedParams.data.priceMax !== undefined) {
      specialistProfileFilters.AND.push({
        priceMaxCents: {
          lte: validatedParams.data.priceMax
        }
      });
    }
  }

  if (validatedParams.data.verifiedOnly) {
    specialistProfileFilters.verified = true;
  }

  // Применяем фильтры specialistProfile
  where.specialistProfile = {
    is: {
      ...specialistProfileFilters
    }
  };

  if (validatedParams.data.q) {
    where.OR = [
      {
        specialistProfile: {
          displayName: {
            contains: validatedParams.data.q,
            mode: 'insensitive'
          }
        }
      },
      {
        specialistProfile: {
          bio: {
            contains: validatedParams.data.q,
            mode: 'insensitive'
          }
        }
      }
    ];
  }

  // Определяем сортировку
  let orderBy: any = {
    specialistProfile: {
      createdAt: 'desc'
    }
  };

  if (validatedParams.data.sort === 'price_asc') {
    orderBy = {
      specialistProfile: {
        priceMinCents: 'asc'
      }
    };
  } else if (validatedParams.data.sort === 'price_desc') {
    orderBy = {
      specialistProfile: {
        priceMinCents: 'desc'
      }
    };
  }

  const specialists = await prisma.user.findMany({
    where,
    skip: Number(offset),
    take: Number(limit),
    include: {
      specialistProfile: true,
      specialistCategories: {
        include: {
          category: true
        }
      }
    },
    orderBy
  });

  const total = await prisma.user.count({ where });

  // Преобразование в формат SpecialistCard
  const items = specialists.map(specialist => ({
    id: specialist.id,
    displayName: specialist.specialistProfile!.displayName,
    city: specialist.specialistProfile!.city,
    onlineOnly: specialist.specialistProfile!.onlineOnly,
    priceMinCents: specialist.specialistProfile!.priceMinCents,
    priceMaxCents: specialist.specialistProfile!.priceMaxCents,
    experienceYears: specialist.specialistProfile!.experienceYears,
    categories: specialist.specialistCategories.map(sc => sc.category.slug),
    verified: specialist.specialistProfile!.verified,
    avatarUrl: specialist.specialistProfile!.avatarUrl
  }));

  return { items, total };
}

// Компонент списка специалистов
async function SpecialistsList({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  try {
    const resolvedParams = await searchParams;
    const { items: specialists, total } = await getSpecialists(searchParams);
    const currentOffset = parseInt(String(resolvedParams.offset || '0'));
    const limit = 20;

    if (specialists.length === 0) {
      return (
        <EmptyState
          title="Специалисты не найдены"
          description="Попробуйте изменить параметры поиска или сбросить фильтры"
          actionText="Сбросить фильтры"
          onAction={() => window.location.href = '/specialists'}
        />
      );
    }

    return (
      <>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Найдено специалистов: {total}
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
          {specialists.map((specialist: SpecialistCard) => (
            <SpecialistCardComponent key={specialist.id} specialist={specialist} />
          ))}
        </div>

                    <PaginationWrapper
                      currentOffset={currentOffset}
                      total={total}
                      limit={limit}
                    />
      </>
    );
  } catch (error) {
    console.error('Error loading specialists:', error);
    return (
      <ErrorState
        title="Ошибка загрузки"
        description="Не удалось загрузить список специалистов. Попробуйте обновить страницу."
      />
    );
  }
}

// Компонент скелетона для загрузки
function SpecialistsListSkeleton() {
  return (
    <>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <SpecialistCardSkeleton key={index} />
        ))}
      </div>
    </>
  );
}

// Основной компонент страницы
export default function SpecialistsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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
                href="/app"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Личный кабинет
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Каталог специалистов
          </h1>

          {/* Фильтры */}
          <SpecialistsFilters />

          {/* Результаты */}
          <div className="bg-white rounded-lg shadow">
            <Suspense fallback={<SpecialistsListSkeleton />}>
              <SpecialistsList searchParams={searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

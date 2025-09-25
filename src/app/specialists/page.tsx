import { Suspense } from 'react';
import { GetSpecialistsResponse, SpecialistCard } from '@/types/specialist';
import SpecialistCardComponent from '@/components/SpecialistCard';
import SpecialistCardSkeleton from '@/components/SpecialistCardSkeleton';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import SpecialistsFilters from '@/components/SpecialistsFilters';
import PaginationWrapper from '@/components/PaginationWrapper';
import Link from 'next/link';

// Функция для получения данных специалистов
async function getSpecialists(searchParams: Promise<{ [key: string]: string | string[] | undefined }>): Promise<GetSpecialistsResponse> {
  const resolvedParams = await searchParams;
  const params = new URLSearchParams();
  
  // Добавляем параметры поиска
  Object.entries(resolvedParams).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.append(key, String(value));
    }
  });

  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/specialists?${params.toString()}`, {
    cache: 'no-store' // Всегда получаем свежие данные
  });

  if (!response.ok) {
    throw new Error('Failed to fetch specialists');
  }

  return response.json();
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
        onRetry={() => window.location.reload()}
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

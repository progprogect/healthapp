import { notFound } from 'next/navigation';
import { SpecialistProfile } from '@/types/specialist';
import Link from 'next/link';
import { Metadata } from 'next';

// Функция для получения данных профиля специалиста
async function getSpecialistProfile(id: string): Promise<SpecialistProfile | null> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/specialists/${id}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch specialist profile');
    }

    return response.json();
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
  
  return {
    title: `${specialist.displayName} | ${categories} | HealthApp`,
    description: `${specialist.bio} ${categories}. ${location}. Опыт: ${specialist.experienceYears} лет.`,
    openGraph: {
      title: `${specialist.displayName} | ${categories}`,
      description: specialist.bio,
      type: 'profile',
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
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
          </div>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-xl sm:text-2xl font-bold text-indigo-600 mb-1">
              {specialist.experienceYears}
            </div>
            <div className="text-sm text-gray-600">лет опыта</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-lg sm:text-xl font-bold text-indigo-600 mb-1 break-words">
              {formatPriceRange(specialist.priceMinCents, specialist.priceMaxCents)}
            </div>
            <div className="text-sm text-gray-600">за сессию</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg sm:col-span-2 lg:col-span-1">
            <div className="text-lg sm:text-xl font-bold text-indigo-600 mb-1 break-words">
              {getLocationText()}
            </div>
            <div className="text-sm text-gray-600">формат работы</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative group">
            <button 
              disabled
              className="w-full bg-gray-400 text-white px-4 sm:px-6 py-3 rounded-md text-base sm:text-lg font-medium cursor-not-allowed transition-colors"
            >
              Написать
            </button>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Чат в разработке
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
          <button className="flex-1 bg-indigo-600 text-white px-4 sm:px-6 py-3 rounded-md text-base sm:text-lg font-medium hover:bg-indigo-700 transition-colors">
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

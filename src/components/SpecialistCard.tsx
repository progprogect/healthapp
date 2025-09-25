import Link from 'next/link';
import { SpecialistCard as SpecialistCardType } from '@/types/specialist';

interface SpecialistCardProps {
  specialist: SpecialistCardType;
}

export default function SpecialistCard({ specialist }: SpecialistCardProps) {
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
    if (specialist.onlineOnly) return 'Онлайн';
    if (specialist.city) return specialist.city;
    return 'Онлайн + Офлайн';
  };

  return (
    <Link 
      href={`/specialists/${specialist.id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 h-full"
    >
      <div className="flex flex-col h-full">
        {/* Header with name and verified badge */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {specialist.displayName}
          </h3>
          {specialist.verified && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2 flex-shrink-0">
              Verified
            </span>
          )}
        </div>

        {/* Categories */}
        {specialist.categories.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {specialist.categories.slice(0, 2).map((category, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {category}
                </span>
              ))}
              {specialist.categories.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  +{specialist.categories.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Location and format */}
        <div className="mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {getLocationText()}
          </div>
        </div>

        {/* Experience */}
        <div className="mb-3">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Опыт:</span> {specialist.experienceYears} лет
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Цена:</span> {formatPriceRange(specialist.priceMinCents, specialist.priceMaxCents)}
          </div>
        </div>

        {/* Footer with CTA */}
        <div className="mt-auto">
          <div className="text-center">
            <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              Подробнее
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

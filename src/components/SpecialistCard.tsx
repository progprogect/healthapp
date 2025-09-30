import Link from 'next/link';
import { SpecialistCard as SpecialistCardType } from '@/types/specialist';
import AvatarImage from './AvatarImage';

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
      className="block card-interactive p-6 h-full"
      data-testid="specialist-card"
      data-id={specialist.id}
    >
      <div className="flex flex-col h-full">
        {/* Avatar and Header */}
        <div className="flex items-start space-x-3 mb-4">
          <div className="flex-shrink-0">
            <AvatarImage
              src={specialist.avatarUrl}
              alt={specialist.displayName}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h3 className="text-heading-4 line-clamp-2">
                {specialist.displayName}
              </h3>
              {specialist.verified && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2 flex-shrink-0">
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Categories */}
        {specialist.categories.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {specialist.categories.slice(0, 2).map((category, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
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
        <div className="mb-4">
          <div className="flex items-center text-body-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {getLocationText()}
          </div>
        </div>

        {/* Experience */}
        <div className="mb-4">
          <div className="text-body-sm">
            <span className="font-medium">Опыт:</span> {specialist.experienceYears} лет
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="text-body-sm">
            <span className="font-medium">Цена:</span> {formatPriceRange(specialist.priceMinCents, specialist.priceMaxCents)}
          </div>
        </div>

        {/* Footer with CTA */}
        <div className="mt-auto">
          <div className="text-center">
            <span className="btn-outline btn-md">
              Подробнее
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AvatarImage from './AvatarImage';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  client: {
    id: string;
    displayName: string;
  };
}

interface ReviewsListProps {
  specialistId: string;
  className?: string;
}

export default function ReviewsList({ specialistId, className = '' }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [specialistId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/specialists/${specialistId}/reviews?limit=10`);
      
      if (!response.ok) {
        throw new Error('Ошибка при загрузке отзывов');
      }

      const data = await response.json();
      setReviews(data.reviews);
      setStats(data.stats);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при загрузке отзывов');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchReviews}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Отзывы клиентов
        </h3>
        {stats.totalReviews > 0 && (
          <div className="text-right">
            <div className="flex items-center space-x-2">
              {renderStars(Math.round(stats.averageRating))}
              <span className="text-sm font-medium text-gray-900">
                {stats.averageRating.toFixed(1)}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {stats.totalReviews} отзывов
            </p>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">⭐</div>
          <p className="text-gray-500">Пока нет отзывов</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-medium text-sm">
                      {review.client.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {review.client.displayName}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {renderStars(review.rating)}
                      <span className="text-xs text-gray-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  {review.comment && (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


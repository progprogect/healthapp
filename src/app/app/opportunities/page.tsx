'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RequestFeedItem, OpportunityFilters, ApplicationFormData, ApplicationFormErrors } from '@/types/request';
import SpecialistGate from '@/components/SpecialistGate';
import RequestStatusBadge from '@/components/RequestStatusBadge';
import RequestStatusActions from '@/components/RequestStatusActions';

export default function OpportunitiesPage() {
  return (
    <SpecialistGate>
      <OpportunitiesContent />
    </SpecialistGate>
  );
}

function OpportunitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [opportunities, setOpportunities] = useState<RequestFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OpportunityFilters>({
    category: searchParams.get('category') || '',
    format: (searchParams.get('format') as 'online' | 'offline' | 'any') || 'any',
    city: searchParams.get('city') || '',
    q: searchParams.get('q') || '',
  });
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestFeedItem | null>(null);
  const [applicationForm, setApplicationForm] = useState<ApplicationFormData>({ message: '' });
  const [applicationErrors, setApplicationErrors] = useState<ApplicationFormErrors>({});
  const [submittingApplication, setSubmittingApplication] = useState(false);

  const categories = [
    { slug: 'psychologist', name: 'Психолог' },
    { slug: 'nutritionist', name: 'Нутрициолог' },
    { slug: 'personal-trainer', name: 'Персональный тренер' },
    { slug: 'health-coach', name: 'Коуч по здоровью' },
    { slug: 'physiotherapist', name: 'Физиотерапевт' },
  ];

  useEffect(() => {
    fetchOpportunities();
  }, [filters]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.format && filters.format !== 'any') params.append('format', filters.format);
      if (filters.city) params.append('city', filters.city);
      if (filters.q) params.append('q', filters.q);

      const response = await fetch(`/api/requests/feed?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Ошибка при загрузке заявок');
      }

      const data = await response.json();
      setOpportunities(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<OpportunityFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    // Обновляем URL
    const params = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value && value !== 'any') {
        params.append(key, value);
      }
    });

    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.push(`/app/opportunities${newUrl}`, { scroll: false });
  };

  const handleApplicationSubmit = async () => {
    if (!selectedRequest) return;

    // Валидация
    const errors: ApplicationFormErrors = {};
    if (!applicationForm.message.trim()) {
      errors.message = 'Введите сообщение';
    } else if (applicationForm.message.length > 1000) {
      errors.message = 'Сообщение не должно превышать 1000 символов';
    }

    if (Object.keys(errors).length > 0) {
      setApplicationErrors(errors);
      return;
    }

    try {
      setSubmittingApplication(true);
      setApplicationErrors({});

      const response = await fetch(`/api/requests/${selectedRequest.id}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.details) {
          const fieldErrors: ApplicationFormErrors = {};
          errorData.details.forEach((detail: any) => {
            fieldErrors[detail.field as keyof ApplicationFormErrors] = detail.message;
          });
          setApplicationErrors(fieldErrors);
        } else {
          setApplicationErrors({ general: errorData.error || 'Ошибка при отправке отклика' });
        }
        return;
      }

      // Успешно отправлено - закрываем модалку и обновляем список
      setShowApplicationModal(false);
      setSelectedRequest(null);
      setApplicationForm({ message: '' });
      setApplicationErrors({});
      
      // Обновляем список заявок (скрываем откликнувшуюся)
      setOpportunities(prev => prev.filter(req => req.id !== selectedRequest.id));
    } catch (err) {
      setApplicationErrors({ general: 'Ошибка сети. Попробуйте еще раз.' });
    } finally {
      setSubmittingApplication(false);
    }
  };

  const getFormatLabel = (format: string) => {
    const formatLabels = {
      online: 'Онлайн',
      offline: 'Очно',
      any: 'Любой формат',
    };
    return formatLabels[format as keyof typeof formatLabels] || format;
  };

  const formatPrice = (cents: number) => {
    return `${cents / 100} ₽`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-heading-1">Лента заявок</h1>
          <p className="text-body mt-2">Найдите подходящие заявки и откликнитесь на них</p>
        </div>

        {/* Фильтры */}
        <div className="card-elevated p-6 mb-8">
          <h2 className="text-heading-3 mb-6">Фильтры</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Категория */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Категория
              </label>
              <select
                id="category"
                data-testid="category-filter"
                value={filters.category || ''}
                onChange={(e) => updateFilters({ category: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Все категории</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Формат */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Формат работы
              </label>
              <select
                value={filters.format || 'any'}
                onChange={(e) => updateFilters({ format: e.target.value as 'online' | 'offline' | 'any' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="any">Любой формат</option>
                <option value="online">Онлайн</option>
                <option value="offline">Очно</option>
              </select>
            </div>

            {/* Город */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                Город
              </label>
              <input
                type="text"
                id="city"
                value={filters.city || ''}
                onChange={(e) => updateFilters({ city: e.target.value || undefined })}
                placeholder="Введите город"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Поиск */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Поиск
              </label>
              <input
                type="text"
                id="search"
                value={filters.q || ''}
                onChange={(e) => updateFilters({ q: e.target.value || undefined })}
                placeholder="Поиск по тексту..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Список заявок */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ошибка</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchOpportunities}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Попробовать снова
            </button>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="card-elevated p-8 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-heading-3 mb-3">Нет подходящих заявок</h3>
            <p className="text-body">Попробуйте изменить фильтры или зайдите позже</p>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-heading-2 mb-2">🎯 Заявки для вас ({opportunities.length})</h2>
              <p className="text-body-sm text-gray-600">
                Показываем заявки в ваших категориях, отсортированные по релевантности
              </p>
            </div>
            <div className="space-y-6">
            {opportunities.map((opportunity) => (
              <div key={opportunity.id} data-testid="request-card" className="card-elevated p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-heading-3">{opportunity.title}</h3>
                      <RequestStatusBadge status={opportunity.status} />
                      {opportunity.relevanceScore && opportunity.relevanceScore > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ⭐ {opportunity.relevanceScore} релевантность
                        </span>
                      )}
                    </div>
                    {opportunity.relevanceReasons && opportunity.relevanceReasons.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {opportunity.relevanceReasons.map((reason, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-body-sm mb-4">{opportunity.description}</p>
                    <div className="flex items-center space-x-4 text-caption">
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {opportunity.category.name}
                      </span>
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {getFormatLabel(opportunity.preferredFormat)}
                        {opportunity.city && ` • ${opportunity.city}`}
                      </span>
                      {opportunity.budgetMinCents && opportunity.budgetMaxCents && (
                        <span className="inline-flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          {formatPrice(opportunity.budgetMinCents)} - {formatPrice(opportunity.budgetMaxCents)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-3">
                    <span className="text-caption">
                      {formatDate(opportunity.createdAt)}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-body-sm">
                    Опубликована {formatDate(opportunity.createdAt)}
                  </div>
                  <div className="flex items-center gap-3">
                    <RequestStatusActions
                      requestId={opportunity.id}
                      currentStatus={opportunity.status}
                      isClient={false} // В ленте специалистов
                      isSpecialist={true}
                      onStatusChange={(newStatus) => {
                        // Обновляем статус в локальном состоянии
                        setOpportunities(prev => 
                          prev.map(req => 
                            req.id === opportunity.id 
                              ? { ...req, status: newStatus }
                              : req
                          )
                        );
                      }}
                    />
                    {opportunity.status === 'OPEN' && (
                      <button
                        data-testid="apply-button"
                        onClick={() => {
                          setSelectedRequest(opportunity);
                          setShowApplicationModal(true);
                        }}
                        className="btn btn-primary btn-md"
                      >
                        Откликнуться
                      </button>
                    )}
                    {opportunity.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => {
                          // Переход в чат
                          window.location.href = `/app/chat/${opportunity.id}`;
                        }}
                        className="btn btn-secondary btn-md"
                      >
                        Написать в чат
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        {/* Модалка отправки отклика */}
        {showApplicationModal && selectedRequest && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Отклик на заявку: {selectedRequest.title}
                </h3>
                
                {applicationErrors.general && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm">{applicationErrors.general}</p>
                  </div>
                )}

                <div className="mb-4">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Ваше сообщение *
                  </label>
                  <textarea
                    id="message"
                    data-testid="apply-text"
                    rows={4}
                    value={applicationForm.message}
                    onChange={(e) => {
                      setApplicationForm({ message: e.target.value });
                      if (applicationErrors.message) {
                        setApplicationErrors({ ...applicationErrors, message: undefined });
                      }
                    }}
                    placeholder="Расскажите о своем опыте и как можете помочь..."
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      applicationErrors.message ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {applicationErrors.message && (
                    <p className="mt-1 text-sm text-red-600">{applicationErrors.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {applicationForm.message.length}/1000 символов
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowApplicationModal(false);
                      setSelectedRequest(null);
                      setApplicationForm({ message: '' });
                      setApplicationErrors({});
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Отмена
                  </button>
                  <button
                    data-testid="apply-submit"
                    onClick={handleApplicationSubmit}
                    disabled={submittingApplication}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingApplication ? 'Отправка...' : 'Отправить отклик'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

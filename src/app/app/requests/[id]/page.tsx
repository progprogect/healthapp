'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Request, Application } from '@/types/request';

interface RequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function RequestDetailPage({ params }: RequestDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [request, setRequest] = useState<Request | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingApplication, setProcessingApplication] = useState<string | null>(null);

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Получаем заявку
      const requestResponse = await fetch(`/api/requests/mine`);
      if (!requestResponse.ok) {
        throw new Error('Ошибка при загрузке заявок');
      }
      const requestData = await requestResponse.json();
      const currentRequest = requestData.items.find((r: Request) => r.id === id);
      
      if (!currentRequest) {
        throw new Error('Заявка не найдена');
      }
      setRequest(currentRequest);

      // Получаем отклики
      const applicationsResponse = await fetch(`/api/requests/${id}/applications`);
      if (!applicationsResponse.ok) {
        throw new Error('Ошибка при загрузке откликов');
      }
      const applicationsData = await applicationsResponse.json();
      setApplications(applicationsData.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplication = async (applicationId: string) => {
    try {
      setProcessingApplication(applicationId);
      
      const response = await fetch(`/api/applications/${applicationId}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при принятии отклика');
      }

      const result = await response.json();
      
      // Обновляем статус отклика локально
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'accepted' as const }
            : app
        )
      );

      // Переходим в чат
      router.push(`/app/chat/${result.threadId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setProcessingApplication(null);
    }
  };

  const handleDeclineApplication = async (applicationId: string) => {
    try {
      setProcessingApplication(applicationId);
      
      const response = await fetch(`/api/applications/${applicationId}/decline`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при отклонении отклика');
      }

      // Удаляем отклик из списка
      setApplications(prev => prev.filter(app => app.id !== applicationId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setProcessingApplication(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Открыта', className: 'bg-green-100 text-green-800' },
      matched: { label: 'Найден специалист', className: 'bg-blue-100 text-blue-800' },
      closed: { label: 'Закрыта', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Отменена', className: 'bg-red-100 text-red-800' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getFormatLabel = (format: string) => {
    const formatLabels = {
      online: 'Онлайн',
      offline: 'Очно',
      any: 'Любой формат',
    };
    return formatLabels[format as keyof typeof formatLabels] || format;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ошибка</h3>
            <p className="text-gray-500 mb-4">{error || 'Заявка не найдена'}</p>
            <button
              onClick={() => router.push('/app/requests')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Вернуться к заявкам
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Назад
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
        </div>

        {/* Информация о заявке */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                {getStatusBadge(request.status)}
                <span className="text-sm text-gray-500">
                  Создана {new Date(request.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{request.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {request.category.name}
                </span>
                <span className="inline-flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {getFormatLabel(request.preferredFormat)}
                  {request.city && ` • ${request.city}`}
                </span>
                {request.budgetMinCents && request.budgetMaxCents && (
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    {request.budgetMinCents / 100} - {request.budgetMaxCents / 100} ₽
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Отклики */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Отклики специалистов ({applications.length})
          </h2>

          {applications.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Пока нет откликов</h3>
              <p className="text-gray-500">Специалисты еще не откликнулись на вашу заявку</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {application.specialist.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{application.specialist.displayName}</h3>
                          {application.specialist.verified && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{application.specialist.experienceYears} лет опыта</span>
                          {application.specialist.priceMinCents && application.specialist.priceMaxCents && (
                            <span>
                              {application.specialist.priceMinCents / 100} - {application.specialist.priceMaxCents / 100} ₽
                            </span>
                          )}
                          <span>
                            {application.specialist.onlineOnly ? 'Онлайн' : application.specialist.city || 'Онлайн/Очно'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(application.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Сообщение специалиста:</h4>
                    <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-md">{application.message}</p>
                  </div>

                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Категории:</h4>
                    <div className="flex flex-wrap gap-2">
                      {application.specialist.categories.map((category) => (
                        <span
                          key={category.slug}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {application.specialist.bio && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">О специалисте:</h4>
                      <p className="text-gray-600 text-sm">{application.specialist.bio}</p>
                    </div>
                  )}

                  {application.status === 'pending' && (
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleDeclineApplication(application.id)}
                        disabled={processingApplication === application.id}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingApplication === application.id ? 'Отклонение...' : 'Отклонить'}
                      </button>
                      <button
                        onClick={() => handleAcceptApplication(application.id)}
                        disabled={processingApplication === application.id}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingApplication === application.id ? 'Принятие...' : 'Принять'}
                      </button>
                    </div>
                  )}

                  {application.status === 'accepted' && (
                    <div className="flex justify-end">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        ✓ Принят
                      </span>
                    </div>
                  )}

                  {application.status === 'rejected' && (
                    <div className="flex justify-end">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        ✗ Отклонен
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

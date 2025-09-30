'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import RequestStatusBadge from '@/components/RequestStatusBadge';
import AppLoading from '@/components/AppLoading';
import AppError from '@/components/AppError';
import Link from 'next/link';

interface Application {
  id: string;
  message: string;
  status: 'SENT' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
  request: {
    id: string;
    title: string;
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    preferredFormat: 'ONLINE' | 'OFFLINE' | 'ANY';
    city?: string;
    budgetMinCents?: number;
    budgetMaxCents?: number;
    category: {
      slug: string;
      name: string;
    };
    client: {
      id: string;
      displayName: string;
    };
  };
}

export default function MyApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Используем useRef для стабильного callback
  const fetchRef = useRef<() => Promise<void>>();
  
  fetchRef.current = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/applications/mine?${params}`);
      
      if (!response.ok) {
        throw new Error('Ошибка при загрузке откликов');
      }

      const data = await response.json();
      setApplications(data.items);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при загрузке откликов');
    } finally {
      setLoading(false);
    }
  };
  
  // Стабильный wrapper callback
  const fetchApplications = useCallback(() => {
    fetchRef.current?.();
  }, []);
  
  // Redirect effect - отдельно от data fetching
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated') {
      router.push('/auth/login');
    }
  }, [status]); // ✅ router НЕ в dependencies!
  
  // Data fetch effect - только когда authenticated
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchApplications();
  }, [status, statusFilter, fetchApplications]); // ✅ Стабильные deps

  const formatPrice = (cents: number | null) => {
    if (!cents) return null;
    return `${(cents / 100).toFixed(0)} ₽`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'ONLINE': return 'Онлайн';
      case 'OFFLINE': return 'Офлайн';
      case 'ANY': return 'Любой';
      default: return format;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'SENT': return 'Отправлен';
      case 'ACCEPTED': return 'Принят';
      case 'DECLINED': return 'Отклонен';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACCEPTED': return 'bg-green-100 text-green-800 border-green-200';
      case 'DECLINED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (status === 'loading' || loading) {
    return <AppLoading message="Загрузка откликов..." />;
  }

  if (error) {
    return (
      <AppError 
        title="Ошибка" 
        message={error}
        action={{
          label: 'Попробовать снова',
          onClick: fetchApplications
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Мои отклики</h1>
          <p className="text-gray-600">Отклики на заявки клиентов</p>
        </div>
        <Link
          href="/app/opportunities"
          className="btn btn-primary"
        >
          Найти заявки
        </Link>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Статус:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Все</option>
            <option value="SENT">Отправленные</option>
            <option value="ACCEPTED">Принятые</option>
            <option value="DECLINED">Отклоненные</option>
          </select>
        </div>
      </div>

      {/* Список откликов */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет откликов</h3>
          <p className="text-gray-600 mb-4">
            {statusFilter === 'all' 
              ? 'У вас пока нет откликов. Найдите подходящие заявки и откликнитесь на них.'
              : 'Нет откликов с выбранным статусом.'
            }
          </p>
          <Link
            href="/app/opportunities"
            className="btn btn-primary"
          >
            Найти заявки
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div key={application.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{application.request.title}</h3>
                    <RequestStatusBadge status={application.request.status} />
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                      {getStatusLabel(application.status)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{application.request.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span className="inline-flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {application.request.category.name}
                    </span>
                    <span className="inline-flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {getFormatLabel(application.request.preferredFormat)}
                      {application.request.city && ` • ${application.request.city}`}
                    </span>
                    {(application.request.budgetMinCents || application.request.budgetMaxCents) && (
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        {application.request.budgetMinCents && application.request.budgetMaxCents
                          ? `${formatPrice(application.request.budgetMinCents)} - ${formatPrice(application.request.budgetMaxCents)}`
                          : application.request.budgetMinCents
                          ? `от ${formatPrice(application.request.budgetMinCents)}`
                          : `до ${formatPrice(application.request.budgetMaxCents || 0)}`
                        }
                      </span>
                    )}
                  </div>

                  {/* Информация о клиенте */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-medium text-sm">
                          {application.request.client.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{application.request.client.displayName}</p>
                        <p className="text-sm text-gray-500">Клиент</p>
                      </div>
                    </div>
                  </div>

                  {/* Ваш отклик */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Ваш отклик:</h4>
                    <p className="text-sm text-gray-600">{application.message}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>Отправлен: {formatDate(application.createdAt)}</div>
                </div>
              </div>

              {/* Действия */}
              <div className="flex justify-end space-x-3">
                {application.status === 'ACCEPTED' && application.request.status === 'IN_PROGRESS' && (
                  <Link
                    href={`/app/chat/${application.request.id}`}
                    className="btn btn-primary btn-sm"
                  >
                    Написать в чат
                  </Link>
                )}
                {application.status === 'SENT' && (
                  <span className="text-sm text-gray-500">
                    Ожидаем ответа от клиента
                  </span>
                )}
                {application.status === 'DECLINED' && (
                  <span className="text-sm text-red-500">
                    Отклик отклонен клиентом
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

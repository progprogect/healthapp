'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import RequestStatusBadge from '@/components/RequestStatusBadge';
import RequestStatusActions from '@/components/RequestStatusActions';
import AppLoading from '@/components/AppLoading';
import AppError from '@/components/AppError';
import Link from 'next/link';

interface Request {
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
  createdAt: string;
  updatedAt: string;
  applications?: Array<{
    id: string;
    status: 'SENT' | 'ACCEPTED' | 'DECLINED';
    specialist: {
      id: string;
      displayName: string;
      avatarUrl?: string;
    };
  }>;
}

export default function MyRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
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
      
      const response = await fetch(`/api/requests/mine?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Ошибка ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setRequests(data.items);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при загрузке заявок');
    } finally {
      setLoading(false);
    }
  };
  
  // Стабильный wrapper callback
  const fetchRequests = useCallback(() => {
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
    fetchRequests();
  }, [status, statusFilter, fetchRequests]); // ✅ Стабильные deps

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

  const handleStatusChange = (requestId: string, newStatus: string) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: newStatus as any }
          : req
      )
    );
  };

  if (status === 'loading' || loading) {
    return <AppLoading message="Загрузка заявок..." />;
  }

  if (error) {
    return (
      <AppError 
        title="Ошибка" 
        message={error}
        action={{
          label: 'Попробовать снова',
          onClick: fetchRequests
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Мои заявки</h1>
          <p className="text-gray-600">Управление вашими заявками</p>
        </div>
        <Link
          href="/app/requests/new"
          className="btn btn-primary"
        >
          Создать заявку
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
            <option value="OPEN">Открытые</option>
            <option value="IN_PROGRESS">В работе</option>
            <option value="COMPLETED">Завершенные</option>
            <option value="CANCELLED">Отмененные</option>
          </select>
        </div>
      </div>

      {/* Список заявок */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет заявок</h3>
          <p className="text-gray-600 mb-4">
            {statusFilter === 'all' 
              ? 'У вас пока нет заявок. Создайте первую заявку, чтобы найти специалиста.'
              : 'Нет заявок с выбранным статусом.'
            }
          </p>
          <Link
            href="/app/requests/new"
            className="btn btn-primary"
          >
            Создать заявку
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                    <RequestStatusBadge status={request.status} />
                  </div>
                  <p className="text-gray-600 mb-3">{request.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
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
                    {(request.budgetMinCents || request.budgetMaxCents) && (
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        {request.budgetMinCents && request.budgetMaxCents
                          ? `${formatPrice(request.budgetMinCents)} - ${formatPrice(request.budgetMaxCents)}`
                          : request.budgetMinCents
                          ? `от ${formatPrice(request.budgetMinCents)}`
                          : `до ${formatPrice(request.budgetMaxCents || 0)}`
                        }
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>Создана: {formatDate(request.createdAt)}</div>
                  <div>Обновлена: {formatDate(request.updatedAt)}</div>
                </div>
              </div>

              {/* Принятые заявки */}
              {request.applications && request.applications.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Принятые заявки:</h4>
                  <div className="space-y-2">
                    {request.applications
                      .filter(app => app.status === 'ACCEPTED')
                      .map((app) => (
                        <div key={app.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-medium text-sm">
                              {app.specialist.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{app.specialist.displayName}</p>
                            <p className="text-sm text-gray-500">Специалист</p>
                          </div>
                          <Link
                            href={`/app/chat/${request.id}`}
                            className="btn btn-sm btn-secondary"
                          >
                            Написать в чат
                          </Link>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Действия */}
              <RequestStatusActions
                requestId={request.id}
                currentStatus={request.status}
                isClient={true}
                isSpecialist={false}
                specialistId={request.applications?.find(app => app.status === 'ACCEPTED')?.specialist.id}
                onStatusChange={(newStatus) => handleStatusChange(request.id, newStatus)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
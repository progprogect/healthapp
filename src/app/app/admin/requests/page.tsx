'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import RequestStatusBadge from '@/components/RequestStatusBadge';
import AppLoading from '@/components/AppLoading';
import AppError from '@/components/AppError';
import AccessGate from '@/components/AccessGate';

interface AdminRequest {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  preferredFormat: 'ONLINE' | 'OFFLINE' | 'ANY';
  city?: string;
  budgetMinCents?: number;
  budgetMaxCents?: number;
  createdAt: string;
  updatedAt: string;
  category: {
    slug: string;
    name: string;
  };
  client: {
    id: string;
    email: string;
    displayName: string;
    status: string;
  };
  specialist?: {
    id: string;
    email: string;
    displayName: string;
    status: string;
  } | null;
  applicationsCount: number;
}

export default function AdminRequestsPage() {
  return (
    <AccessGate requireAdmin={true}>
      <AdminRequestsContent />
    </AccessGate>
  );
}

function AdminRequestsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    clientId: '',
    specialistId: ''
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status !== 'authenticated' || session?.user?.role !== 'ADMIN') {
      router.push('/app');
      return;
    }

    fetchRequests();
  }, [status, router, filters]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.category !== 'all') {
        params.append('category', filters.category);
      }
      if (filters.clientId) {
        params.append('clientId', filters.clientId);
      }
      if (filters.specialistId) {
        params.append('specialistId', filters.specialistId);
      }
      
      const response = await fetch(`/api/admin/requests?${params}`);
      
      if (!response.ok) {
        throw new Error('Ошибка при загрузке заявок');
      }

      const data = await response.json();
      setRequests(data.items);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при загрузке заявок');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number | null) => {
    if (!cents) return null;
    return `${(cents / 100).toFixed(0)} ₽`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600';
      case 'BLOCKED': return 'text-red-600';
      case 'DELETED': return 'text-gray-500';
      default: return 'text-gray-600';
    }
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
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Управление заявками</h1>
        <p className="text-gray-600">Все заявки в системе</p>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Все</option>
              <option value="OPEN">Открытые</option>
              <option value="IN_PROGRESS">В работе</option>
              <option value="COMPLETED">Завершенные</option>
              <option value="CANCELLED">Отмененные</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Все</option>
              <option value="psychologist">Психолог</option>
              <option value="nutritionist">Нутрициолог</option>
              <option value="personal-trainer">Персональный тренер</option>
              <option value="health-coach">Коуч по здоровью</option>
              <option value="physiotherapist">Физиотерапевт</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID клиента</label>
            <input
              type="text"
              value={filters.clientId}
              onChange={(e) => setFilters(prev => ({ ...prev, clientId: e.target.value }))}
              placeholder="Поиск по ID клиента"
              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID специалиста</label>
            <input
              type="text"
              value={filters.specialistId}
              onChange={(e) => setFilters(prev => ({ ...prev, specialistId: e.target.value }))}
              placeholder="Поиск по ID специалиста"
              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">
            {requests.filter(r => r.status === 'OPEN').length}
          </div>
          <div className="text-sm text-gray-600">Открытые</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {requests.filter(r => r.status === 'IN_PROGRESS').length}
          </div>
          <div className="text-sm text-gray-600">В работе</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">
            {requests.filter(r => r.status === 'COMPLETED').length}
          </div>
          <div className="text-sm text-gray-600">Завершенные</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-red-600">
            {requests.filter(r => r.status === 'CANCELLED').length}
          </div>
          <div className="text-sm text-gray-600">Отмененные</div>
        </div>
      </div>

      {/* Таблица заявок */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Заявка
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Клиент
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Специалист
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Создана
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{request.title}</div>
                    <div className="text-sm text-gray-500">{request.category.name}</div>
                    <div className="text-xs text-gray-400">
                      {getFormatLabel(request.preferredFormat)}
                      {request.city && ` • ${request.city}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{request.client.displayName}</div>
                    <div className="text-sm text-gray-500">{request.client.email}</div>
                    <div className={`text-xs ${getStatusColor(request.client.status)}`}>
                      {request.client.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.specialist ? (
                      <>
                        <div className="text-sm font-medium text-gray-900">{request.specialist.displayName}</div>
                        <div className="text-sm text-gray-500">{request.specialist.email}</div>
                        <div className={`text-xs ${getStatusColor(request.specialist.status)}`}>
                          {request.specialist.status}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">Не назначен</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RequestStatusBadge status={request.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(request.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900">
                      Подробнее
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {requests.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет заявок</h3>
            <p className="text-gray-600">Нет заявок, соответствующих выбранным фильтрам</p>
          </div>
        )}
      </div>
    </div>
  );
}


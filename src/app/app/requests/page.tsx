import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Request } from '@/types/request';
import { prisma } from '@/lib/prisma';

async function getMyRequests(userId: string): Promise<Request[]> {
  try {
    // Вместо fetch к API, напрямую обращаемся к БД
    const requests = await prisma.request.findMany({
      where: {
        clientUserId: userId
      },
      include: {
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Преобразуем в формат Request
    return requests.map(req => ({
      id: req.id,
      title: req.title,
      description: req.description,
      preferredFormat: req.preferredFormat.toLowerCase() as 'online' | 'offline' | 'any',
      city: req.city,
      budgetMinCents: req.budgetMinCents,
      budgetMaxCents: req.budgetMaxCents,
      status: req.status.toLowerCase() as 'open' | 'matched' | 'closed' | 'cancelled',
      category: {
        slug: req.category.slug,
        name: req.category.name
      },
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.createdAt.toISOString() // Используем createdAt, так как updatedAt нет в схеме
    }));
  } catch (error) {
    console.error('Error fetching requests:', error);
    return [];
  }
}

export default async function RequestsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  if (session.user.role !== 'CLIENT') {
    redirect('/app');
  }

  const requests = await getMyRequests(session.user.id);

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Мои заявки</h1>
          <Link
            href="/app/requests/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Создать заявку
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">У вас пока нет заявок</h3>
            <p className="text-gray-500 mb-4">Создайте первую заявку, чтобы найти подходящего специалиста</p>
            <Link
              href="/app/requests/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Создать заявку
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{request.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{request.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                  <div className="flex flex-col items-end space-y-2">
                    {getStatusBadge(request.status)}
                    <span className="text-xs text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Создана {new Date(request.createdAt).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <Link
                    href={`/app/requests/${request.id}`}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    Подробнее
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

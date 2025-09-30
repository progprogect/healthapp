'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface AccessGateProps {
  children: ReactNode;
  requireClientProfile?: boolean;
  requireSpecialistProfile?: boolean;
  requireAdmin?: boolean;
  fallback?: ReactNode;
}

export default function AccessGate({
  children,
  requireClientProfile = false,
  requireSpecialistProfile = false,
  requireAdmin = false,
  fallback
}: AccessGateProps) {
  const { data: session, status } = useSession();

  // Показываем загрузку пока проверяем сессию
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Если пользователь не авторизован
  if (!session) {
    return fallback || (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Необходима авторизация
        </h2>
        <p className="text-gray-600 mb-6">
          Войдите в систему, чтобы получить доступ к этому разделу.
        </p>
        <div className="space-x-4">
          <Link
            href="/auth/login"
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Войти
          </Link>
          <Link
            href="/auth/register"
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            Регистрация
          </Link>
        </div>
      </div>
    );
  }

  // Проверяем требования к профилю
  const userRole = session.user?.role;
  
  if (requireAdmin && userRole !== 'ADMIN') {
    return fallback || (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Доступ запрещен
        </h2>
        <p className="text-gray-600 mb-6">
          У вас нет прав для доступа к этому разделу.
        </p>
        <Link
          href="/app"
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Вернуться в приложение
        </Link>
      </div>
    );
  }

  // Для проверки профилей нужно будет получать данные с сервера
  // Пока что просто проверяем роль
  if (requireClientProfile && userRole !== 'CLIENT') {
    return fallback || (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Профиль клиента не найден
        </h2>
        <p className="text-gray-600 mb-6">
          Для доступа к этому разделу необходимо создать профиль клиента.
        </p>
        <Link
          href="/auth/register"
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Создать профиль клиента
        </Link>
      </div>
    );
  }

  if (requireSpecialistProfile && userRole !== 'SPECIALIST') {
    return fallback || (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Профиль специалиста не найден
        </h2>
        <p className="text-gray-600 mb-6">
          Для доступа к этому разделу необходимо стать специалистом.
        </p>
        <Link
          href="/app/specialist/profile/edit"
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Стать специалистом
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}


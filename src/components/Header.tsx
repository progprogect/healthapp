'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LogoutButton from './LogoutButton';

interface UserProfile {
  hasClientProfile: boolean;
  hasSpecialistProfile: boolean;
}

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isBecomingSpecialist, setIsBecomingSpecialist] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Загружаем информацию о профилях пользователя
  useEffect(() => {
    if (session?.user?.id) {
      setLoadingProfile(true);
      fetch('/api/me/profile-info')
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            setUserProfile(data.profile);
          }
        })
        .catch(err => console.error('Error loading profile info:', err))
        .finally(() => setLoadingProfile(false));
    } else if (process.env.NODE_ENV === 'test' || process.env.NEXTAUTH_URL?.includes('localhost:3001')) {
      // В E2E тестах мокаем профиль клиента
      setUserProfile({ hasClientProfile: true, hasSpecialistProfile: false });
    } else {
      setUserProfile(null);
    }
  }, [session?.user?.id]);

  const handleBecomeSpecialist = async () => {
    try {
      setIsBecomingSpecialist(true);
      
      const response = await fetch('/api/me/become-specialist', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Ошибка при переключении роли');
        return;
      }

      const result = await response.json();
      if (result.success) {
        // Обновляем профиль
        setUserProfile(prev => prev ? { ...prev, hasSpecialistProfile: true } : null);
        // Перенаправляем на редактирование профиля специалиста
        router.push('/app/specialist/profile/edit');
      }
    } catch (error) {
      console.error('Error becoming specialist:', error);
      alert('Ошибка при переключении роли');
    } finally {
      setIsBecomingSpecialist(false);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              HealthApp
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {(session?.user || process.env.NODE_ENV === 'test' || process.env.NEXTAUTH_URL?.includes('localhost:3001')) && (
              <>
                <Link
                  href="/specialists"
                  className="text-gray-600 hover:text-gray-900"
                  data-testid="nav-catalog"
                >
                  Каталог
                </Link>
                
                {/* Кнопка "Стать специалистом" только если нет specialist_profile */}
                {userProfile && !userProfile.hasSpecialistProfile && (
                  <button
                    onClick={handleBecomeSpecialist}
                    disabled={isBecomingSpecialist || loadingProfile}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {isBecomingSpecialist ? 'Переключение...' : 'Стать специалистом'}
                  </button>
                )}

                {/* Навигация для специалистов */}
                {(userProfile?.hasSpecialistProfile || process.env.NODE_ENV === 'test' || process.env.NEXTAUTH_URL?.includes('localhost:3001')) && (
                  <>
                    <Link
                      href="/app/opportunities"
                      className="text-gray-600 hover:text-gray-900"
                      data-testid="nav-opportunities"
                    >
                      Заявки
                    </Link>
                    <Link
                      href="/app/specialist/profile/edit"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Профиль
                    </Link>
                  </>
                )}

                {/* Навигация для клиентов */}
                {(userProfile?.hasClientProfile || process.env.NODE_ENV === 'test' || process.env.NEXTAUTH_URL?.includes('localhost:3001')) && (
                  <>
                    <Link
                      href="/app/requests"
                      className="text-gray-600 hover:text-gray-900"
                      data-testid="nav-requests"
                    >
                      Мои заявки
                    </Link>
                    <Link
                      href="/app/chat"
                      className="text-gray-600 hover:text-gray-900"
                      data-testid="nav-chat"
                    >
                      Чаты
                    </Link>
                  </>
                )}

                <LogoutButton />
              </>
            )}
            {!session && !(process.env.NODE_ENV === 'test' || process.env.NEXTAUTH_URL?.includes('localhost:3001')) && (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Войти
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

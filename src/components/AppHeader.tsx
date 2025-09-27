'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import GuestNav from './navigation/GuestNav';
import ClientNav from './navigation/ClientNav';
import SpecialistNav from './navigation/SpecialistNav';
import AdminNav from './navigation/AdminNav';
import { useUnreadCounter } from '@/hooks/useChatSocket';

export default function AppHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { unreadCount } = useUnreadCounter();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              HealthApp
            </Link>
          </div>
          <nav className="flex items-center space-x-8">
            {status === 'loading' ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ) : !session ? (
              <GuestNav />
            ) : (
              // Определяем тип навигации на основе роли пользователя
              (() => {
                const userRole = session?.user?.role;
                switch (userRole) {
                  case 'CLIENT':
                    return <ClientNav unreadCount={unreadCount} />;
                  case 'SPECIALIST':
                    return <SpecialistNav unreadCount={unreadCount} />;
                  case 'ADMIN':
                    return <AdminNav />;
                  default:
                    return <ClientNav unreadCount={unreadCount} />; // Fallback
                }
              })()
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

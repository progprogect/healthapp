'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { memo, useMemo } from 'react';
import GuestNav from './navigation/GuestNav';
import ClientNav from './navigation/ClientNav';
import SpecialistNav from './navigation/SpecialistNav';
import AdminNav from './navigation/AdminNav';
import { useUnreadCounter } from '@/hooks/useUnreadCounter';

function AppHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { unreadCount } = useUnreadCounter();

  // Мемоизируем навигацию
  const navigation = useMemo(() => {
    if (status === 'loading') {
      return (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      );
    }

    if (!session) {
      return <GuestNav />;
    }

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
  }, [status, session, unreadCount]);

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
            {navigation}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default memo(AppHeader);

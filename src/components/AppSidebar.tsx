'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (path: string) => pathname.startsWith(path);

  const getNavigationItems = () => {
    // Если нет сессии, не показываем навигацию
    if (!session?.user?.role) {
      return [];
    }

    const userRole = session.user.role;
    switch (userRole) {
      case 'CLIENT':
        return [
          { href: '/app/requests', label: 'Мои заявки', icon: '📋' },
          { href: '/app/chat', label: 'Чат', icon: '💬' },
          { href: '/specialists', label: 'Каталог', icon: '👥' },
        ];
      case 'SPECIALIST':
        return [
          { href: '/app/opportunities', label: 'Заявки клиентов', icon: '🎯' },
          { href: '/app/applications', label: 'Мои отклики', icon: '📝' },
          { href: '/app/chat', label: 'Чат', icon: '💬' },
          { href: '/app/specialist/profile/edit', label: 'Профиль', icon: '👤' },
          { href: '/specialists', label: 'Каталог', icon: '👥' },
        ];
      case 'ADMIN':
        return [
          { href: '/app/admin/specialists', label: 'Управление специалистами', icon: '👥' },
          { href: '/app/admin/requests', label: 'Все заявки', icon: '📋' },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  if (navigationItems.length === 0) {
    return null;
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          // Определяем data-testid на основе href
          let testId = '';
          if (item.href === '/app/requests') testId = 'nav-requests';
          else if (item.href === '/app/chat') testId = 'nav-chat';
          else if (item.href === '/app/opportunities') testId = 'nav-opportunities';
          else if (item.href === '/specialists') testId = 'nav-catalog';
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              data-testid={testId}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Если items не переданы, генерируем их из pathname
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname);

  if (breadcrumbItems.length <= 1) return null;

  return (
    <nav className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`} data-testid="breadcrumb">
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          
          {item.href && index < breadcrumbItems.length - 1 ? (
            <Link 
              href={item.href} 
              className="hover:text-gray-700 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={index === breadcrumbItems.length - 1 ? 'text-gray-900 font-medium' : ''}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Главная', href: '/' }
  ];

  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Специальная обработка для известных маршрутов
    let label = segment;
    
    if (segment === 'app') {
      label = 'Личный кабинет';
    } else if (segment === 'specialists') {
      label = 'Каталог';
    } else if (segment === 'requests') {
      label = 'Заявки';
    } else if (segment === 'opportunities') {
      label = 'Заявки клиентов';
    } else if (segment === 'chat') {
      label = 'Чат';
    } else if (segment === 'admin') {
      label = 'Админ';
    } else if (segment === 'specialist') {
      label = 'Профиль специалиста';
    } else if (segment === 'profile') {
      label = 'Профиль';
    } else if (segment === 'edit') {
      label = 'Редактирование';
    } else if (segment === 'new') {
      label = 'Новая заявка';
    } else if (segment.match(/^[a-z0-9]+$/)) {
      // Если это ID (только буквы и цифры), показываем как "Детали"
      label = 'Детали';
    } else {
      // Капитализируем первую букву
      label = segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    breadcrumbs.push({
      label,
      href: index === segments.length - 1 ? undefined : currentPath
    });
  });

  return breadcrumbs;
}

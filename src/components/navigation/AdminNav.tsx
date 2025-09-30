'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

function AdminNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <>
      <Link 
        href="/specialists" 
        className={`transition-colors ${
          isActive('/specialists') 
            ? 'text-indigo-600 font-medium' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
        data-testid="nav-catalog"
      >
        Каталог
      </Link>
      
      <Link 
        href="/app/admin/specialists" 
        className={`transition-colors ${
          isActive('/app/admin') 
            ? 'text-indigo-600 font-medium' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
        data-testid="nav-admin"
      >
        Админ
      </Link>

      {/* Profile Menu */}
      <div className="relative">
        <button
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span className="text-sm font-medium">
            {session?.user?.name || session?.user?.email}
          </span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isProfileMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
            <Link
              href="/app/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsProfileMenuOpen(false)}
            >
              Профиль
            </Link>
            <Link
              href="/app/settings"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setIsProfileMenuOpen(false)}
            >
              Настройки
            </Link>
            <hr className="my-1" />
            <button
              onClick={() => {
                setIsProfileMenuOpen(false);
                signOut({ callbackUrl: 'http://localhost:3001/' });
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Выйти
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default memo(AdminNav);

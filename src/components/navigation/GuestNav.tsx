'use client';

import Link from 'next/link';

export default function GuestNav() {
  return (
    <>
      <Link 
        href="/specialists" 
        className="text-gray-600 hover:text-gray-900 transition-colors"
        data-testid="nav-catalog"
      >
        Каталог
      </Link>
      <Link 
        href="/auth/login" 
        className="text-gray-600 hover:text-gray-900 transition-colors"
      >
        Войти
      </Link>
      <Link 
        href="/auth/register" 
        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        Регистрация
      </Link>
    </>
  );
}

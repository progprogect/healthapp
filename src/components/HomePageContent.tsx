'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function HomePageContent() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Найдите подходящего
              <span className="text-indigo-600"> специалиста</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Платформа для поиска и связи с медицинскими специалистами. 
              Получайте консультации онлайн или офлайн в удобное для вас время.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {status === 'loading' ? (
                <div className="animate-pulse bg-gray-200 h-12 w-48 rounded-md mx-auto"></div>
              ) : session ? (
                <Link
                  href="/app"
                  className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Перейти в приложение
                </Link>
              ) : (
                <>
                  <Link
                    href="/specialists"
                    className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Посмотреть каталог
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-white text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    Начать работу
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Почему выбирают нас
            </h2>
            <p className="text-lg text-gray-600">
              Простой и удобный способ найти специалиста для вашего здоровья
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Умный поиск
              </h3>
              <p className="text-gray-600">
                Фильтруйте специалистов по категориям, опыту, формату работы и цене
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Прямое общение
              </h3>
              <p className="text-gray-600">
                Встроенный чат для быстрой связи с выбранным специалистом
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Проверенные специалисты
              </h3>
              <p className="text-gray-600">
                Все специалисты проходят верификацию и имеют подтвержденную квалификацию
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Готовы начать?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Присоединяйтесь к тысячам пользователей, которые уже нашли своих специалистов
          </p>
          {!session && (
            <Link
              href="/auth/register"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Зарегистрироваться бесплатно
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Специалист не найден
          </h2>
          <p className="text-gray-600 mb-8">
            Запрашиваемый специалист не существует или был удален.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/specialists"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Перейти к каталогу
          </Link>
          
          <div>
            <Link
              href="/"
              className="text-indigo-600 hover:text-indigo-500 text-sm"
            >
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

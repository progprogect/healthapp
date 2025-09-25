import Link from "next/link"

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          HealthApp
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Найдите подходящего специалиста для вашего здоровья
        </p>
        
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto mb-8">
          <h2 className="text-2xl font-semibold mb-4">Каталог специалистов готов!</h2>
          <p className="text-gray-600 mb-4">
            Система поиска и фильтрации специалистов работает.
          </p>
          <div className="text-sm text-gray-500 mb-4">
            <p>✅ 15 тестовых специалистов</p>
            <p>✅ API с фильтрами и поиском</p>
            <p>✅ Фильтры по формату, городу, цене</p>
            <p>✅ Поиск по имени и описанию</p>
          </div>
          <div className="space-y-2">
            <Link
              href="/specialists"
              className="block w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Посмотреть каталог
            </Link>
            <Link
              href="/auth/login"
              className="block w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Войти в систему
            </Link>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Следующие шаги:
          </h3>
          <ul className="text-sm text-blue-800 text-left space-y-1">
            <li>• Каталог специалистов</li>
            <li>• Система заявок</li>
            <li>• Встроенный чат</li>
            <li>• Фильтры и поиск</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
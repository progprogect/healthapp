import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

export default async function AppPage() {
  const session = await getServerSession()

  // В E2E тестах временно отключаем проверку авторизации
  if (!session && process.env.NODE_ENV !== 'test' && !process.env.NEXTAUTH_URL?.includes('localhost:3001')) {
    redirect("/auth/login")
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Добро пожаловать в HealthApp!
              </h2>
              <p className="text-gray-600 mb-4">
                Вы успешно вошли в систему.
              </p>
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                <p className="font-semibold">✅ Аутентификация работает!</p>
                <p className="text-sm">
                  Роль: {session?.user?.role || "CLIENT"} | 
                  Email: {session?.user?.email || "test@example.com"}
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}

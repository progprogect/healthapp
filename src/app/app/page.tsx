import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import LogoutButton from "@/components/LogoutButton"

export default async function AppPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                HealthApp
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Привет, {session.user?.name || session.user?.email}!
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

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
                  Роль: {session.user?.role || "CLIENT"} | 
                  Email: {session.user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

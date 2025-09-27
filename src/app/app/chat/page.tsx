import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import ChatThreadList from '@/components/ChatThreadList';
import Link from 'next/link';

export default async function ChatPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold text-gray-900">
                HealthApp
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/specialists"
                className="text-gray-600 hover:text-gray-900"
              >
                Каталог
              </Link>
              <Link
                href="/app"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Личный кабинет
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Чаты</h1>
            <p className="text-gray-600">Выберите диалог для общения</p>
          </div>
          
          <ChatThreadList />
        </div>
      </div>
    </div>
  );
}


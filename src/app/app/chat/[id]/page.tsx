import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import ChatInterface from '@/components/ChatInterface';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const { id: threadId } = await params;

  // Проверяем, что пользователь является участником треда
  const thread = await prisma.chatThread.findFirst({
    where: {
      id: threadId,
      OR: [
        { clientUserId: session.user.id },
        { specialistUserId: session.user.id }
      ]
    },
    include: {
      client: {
        include: { clientProfile: true }
      },
      specialist: {
        include: { specialistProfile: true }
      }
    }
  });

  if (!thread) {
    notFound();
  }

  // Определяем собеседника
  const isClient = thread.clientUserId === session.user.id;
  const peer = isClient ? thread.specialist : thread.client;
  const peerProfile = isClient ? thread.specialist.specialistProfile : thread.client.clientProfile;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/app/chat"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Назад к чатам
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-600">
                    {peerProfile?.displayName?.charAt(0) || peer.email?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {peerProfile?.displayName || peer.email}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isClient ? 'Специалист' : 'Клиент'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/app"
                className="text-gray-600 hover:text-gray-900"
              >
                Личный кабинет
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)]">
        <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
          <ChatInterface threadId={threadId} />
        </div>
      </div>
    </div>
  );
}
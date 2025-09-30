"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChatThread, GetThreadsResponse } from '@/types/chat'
import Link from 'next/link'
import { useChatSocket, ThreadUpdatedEvent } from '@/hooks/useChatSocket'

export default function ChatThreadList() {
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  const router = useRouter()
  
  // Socket.IO хук
  const { isConnected, fallbackToPolling, setOnThreadUpdated } = useChatSocket()

  // Обработчик обновления треда через Socket.IO
  useEffect(() => {
    setOnThreadUpdated((event: ThreadUpdatedEvent) => {
      setThreads(prevThreads => {
        return prevThreads.map(thread => {
          if (thread.id === event.threadId) {
            return {
              ...thread,
              lastMessage: event.lastMessage ? {
                id: event.lastMessage.id,
                threadId: thread.id,
                senderId: event.lastMessage.senderId,
                content: event.lastMessage.body,
                createdAt: event.lastMessage.createdAt,
                readAt: null
              } : undefined,
              unreadCount: event.unreadCount,
              updatedAt: event.lastMessage?.createdAt || thread.updatedAt,
            };
          }
          return thread;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    });
  }, [setOnThreadUpdated]);

  // Polling fallback при проблемах с Socket.IO
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (fallbackToPolling) {
      console.log('Using polling fallback for chat threads');
      interval = setInterval(fetchThreads, 5000); // Каждые 5 секунд
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fallbackToPolling]);

  const fetchThreads = async () => {
    try {
      setError('')
      const response = await fetch('/api/chat/threads?limit=50&offset=0')
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки чатов')
      }

      const data: GetThreadsResponse = await response.json()
      setThreads(data.threads)
      setTotal(data.total)
    } catch (error) {
      console.error('Error fetching threads:', error)
      setError(error instanceof Error ? error.message : 'Ошибка загрузки чатов')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchThreads()
  }, [])

  const formatLastMessage = (message: ChatThread['lastMessage']) => {
    if (!message) return 'Нет сообщений'
    
    const maxLength = 50
    if (message.content.length <= maxLength) {
      return message.content
    }
    return message.content.substring(0, maxLength) + '...'
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('ru-RU', { 
        weekday: 'short' 
      })
    } else {
      return date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit' 
      })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="text-right space-y-2">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-5 bg-gray-200 rounded-full w-5"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-lg font-medium">{error}</p>
        </div>
        <button
          onClick={fetchThreads}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  if (threads.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-lg font-medium">Нет диалогов</p>
          <p className="text-sm">Начните общение с специалистом</p>
        </div>
        <Link
          href="/specialists"
          className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Найти специалиста
        </Link>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {threads.map((thread) => (
        <Link
          key={thread.id}
          href={`/app/chat/${thread.id}`}
          className="block p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-4">
            {/* Аватар */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-medium text-sm">
                  {getInitials(thread.peer?.displayName || 'Unknown')}
                </span>
              </div>
            </div>

            {/* Информация о диалоге */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {thread.peer?.displayName || 'Unknown'}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {formatTime(thread.updatedAt)}
                  </span>
                  {(thread.unreadCount || 0) > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {thread.unreadCount || 0}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 truncate mt-1">
                {formatLastMessage(thread.lastMessage)}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}


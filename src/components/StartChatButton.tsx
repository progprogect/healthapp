"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CreateThreadRequest } from '@/types/chat'

interface StartChatButtonProps {
  specialistId: string
  requestId?: string | null
}

export default function StartChatButton({ specialistId, requestId }: StartChatButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { data: session, status } = useSession()

  const handleStartChat = async () => {
    // Проверяем авторизацию
    if (status === 'loading') {
      return
    }
    
    if (!session) {
      setError('Необходимо войти в систему')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/chat/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          specialistId,
          requestId
        } as CreateThreadRequest),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Ошибка создания чата')
      }

      const data = await response.json()
      
      // Редиректим на страницу чата
      router.push(`/app/chat/${data.threadId}`)
      
    } catch (error) {
      console.error('Error starting chat:', error)
      setError(error instanceof Error ? error.message : 'Ошибка создания чата')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 relative group">
      <button
        onClick={handleStartChat}
        disabled={loading || status === 'loading'}
        className="w-full bg-indigo-600 text-white px-4 sm:px-6 py-3 rounded-md text-base sm:text-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Создание чата...' : 
         status === 'loading' ? 'Загрузка...' :
         !session ? 'Войти для чата' : 'Написать'}
      </button>
      
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 px-3 py-2 bg-red-100 text-red-800 text-sm rounded-md border border-red-200">
          {error}
        </div>
      )}
    </div>
  )
}


"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useChatSocket, MessageNewEvent, MessageReadEvent } from '@/hooks/useChatSocket';
import { SendMessageRequest, SendMessageResponse, GetMessagesResponse } from '@/types/chat';

interface ChatInterfaceProps {
  threadId: string;
}

export default function ChatInterface({ threadId }: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<GetMessagesResponse['messages']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Socket.IO хук
  const { 
    isConnected, 
    fallbackToPolling, 
    setOnMessageNew, 
    setOnMessageRead,
    joinThread,
    leaveThread 
  } = useChatSocket(threadId);

  // Автоматическая прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Загрузка сообщений
  const fetchMessages = async (beforeId?: string) => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (beforeId) params.append('beforeId', beforeId);
      
      const response = await fetch(`/api/chat/threads/${threadId}/messages?${params}`);
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки сообщений');
      }

      const data: GetMessagesResponse = await response.json();
      
      if (beforeId) {
        // Загружаем более старые сообщения - избегаем дубликатов
        setMessages(prev => {
          const existingIds = new Set(prev.map(msg => msg.id));
          const newMessages = data.messages.filter(msg => !existingIds.has(msg.id));
          return [...newMessages, ...prev];
        });
        setLoadingMore(false);
      } else {
        // Первая загрузка или обновление
        setMessages(data.messages);
        setLoading(false);
      }
      
      setHasMore(false); // hasMore не используется в новом API
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error instanceof Error ? error.message : 'Ошибка загрузки сообщений');
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Отправка сообщения
  const sendMessage = async () => {
    if (!messageText.trim() || sending) return;

    setSending(true);
    setError('');

    try {
      const response = await fetch(`/api/chat/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: threadId,
          content: messageText.trim(),
        } as SendMessageRequest),
      });

      if (!response.ok) {
        throw new Error('Ошибка отправки сообщения');
      }

      const data: SendMessageResponse = await response.json();
      
      // Не добавляем сообщение локально - оно придет через Socket.IO
      // Это предотвращает дублирование сообщений
      setMessageText('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Ошибка отправки сообщения');
    } finally {
      setSending(false);
    }
  };

  // Пометка сообщений как прочитанных
  const markAsRead = async () => {
    try {
      await fetch(`/api/chat/threads/${threadId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Обработчики Socket.IO событий
  useEffect(() => {
    setOnMessageNew((event: MessageNewEvent) => {
      if (event.threadId === threadId) {
        // Добавляем новое сообщение, если его еще нет
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === event.message.id);
          if (!exists) {
            return [...prev, {
              id: event.message.id,
              threadId: event.threadId,
              senderId: event.message.senderId,
              content: event.message.body,
              createdAt: event.message.createdAt,
              readAt: event.message.senderId === session?.user?.id ? event.message.createdAt : null,
            }];
          }
          return prev;
        });
      }
    });

    setOnMessageRead((event: MessageReadEvent) => {
      if (event.threadId === threadId && event.readerId !== session?.user?.id) {
        // Обновляем статус прочтения сообщений
        setMessages(prev => prev.map(msg => ({
          ...msg,
          readAt: msg.senderId === event.readerId ? new Date().toISOString() : msg.readAt,
        })));
      }
    });
  }, [threadId, session?.user?.id, setOnMessageNew, setOnMessageRead]);

  // Polling fallback при проблемах с Socket.IO
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (fallbackToPolling) {
      console.log('Using polling fallback for chat messages');
      interval = setInterval(() => fetchMessages(), 5000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fallbackToPolling]);

  // Первоначальная загрузка и пометка как прочитанных
  useEffect(() => {
    fetchMessages();
    markAsRead();
  }, [threadId]);

  // Загрузка при присоединении к треду
  useEffect(() => {
    if (isConnected) {
      joinThread(threadId);
    }
    
    return () => {
      if (isConnected) {
        leaveThread(threadId);
      }
    };
  }, [threadId, isConnected, joinThread, leaveThread]);

  // Загрузка более старых сообщений
  const loadMoreMessages = () => {
    if (hasMore && !loadingMore && messages.length > 0) {
      setLoadingMore(true);
      fetchMessages(messages[0].id);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Статус подключения */}
      <div className="px-6 py-3 bg-gray-50 border-b">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-body-sm text-gray-600">
            {isConnected ? 'Подключено' : 'Подключение...'}
            {fallbackToPolling && ' (режим обновления)'}
          </span>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMoreMessages}
              disabled={loadingMore}
              className="btn-outline btn-sm"
            >
              {loadingMore ? 'Загрузка...' : 'Загрузить предыдущие сообщения'}
            </button>
          </div>
        )}

        {messages.map((message) => {
          const isOwn = message.senderId === session?.user?.id;
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-6`}
            >
              <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Аватар */}
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-indigo-600">
                    {isOwn ? 'Я' : 'С'}
                  </span>
                </div>
                
                {/* Сообщение */}
                <div
                  className={`px-4 py-3 rounded-lg shadow-sm ${
                    isOwn
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-body-sm">{message.content}</p>
                  <p className={`text-caption mt-2 ${
                    isOwn ? 'text-indigo-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className="p-6 border-t bg-white">
        {error && (
          <div className="mb-3 text-red-600 text-body-sm">{error}</div>
        )}
        <div className="flex space-x-4">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            className="form-textarea flex-1"
            rows={2}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!messageText.trim() || sending}
            className="btn btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
}

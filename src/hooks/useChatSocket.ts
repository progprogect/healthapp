"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

// Типы для Socket.IO событий
export interface MessageNewEvent {
  threadId: string;
  message: {
    id: string;
    body: string;
    senderId: string;
    createdAt: string;
  };
}

export interface MessageReadEvent {
  threadId: string;
  readerId: string;
}

export interface ThreadUpdatedEvent {
  threadId: string;
  lastMessage: {
    id: string;
    body: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
}

// Хук для работы с Socket.IO в чатах
export function useChatSocket(threadId?: string) {
  const { data: session, status } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [fallbackToPolling, setFallbackToPolling] = useState(false);

  // Callbacks для обработки событий
  const onMessageNewRef = useRef<((event: MessageNewEvent) => void) | null>(null);
  const onMessageReadRef = useRef<((event: MessageReadEvent) => void) | null>(null);
  const onThreadUpdatedRef = useRef<((event: ThreadUpdatedEvent) => void) | null>(null);

  // Функция для подключения к Socket.IO
  const connect = useCallback(() => {
    if (socketRef.current?.connected || status !== 'authenticated') {
      return;
    }

    try {
      console.log('Connecting to Socket.IO...');
      
      const socket = io(process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
        : 'http://localhost:3001', {
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });

      socketRef.current = socket;

      // Обработка подключения
      socket.on('connect', () => {
        console.log('Socket.IO connected:', socket.id);
        setIsConnected(true);
        setConnectionError(null);
        setFallbackToPolling(false);
      });

      // Обработка отключения
      socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        setIsConnected(false);
        
        // Если отключение не было инициативой пользователя, переключаемся на polling
        if (reason !== 'io client disconnect') {
          setFallbackToPolling(true);
          console.log('Switching to polling fallback due to disconnection');
        }
      });

      // Обработка ошибок подключения
      socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        setConnectionError(error.message);
        setIsConnected(false);
        setFallbackToPolling(true);
      });

      // Обработка событий чата
      socket.on('message:new', (event: MessageNewEvent) => {
        console.log('Received message:new event:', event);
        if (onMessageNewRef.current) {
          onMessageNewRef.current(event);
        }
      });

      socket.on('message:read', (event: MessageReadEvent) => {
        console.log('Received message:read event:', event);
        if (onMessageReadRef.current) {
          onMessageReadRef.current(event);
        }
      });

      socket.on('thread:updated', (event: ThreadUpdatedEvent) => {
        console.log('Received thread:updated event:', event);
        if (onThreadUpdatedRef.current) {
          onThreadUpdatedRef.current(event);
        }
      });

    } catch (error) {
      console.error('Failed to connect to Socket.IO:', error);
      setConnectionError('Failed to connect');
      setFallbackToPolling(true);
    }
  }, [status]);

  // Функция для отключения
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Disconnecting Socket.IO...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Присоединение к комнате треда
  const joinThread = useCallback((threadId: string) => {
    if (socketRef.current?.connected) {
      console.log(`Joining thread room: ${threadId}`);
      socketRef.current.emit('join:thread', threadId);
    }
  }, []);

  // Покидание комнаты треда
  const leaveThread = useCallback((threadId: string) => {
    if (socketRef.current?.connected) {
      console.log(`Leaving thread room: ${threadId}`);
      socketRef.current.emit('leave:thread', threadId);
    }
  }, []);

  // Подключение при аутентификации
  useEffect(() => {
    if (status === 'authenticated') {
      connect();
    } else if (status === 'unauthenticated') {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [status, connect, disconnect]);

  // Автоматическое присоединение/покидание комнаты треда
  useEffect(() => {
    if (threadId && isConnected) {
      joinThread(threadId);
      
      return () => {
        leaveThread(threadId);
      };
    }
  }, [threadId, isConnected, joinThread, leaveThread]);

  // Функции для установки обработчиков событий
  const setOnMessageNew = useCallback((callback: (event: MessageNewEvent) => void) => {
    onMessageNewRef.current = callback;
  }, []);

  const setOnMessageRead = useCallback((callback: (event: MessageReadEvent) => void) => {
    onMessageReadRef.current = callback;
  }, []);

  const setOnThreadUpdated = useCallback((callback: (event: ThreadUpdatedEvent) => void) => {
    onThreadUpdatedRef.current = callback;
  }, []);

  return {
    isConnected,
    connectionError,
    fallbackToPolling,
    connect,
    disconnect,
    joinThread,
    leaveThread,
    setOnMessageNew,
    setOnMessageRead,
    setOnThreadUpdated,
  };
}

// Хук для подсчета непрочитанных сообщений
export function useUnreadCounter() {
  const { isConnected, setOnThreadUpdated } = useChatSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [threadCounts, setThreadCounts] = useState<Record<string, number>>({});

  // Обновляем общий счетчик при изменении счетчиков по тредам
  useEffect(() => {
    const total = Object.values(threadCounts).reduce((sum, count) => sum + count, 0);
    setUnreadCount(total);
  }, [threadCounts]);

  // Обработчик обновления треда
  useEffect(() => {
    setOnThreadUpdated((event: ThreadUpdatedEvent) => {
      setThreadCounts(prev => ({
        ...prev,
        [event.threadId]: event.unreadCount
      }));
    });
  }, [setOnThreadUpdated]);

  // Функция для обновления счетчика конкретного треда
  const updateThreadCount = useCallback((threadId: string, count: number) => {
    setThreadCounts(prev => ({
      ...prev,
      [threadId]: count
    }));
  }, []);

  // Функция для сброса счетчика треда
  const resetThreadCount = useCallback((threadId: string) => {
    setThreadCounts(prev => {
      const { [threadId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  return {
    unreadCount,
    threadCounts,
    updateThreadCount,
    resetThreadCount,
    isSocketConnected: isConnected,
  };
}

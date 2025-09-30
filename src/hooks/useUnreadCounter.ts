'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useUnreadCounter as useChatUnreadCounter } from './useChatSocket';

interface UnreadCounts {
  chat: number;
  applications: number;
  requests: number;
  total: number;
}

export function useUnreadCounter() {
  const { data: session, status } = useSession();
  const chatUnreadCount = useChatUnreadCounter();
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    chat: 0,
    applications: 0,
    requests: 0,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  
  // Используем useRef для стабильного callback
  const fetchRef = useRef<() => Promise<void>>();
  
  fetchRef.current = async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    setLoading(true);
    try {
      // Используем новый batch API
      const response = await fetch('/api/me/unread-counts');
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCounts(data);
      } else {
        // Fallback на старый способ, если новый API недоступен
        const [applicationsResponse, requestsResponse] = await Promise.all([
          fetch('/api/applications/unread-count').then(res => res.ok ? res.json() : { count: 0 }),
          fetch('/api/requests/unread-count').then(res => res.ok ? res.json() : { count: 0 })
        ]);

        const chatCount = typeof chatUnreadCount === 'number' ? chatUnreadCount : chatUnreadCount.unreadCount;
        const newCounts = {
          chat: chatCount,
          applications: applicationsResponse.count || 0,
          requests: requestsResponse.count || 0,
          total: chatCount + (applicationsResponse.count || 0) + (requestsResponse.count || 0)
        };

        setUnreadCounts(newCounts);
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Стабильный wrapper callback
  const refresh = useCallback(() => {
    fetchRef.current?.();
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    
    refresh();
    
    // Обновляем счетчики каждые 30 секунд
    const interval = setInterval(refresh, 30000);
    
    return () => clearInterval(interval);
  }, [status]); // ✅ ТОЛЬКО status!

  // Мемоизируем возвращаемый объект
  return useMemo(() => ({
    unreadCount: unreadCounts.total,
    unreadCounts,
    loading,
    refresh
  }), [unreadCounts, loading, refresh]);
}

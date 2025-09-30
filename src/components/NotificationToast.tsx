'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface NotificationToastProps {
  type: 'new_request' | 'new_application' | 'new_message' | 'request_accepted';
  title: string;
  message: string;
  actionUrl?: string;
}

export default function NotificationToast({
  type,
  title,
  message,
  actionUrl
}: NotificationToastProps) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    // Показываем уведомление
    const toastId = toast.info(title, {
      description: message,
      duration: 5000,
      action: actionUrl ? {
        label: 'Перейти',
        onClick: () => {
          window.location.href = actionUrl;
        }
      } : undefined
    });

    return () => {
      toast.dismiss(toastId);
    };
  }, [type, title, message, actionUrl, session?.user?.id]);

  return null;
}

// Хук для показа уведомлений
export function useNotifications() {
  const showNotification = (type: NotificationToastProps['type'], title: string, message: string, actionUrl?: string) => {
    toast.info(title, {
      description: message,
      duration: 5000,
      action: actionUrl ? {
        label: 'Перейти',
        onClick: () => {
          window.location.href = actionUrl;
        }
      } : undefined
    });
  };

  const showSuccess = (title: string, message?: string) => {
    toast.success(title, {
      description: message,
      duration: 3000
    });
  };

  const showError = (title: string, message?: string) => {
    toast.error(title, {
      description: message,
      duration: 5000
    });
  };

  return {
    showNotification,
    showSuccess,
    showError
  };
}


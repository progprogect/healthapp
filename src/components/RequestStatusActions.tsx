'use client';

import { useState } from 'react';
import { RequestStatus } from '@prisma/client';
import { toast } from 'sonner';
import Link from 'next/link';

interface RequestStatusActionsProps {
  requestId: string;
  currentStatus: RequestStatus;
  isClient: boolean;
  isSpecialist: boolean;
  specialistId?: string;
  onStatusChange?: (newStatus: RequestStatus) => void;
}

export default function RequestStatusActions({
  requestId,
  currentStatus,
  isClient,
  isSpecialist,
  specialistId,
  onStatusChange
}: RequestStatusActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const updateStatus = async (newStatus: RequestStatus) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при обновлении статуса');
      }

      toast.success('Статус заявки обновлен');
      onStatusChange?.(newStatus);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при обновлении статуса');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableActions = () => {
    const actions: Array<{
      label: string;
      status: RequestStatus;
      className: string;
      confirmText: string;
      isLink?: boolean;
      linkUrl?: string;
    }> = [];

    if (isClient) {
      switch (currentStatus) {
        case 'OPEN':
          actions.push({
            label: 'Отменить заявку',
            status: 'CANCELLED' as RequestStatus,
            className: 'bg-red-600 hover:bg-red-700 text-white',
            confirmText: 'Вы уверены, что хотите отменить заявку?'
          });
          break;
        case 'IN_PROGRESS':
          actions.push({
            label: 'Завершить заявку',
            status: 'COMPLETED' as RequestStatus,
            className: 'bg-green-600 hover:bg-green-700 text-white',
            confirmText: 'Отметить заявку как завершенную?'
          });
          break;
        case 'COMPLETED':
          if (specialistId) {
            actions.push({
              label: 'Оставить отзыв',
              status: 'COMPLETED' as RequestStatus,
              className: 'bg-blue-600 hover:bg-blue-700 text-white',
              confirmText: '',
              isLink: true,
              linkUrl: `/app/reviews/new?requestId=${requestId}&specialistId=${specialistId}`
            });
          }
          break;
      }
    }

    if (isSpecialist && currentStatus === 'IN_PROGRESS') {
      actions.push({
        label: 'Завершить работу',
        status: 'COMPLETED' as RequestStatus,
        className: 'bg-green-600 hover:bg-green-700 text-white',
        confirmText: 'Отметить работу как завершенную?'
      });
    }

    return actions;
  };

  const handleAction = async (action: any) => {
    if (window.confirm(action.confirmText)) {
      await updateStatus(action.status);
    }
  };

  const actions = getAvailableActions();

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 mt-3">
      {actions.map((action, index) => (
        action.isLink ? (
          <Link
            key={index}
            href={action.linkUrl || '#'}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${action.className}`}
          >
            {action.label}
          </Link>
        ) : (
          <button
            key={index}
            onClick={() => handleAction(action)}
            disabled={isLoading}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${action.className} ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Обновление...' : action.label}
          </button>
        )
      ))}
    </div>
  );
}

'use client';

import { RequestStatus } from '@prisma/client';

interface RequestStatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

const statusConfig = {
  OPEN: {
    label: 'Открыта',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: '🟢'
  },
  IN_PROGRESS: {
    label: 'В работе',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '🟡'
  },
  COMPLETED: {
    label: 'Завершена',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: '🔵'
  },
  CANCELLED: {
    label: 'Отменена',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: '🔴'
  }
};

export default function RequestStatusBadge({ status, className = '' }: RequestStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.className} ${className}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}


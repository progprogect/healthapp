'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ReviewForm from '@/components/ReviewForm';
import AppLoading from '@/components/AppLoading';
import AppError from '@/components/AppError';

interface RequestInfo {
  id: string;
  title: string;
  specialist: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export default function NewReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = searchParams.get('requestId');
  const specialistId = searchParams.get('specialistId');
  
  // Используем useRef для стабильного callback
  const fetchRef = useRef<() => Promise<void>>();
  
  fetchRef.current = async () => {
    if (!requestId || !specialistId) {
      setError('Неверные параметры запроса');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/requests/${requestId}`);
      if (!response.ok) {
        throw new Error('Не удалось загрузить информацию о заявке');
      }
      const data = await response.json();
      setRequestInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };
  
  // Стабильный wrapper callback
  const fetchRequestInfo = useCallback(() => {
    fetchRef.current?.();
  }, []);
  
  // Redirect effect - отдельно
  useEffect(() => {
    if (status === 'loading') return;
    if (status !== 'authenticated') {
      router.push('/auth/login');
    }
  }, [status]); // ✅ router НЕ в dependencies!
  
  // Data fetch effect
  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!requestId || !specialistId) {
      setError('Неверные параметры запроса');
      setLoading(false);
      return;
    }
    fetchRequestInfo();
  }, [status, requestId, specialistId, fetchRequestInfo]); // ✅ Стабильные deps

  const fetchRequestInfoOld = async () => {
    try {
      const response = await fetch(`/api/requests/${requestId}`);
      
      if (!response.ok) {
        throw new Error('Заявка не найдена');
      }

      const request = await response.json();
      
      // Проверяем, что заявка завершена и пользователь - клиент
      if (request.status !== 'COMPLETED') {
        throw new Error('Отзыв можно оставить только после завершения заявки');
      }

      // Получаем информацию о специалисте
      const specialistResponse = await fetch(`/api/specialists/${specialistId}`);
      
      if (!specialistResponse.ok) {
        throw new Error('Специалист не найден');
      }

      const specialist = await specialistResponse.json();

      setRequestInfo({
        id: request.id,
        title: request.title,
        specialist: {
          id: specialist.id,
          displayName: specialist.displayName,
          avatarUrl: specialist.avatarUrl
        }
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    router.push('/app/requests');
  };

  const handleCancel = () => {
    router.push('/app/requests');
  };

  if (status === 'loading' || loading) {
    return <AppLoading message="Загрузка..." />;
  }

  if (error) {
    return (
      <AppError 
        title="Ошибка" 
        message={error}
        action={{
          label: 'Вернуться к заявкам',
          onClick: () => router.push('/app/requests')
        }}
      />
    );
  }

  if (!requestInfo) {
    return <AppError title="Ошибка" message="Данные не найдены" />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Оставить отзыв
        </h1>
        <p className="text-gray-600">
          Расскажите о своем опыте работы с специалистом
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-2">
          Заявка: {requestInfo.title}
        </h3>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 font-medium text-sm">
              {requestInfo.specialist.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {requestInfo.specialist.displayName}
            </p>
            <p className="text-sm text-gray-500">Специалист</p>
          </div>
        </div>
      </div>

      <ReviewForm
        specialistId={requestInfo.specialist.id}
        requestId={requestInfo.id}
        onReviewSubmitted={handleReviewSubmitted}
        onCancel={handleCancel}
      />
    </div>
  );
}


'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RequestFormData, RequestFormErrors } from '@/types/request';

export default function NewRequestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RequestFormData>({
    categorySlug: '',
    title: '',
    description: '',
    preferredFormat: 'any',
    city: '',
    budgetMinCents: undefined,
    budgetMaxCents: undefined,
  });
  const [errors, setErrors] = useState<RequestFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { slug: 'psychologist', name: 'Психолог' },
    { slug: 'nutritionist', name: 'Нутрициолог' },
    { slug: 'personal-trainer', name: 'Персональный тренер' },
    { slug: 'health-coach', name: 'Коуч по здоровью' },
    { slug: 'physiotherapist', name: 'Физиотерапевт' },
  ];

  const handleInputChange = (field: keyof RequestFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: RequestFormErrors = {};

    if (!formData.categorySlug) {
      newErrors.categorySlug = 'Выберите категорию';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Введите заголовок';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Заголовок должен содержать минимум 5 символов';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Введите описание';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Описание должно содержать минимум 20 символов';
    }
    if (formData.preferredFormat === 'offline' && !formData.city?.trim()) {
      newErrors.city = 'Укажите город для очных встреч';
    }
    if (formData.budgetMinCents && formData.budgetMaxCents && formData.budgetMinCents > formData.budgetMaxCents) {
      newErrors.budgetMinCents = 'Минимальный бюджет не может быть больше максимального';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          city: formData.preferredFormat === 'offline' ? formData.city : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.details) {
          const fieldErrors: RequestFormErrors = {};
          errorData.details.forEach((detail: any) => {
            fieldErrors[detail.field as keyof RequestFormErrors] = detail.message;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: errorData.error || 'Ошибка при создании заявки' });
        }
        return;
      }

      const result = await response.json();
      router.push(`/app/requests/${result.id}`);
    } catch (error) {
      setErrors({ general: 'Ошибка сети. Попробуйте еще раз.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Создать заявку</h1>
          
          {errors.general && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Категория */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Категория специалиста *
              </label>
              <select
                id="category"
                value={formData.categorySlug}
                onChange={(e) => handleInputChange('categorySlug', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.categorySlug ? 'border-red-300' : 'border-gray-300'
                }`}
                data-testid="request-category"
              >
                <option value="">Выберите категорию</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categorySlug && (
                <p className="mt-1 text-sm text-red-600">{errors.categorySlug}</p>
              )}
            </div>

            {/* Заголовок */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Заголовок заявки *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Краткое описание вашей потребности"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                data-testid="request-title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Описание */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Подробное описание *
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Опишите подробно, что вам нужно, какие у вас есть проблемы или цели..."
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                data-testid="request-description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Формат работы */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Предпочтительный формат работы *
              </label>
              <div className="space-y-2">
                {[
                  { value: 'online', label: 'Онлайн консультации' },
                  { value: 'offline', label: 'Очные встречи' },
                  { value: 'any', label: 'Любой формат' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="preferredFormat"
                      value={option.value}
                      checked={formData.preferredFormat === option.value}
                      onChange={(e) => handleInputChange('preferredFormat', e.target.value)}
                      className="mr-2"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Город (только для очных встреч) */}
            {formData.preferredFormat === 'offline' && (
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  Город *
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Введите город"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.city ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>
            )}

            {/* Бюджет */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Бюджет (в рублях)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="budgetMin" className="block text-xs text-gray-500 mb-1">
                    От
                  </label>
                  <input
                    type="number"
                    id="budgetMin"
                    value={formData.budgetMinCents ? formData.budgetMinCents / 100 : ''}
                    onChange={(e) => handleInputChange('budgetMinCents', e.target.value ? Number(e.target.value) * 100 : undefined)}
                    placeholder="0"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.budgetMinCents ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="budgetMax" className="block text-xs text-gray-500 mb-1">
                    До
                  </label>
                  <input
                    type="number"
                    id="budgetMax"
                    value={formData.budgetMaxCents ? formData.budgetMaxCents / 100 : ''}
                    onChange={(e) => handleInputChange('budgetMaxCents', e.target.value ? Number(e.target.value) * 100 : undefined)}
                    placeholder="0"
                    min="0"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.budgetMaxCents ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>
              {errors.budgetMinCents && (
                <p className="mt-1 text-sm text-red-600">{errors.budgetMinCents}</p>
              )}
            </div>

            {/* Кнопки */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="request-submit"
              >
                {isSubmitting ? 'Создание...' : 'Создать заявку'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Publication } from '@/types/specialist';

interface PublicationFormProps {
  onAdd: (publication: Omit<Publication, 'id' | 'createdAt'>) => void;
  disabled?: boolean;
}

export default function PublicationForm({ onAdd, disabled = false }: PublicationFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    type: 'ARTICLE' as 'ARTICLE' | 'BOOK' | 'RESEARCH' | 'BLOG_POST' | 'PODCAST' | 'VIDEO',
    year: ''
  });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    if (!formData.title.trim() || !formData.url.trim()) {
      toast.error('Заполните обязательные поля');
      return;
    }

    // Валидация URL
    try {
      new URL(formData.url);
    } catch {
      toast.error('Введите корректный URL');
      return;
    }

    try {
      // Добавляем публикацию
      onAdd({
        title: formData.title.trim(),
        url: formData.url.trim(),
        type: formData.type,
        year: formData.year ? parseInt(formData.year) : undefined,
        isVerified: false
      });

      // Сбрасываем форму
      setFormData({
        title: '',
        url: '',
        type: 'ARTICLE',
        year: ''
      });
      setShowForm(false);
      toast.success('Публикация добавлена');
    } catch (error) {
      console.error('Publication add error:', error);
      toast.error('Ошибка добавления публикации');
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        disabled={disabled}
        className="btn btn-outline btn-sm"
      >
        + Добавить публикацию
      </button>
    );
  }

  return (
    <div className="card p-6 space-y-4">
      <h3 className="text-heading-4">Добавить публикацию</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название публикации *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Например: Когнитивно-поведенческая терапия при тревожности"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={disabled}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ссылка на публикацию *
          </label>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://example.com/publication"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={disabled}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип публикации
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={disabled}
            >
              <option value="ARTICLE">Статья</option>
              <option value="BOOK">Книга</option>
              <option value="RESEARCH">Исследование</option>
              <option value="BLOG_POST">Блог-пост</option>
              <option value="PODCAST">Подкаст</option>
              <option value="VIDEO">Видео</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Год публикации
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
              placeholder="2023"
              min="1900"
              max={new Date().getFullYear()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={disabled}
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={disabled}
            className="btn btn-primary btn-sm"
          >
            Добавить
          </button>
          
          <button
            type="button"
            onClick={() => setShowForm(false)}
            disabled={disabled}
            className="btn btn-secondary btn-sm"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}


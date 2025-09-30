'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { fileStorageService, FILE_CONFIGS } from '@/lib/file-storage';
import { Education } from '@/types/specialist';

interface EducationFormProps {
  onAdd: (education: Omit<Education, 'id' | 'createdAt'>) => void;
  specialistId: string;
  disabled?: boolean;
}

export default function EducationForm({ onAdd, specialistId, disabled = false }: EducationFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    institution: '',
    degree: '',
    year: '',
    documentType: 'diploma' as 'diploma' | 'certificate' | 'license',
    document: null as File | null
  });
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || uploading) return;

    if (!formData.title.trim() || !formData.institution.trim()) {
      toast.error('Заполните обязательные поля');
      return;
    }

    setUploading(true);
    try {
      let documentUrl: string | undefined;

      // Загружаем документ, если есть
      if (formData.document) {
        const result = await fileStorageService.uploadFile(
          formData.document,
          FILE_CONFIGS.document,
          specialistId,
          'documents'
        );
        documentUrl = result.url;
      }

      // Добавляем образование
      onAdd({
        title: formData.title.trim(),
        institution: formData.institution.trim(),
        degree: formData.degree.trim() || undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        documentUrl,
        documentType: formData.documentType,
        isVerified: false
      });

      // Сбрасываем форму
      setFormData({
        title: '',
        institution: '',
        degree: '',
        year: '',
        documentType: 'diploma',
        document: null
      });
      setShowForm(false);
      toast.success('Образование добавлено');
    } catch (error) {
      console.error('Education add error:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка добавления образования');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, document: file }));
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        disabled={disabled}
        className="btn btn-outline btn-sm"
      >
        + Добавить образование
      </button>
    );
  }

  return (
    <div className="card p-6 space-y-4">
      <h3 className="text-heading-4">Добавить образование</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название образования *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Например: Высшее медицинское образование"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={disabled || uploading}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Учебное заведение *
            </label>
            <input
              type="text"
              value={formData.institution}
              onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
              placeholder="Например: МГУ им. Ломоносова"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={disabled || uploading}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Степень/Квалификация
            </label>
            <input
              type="text"
              value={formData.degree}
              onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
              placeholder="Например: Кандидат наук"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={disabled || uploading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Год окончания
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
              placeholder="2020"
              min="1950"
              max={new Date().getFullYear()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={disabled || uploading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Тип документа
          </label>
          <select
            value={formData.documentType}
            onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={disabled || uploading}
          >
            <option value="diploma">Диплом</option>
            <option value="certificate">Сертификат</option>
            <option value="license">Лицензия</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Документ (PDF)
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={disabled || uploading}
          />
          {formData.document && (
            <p className="text-caption text-gray-600 mt-1">
              Выбран файл: {formData.document.name}
            </p>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={disabled || uploading}
            className="btn btn-primary btn-sm"
          >
            {uploading ? 'Добавление...' : 'Добавить'}
          </button>
          
          <button
            type="button"
            onClick={() => setShowForm(false)}
            disabled={disabled || uploading}
            className="btn btn-secondary btn-sm"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}


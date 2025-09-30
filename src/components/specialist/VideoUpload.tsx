'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { fileStorageService, FILE_CONFIGS } from '@/lib/file-storage';

interface VideoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  specialistId: string;
  disabled?: boolean;
}

export default function VideoUpload({ 
  value, 
  onChange, 
  specialistId, 
  disabled = false 
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (disabled) return;

    setUploading(true);
    try {
      const result = await fileStorageService.uploadFile(
        file, 
        FILE_CONFIGS.video, 
        specialistId, 
        'video'
      );
      
      onChange(result.url);
      setPreview(result.thumbnailUrl || result.url);
      toast.success('Видео успешно загружено');
    } catch (error) {
      console.error('Video upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка загрузки видео');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeVideo = () => {
    onChange('');
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-heading-4">Видео-презентация</label>
      
      {value ? (
        <div className="relative">
          <video 
            src={value} 
            controls 
            className="w-full max-w-md rounded-lg shadow-sm"
            poster={preview || undefined}
          >
            Ваш браузер не поддерживает видео.
          </video>
          <button
            onClick={removeVideo}
            disabled={disabled}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-colors disabled:opacity-50"
            title="Удалить видео"
          >
            ×
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400 cursor-pointer'
          }`}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileInputChange}
            disabled={disabled || uploading}
            className="hidden"
          />
          
          <div className="space-y-2">
            <div className="text-4xl">🎥</div>
            <p className="text-body">
              {uploading ? 'Загрузка видео...' : 'Перетащите видео или нажмите для выбора'}
            </p>
            <p className="text-caption">
              Максимум 100MB, формат MP4/WebM/MOV
            </p>
            {uploading && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


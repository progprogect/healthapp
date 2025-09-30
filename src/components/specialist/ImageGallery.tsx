'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { fileStorageService, FILE_CONFIGS } from '@/lib/file-storage';
import { GalleryImage } from '@/types/specialist';

interface ImageGalleryProps {
  value: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  specialistId: string;
  disabled?: boolean;
  maxImages?: number;
}

export default function ImageGallery({ 
  value, 
  onChange, 
  specialistId, 
  disabled = false,
  maxImages = 10
}: ImageGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    if (disabled || uploading) return;

    const fileArray = Array.from(files);
    if (value.length + fileArray.length > maxImages) {
      toast.error(`Максимум ${maxImages} изображений`);
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = fileArray.map(async (file, index) => {
        const result = await fileStorageService.uploadFile(
          file, 
          FILE_CONFIGS.image, 
          specialistId, 
          'gallery'
        );
        
        return {
          url: result.url,
          alt: file.name,
          order: value.length + index
        };
      });

      const newImages = await Promise.all(uploadPromises);
      onChange([...value, ...newImages]);
      toast.success(`Загружено ${newImages.length} изображений`);
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка загрузки изображений');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeImage = (index: number) => {
    const newImages = value.filter((_, i) => i !== index);
    // Обновляем порядок
    const reorderedImages = newImages.map((img, i) => ({ ...img, order: i }));
    onChange(reorderedImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...value];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    
    // Обновляем порядок
    const reorderedImages = newImages.map((img, i) => ({ ...img, order: i }));
    onChange(reorderedImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-heading-4">Галерея работ</label>
        <span className="text-caption text-gray-500">
          {value.length}/{maxImages} изображений
        </span>
      </div>
      
      {/* Область загрузки */}
      {value.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors ${
            disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400 cursor-pointer'
          }`}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInputChange}
            disabled={disabled || uploading}
            className="hidden"
          />
          
          <div className="space-y-2">
            <div className="text-3xl">📷</div>
            <p className="text-body-sm">
              {uploading ? 'Загрузка изображений...' : 'Перетащите изображения или нажмите для выбора'}
            </p>
            <p className="text-caption">
              Максимум 10MB на изображение, форматы JPG/PNG/WebP
            </p>
            {uploading && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Галерея изображений */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {value.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image.url}
                alt={image.alt || `Изображение ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg shadow-sm"
              />
              
              {/* Кнопки управления */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  {index > 0 && (
                    <button
                      onClick={() => moveImage(index, index - 1)}
                      disabled={disabled}
                      className="bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
                      title="Переместить влево"
                    >
                      ←
                    </button>
                  )}
                  
                  <button
                    onClick={() => removeImage(index)}
                    disabled={disabled}
                    className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                    title="Удалить изображение"
                  >
                    ×
                  </button>
                  
                  {index < value.length - 1 && (
                    <button
                      onClick={() => moveImage(index, index + 1)}
                      disabled={disabled}
                      className="bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
                      title="Переместить вправо"
                    >
                      →
                    </button>
                  )}
                </div>
              </div>
              
              {/* Номер изображения */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


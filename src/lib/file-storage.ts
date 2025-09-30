import { createId } from '@paralleldrive/cuid2';

export interface FileUploadConfig {
  maxSize: number;
  allowedTypes: readonly string[];
  generateThumbnail?: boolean;
  optimize?: boolean;
}

export interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  metadata: {
    size: number;
    type: string;
    uploadedAt: string;
  };
}

export const FILE_CONFIGS = {
  video: {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    generateThumbnail: true,
    optimize: true
  },
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    generateThumbnail: false,
    optimize: true
  },
  document: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['application/pdf'],
    generateThumbnail: true, // PDF preview
    optimize: false
  }
} as const;

export class FileStorageService {
  /**
   * Валидация файла перед загрузкой
   */
  private validateFile(file: File, config: FileUploadConfig): void {
    if (file.size > config.maxSize) {
      throw new Error(`Размер файла не должен превышать ${this.formatFileSize(config.maxSize)}`);
    }

    if (!config.allowedTypes.includes(file.type)) {
      throw new Error(`Неподдерживаемый тип файла. Разрешены: ${config.allowedTypes.join(', ')}`);
    }
  }

  /**
   * Генерация уникального имени файла
   */
  private generateFileName(file: File, specialistId: string, category: string): string {
    const fileId = createId();
    const extension = file.name.split('.').pop() || 'bin';
    return `${category}/${specialistId}/${fileId}.${extension}`;
  }

  /**
   * Форматирование размера файла
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Загрузка файла в локальное хранилище (MVP версия)
   */
  async uploadFile(
    file: File,
    config: FileUploadConfig,
    specialistId: string,
    category: 'video' | 'gallery' | 'documents'
  ): Promise<UploadResult> {
    try {
      // 1. Валидация файла
      this.validateFile(file, config);

      // 2. Генерация уникального имени
      const fileName = this.generateFileName(file, specialistId, category);

      // 3. Получение URL для загрузки
      const uploadResponse = await fetch('/api/upload/specialist-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          contentType: file.type,
          size: file.size,
          category
        })
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Ошибка получения URL загрузки');
      }

      const { uploadUrl, publicUrl } = await uploadResponse.json();

      // 4. Загрузка файла
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResult.ok) {
        throw new Error('Ошибка загрузки файла');
      }

      // 5. Генерация превью (заглушка для MVP)
      const thumbnailUrl = config.generateThumbnail ? `${publicUrl}?thumbnail=true` : undefined;

      return {
        url: publicUrl,
        thumbnailUrl,
        metadata: {
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  /**
   * Удаление файла
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const response = await fetch('/api/upload/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl })
      });

      if (!response.ok) {
        throw new Error('Ошибка удаления файла');
      }
    } catch (error) {
      console.error('File deletion error:', error);
      throw error;
    }
  }

  /**
   * Получение информации о файле
   */
  async getFileInfo(fileUrl: string): Promise<{ size: number; type: string; lastModified: string } | null> {
    try {
      const response = await fetch(fileUrl, { method: 'HEAD' });
      if (!response.ok) return null;

      return {
        size: parseInt(response.headers.get('content-length') || '0'),
        type: response.headers.get('content-type') || 'unknown',
        lastModified: response.headers.get('last-modified') || new Date().toISOString()
      };
    } catch (error) {
      console.error('File info error:', error);
      return null;
    }
  }
}

// Экспортируем экземпляр сервиса
export const fileStorageService = new FileStorageService();

import { NextResponse } from 'next/server';
import { requireSpecialistProfile } from '@/lib/auth-guards';
import { z } from 'zod';
import { createId } from '@paralleldrive/cuid2';

// Схема валидации для запроса upload URL
const uploadUrlSchema = z.object({
  fileName: z.string().min(1, 'Имя файла обязательно'),
  contentType: z.string().min(1, 'Тип контента обязателен'),
  size: z.number().min(1, 'Размер файла должен быть больше 0'),
  category: z.enum(['video', 'gallery', 'documents'])
});

// POST /api/upload/specialist-url - получить URL для загрузки файла специалиста
export async function POST(request: Request) {
  try {
    const { user, specialistProfile } = await requireSpecialistProfile();

    const body = await request.json();
    const validatedData = uploadUrlSchema.parse(body);

    // Валидация размера файла в зависимости от категории
    const maxSizes = {
      video: 100 * 1024 * 1024, // 100MB
      gallery: 10 * 1024 * 1024, // 10MB
      documents: 20 * 1024 * 1024 // 20MB
    };

    if (validatedData.size > maxSizes[validatedData.category]) {
      return NextResponse.json({ 
        error: `Размер файла не должен превышать ${formatFileSize(maxSizes[validatedData.category])}` 
      }, { status: 400 });
    }

    // Валидация типа файла
    const allowedTypes = {
      video: ['video/mp4', 'video/webm', 'video/quicktime'],
      gallery: ['image/jpeg', 'image/png', 'image/webp'],
      documents: ['application/pdf']
    };

    if (!allowedTypes[validatedData.category].includes(validatedData.contentType)) {
      return NextResponse.json({ 
        error: `Неподдерживаемый тип файла для категории ${validatedData.category}` 
      }, { status: 400 });
    }

    // Генерируем путь для файла
    const objectKey = `${validatedData.category}/${user.id}/${validatedData.fileName}`;

    // Для MVP используем простой подход с локальным хранилищем
    const uploadUrl = `/api/upload/${objectKey}`;
    const publicUrl = `/uploads/${objectKey}`;

    return NextResponse.json({
      uploadUrl,
      objectKey,
      publicUrl
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }

    if (error instanceof Error && ['UNAUTHORIZED', 'NO_SPECIALIST_PROFILE', 'USER_NOT_ACTIVE'].includes(error.message)) {
      const status = error.message === 'UNAUTHORIZED' ? 401 : 403;
      return NextResponse.json({ error: 'Unauthorized' }, { status });
    }
    
    console.error('Error generating upload URL:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

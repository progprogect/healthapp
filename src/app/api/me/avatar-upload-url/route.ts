import { NextResponse } from 'next/server';
import { requireSpecialistProfile } from '@/lib/auth-guards';
import { z } from 'zod';
import { createId } from '@paralleldrive/cuid2';

// Схема валидации для запроса upload URL
const uploadUrlSchema = z.object({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z.number().min(1, 'Размер файла должен быть больше 0').max(2 * 1024 * 1024, 'Размер файла не должен превышать 2MB')
});

// POST /api/me/avatar-upload-url - получить URL для загрузки аватара
export async function POST(request: Request) {
  try {
    const { user, specialistProfile } = await requireSpecialistProfile();

    const body = await request.json();
    const validatedData = uploadUrlSchema.parse(body);

    // Генерируем уникальный ключ для файла
    const fileId = createId();
    const fileExtension = validatedData.contentType.split('/')[1];
    const objectKey = `avatars/${user.id}/${fileId}.${fileExtension}`;

    // Для MVP используем простой подход с локальным хранилищем
    // В продакшене здесь был бы pre-signed URL для S3/R2
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


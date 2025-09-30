import { NextResponse } from 'next/server';
import { requireSpecialistProfile } from '@/lib/auth-guards';
import { z } from 'zod';
import { unlink } from 'fs/promises';
import { join } from 'path';

// Схема валидации для удаления файла
const deleteFileSchema = z.object({
  fileUrl: z.string().url('Некорректный URL файла')
});

// DELETE /api/upload/delete - удалить файл специалиста
export async function DELETE(request: Request) {
  try {
    const { user } = await requireSpecialistProfile();

    const body = await request.json();
    const validatedData = deleteFileSchema.parse(body);

    // Извлекаем путь к файлу из URL
    const url = new URL(validatedData.fileUrl);
    const filePath = url.pathname.replace('/uploads/', '');
    
    // Проверяем, что файл принадлежит текущему специалисту
    if (!filePath.startsWith(`video/${user.id}/`) && 
        !filePath.startsWith(`gallery/${user.id}/`) && 
        !filePath.startsWith(`documents/${user.id}/`)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    // Полный путь к файлу
    const fullPath = join(process.cwd(), 'public', 'uploads', filePath);

    try {
      await unlink(fullPath);
      return NextResponse.json({ success: true });
    } catch (error) {
      // Файл может не существовать, это не критично
      console.log('File not found or already deleted:', fullPath);
      return NextResponse.json({ success: true });
    }

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
    
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


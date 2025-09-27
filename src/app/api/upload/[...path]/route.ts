import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// PUT /api/upload/[path] - загрузить файл (MVP версия)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePath = resolvedParams.path.join('/');
    
    // Проверяем, что путь начинается с avatars/
    if (!filePath.startsWith('avatars/')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    const buffer = await request.arrayBuffer();
    const data = Buffer.from(buffer);

    // Создаем директорию если не существует
    const uploadDir = join(process.cwd(), 'public', 'uploads', filePath.split('/').slice(0, -1).join('/'));
    await mkdir(uploadDir, { recursive: true });

    // Сохраняем файл
    const fullPath = join(process.cwd(), 'public', 'uploads', filePath);
    await writeFile(fullPath, data);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { requireSpecialistProfile } from '@/lib/auth-guards';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для добавления публикации
const addPublicationSchema = z.object({
  title: z.string().min(1, 'Название публикации обязательно'),
  url: z.string().url('Некорректный URL'),
  type: z.enum(['ARTICLE', 'BOOK', 'RESEARCH', 'BLOG_POST', 'PODCAST', 'VIDEO']),
  year: z.number().min(1900).max(new Date().getFullYear()).optional()
});

// POST /api/me/specialist-profile/publications - добавить публикацию
export async function POST(request: Request) {
  try {
    const { user, specialistProfile } = await requireSpecialistProfile();

    const body = await request.json();
    const validatedData = addPublicationSchema.parse(body);

    const publication = await prisma.publication.create({
      data: {
        specialistId: user.id,
        title: validatedData.title,
        url: validatedData.url,
        type: validatedData.type,
        year: validatedData.year,
        isVerified: false
      }
    });

    return NextResponse.json({
      id: publication.id,
      title: publication.title,
      url: publication.url,
      type: publication.type,
      year: publication.year,
      isVerified: publication.isVerified,
      createdAt: publication.createdAt.toISOString()
    }, { status: 201 });

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
    
    console.error('Error adding publication:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET /api/me/specialist-profile/publications - получить публикации специалиста
export async function GET() {
  try {
    const { user } = await requireSpecialistProfile();

    const publications = await prisma.publication.findMany({
      where: { specialistId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      publications: publications.map(pub => ({
        id: pub.id,
        title: pub.title,
        url: pub.url,
        type: pub.type,
        year: pub.year,
        isVerified: pub.isVerified,
        createdAt: pub.createdAt.toISOString()
      }))
    });

  } catch (error) {
    if (error instanceof Error && ['UNAUTHORIZED', 'NO_SPECIALIST_PROFILE', 'USER_NOT_ACTIVE'].includes(error.message)) {
      const status = error.message === 'UNAUTHORIZED' ? 401 : 403;
      return NextResponse.json({ error: 'Unauthorized' }, { status });
    }
    
    console.error('Error fetching publications:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

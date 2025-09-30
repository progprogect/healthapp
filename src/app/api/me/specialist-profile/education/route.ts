import { NextResponse } from 'next/server';
import { requireSpecialistProfile } from '@/lib/auth-guards';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для добавления образования
const addEducationSchema = z.object({
  title: z.string().min(1, 'Название образования обязательно'),
  institution: z.string().min(1, 'Учебное заведение обязательно'),
  degree: z.string().optional(),
  year: z.number().min(1900).max(new Date().getFullYear()).optional(),
  documentUrl: z.string().url().optional(),
  documentType: z.enum(['diploma', 'certificate', 'license'])
});

// POST /api/me/specialist-profile/education - добавить образование
export async function POST(request: Request) {
  try {
    const { user, specialistProfile } = await requireSpecialistProfile();

    const body = await request.json();
    const validatedData = addEducationSchema.parse(body);

    const education = await prisma.education.create({
      data: {
        specialistId: user.id,
        title: validatedData.title,
        institution: validatedData.institution,
        degree: validatedData.degree,
        year: validatedData.year,
        documentUrl: validatedData.documentUrl,
        documentType: validatedData.documentType,
        isVerified: false
      }
    });

    return NextResponse.json({
      id: education.id,
      title: education.title,
      institution: education.institution,
      degree: education.degree,
      year: education.year,
      documentUrl: education.documentUrl,
      documentType: education.documentType,
      isVerified: education.isVerified,
      createdAt: education.createdAt.toISOString()
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
    
    console.error('Error adding education:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET /api/me/specialist-profile/education - получить образование специалиста
export async function GET() {
  try {
    const { user } = await requireSpecialistProfile();

    const education = await prisma.education.findMany({
      where: { specialistId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      education: education.map(edu => ({
        id: edu.id,
        title: edu.title,
        institution: edu.institution,
        degree: edu.degree,
        year: edu.year,
        documentUrl: edu.documentUrl,
        documentType: edu.documentType,
        isVerified: edu.isVerified,
        verifiedAt: edu.verifiedAt?.toISOString(),
        verifiedBy: edu.verifiedBy,
        createdAt: edu.createdAt.toISOString()
      }))
    });

  } catch (error) {
    if (error instanceof Error && ['UNAUTHORIZED', 'NO_SPECIALIST_PROFILE', 'USER_NOT_ACTIVE'].includes(error.message)) {
      const status = error.message === 'UNAUTHORIZED' ? 401 : 403;
      return NextResponse.json({ error: 'Unauthorized' }, { status });
    }
    
    console.error('Error fetching education:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

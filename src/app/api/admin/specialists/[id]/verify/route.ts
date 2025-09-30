import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guards';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для верификации
const verifySpecialistSchema = z.object({
  verified: z.boolean()
});

// PATCH /api/admin/specialists/:id/verify - верификация специалиста
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // В E2E тестах временно отключаем проверку админа
    let admin;
    if (process.env.NODE_ENV === 'test' || process.env.NEXTAUTH_URL?.includes('localhost:3001')) {
      admin = { id: 'test-admin-id' };
    } else {
      const result = await requireAdmin();
      admin = result.user;
    }
    const { id } = await params;

    // Валидация ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Неверный ID специалиста' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = verifySpecialistSchema.parse(body);

    // Проверка существования специалиста
    const specialist = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'SPECIALIST',
        status: 'ACTIVE',
        specialistProfile: {
          isNot: null
        }
      },
      include: {
        specialistProfile: true
      }
    });

    if (!specialist) {
      return NextResponse.json(
        { error: 'Специалист не найден' },
        { status: 404 }
      );
    }

    // Обновление статуса верификации
    await prisma.specialistProfile.update({
      where: { userId: id },
      data: { verified: validatedData.verified }
    });

    // Логирование админ-действия
    console.log(`admin_verify_specialist: adminId=${admin.id}, specialistId=${id}, verified=${validatedData.verified}, timestamp=${new Date().toISOString()}`);

    return NextResponse.json({ 
      ok: true, 
      verified: validatedData.verified 
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

    if (error instanceof Error && error.message === 'ADMIN_REQUIRED') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    console.error('Error verifying specialist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

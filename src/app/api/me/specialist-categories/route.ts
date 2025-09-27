import { NextResponse } from 'next/server';
import { requireSpecialistProfile } from '@/lib/auth-guards';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Схема валидации для обновления категорий
const updateCategoriesSchema = z.object({
  slugs: z.array(z.string()).min(0, 'Минимум 0 категорий').max(5, 'Максимум 5 категорий')
});

// PUT /api/me/specialist-categories - заменить список категорий
export async function PUT(request: Request) {
  try {
    const { user, specialistProfile } = await requireSpecialistProfile();

    const body = await request.json();
    const validatedData = updateCategoriesSchema.parse(body);

    // Проверяем, что все slug существуют в справочнике
    const existingCategories = await prisma.category.findMany({
      where: {
        slug: {
          in: validatedData.slugs
        }
      },
      select: { slug: true }
    });

    const existingSlugs = existingCategories.map(cat => cat.slug);
    const invalidSlugs = validatedData.slugs.filter(slug => !existingSlugs.includes(slug));

    if (invalidSlugs.length > 0) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: [{ field: 'slugs', message: `Неизвестные категории: ${invalidSlugs.join(', ')}` }] 
      }, { status: 400 });
    }

    // Атомарно заменяем категории в транзакции
    await prisma.$transaction(async (tx) => {
      // Удаляем все существующие связи
      await tx.specialistCategory.deleteMany({
        where: {
          specialistUserId: user.id
        }
      });

      // Создаем новые связи
      if (validatedData.slugs.length > 0) {
        await tx.specialistCategory.createMany({
          data: validatedData.slugs.map(slug => ({
            specialistUserId: user.id,
            categorySlug: slug
          }))
        });
      }
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }

    if (error instanceof Error && ['UNAUTHORIZED', 'NO_SPECIALIST_PROFILE', 'USER_NOT_ACTIVE'].includes(error.message)) {
      const status = error.message === 'UNAUTHORIZED' ? 401 : 403;
      return NextResponse.json({ error: 'Unauthorized' }, { status });
    }
    
    console.error('Error updating specialist categories:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

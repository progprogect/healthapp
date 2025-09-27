import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { CreateRequestRequest, CreateRequestResponse } from '@/types/request';
import { requireClientProfile, createErrorResponse } from '@/lib/auth-guards';

// Schema для создания заявки
const createRequestSchema = z.object({
  categorySlug: z.string().min(1, 'Категория обязательна'),
  title: z.string().min(5, 'Заголовок должен содержать минимум 5 символов').max(200, 'Заголовок не должен превышать 200 символов'),
  description: z.string().min(20, 'Описание должно содержать минимум 20 символов').max(2000, 'Описание не должно превышать 2000 символов'),
  preferredFormat: z.enum(['online', 'offline', 'any'], {
    errorMap: () => ({ message: 'Формат должен быть online, offline или any' })
  }),
  city: z.string().optional(),
  budgetMinCents: z.number().min(0, 'Минимальный бюджет не может быть отрицательным').optional(),
  budgetMaxCents: z.number().min(0, 'Максимальный бюджет не может быть отрицательным').optional(),
}).refine((data) => {
  // city обязателен для offline
  if (data.preferredFormat === 'offline' && !data.city) {
    return false;
  }
  return true;
}, {
  message: 'Город обязателен для офлайн формата',
  path: ['city']
}).refine((data) => {
  // бюджет: min ≤ max
  if (data.budgetMinCents && data.budgetMaxCents && data.budgetMinCents > data.budgetMaxCents) {
    return false;
  }
  return true;
}, {
  message: 'Минимальный бюджет не может быть больше максимального',
  path: ['budgetMinCents']
});

// POST /api/requests - создать заявку (только для пользователей с client_profile)
export async function POST(request: Request) {
  try {
    // Проверяем наличие client_profile
    const { user, clientProfile } = await requireClientProfile();

    const body = await request.json();
    const validatedData = createRequestSchema.parse(body);

    // Проверяем, что категория существует
    const category = await prisma.category.findUnique({
      where: { slug: validatedData.categorySlug }
    });

    if (!category) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 });
    }

    // Преобразуем preferredFormat в верхний регистр для Prisma
    const preferredFormatMap = {
      'online': 'ONLINE',
      'offline': 'OFFLINE', 
      'any': 'ANY'
    } as const;

    // Создаем заявку
    const newRequest = await prisma.request.create({
      data: {
        clientUserId: user.id,
        categoryId: category.id,
        title: validatedData.title,
        description: validatedData.description,
        preferredFormat: preferredFormatMap[validatedData.preferredFormat],
        city: validatedData.city,
        budgetMinCents: validatedData.budgetMinCents,
        budgetMaxCents: validatedData.budgetMaxCents,
        status: 'OPEN'
      }
    });

    return NextResponse.json({
      id: newRequest.id,
      status: newRequest.status,
      createdAt: newRequest.createdAt.toISOString()
    } as CreateRequestResponse, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Ошибка валидации', 
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 });
    }
    
    // Обрабатываем ошибки авторизации
    if (error instanceof Error && ['UNAUTHORIZED', 'NO_CLIENT_PROFILE', 'USER_NOT_ACTIVE'].includes(error.message)) {
      const errorResponse = createErrorResponse(error.message, 
        error.message === 'UNAUTHORIZED' ? 401 : 403
      );
      return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.status });
    }
    
    console.error('Error creating request:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

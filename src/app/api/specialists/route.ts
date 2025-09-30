import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Define Zod schema for query parameters
const specialistSearchParamsSchema = z.object({
  category: z.string().optional(),
  format: z.enum(['online', 'offline', 'any']).default('any'),
  city: z.string().optional(),
  minExp: z.string().transform(Number).optional(),
  priceMin: z.string().transform(Number).optional(),
  priceMax: z.string().transform(Number).optional(),
  q: z.string().optional(),
  verifiedOnly: z.string().transform(val => val === 'true').default(true),
  sort: z.enum(['recent', 'price_asc', 'price_desc']).default('recent'),
  limit: z.string().transform(Number).default(20),
  offset: z.string().transform(Number).default(0),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validatedParams = specialistSearchParamsSchema.safeParse(params);

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: "Неверные параметры запроса", details: validatedParams.error.issues },
        { status: 400 }
      );
    }

    const limit = validatedParams.data.limit;
    const offset = validatedParams.data.offset;

    const where: any = {
      role: 'SPECIALIST',
      status: 'ACTIVE',
    };

    // Применяем фильтры
    if (validatedParams.data.category) {
      where.specialistCategories = {
        some: {
          category: {
            slug: validatedParams.data.category
          }
        }
      };
    }

    // Создаем объект для фильтров specialistProfile
    const specialistProfileFilters: any = {};

    if (validatedParams.data.format === 'online') {
      specialistProfileFilters.onlineOnly = true;
    } else if (validatedParams.data.format === 'offline') {
      specialistProfileFilters.onlineOnly = false;
      if (validatedParams.data.city) {
        specialistProfileFilters.city = validatedParams.data.city;
      }
    }

    if (validatedParams.data.minExp !== undefined) {
      specialistProfileFilters.experienceYears = {
        gte: validatedParams.data.minExp
      };
    }

    if (validatedParams.data.priceMin !== undefined || validatedParams.data.priceMax !== undefined) {
      specialistProfileFilters.AND = [];
      if (validatedParams.data.priceMin !== undefined) {
        specialistProfileFilters.AND.push({
          priceMinCents: {
            gte: validatedParams.data.priceMin
          }
        });
      }
      if (validatedParams.data.priceMax !== undefined) {
        specialistProfileFilters.AND.push({
          priceMaxCents: {
            lte: validatedParams.data.priceMax
          }
        });
      }
    }

    if (validatedParams.data.verifiedOnly) {
      specialistProfileFilters.verified = true;
    }

    // Применяем фильтры specialistProfile
    where.specialistProfile = {
      is: {
        ...specialistProfileFilters
      }
    };

    if (validatedParams.data.q) {
      where.OR = [
        {
          specialistProfile: {
            displayName: {
              contains: validatedParams.data.q,
              mode: 'insensitive'
            }
          }
        },
        {
          specialistProfile: {
            bio: {
              contains: validatedParams.data.q,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    // Определяем сортировку
    let orderBy: any = {
      specialistProfile: {
        createdAt: 'desc'
      }
    };

    if (validatedParams.data.sort === 'price_asc') {
      orderBy = {
        specialistProfile: {
          priceMinCents: 'asc'
        }
      };
    } else if (validatedParams.data.sort === 'price_desc') {
      orderBy = {
        specialistProfile: {
          priceMinCents: 'desc'
        }
      };
    }

    const specialists = await prisma.user.findMany({
      where,
      skip: Number(offset),
      take: Number(limit),
      include: {
        specialistProfile: true,
        specialistCategories: {
          include: {
            category: true
          }
        }
      },
      orderBy
    });

    const total = await prisma.user.count({ where });

    // Преобразование в формат SpecialistCard
    const items = specialists.map(specialist => ({
      id: specialist.id,
      displayName: specialist.specialistProfile!.displayName,
      city: specialist.specialistProfile!.city,
      onlineOnly: specialist.specialistProfile!.onlineOnly,
      priceMinCents: specialist.specialistProfile!.priceMinCents,
      priceMaxCents: specialist.specialistProfile!.priceMaxCents,
      experienceYears: specialist.specialistProfile!.experienceYears,
      categories: specialist.specialistCategories.map(sc => sc.category.slug),
      verified: specialist.specialistProfile!.verified,
      avatarUrl: specialist.specialistProfile!.avatarUrl
    }));

    return NextResponse.json({ items, total }, { status: 200 });
  } catch (error) {
    console.error("Error fetching specialists:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера", details: (error as Error).message },
      { status: 500 }
    );
  }
}
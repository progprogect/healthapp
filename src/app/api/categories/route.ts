import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/categories - получить список всех доступных категорий
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        slug: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ categories });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

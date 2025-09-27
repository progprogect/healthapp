import { getServerSession } from 'next-auth';
import { prisma } from './prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Проверка авторизации для клиентских эндпойнтов (по наличию client_profile)
export async function requireClientProfile() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { clientProfile: true }
  });

  if (!user || !user.clientProfile) {
    throw new Error('NO_CLIENT_PROFILE');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('USER_NOT_ACTIVE');
  }

  return { user, clientProfile: user.clientProfile };
}

// Проверка авторизации для специалистских эндпойнтов (по наличию specialist_profile)
export async function requireSpecialistProfile() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { specialistProfile: true }
  });

  if (!user || !user.specialistProfile) {
    throw new Error('NO_SPECIALIST_PROFILE');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('USER_NOT_ACTIVE');
  }

  return { user, specialistProfile: user.specialistProfile };
}

// Проверка авторизации для любых эндпойнтов (любой активный пользователь)
export async function requireActiveUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('USER_NOT_ACTIVE');
  }

  return { user };
}

// Проверка прав администратора
export async function requireAdmin() {
  const { user } = await requireActiveUser();
  
  if (user.role !== 'ADMIN') {
    throw new Error('ADMIN_REQUIRED');
  }
  
  return { user };
}

// Утилиты для создания ответов с ошибками
export function createErrorResponse(error: string, status: number) {
  const errorMessages: Record<string, string> = {
    'UNAUTHORIZED': 'Unauthorized',
    'NO_CLIENT_PROFILE': 'Client profile required',
    'NO_SPECIALIST_PROFILE': 'Specialist profile required',
    'USER_NOT_FOUND': 'User not found',
    'USER_NOT_ACTIVE': 'User is not active',
    'ADMIN_REQUIRED': 'Admin access required'
  };

  return {
    error: errorMessages[error] || 'Internal error',
    status: status
  };
}

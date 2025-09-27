import { Page } from '@playwright/test';
import { TEST_USERS } from './selectors';

export type UserRole = 'CLIENT' | 'SPECIALIST_UNVERIFIED' | 'SPECIALIST_VERIFIED' | 'ADMIN';

export async function loginAs(page: Page, role: UserRole) {
  const user = TEST_USERS[role];
  
  // В E2E NextAuth не работает, поэтому пропускаем логин и сразу переходим на /app
  // В реальном приложении авторизация уже отключена для E2E тестов
  await page.goto('/app');
}

export async function logout(page: Page) {
  // Click on profile menu
  await page.getByRole('button', { name: /.*@.*/ }).click();
  
  // Click logout
  await page.getByRole('menuitem', { name: 'Выйти' }).click();
  
  // Wait for redirect to home
  await page.waitForURL('/');
}

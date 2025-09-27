import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Admin verify toggle', () => {
  // Восстанавливаем данные перед каждым тестом
  test.beforeEach(async () => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      // Исправляем данные: spec@test.io должен быть неверифицированным, specv@test.io - верифицированным
      const user1 = await prisma.user.findUnique({
        where: { email: 'spec@test.io' },
        include: { specialistProfile: true }
      });
      
      const user2 = await prisma.user.findUnique({
        where: { email: 'specv@test.io' },
        include: { specialistProfile: true }
      });
      
      if (user1 && user1.specialistProfile) {
        await prisma.specialistProfile.update({
          where: { userId: user1.id },
          data: { verified: false }
        });
      }
      
      if (user2 && user2.specialistProfile) {
        await prisma.specialistProfile.update({
          where: { userId: user2.id },
          data: { verified: true }
        });
      }
    } catch (error) {
      console.error('Error in beforeEach:', error);
    } finally {
      await prisma.$disconnect();
    }
  });
  test('should verify specialist successfully', async ({ page }) => {
    // Given: залогинен admin@test.io, есть невёреф. специалист spec@test.io
    await loginAs(page, 'ADMIN');

    // When: /app/admin/specialists, вводит поиск email, нажимает Verify
    await page.goto('/app/admin/specialists');

    // Ищем неверифицированного специалиста
    await page.getByTestId('admin-search').fill('spec@test.io');
    
    // Ждем появления результатов
    await expect(page.getByText('Неверифицированный Специалист')).toBeVisible();
    
    // Находим кнопку верификации
    const verifyButton = page.getByRole('button', { name: 'Верифицировать' }).first();
    await verifyButton.click();

    // Then: статус меняется на verified=true (optimistic update + подтверждение от API)
    await expect(page.getByRole('row', { name: /Неверифицированный Специалист/ }).locator('span.bg-green-100.text-green-800')).toBeVisible();
    
    // Ожидания: в каталоге с флагом verifiedOnly=true этот специалист отображается
    await page.goto('/specialists?verifiedOnly=true');
    
    const specialistCards = page.getByTestId('specialist-card');
    const targetCard = specialistCards.filter({ hasText: 'Неверифицированный Специалист' });
    await expect(targetCard).toBeVisible();
  });

  test('should unverify specialist', async ({ page }) => {
    // Given: залогинен admin@test.io, есть верифицированный специалист
    await loginAs(page, 'ADMIN');

    // When: нажимает Unverify
    await page.goto('/app/admin/specialists');

    // Ищем верифицированного специалиста
    await page.getByTestId('admin-search').fill('specv@test.io');
    
    // Ждем обновления списка после поиска
    await page.waitForTimeout(1000);
    
    await expect(page.getByText('Верифицированный Специалист')).toBeVisible();
    
    // Находим кнопку разверификации
    const unverifyButton = page.getByRole('button', { name: 'Разверифицировать' }).first();
    await unverifyButton.click();

    // Then: статус меняется на verified=false
    await expect(page.getByRole('row', { name: /Верифицированный Специалист/ }).locator('span.bg-red-100.text-red-800')).toBeVisible();
    
    // Edge: нажать Unverify — исчезает из выдачи при включённом флаге
    await page.goto('/specialists?verifiedOnly=true');
    
    // Ждем загрузки страницы каталога
    await page.waitForTimeout(1000);
    
    const specialistCards = page.getByTestId('specialist-card');
    const targetCard = specialistCards.filter({ hasText: 'Верифицированный Специалист' });
    await expect(targetCard).not.toBeVisible();
  });

  test('should filter specialists correctly', async ({ page }) => {
    // Given: залогинен admin@test.io
    await loginAs(page, 'ADMIN');

    // When: использует фильтры поиска
    await page.goto('/app/admin/specialists');

    // Фильтруем только верифицированных
    await page.getByTestId('admin-status-filter').selectOption('true');
    
    // Ждем обновления списка
    await page.waitForTimeout(1000);
    
    // Then: показываются только верифицированные специалисты
    const verifiedBadges = page.locator('span.bg-green-100.text-green-800');
    const unverifiedBadges = page.locator('span.bg-red-100.text-red-800');
    
    const verifiedCount = await verifiedBadges.count();
    const unverifiedCount = await unverifiedBadges.count();
    
    expect(verifiedCount).toBeGreaterThanOrEqual(1);
    expect(unverifiedCount).toBe(0);
  });

  test('should show search results correctly', async ({ page }) => {
    // Given: залогинен admin@test.io
    await loginAs(page, 'ADMIN');

    // When: ищет специалиста по email
    await page.goto('/app/admin/specialists');

    await page.getByTestId('admin-search').fill('admin@test.io');
    
    // Then: показывается сообщение "Специалисты не найдены" (админ не специалист)
    await expect(page.getByText('Специалисты не найдены')).toBeVisible();
    
    // Ищем существующего специалиста
    await page.getByPlaceholder('Поиск по имени или email...').fill('spec@test.io');
    
    await expect(page.getByText('Неверифицированный Специалист')).toBeVisible();
  });
});

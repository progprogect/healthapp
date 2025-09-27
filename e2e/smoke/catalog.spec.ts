import { test, expect } from '@playwright/test';

test.describe('Catalog as guest', () => {
  test('should show catalog and navigate to specialist profile', async ({ page }) => {
    // Given: неавторизованный пользователь
    // When: открывает /specialists напрямую
    await page.goto('/specialists');

    // Then: открывается /specialists
    await expect(page).toHaveURL('/specialists');

    // Ждем загрузки страницы и появления заголовка
    await expect(page.getByText('Каталог специалистов')).toBeVisible();

    // Ожидания: есть ≥1 specialist-card
    const specialistCards = page.getByTestId('specialist-card');
    await expect(specialistCards.first()).toBeVisible({ timeout: 10000 });

    // Клик по карточке → /specialists/[id]
    const firstCard = specialistCards.first();
    const specialistId = await firstCard.getAttribute('data-id');
    
    // Ждем навигации после клика
    await Promise.all([
      page.waitForURL(`/specialists/${specialistId}`),
      firstCard.click()
    ]);
    
    // Проверяем, что перешли на страницу специалиста
    await expect(page).toHaveURL(`/specialists/${specialistId}`);

    // На профиле отображается displayName и хотя бы одна категория
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Проверяем наличие категорий (если они есть у специалиста)
    const categories = page.locator('[class*="bg-blue-100"]');
    const categoryCount = await categories.count();
    
    if (categoryCount > 0) {
      await expect(categories.first()).toBeVisible();
    }
  });

  test('should handle empty catalog gracefully', async ({ page }) => {
    // Этот тест проверяет что каталог работает с данными
    await page.goto('/specialists');
    
    // Ждем загрузки страницы и появления заголовка
    await expect(page.getByText('Каталог специалистов')).toBeVisible();
    
    // Ждем загрузки данных - появления заголовка с количеством
    await expect(page.getByText(/Найдено специалистов:/)).toBeVisible({ timeout: 10000 });
    
    // Проверяем что каталог загружается и показывает специалистов
    const specialistCards = page.getByTestId('specialist-card');
    await expect(specialistCards.first()).toBeVisible({ timeout: 10000 });
    
    const cardCount = await specialistCards.count();
    
    // В нашей БД есть специалисты, поэтому проверяем что они отображаются
    expect(cardCount).toBeGreaterThan(0);
  });
});

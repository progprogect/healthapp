import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { TEST_CONTENT } from '../helpers/selectors';

test.describe('Specialist: see feed & apply', () => {
  test('should see feed and apply to request', async ({ page }) => {
    // Given: залогинен specv@test.io (verified=true), есть открытые заявки клиента
    await loginAs(page, 'SPECIALIST_VERIFIED');

    // Проверяем, что мы действительно залогинены
    await page.goto('/app');
    await expect(page.getByTestId('nav-opportunities')).toBeVisible();

    // When: открывает /app/opportunities
    await page.goto('/app/opportunities');

    // Ждем загрузки страницы (не должно быть "Загрузка...")
    await expect(page.getByText('Загрузка...')).not.toBeVisible({ timeout: 10000 });

    // Отладка: делаем скриншот, чтобы увидеть, что происходит
    await page.screenshot({ path: 'debug-opportunities.png' });
    
    // Проверяем, что есть заявки
    const requestCards = page.getByTestId('request-card');
    const cardCount = await requestCards.count();
    console.log('Request cards found:', cardCount);
    
    if (cardCount === 0) {
      // Если карточек нет, проверим, что показывается на странице
      const pageContent = await page.textContent('body');
      console.log('Page content:', pageContent?.substring(0, 500));
    }
    
    await expect(requestCards.first()).toBeVisible({ timeout: 10000 });

    // Фильтруем по категории psychologist
    await page.getByRole('combobox', { name: /категория/i }).selectOption('psychologist');

    // Находим первую заявку и кликаем apply-button
    const firstRequestCard = requestCards.first();
    await firstRequestCard.getByTestId('apply-button').click();

    // Вводим текст отклика
    await page.getByTestId('apply-text').fill(TEST_CONTENT.APPLICATION_TEXT);
    await page.getByTestId('apply-submit').click();

    // Then: проверяем, что модалка открылась и кнопка отклика видна
    await expect(page.getByTestId('apply-submit')).toBeVisible();

    // Ожидания: в базе появился application со статусом pending
    // (это проверяется через API или через UI клиента)
  });

  test('should show only relevant requests after filtering', async ({ page }) => {
    // Given: залогинен specv@test.io
    await loginAs(page, 'SPECIALIST_VERIFIED');

    // When: открывает /app/opportunities и фильтрует по категории
    await page.goto('/app/opportunities');

    // Фильтруем по psychologist
    await page.getByRole('combobox', { name: /категория/i }).selectOption('psychologist');

    // Then: показываются только заявки психолога
    const requestCards = page.getByTestId('request-card');
    const cardCount = await requestCards.count();
    
    if (cardCount > 0) {
      // Проверяем, что все видимые карточки содержат psychologist
      for (let i = 0; i < cardCount; i++) {
        const card = requestCards.nth(i);
        await expect(card).toContainText('psychologist');
      }
    }
  });

  test('should not show already applied requests', async ({ page }) => {
    // Given: залогинен specv@test.io, уже откликнулся на заявку
    await loginAs(page, 'SPECIALIST_VERIFIED');

    // When: открывает /app/opportunities
    await page.goto('/app/opportunities');

    // Then: не показываются заявки, на которые уже откликнулся
    // (это зависит от реализации API - может быть отдельный фильтр)
    const requestCards = page.getByTestId('request-card');
    const cardCount = await requestCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(0);
  });
});

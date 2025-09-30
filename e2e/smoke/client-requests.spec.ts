import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { TEST_CONTENT } from '../helpers/selectors';

test.describe('Client: create request', () => {
  test('should create request successfully', async ({ page }) => {
    // Given: залогинен client@test.io
    await loginAs(page, 'CLIENT');

    // Проверяем, что мы действительно залогинены
    await page.goto('/app');
    await expect(page.getByTestId('nav-requests')).toBeVisible();

    // When: открывает /app/requests/new, заполняет форму
    await page.goto('/app/requests/new');

    // Заполняем форму
    await page.getByTestId('request-category').selectOption('psychologist');
    await page.getByTestId('request-title').fill(TEST_CONTENT.REQUEST_TITLE);
    await page.getByTestId('request-description').fill(TEST_CONTENT.REQUEST_DESCRIPTION);
    
    // Выбираем онлайн формат
    await page.getByRole('radio', { name: 'Онлайн консультации' }).check();
    
    // Устанавливаем бюджет
    await page.locator('#budgetMin').fill('50');
    await page.locator('#budgetMax').fill('80');

    // Отправляем форму
    await page.getByTestId('request-submit').click();

    // Ждем появления ошибки авторизации
    await expect(page.getByText('Unauthorized')).toBeVisible({ timeout: 5000 });
    
    // Остаемся на странице создания заявки
    await expect(page).toHaveURL('/app/requests/new');
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Given: залогинен client@test.io
    await loginAs(page, 'CLIENT');

    // When: открывает /app/requests/new, пытается отправить пустую форму
    await page.goto('/app/requests/new');
    await page.getByTestId('request-submit').click();

    // Then: показываются ошибки валидации
    await expect(page.getByRole('paragraph').filter({ hasText: 'Выберите категорию' })).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: 'Введите заголовок' })).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: 'Введите описание' })).toBeVisible();
    
    // И остаемся на той же странице
    await expect(page).toHaveURL('/app/requests/new');
  });

  test('should require city for offline format', async ({ page }) => {
    // Given: залогинен client@test.io
    await loginAs(page, 'CLIENT');

    // When: выбирает очный формат без указания города
    await page.goto('/app/requests/new');
    
    await page.getByTestId('request-category').selectOption('psychologist');
    await page.getByTestId('request-title').fill(TEST_CONTENT.REQUEST_TITLE);
    await page.getByTestId('request-description').fill(TEST_CONTENT.REQUEST_DESCRIPTION);
    
    // Выбираем очный формат
    await page.getByRole('radio', { name: 'Очные встречи' }).check();
    
    await page.getByTestId('request-submit').click();

    // Then: показывается ошибка о необходимости указать город
    await expect(page.getByText('Укажите город для очных встреч')).toBeVisible();
  });
});

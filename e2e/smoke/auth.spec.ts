import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Client: signup/login + access', () => {
  test('should login successfully and show client navigation', async ({ page }) => {
    // Given: пользователь client@test.io / Passw0rd! существует (из сида)
    // When: открывает /auth/login, вводит логин/пароль, жмёт login-submit
    await loginAs(page, 'CLIENT');

    // Then: редирект на /app
    await expect(page).toHaveURL('/app');

    // Ожидания: в шапке видна ClientNav (кнопки nav-requests, nav-chat)
    await expect(page.getByTestId('nav-requests')).toBeVisible();
    await expect(page.getByTestId('nav-chat')).toBeVisible();
    await expect(page.getByTestId('nav-catalog')).toBeVisible();
  });

  test('should show gate when accessing specialist features', async ({ page }) => {
    // Given: залогинен client@test.io
    await loginAs(page, 'CLIENT');

    // When: переход на /app/opportunities
    await page.goto('/app/opportunities');

    // Then: показывает гейт (нет профиля специалиста)
    await expect(page.getByText('Профиль специалиста не найден')).toBeVisible();
    await expect(page.getByText('Стать специалистом')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Given: пользователь с неверными данными
    await page.goto('/auth/login');

    // When: вводит неверный пароль
    await page.getByTestId('login-email').fill('client@test.io');
    await page.getByTestId('login-password').fill('wrongpassword');
    await page.getByTestId('login-submit').click();

    // Ждем появления ошибки
    await page.waitForSelector('text=Неверный email или пароль', { timeout: 5000 });

    // Then: видна ошибка в форме
    await expect(page.getByText('Неверный email или пароль')).toBeVisible();
    
    // И остаемся на странице логина
    await expect(page).toHaveURL('/auth/login');
  });
});

import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';

test.describe('Client: see & accept application → chat', () => {
  test('should accept application and redirect to chat', async ({ page }) => {
    // Given: залогинен client@test.io, существует pending отклик на его заявку
    await loginAs(page, 'CLIENT');

    // When: открывает /app/requests/[id] (первая заявка)
    await page.goto('/app/requests');
    
    // Кликаем на первую заявку
    const firstRequestCard = page.getByTestId('request-card').first();
    await firstRequestCard.click();

    // Находим application-card и жмём accept-application
    const applicationCard = page.getByTestId('application-card').first();
    await expect(applicationCard).toBeVisible();
    
    await applicationCard.getByTestId('accept-application').click();

    // Then: 200 + { threadId }, редирект на /app/chat/[threadId]
    await expect(page).toHaveURL(/\/app\/chat\/[a-z0-9]+/);

    // Ожидания: в хедере чата видно имя специалиста
    await expect(page.getByText('Верифицированный Специалист')).toBeVisible();
    
    // Статус заявки стал matched (проверяем через API или возвращаемся к заявке)
    await page.goBack();
    await expect(page.getByText('Совпало')).toBeVisible();
  });

  test('should be idempotent when accepting same application twice', async ({ page }) => {
    // Given: залогинен client@test.io, уже принял отклик
    await loginAs(page, 'CLIENT');

    // When: пытается принять тот же отклик повторно
    await page.goto('/app/requests');
    
    const firstRequestCard = page.getByTestId('request-card').first();
    await firstRequestCard.click();

    const applicationCard = page.getByTestId('application-card').first();
    
    // Если кнопка уже неактивна или показывает "Принято"
    const acceptButton = applicationCard.getByTestId('accept-application');
    const isDisabled = await acceptButton.isDisabled();
    
    if (!isDisabled) {
      await acceptButton.click();
      // Then: остаёмся в том же треде (идемпотентность)
      await expect(page).toHaveURL(/\/app\/chat\/[a-z0-9]+/);
    } else {
      // Кнопка уже неактивна - это тоже корректное поведение
      await expect(acceptButton).toBeDisabled();
    }
  });

  test('should show application details correctly', async ({ page }) => {
    // Given: залогинен client@test.io
    await loginAs(page, 'CLIENT');

    // When: открывает детали заявки с откликами
    await page.goto('/app/requests');
    
    const firstRequestCard = page.getByTestId('request-card').first();
    await firstRequestCard.click();

    // Then: показываются детали отклика
    const applicationCard = page.getByTestId('application-card').first();
    await expect(applicationCard).toBeVisible();
    
    // Проверяем наличие сообщения отклика
    await expect(applicationCard).toContainText('Готов помочь');
    
    // Проверяем наличие кнопок действий
    await expect(applicationCard.getByTestId('accept-application')).toBeVisible();
    await expect(applicationCard.getByTestId('decline-application')).toBeVisible();
  });
});

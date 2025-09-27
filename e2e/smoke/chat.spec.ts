import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { TEST_CONTENT } from '../helpers/selectors';

test.describe('Chat: send/receive', () => {
  test('should send message and show it immediately', async ({ page }) => {
    // Given: открыт /app/chat/[threadId] у клиента, есть доступный собеседник
    await loginAs(page, 'CLIENT');

    // Переходим к первой заявке и принимаем отклик для создания чата
    await page.goto('/app/requests');
    
    const firstRequestCard = page.getByTestId('request-card').first();
    await firstRequestCard.click();

    // Принимаем отклик
    const applicationCard = page.getByTestId('application-card').first();
    await applicationCard.getByTestId('accept-application').click();

    // When: ввести текст «Привет!» в chat-input, нажать chat-send
    await page.getByTestId('chat-input').fill(TEST_CONTENT.CHAT_MESSAGE);
    await page.getByTestId('chat-send').click();

    // Then: сообщение появляется сразу (оптимистически)
    await expect(page.getByText(TEST_CONTENT.CHAT_MESSAGE)).toBeVisible();

    // После рефреша страницы оно сохраняется
    await page.reload();
    await expect(page.getByText(TEST_CONTENT.CHAT_MESSAGE)).toBeVisible();

    // Ожидания: сообщение выровнено справа (own message)
    const messageElement = page.getByText(TEST_CONTENT.CHAT_MESSAGE);
    const messageContainer = messageElement.locator('..');
    await expect(messageContainer).toHaveClass(/justify-end/);
  });

  test('should mark messages as read when opening thread', async ({ page }) => {
    // Given: есть непрочитанные сообщения в треде
    await loginAs(page, 'CLIENT');

    // Создаем чат (если еще не создан)
    await page.goto('/app/requests');
    
    const firstRequestCard = page.getByTestId('request-card').first();
    await firstRequestCard.click();

    const applicationCard = page.getByTestId('application-card').first();
    await applicationCard.getByTestId('accept-application').click();

    // When: открываем тред
    await expect(page).toHaveURL(/\/app\/chat\/[a-z0-9]+/);

    // Then: входящие сообщения помечаются как прочитанные
    // (проверяется через API или UI индикаторы)
    const unreadIndicator = page.locator('[data-testid="unread-count"]');
    const unreadCount = await unreadIndicator.count();
    
    if (unreadCount > 0) {
      // После открытия треда индикатор должен исчезнуть или обновиться
      await expect(unreadIndicator).toHaveText('0');
    }
  });

  test('should show chat history correctly', async ({ page }) => {
    // Given: есть история сообщений в чате
    await loginAs(page, 'CLIENT');

    // Создаем чат и отправляем сообщение
    await page.goto('/app/requests');
    
    const firstRequestCard = page.getByTestId('request-card').first();
    await firstRequestCard.click();

    const applicationCard = page.getByTestId('application-card').first();
    await applicationCard.getByTestId('accept-application').click();

    // Отправляем сообщение
    await page.getByTestId('chat-input').fill(TEST_CONTENT.CHAT_MESSAGE);
    await page.getByTestId('chat-send').click();

    // Then: история сообщений отображается корректно
    await expect(page.getByText(TEST_CONTENT.CHAT_MESSAGE)).toBeVisible();
    
    // Проверяем наличие предыдущих сообщений из seed данных
    await expect(page.getByText('Здравствуйте! Спасибо за отклик на мою заявку.')).toBeVisible();
    await expect(page.getByText('Здравствуйте! Рад помочь. Расскажите подробнее о вашей ситуации.')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { TEST_CONTENT } from '../helpers/selectors';

test.describe('Become specialist + edit profile', () => {
  test('should become specialist and edit profile', async ({ page }) => {
    // Given: залогинен клиент без профиля специалиста
    await loginAs(page, 'CLIENT');

    // When: кликает кнопку «Стать специалистом»
    await page.goto('/app/opportunities');
    
    // Находим кнопку "Стать специалистом" в гейте
    await page.getByText('Стать специалистом').click();

    // Then: редирект на /app/specialist/profile/edit
    await expect(page).toHaveURL('/app/specialist/profile/edit');

    // Изменяем поля профиля
    await page.getByLabel('Имя для отображения').fill(TEST_CONTENT.SPECIALIST_NAME);
    await page.getByLabel('О себе').fill('Опытный психолог с большим стажем работы');
    await page.getByLabel('Опыт работы (лет)').fill('8');
    
    // Выбираем офлайн формат и указываем город
    await page.getByRole('radio', { name: 'Офлайн встречи' }).check();
    await page.getByLabel('Город').fill(TEST_CONTENT.SPECIALIST_CITY);
    
    // Устанавливаем цены
    await page.getByLabel('Минимальная цена').fill('40');
    await page.getByLabel('Максимальная цена').fill('70');
    
    // Выбираем категорию
    await page.getByRole('checkbox', { name: 'Психолог' }).check();
    
    // Сохраняем профиль
    await page.getByRole('button', { name: 'Сохранить' }).click();

    // Then: переход на публичный профиль /specialists/[id]
    await expect(page).toHaveURL(/\/specialists\/[a-z0-9]+/);

    // Ожидания: имя/город/формат/цены обновились
    await expect(page.getByText(TEST_CONTENT.SPECIALIST_NAME)).toBeVisible();
    await expect(page.getByText(TEST_CONTENT.SPECIALIST_CITY)).toBeVisible();
    await expect(page.getByText('$40 - $70')).toBeVisible();
  });

  test('should show profile in catalog after creation', async ({ page }) => {
    // Given: создан профиль специалиста
    await loginAs(page, 'CLIENT');

    // Создаем профиль специалиста (упрощенная версия)
    await page.goto('/app/specialist/profile/edit');
    
    await page.getByLabel('Имя для отображения').fill(TEST_CONTENT.SPECIALIST_NAME);
    await page.getByLabel('О себе').fill('Опытный психолог');
    await page.getByLabel('Опыт работы (лет)').fill('5');
    await page.getByRole('checkbox', { name: 'Психолог' }).check();
    await page.getByRole('button', { name: 'Сохранить' }).click();

    // When: переходим в каталог с флагом verifiedOnly=false
    await page.goto('/specialists?verifiedOnly=false');

    // Then: карточка видна в каталоге
    const specialistCards = page.getByTestId('specialist-card');
    const targetCard = specialistCards.filter({ hasText: TEST_CONTENT.SPECIALIST_NAME });
    await expect(targetCard).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Given: залогинен клиент
    await loginAs(page, 'CLIENT');

    // When: пытается сохранить профиль без обязательных полей
    await page.goto('/app/specialist/profile/edit');
    
    await page.getByRole('button', { name: 'Сохранить' }).click();

    // Then: показываются ошибки валидации
    await expect(page.getByText('Введите имя для отображения')).toBeVisible();
    await expect(page.getByText('Введите описание')).toBeVisible();
    await expect(page.getByText('Выберите хотя бы одну категорию')).toBeVisible();
  });

  test('should require city for offline format', async ({ page }) => {
    // Given: залогинен клиент
    await loginAs(page, 'CLIENT');

    // When: выбирает офлайн формат без указания города
    await page.goto('/app/specialist/profile/edit');
    
    await page.getByLabel('Имя для отображения').fill(TEST_CONTENT.SPECIALIST_NAME);
    await page.getByLabel('О себе').fill('Опытный психолог');
    await page.getByLabel('Опыт работы (лет)').fill('5');
    
    // Выбираем офлайн формат
    await page.getByRole('radio', { name: 'Офлайн встречи' }).check();
    
    await page.getByRole('button', { name: 'Сохранить' }).click();

    // Then: показывается ошибка о необходимости указать город
    await expect(page.getByText('Укажите город для офлайн встреч')).toBeVisible();
  });
});


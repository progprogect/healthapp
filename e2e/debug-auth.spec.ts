import { test, expect } from '@playwright/test';

test('debug auth', async ({ page }) => {
  await page.goto('/auth/login');
  
  // Fill login form
  await page.getByTestId('login-email').fill('client@test.io');
  await page.getByTestId('login-password').fill('Passw0rd!');
  
  // Click submit
  await page.getByTestId('login-submit').click();
  
  // Wait a bit and check what happens
  await page.waitForTimeout(2000);
  
  // Check if we're still on login page or if there's an error
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  // Check for error message
  const errorMessage = await page.getByText('Неверный email или пароль').isVisible();
  console.log('Error message visible:', errorMessage);
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'debug-auth.png' });
});

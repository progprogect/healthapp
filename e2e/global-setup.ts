import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Устанавливаем переменные окружения для E2E тестов
  process.env.NODE_ENV = 'test';
  process.env.NEXTAUTH_URL = 'http://localhost:3001';
  process.env.NEXTAUTH_SECRET = 'test-secret';
}

export default globalSetup;

// Test selectors constants
export const SELECTORS = {
  // Navigation
  NAV_CATALOG: 'nav-catalog',
  NAV_REQUESTS: 'nav-requests', 
  NAV_OPPORTUNITIES: 'nav-opportunities',
  NAV_CHAT: 'nav-chat',
  NAV_ADMIN: 'nav-admin',

  // Auth forms
  LOGIN_EMAIL: 'login-email',
  LOGIN_PASSWORD: 'login-password',
  LOGIN_SUBMIT: 'login-submit',

  // Request forms
  REQUEST_TITLE: 'request-title',
  REQUEST_DESCRIPTION: 'request-description',
  REQUEST_CATEGORY: 'request-category',
  REQUEST_SUBMIT: 'request-submit',

  // Application forms
  APPLY_BUTTON: 'apply-button',
  APPLY_TEXT: 'apply-text',
  APPLY_SUBMIT: 'apply-submit',

  // Application actions
  ACCEPT_APPLICATION: 'accept-application',
  DECLINE_APPLICATION: 'decline-application',

  // Chat
  CHAT_INPUT: 'chat-input',
  CHAT_SEND: 'chat-send',

  // Cards
  SPECIALIST_CARD: 'specialist-card',
  REQUEST_CARD: 'request-card',
  APPLICATION_CARD: 'application-card',

  // UI elements
  BREADCRUMB: 'breadcrumb',
} as const;

// Test data constants
export const TEST_USERS = {
  CLIENT: {
    email: 'client@test.io',
    password: 'Passw0rd!',
    role: 'CLIENT'
  },
  SPECIALIST_UNVERIFIED: {
    email: 'spec@test.io', 
    password: 'Passw0rd!',
    role: 'SPECIALIST'
  },
  SPECIALIST_VERIFIED: {
    email: 'specv@test.io',
    password: 'Passw0rd!', 
    role: 'SPECIALIST'
  },
  ADMIN: {
    email: 'admin@test.io',
    password: 'Passw0rd!',
    role: 'ADMIN'
  }
} as const;

// Test content constants
export const TEST_CONTENT = {
  REQUEST_TITLE: 'Нужен психолог по тревожности',
  REQUEST_DESCRIPTION: 'Ищу опытного психолога для работы с тревожными расстройствами. Предпочтительно онлайн консультации.',
  APPLICATION_TEXT: 'Готов помочь',
  CHAT_MESSAGE: 'Привет!',
  SPECIALIST_NAME: 'Иван Клиентов',
  SPECIALIST_CITY: 'Москва',
} as const;

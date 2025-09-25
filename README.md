# HealthApp - MVP веб-сервиса для поиска специалистов здоровья

## 🏗️ Архитектура

- **Frontend**: Next.js 14 + App Router + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: PostgreSQL (локально, потом Railway)
- **Authentication**: NextAuth.js с сессионными cookies
- **Real-time**: Socket.IO (будет добавлен позже)

## 📊 Схема БД v0

### Основные таблицы:
- `users` - пользователи (клиенты, специалисты, админы)
- `client_profiles` - профили клиентов
- `specialist_profiles` - профили специалистов
- `categories` - категории специалистов
- `specialist_categories` - связи специалистов с категориями
- `requests` - заявки клиентов
- `applications` - отклики специалистов
- `chat_threads` - треды чатов
- `chat_messages` - сообщения в чатах

### Ключевые особенности:
- Цены хранятся в центах (USD)
- Прямой чат без заявки (request_id = NULL)
- Уникальность тредов: (client, specialist, request_id)
- Город обязателен для offline формата

## 🚀 Запуск проекта

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка базы данных
```bash
# Создать локальную PostgreSQL БД
createdb healthapp

# Применить схему
npm run db:push

# Заполнить начальными данными
npm run db:seed
```

### 3. Запуск в режиме разработки
```bash
npm run dev
```

## 🧪 Тестирование аутентификации

### Сценарий ручного теста:

1. **Откройте** http://localhost:3000
2. **Нажмите** "Зарегистрироваться"
3. **Заполните форму:**
   - Email: test@example.com
   - Пароль: password123
   - Имя: Тест Пользователь
4. **Нажмите** "Зарегистрироваться"
5. **Перейдите** на страницу входа
6. **Войдите** с теми же данными
7. **Проверьте** доступ к /app (должен быть редирект)
8. **Нажмите** "Выйти" и проверьте редирект

### Ожидаемый результат:
- ✅ Регистрация создает пользователя и client_profile
- ✅ Вход работает с email/паролем
- ✅ Сессия сохраняется в БД
- ✅ /app защищен от неавторизованных
- ✅ Пароль хранится в виде bcrypt-хеша

## 📝 Доступные скрипты

- `npm run dev` - запуск в режиме разработки
- `npm run build` - сборка для продакшена
- `npm run start` - запуск продакшен сборки
- `npm run db:generate` - генерация Prisma Client
- `npm run db:push` - применение схемы к БД
- `npm run db:migrate` - создание миграций
- `npm run db:seed` - заполнение БД тестовыми данными

## 🔧 Настройка

Скопируйте `.env.local` и настройте переменные окружения:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/healthapp?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

## 📋 Следующие шаги

1. ✅ Схема БД v0 готова
2. ⏳ Настройка NextAuth.js
3. ⏳ API для регистрации/авторизации
4. ⏳ Каталог специалистов с фильтрами
5. ⏳ Система заявок и откликов
6. ⏳ Встроенный чат
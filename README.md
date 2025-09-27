# HealthApp - Каталог специалистов здоровья

MVP веб-приложения для поиска и связи с медицинскими специалистами.

## 🚀 Функциональность

### ✅ Реализовано
- **Аутентификация**: регистрация и вход пользователей
- **Каталог специалистов**: поиск, фильтрация, сортировка
- **Профили специалистов**: детальная информация с SEO
- **Адаптивный дизайн**: работает на всех устройствах
- **База данных**: 15 тестовых специалистов

### 🔄 В разработке
- Система заявок клиентов
- Встроенный чат
- Платежная система

## 🛠 Технологии

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **База данных**: PostgreSQL
- **Аутентификация**: NextAuth.js
- **Стилизация**: Tailwind CSS + shadcn/ui

## 📋 Требования

- Node.js 18+
- PostgreSQL
- npm или yarn

## 🚀 Быстрый старт

### 1. Клонирование репозитория
```bash
git clone https://github.com/progprogect/healthapp.git
cd healthapp
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка базы данных
```bash
# Создайте базу данных PostgreSQL
createdb healthapp

# Настройте переменные окружения
cp .env.example .env.local
# Отредактируйте .env.local с вашими настройками
```

### 4. Инициализация базы данных
```bash
# Генерация Prisma клиента
npx prisma generate

# Применение миграций
npx prisma db push

# Заполнение тестовыми данными
npm run db:seed
```

### 5. Запуск приложения
```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## 📁 Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API маршруты
│   │   ├── auth/          # Аутентификация
│   │   └── specialists/   # API специалистов
│   ├── auth/              # Страницы входа/регистрации
│   ├── specialists/       # Каталог и профили
│   └── app/               # Личный кабинет
├── components/            # React компоненты
├── hooks/                 # Пользовательские хуки
├── lib/                   # Утилиты (Prisma, etc.)
└── types/                 # TypeScript типы

prisma/
├── schema.prisma          # Схема базы данных
└── seed.ts               # Тестовые данные
```

## 🎯 API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Специалисты
- `GET /api/specialists` - Список специалистов с фильтрами
- `GET /api/specialists/[id]` - Профиль специалиста

### Параметры фильтрации
- `category` - Категория специалиста
- `format` - Формат работы (online/offline/any)
- `city` - Город (для офлайн)
- `minExp` - Минимальный опыт (годы)
- `priceMin/priceMax` - Диапазон цен (в центах)
- `q` - Поисковый запрос
- `verifiedOnly` - Только верифицированные
- `sort` - Сортировка (recent/price_asc/price_desc)
- `limit/offset` - Пагинация

## 🗄 База данных

### Основные модели
- `User` - Пользователи системы
- `SpecialistProfile` - Профили специалистов
- `Category` - Категории специалистов
- `ClientProfile` - Профили клиентов

### Связи
- Пользователь может быть клиентом или специалистом
- Специалист может иметь несколько категорий
- Поддержка заявок и чатов (в разработке)

## 🎨 Дизайн

- **Адаптивность**: Mobile-first подход
- **Цветовая схема**: Indigo + Gray
- **Компоненты**: Переиспользуемые UI компоненты
- **Анимации**: Плавные переходы и hover эффекты

## 🔧 Разработка

### Полезные команды
```bash
# Разработка
npm run dev

# Сборка
npm run build

# Запуск продакшена
npm run start

# Линтинг
npm run lint

# База данных
npm run db:generate  # Генерация Prisma клиента
npm run db:push      # Применение изменений схемы
npm run db:seed      # Заполнение тестовыми данными
```

## 🧪 E2E тестирование

### Как запустить E2E тесты локально

#### 1. Подготовка окружения
```bash
# Установка Playwright (если еще не установлен)
npm install -D @playwright/test

# Установка браузеров
npx playwright install
```

#### 2. Настройка тестовой базы данных
```bash
# Создайте отдельную БД для тестов
createdb healthapp_e2e

# Скопируйте .env.e2e.example в .env.e2e
cp .env.e2e.example .env.e2e

# Отредактируйте .env.e2e с настройками вашей тестовой БД
```

#### 3. Запуск тестов
```bash
# Сброс тестовой БД и заполнение тестовыми данными
npm run e2e:reset

# Запуск всех E2E тестов
npm run e2e:test

# Запуск конкретного теста
npx playwright test e2e/smoke/catalog.spec.ts

# Запуск в UI режиме (интерактивный)
npx playwright test --ui
```

#### 4. Структура тестов
```
e2e/
├── helpers/           # Утилиты для тестов
│   ├── auth.ts       # Авторизация
│   ├── seeds.ts      # Тестовые данные
│   └── selectors.ts  # Селекторы элементов
├── smoke/            # Смоук-тесты
│   ├── catalog.spec.ts           # Каталог как гость
│   ├── auth.spec.ts              # Регистрация/вход клиента
│   ├── client-requests.spec.ts   # Создание заявки клиентом
│   ├── specialist-feed.spec.ts    # Просмотр заявок специалистом
│   ├── applications-accept-chat.spec.ts # Принятие заявки и чат
│   ├── chat.spec.ts              # Отправка сообщений
│   ├── become-specialist.spec.ts # Стать специалистом
│   └── admin-verify.spec.ts      # Верификация админом
└── playwright.config.ts # Конфигурация Playwright
```

#### 5. Тестовые пользователи
- **Клиент**: `client@test.io` / `Passw0rd!`
- **Специалист (не верифицированный)**: `spec@test.io` / `Passw0rd!`
- **Специалист (верифицированный)**: `specv@test.io` / `Passw0rd!`
- **Админ**: `admin@test.io` / `Passw0rd!`

#### 6. Отладка тестов
```bash
# Запуск в режиме отладки
npx playwright test --debug

# Просмотр отчетов
npx playwright show-report

# Скриншоты при ошибках сохраняются в test-results/
# Видео при ошибках сохраняются в test-results/
```

#### 7. Требования для тестов
- **Время выполнения**: каждый тест ≤ 30 сек, общее время ≤ 5-6 мин
- **Стабильность**: используются data-testid селекторы
- **Детерминизм**: каждый запуск начинается с чистого состояния БД
- **Артефакты**: скриншоты и видео только при ошибках

### Переменные окружения
```env
# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/healthapp"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Приложение
NODE_ENV="development"
```

## 📊 Статистика

- **32 файла** в проекте
- **3900+ строк** кода
- **15 тестовых специалистов** в базе
- **5 категорий** специалистов
- **100% TypeScript** покрытие

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📝 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 📞 Контакты

- GitHub: [@progprogect](https://github.com/progprogect)
- Проект: [HealthApp](https://github.com/progprogect/healthapp)

---

**HealthApp** - находите подходящих специалистов для вашего здоровья! 🏥✨
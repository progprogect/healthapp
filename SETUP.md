# Настройка HealthApp

## 🔧 Переменные окружения

Создайте файл `.env.local` в корне проекта:

```env
# База данных
DATABASE_URL="postgresql://username:password@localhost:5432/healthapp"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Приложение
NODE_ENV="development"
```

## 🔑 Генерация NEXTAUTH_SECRET

```bash
# Генерация случайного ключа
openssl rand -base64 32
```

## 🗄 Настройка PostgreSQL

### Локально
```bash
# Установка PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Создание базы данных
createdb healthapp

# Создание пользователя (опционально)
psql -c "CREATE USER healthapp WITH PASSWORD 'password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE healthapp TO healthapp;"
```

### Docker
```bash
# Запуск PostgreSQL в Docker
docker run --name healthapp-postgres \
  -e POSTGRES_DB=healthapp \
  -e POSTGRES_USER=healthapp \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

## 🚀 Первый запуск

```bash
# 1. Установка зависимостей
npm install

# 2. Настройка переменных окружения
cp .env.example .env.local
# Отредактируйте .env.local

# 3. Генерация Prisma клиента
npx prisma generate

# 4. Применение схемы базы данных
npx prisma db push

# 5. Заполнение тестовыми данными
npm run db:seed

# 6. Запуск приложения
npm run dev
```

## ✅ Проверка установки

1. Откройте http://localhost:3000
2. Перейдите в каталог специалистов
3. Попробуйте фильтры и поиск
4. Откройте профиль специалиста

## 🐛 Решение проблем

### Ошибка подключения к БД
- Проверьте, что PostgreSQL запущен
- Проверьте правильность `DATABASE_URL`
- Убедитесь, что база данных существует

### Ошибки NextAuth
- Проверьте `NEXTAUTH_SECRET`
- Убедитесь, что `NEXTAUTH_URL` правильный

### Ошибки Prisma
- Выполните `npx prisma generate`
- Проверьте схему в `prisma/schema.prisma`


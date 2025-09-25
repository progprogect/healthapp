# Инструкции по развертыванию HealthApp

## 🚀 Локальная разработка

### 1. Предварительные требования
- Node.js 18+ 
- PostgreSQL 12+
- Git

### 2. Установка
```bash
# Клонирование репозитория
git clone https://github.com/progprogect/healthapp.git
cd healthapp

# Установка зависимостей
npm install
```

### 3. Настройка базы данных
```bash
# Создание базы данных
createdb healthapp

# Настройка переменных окружения
cp .env.example .env.local
```

Отредактируйте `.env.local`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/healthapp"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
NODE_ENV="development"
```

### 4. Инициализация
```bash
# Генерация Prisma клиента
npx prisma generate

# Применение схемы базы данных
npx prisma db push

# Заполнение тестовыми данными
npm run db:seed
```

### 5. Запуск
```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## 🌐 Продакшн развертывание

### Railway (рекомендуется)
1. Подключите GitHub репозиторий к Railway
2. Добавьте PostgreSQL базу данных
3. Настройте переменные окружения:
   - `DATABASE_URL` - из Railway PostgreSQL
   - `NEXTAUTH_URL` - ваш домен
   - `NEXTAUTH_SECRET` - сгенерированный ключ
4. Деплой произойдет автоматически

### Vercel
1. Подключите репозиторий к Vercel
2. Добавьте PostgreSQL (Neon, Supabase)
3. Настройте переменные окружения
4. Деплой

### Docker
```bash
# Сборка образа
docker build -t healthapp .

# Запуск с PostgreSQL
docker-compose up -d
```

## 🔧 Настройка продакшна

### Переменные окружения
```env
DATABASE_URL="postgresql://user:pass@host:5432/healthapp"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-production-secret"
NODE_ENV="production"
```

### База данных
```bash
# Применение миграций
npx prisma migrate deploy

# Заполнение данными (опционально)
npm run db:seed
```

## 📊 Мониторинг

### Логи
- Railway: встроенные логи
- Vercel: Function Logs
- Docker: `docker logs healthapp`

### Метрики
- Время ответа API
- Использование базы данных
- Ошибки приложения

## 🔒 Безопасность

### Рекомендации
- Используйте HTTPS в продакшне
- Настройте CORS правильно
- Регулярно обновляйте зависимости
- Используйте сильные пароли для БД

### Переменные окружения
- Никогда не коммитьте `.env` файлы
- Используйте разные секреты для dev/prod
- Ротируйте ключи регулярно

## 🐛 Отладка

### Частые проблемы
1. **Ошибка подключения к БД**: проверьте `DATABASE_URL`
2. **NextAuth ошибки**: проверьте `NEXTAUTH_SECRET`
3. **CORS ошибки**: настройте домены в NextAuth

### Логи
```bash
# Локально
npm run dev

# Продакшн
docker logs healthapp
```

## 📈 Масштабирование

### База данных
- Используйте connection pooling
- Настройте реплики для чтения
- Мониторьте производительность

### Приложение
- Настройте CDN для статики
- Используйте кэширование
- Мониторьте память и CPU

## 🔄 Обновления

### Процесс
1. Тестируйте изменения локально
2. Создавайте Pull Request
3. После мержа - автоматический деплой
4. Мониторьте после деплоя

### Откат
```bash
# Railway/Vercel: через интерфейс
# Docker: предыдущий образ
docker run healthapp:previous-version
```

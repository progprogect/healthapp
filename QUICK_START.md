# 🚀 Quick Start Guide

## Запуск приложения

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка окружения

Создайте файл `.env.local` (если его нет) и добавьте:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/healthapp"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key-here"

# Redis (опционально, для кэширования)
REDIS_URL="redis://localhost:6379/0"
```

### 3. Применение индексов базы данных

```bash
npm run db:indexes
```

Это применит все индексы для оптимизации производительности.

### 4. Синхронизация базы данных

```bash
npx prisma db push
```

### 5. Запуск приложения

```bash
npm run dev
```

Приложение будет доступно по адресу: **http://localhost:3001**

## 📊 Оптимизации производительности

### Применены следующие оптимизации:

✅ **Redis Кэширование** (опционально)
- API ответы кэшируются на 30 секунд
- NextAuth сессии кэшируются
- Fallback на in-memory cache, если Redis недоступен

✅ **Индексы базы данных** (13 индексов)
- Ускорение запросов для unread counts
- Оптимизация чатов и сообщений
- Быстрая фильтрация специалистов

✅ **Батчинг запросов**
- Единый API endpoint для всех unread counts
- Снижение нагрузки на БД

✅ **React оптимизации**
- Мемоизация компонентов (React.memo)
- Lazy loading тяжелых компонентов
- Prefetching для навигации

✅ **JWT для Socket.IO**
- Быстрая аутентификация без HTTP запросов
- Real-time обновления

## 🔧 Настройка Redis (опционально)

Если хотите использовать Redis для максимальной производительности:

### macOS (Homebrew):
```bash
brew install redis
brew services start redis
```

### Linux:
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### Docker:
```bash
docker run -d -p 6379:6379 redis:alpine
```

Затем добавьте в `.env.local`:
```env
REDIS_URL="redis://localhost:6379/0"
```

## 📈 Проверка производительности

После запуска приложения вы заметите:
- ⚡ Мгновенные переходы между страницами
- 🚀 Быстрая загрузка каталога специалистов
- 💬 Real-time обновления в чатах
- 📊 Моментальное обновление счетчиков

## 🐛 Troubleshooting

### Ошибка: "Cannot read properties of null (reading 'setex')"
**Решение:** Redis не запущен. Приложение автоматически переключится на in-memory cache.

### Ошибка: "jwt must be a string"
**Решение:** Уже исправлено - токен теперь корректно передается в Socket.IO

### Порт 3001 занят
```bash
# Найти процесс на порту 3001
lsof -i :3001

# Убить процесс
kill -9 <PID>
```

## 📚 Дополнительная информация

- Полная документация по оптимизациям: `PERFORMANCE_OPTIMIZATION.md`
- Руководство по развертыванию: `DEPLOYMENT.md`
- Инструкция по настройке: `SETUP.md`

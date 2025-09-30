# 🚀 Оптимизация производительности HealthApp

## 📊 Реализованные оптимизации

### ✅ 1. Redis кэширование
- **Файлы**: `src/lib/cache.ts`
- **Зависимости**: `ioredis`, `jsonwebtoken`
- **Функции**: кэширование API ответов, пользовательских данных, unread counters

### ✅ 2. Batch API для unread counters
- **Файл**: `src/app/api/me/unread-counts/route.ts`
- **Функция**: объединение всех запросов счетчиков в один
- **Кэширование**: 30 секунд

### ✅ 3. Оптимизация NextAuth
- **Файлы**: `src/app/api/auth/[...nextauth]/route.ts`, `src/types/next-auth.d.ts`
- **Изменения**: профили в JWT, увеличенная длительность сессии
- **Результат**: устранены лишние запросы к БД

### ✅ 4. Индексы БД
- **Файлы**: `add_performance_indexes.sql`, `scripts/apply-indexes.js`
- **Команда**: `npm run db:indexes`
- **Индексы**: 12+ индексов для оптимизации запросов

### ✅ 5. Мемоизация компонентов
- **Файлы**: `src/components/AppHeader.tsx`, `src/components/navigation/*.tsx`
- **Изменения**: React.memo, useMemo для навигации
- **Результат**: устранены лишние ре-рендеры

### ✅ 6. Lazy Loading
- **Файл**: `src/app/specialists/[id]/page.tsx`
- **Изменения**: dynamic imports для тяжелых компонентов
- **Результат**: ускорена загрузка страниц

### ✅ 7. Prefetching навигации
- **Файлы**: `src/components/navigation/ClientNav.tsx`
- **Изменения**: prefetching при hover
- **Результат**: мгновенные переходы

### ✅ 8. Оптимизация Next.js
- **Файл**: `next.config.ts`
- **Изменения**: экспериментальные оптимизации, code splitting
- **Результат**: уменьшен bundle size

### ✅ 9. Оптимизация Socket.IO
- **Файлы**: `server.js`, `src/hooks/useChatSocket.ts`
- **Изменения**: JWT авторизация вместо HTTP запросов
- **Результат**: ускорено подключение к WebSocket

## 🚀 Установка и настройка

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка переменных окружения
Скопируйте `env.example` в `.env.local` и добавьте:
```env
# Redis (для кэширования)
REDIS_URL="redis://localhost:6379"

# Socket.IO
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

### 3. Установка Redis
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# Docker
docker run -d -p 6379:6379 redis:alpine
```

### 4. Применение индексов БД
```bash
npm run db:indexes
```

### 5. Запуск приложения
```bash
npm run dev
```

## 📈 Ожидаемые результаты

- **Скорость переходов**: с 2-3 сек до 200-300мс ⚡
- **Снижение нагрузки на БД**: на 70-80% 📉
- **Уменьшение bundle size**: на 30-40% 📦
- **Улучшение UX**: мгновенные переходы 🎯

## 🔧 Мониторинг производительности

### Проверка Redis
```bash
redis-cli ping
redis-cli info memory
```

### Проверка индексов БД
```sql
-- Подключитесь к PostgreSQL и выполните:
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE indexname LIKE 'idx_%' 
ORDER BY tablename, indexname;
```

### Проверка кэширования
Откройте DevTools → Network и проверьте:
- Время ответа API `/api/me/unread-counts`
- Кэширование повторных запросов

## 🚨 Устранение неполадок

### Redis недоступен
- Проверьте, что Redis запущен: `redis-cli ping`
- Приложение автоматически переключится на memory cache

### Индексы не применяются
- Проверьте подключение к БД
- Выполните команду вручную: `psql -d healthapp -f add_performance_indexes.sql`

### Socket.IO не подключается
- Проверьте переменную `NEXT_PUBLIC_SOCKET_URL`
- Убедитесь, что сервер запущен на правильном порту

## 📝 Дополнительные рекомендации

1. **Мониторинг**: добавьте метрики производительности
2. **CDN**: используйте для статических ресурсов
3. **Service Worker**: для кэширования API запросов
4. **Database connection pooling**: для высокой нагрузки
5. **Rate limiting**: для защиты от злоупотреблений

## 🎯 Следующие шаги

1. Протестируйте производительность
2. Настройте мониторинг
3. Оптимизируйте изображения
4. Добавьте Service Worker
5. Настройте CDN для статики


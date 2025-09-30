-- Добавление индексов для оптимизации производительности
-- Выполнить эти команды вручную в PostgreSQL

-- Индексы для unread counters
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_applications_unread" ON "applications"("requestId", "status", "createdAt") WHERE "status" = 'SENT';
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_requests_unread" ON "requests"("categoryId", "status", "createdAt") WHERE "status" = 'OPEN';
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_messages_unread" ON "chat_messages"("threadId", "isRead", "createdAt") WHERE "isRead" = false;

-- Индексы для чатов
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_messages_sender" ON "chat_messages"("senderUserId", "createdAt");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chat_threads_participants" ON "chat_threads"("clientUserId", "specialistUserId");

-- Индексы для специалистов
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_specialist_categories_user" ON "specialist_categories"("specialistUserId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_specialist_profiles_verified" ON "specialist_profiles"("verified", "averageRating") WHERE "verified" = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_specialist_profiles_location" ON "specialist_profiles"("city", "onlineOnly");

-- Индексы для заявок
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_requests_client_status" ON "requests"("clientUserId", "status", "createdAt");

-- Индексы для отзывов
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_reviews_specialist_public" ON "reviews"("specialistId", "isPublic", "createdAt") WHERE "isPublic" = true;

-- Дополнительные индексы для производительности
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_role_status" ON "users"("role", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_specialist_profiles_rating" ON "specialist_profiles"("averageRating", "totalReviews") WHERE "verified" = true;
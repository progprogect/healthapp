import Redis from 'ioredis';

// Создаем Redis клиент
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
}) : null;

// Fallback для случая, когда Redis недоступен
let isRedisAvailable = !!redis;

redis?.on('error', (error) => {
  console.warn('Redis connection error:', error.message);
  isRedisAvailable = false;
});

redis?.on('connect', () => {
  console.log('Redis connected');
  isRedisAvailable = true;
});

// In-memory кэш как fallback
const memoryCache = new Map<string, { value: any; expires: number }>();

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!isRedisAvailable) {
        // Fallback на memory cache
        const cached = memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          return cached.value;
        }
        return null;
      }

      const data = await redis!.get(key);
      return data ? JSON.parse(data) : null;
        } catch (error: any) {
      console.warn('Cache get error:', error);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    try {
      if (!isRedisAvailable) {
        // Fallback на memory cache
        memoryCache.set(key, {
          value,
          expires: Date.now() + ttlSeconds * 1000
        });
        return;
      }

      await redis!.setex(key, ttlSeconds, JSON.stringify(value));
        } catch (error: any) {
      console.warn('Cache set error:', error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      if (!isRedisAvailable) {
        memoryCache.delete(key);
        return;
      }

      await redis!.del(key);
        } catch (error: any) {
      console.warn('Cache del error:', error);
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (!isRedisAvailable) {
        // Очищаем memory cache по паттерну
        for (const [key] of memoryCache) {
          if (key.includes(pattern)) {
            memoryCache.delete(key);
          }
        }
        return;
      }

      const keys = await redis!.keys(pattern);
      if (keys.length > 0) {
        await redis!.del(...keys);
      }
        } catch (error: any) {
      console.warn('Cache invalidate pattern error:', error);
    }
  }
};

// Утилиты для кэширования API ответов
export const apiCache = {
  // Кэшируем API ответы на 5 минут
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T | null> {
    const key = `api:${endpoint}:${JSON.stringify(params || {})}`;
    return cache.get<T>(key);
  },

  async set<T>(endpoint: string, data: T, params?: Record<string, any>, ttl = 300): Promise<void> {
    const key = `api:${endpoint}:${JSON.stringify(params || {})}`;
    await cache.set(key, data, ttl);
  },

  async invalidate(endpoint: string): Promise<void> {
    await cache.invalidatePattern(`api:${endpoint}:*`);
  }
};

// Утилиты для кэширования пользовательских данных
export const userCache = {
  async getProfile(userId: string) {
    return cache.get(`user:${userId}:profile`);
  },

  async setProfile(userId: string, profile: any, ttl = 600) {
    await cache.set(`user:${userId}:profile`, profile, ttl);
  },

  async getUnreadCounts(userId: string) {
    return cache.get(`user:${userId}:unread`);
  },

  async setUnreadCounts(userId: string, counts: any, ttl = 30) {
    await cache.set(`user:${userId}:unread`, counts, ttl);
  },

  async invalidateUser(userId: string) {
    await cache.invalidatePattern(`user:${userId}:*`);
  }
};

export default cache;

---
metaTitle: "Redis в Next.js: кэширование и сессии"
metaDescription: "Как подключить Redis к Next.js для кэширования API-маршрутов, хранения сессий и rate limiting. Примеры с ioredis и Upstash."
author: "Антон Ларичев"
title: "Next.js с Redis: кэширование и управление сессиями"
preview: "Подключаем Redis к Next.js: кэшируем запросы к базе данных, храним пользовательские сессии и реализуем rate limiting с примерами кода."
---

## Зачем Redis в Next.js

Redis (Remote Dictionary Server) — in-memory хранилище данных, которое используется как кэш, база данных и брокер сообщений. В Next.js-приложениях Redis решает две ключевые задачи: ускорение работы за счёт кэширования результатов запросов и хранение пользовательских сессий в stateless-окружениях.

### Когда Redis необходим

- API-маршруты делают тяжёлые запросы к базе данных, одинаковые для разных пользователей
- Нужно хранить сессии в serverless-среде, где нет общей памяти между вызовами
- Требуется ограничение частоты запросов (rate limiting)
- Несколько инстансов приложения должны разделять общее состояние

## Установка и подключение

### Установка зависимостей

```bash
npm install ioredis
```

`ioredis` — наиболее функциональная библиотека для Node.js с поддержкой TypeScript из коробки, автоматическим переподключением и встроенным pipelining.

### Создание клиента Redis

Создайте файл `lib/redis.ts`:

```typescript
import Redis from 'ioredis';

const getRedisClient = () => {
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  client.on('error', (err) => {
    console.error('Redis error:', err);
  });

  return client;
};

declare global {
  var redis: Redis | undefined;
}

const redis = global.redis || getRedisClient();

if (process.env.NODE_ENV !== 'production') {
  global.redis = redis;
}

export default redis;
```

Паттерн с `global.redis` предотвращает создание нового соединения при каждом hot-reload в режиме разработки — точно так же, как это делается с Prisma или другими клиентами баз данных.

### Переменные окружения

Добавьте в `.env.local`:

```bash
REDIS_URL=redis://localhost:6379
```

Для продакшена используйте `redis://:password@host:port` или `rediss://` для TLS-соединения.

## Кэширование в API-маршрутах

### Базовый паттерн Cache-Aside

Cache-Aside (Lazy Loading) — самый распространённый паттерн: сначала проверяем кэш, при промахе идём в источник данных и сохраняем результат.

```typescript
// app/api/products/route.ts
import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { db } from '@/lib/db';

const CACHE_TTL = 60 * 5; // 5 минут

export async function GET() {
  const cacheKey = 'products:all';

  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached), {
      headers: { 'X-Cache': 'HIT' },
    });
  }

  const products = await db.product.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  });

  await redis.set(cacheKey, JSON.stringify(products), 'EX', CACHE_TTL);

  return NextResponse.json(products, {
    headers: { 'X-Cache': 'MISS' },
  });
}
```

Заголовок `X-Cache` помогает при отладке — сразу видно, откуда пришли данные.

### Кэширование с параметрами

Для запросов с параметрами включайте их в ключ кэша:

```typescript
// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cacheKey = `product:${params.id}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  const product = await db.product.findUnique({
    where: { id: params.id },
    include: { category: true, images: true },
  });

  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await redis.set(cacheKey, JSON.stringify(product), 'EX', 600);

  return NextResponse.json(product);
}
```

### Инвалидация кэша

При обновлении данных удаляйте соответствующие ключи:

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const product = await db.product.update({
    where: { id: params.id },
    data: body,
  });

  await redis.del(`product:${params.id}`, 'products:all');

  return NextResponse.json(product);
}
```

Для массовой инвалидации используйте паттерн с тегами — храните список ключей в отдельном множестве:

```typescript
// lib/cache.ts
import redis from './redis';

export async function cacheWithTag(
  key: string,
  tag: string,
  value: unknown,
  ttl: number
) {
  const pipeline = redis.pipeline();
  pipeline.set(key, JSON.stringify(value), 'EX', ttl);
  pipeline.sadd(`tag:${tag}`, key);
  pipeline.expire(`tag:${tag}`, ttl);
  await pipeline.exec();
}

export async function invalidateTag(tag: string) {
  const keys = await redis.smembers(`tag:${tag}`);
  if (keys.length > 0) {
    await redis.del(...keys, `tag:${tag}`);
  }
}
```

```typescript
// Кэшируем с тегом
await cacheWithTag('products:all', 'products', products, 300);
await cacheWithTag('product:123', 'products', product, 300);

// При изменении любого продукта удаляем всё связанное
await invalidateTag('products');
```

## Управление сессиями

### Хранилище сессий на основе Redis

Вместо того чтобы держать данные сессии в зашифрованных cookie, храним их в Redis, а в cookie — только идентификатор.

Создайте `lib/redis-session.ts`:

```typescript
import redis from './redis';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 дней
const SESSION_COOKIE = 'session-id';

export interface SessionData {
  userId: string;
  role: string;
  email: string;
  createdAt: number;
}

export async function createSession(data: SessionData): Promise<string> {
  const sessionId = randomUUID();
  const key = `session:${sessionId}`;

  await redis.set(key, JSON.stringify(data), 'EX', SESSION_TTL);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL,
    path: '/',
  });

  return sessionId;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) return null;

  const data = await redis.get(`session:${sessionId}`);
  if (!data) return null;

  // Продлеваем TTL при каждом обращении (скользящее окно)
  await redis.expire(`session:${sessionId}`, SESSION_TTL);

  return JSON.parse(data) as SessionData;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await redis.del(`session:${sessionId}`);
    cookieStore.delete(SESSION_COOKIE);
  }
}
```

### API-маршруты аутентификации

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/redis-session';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'Неверные данные' }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: 'Неверные данные' }, { status: 401 });
  }

  await createSession({
    userId: user.id,
    role: user.role,
    email: user.email,
    createdAt: Date.now(),
  });

  return NextResponse.json({ success: true });
}
```

```typescript
// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/redis-session';

export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true });
}
```

### Middleware для защиты маршрутов

Middleware в Next.js работает в Edge Runtime, где `ioredis` недоступен. Для прямой работы с Redis используйте `@upstash/redis` — HTTP-клиент, совместимый с Edge:

```bash
npm install @upstash/redis
```

```typescript
// middleware.ts
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function middleware(request: NextRequest) {
  const sessionId = request.cookies.get('session-id')?.value;

  if (!sessionId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const session = await redis.get(`session:${sessionId}`);

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};
```

Upstash предоставляет бесплатный тариф и совместим как с Edge Runtime, так и с Node.js. В продакшене он удобен ещё и тем, что не требует отдельного сервера — подключение идёт через HTTPS REST API.

## Rate Limiting

Redis идеально подходит для ограничения частоты запросов благодаря атомарным операциям:

```typescript
// lib/rate-limit.ts
import redis from './redis';

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export async function rateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const key = `rate-limit:${identifier}`;
  const resetAt = Math.floor(Date.now() / 1000) + windowSeconds;

  const pipeline = redis.pipeline();
  pipeline.incr(key);
  pipeline.expire(key, windowSeconds);
  const results = await pipeline.exec();

  const count = (results?.[0]?.[1] as number) || 0;
  const remaining = Math.max(0, limit - count);

  return {
    success: count <= limit,
    remaining,
    resetAt,
  };
}
```

```typescript
// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success, remaining, resetAt } = await rateLimit(ip, 5, 60);

  if (!success) {
    return NextResponse.json(
      { error: 'Слишком много запросов. Попробуйте позже.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetAt.toString(),
          'Retry-After': '60',
        },
      }
    );
  }

  // Обработка запроса...
  return NextResponse.json({ success: true });
}
```

## Запуск Redis локально

Для локальной разработки используйте Docker Compose:

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:alpine
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    command: redis-server --save 60 1 --loglevel warning

volumes:
  redis-data:
```

```bash
docker compose up -d redis
```

## Лучшие практики

### Структура ключей

Используйте иерархическую структуру с разделителем `:` — это улучшает читаемость и позволяет группировать ключи в Redis Insight:

```
session:{sessionId}       — данные сессии пользователя
product:{id}              — данные конкретного продукта
products:all              — список всех продуктов
rate-limit:{ip}           — счётчик запросов по IP
tag:{tagName}             — множество ключей для групповой инвалидации
user:{userId}:cart        — корзина конкретного пользователя
```

### Защита от сбоев Redis

Redis не должен быть единственной точкой отказа. Оборачивайте операции кэша в try-catch, чтобы приложение продолжало работать при недоступности Redis:

```typescript
// lib/cache.ts
import redis from './redis';

export async function getWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch {
    console.warn(`Cache read failed for key: ${key}`);
  }

  const data = await fetcher();

  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch {
    console.warn(`Cache write failed for key: ${key}`);
  }

  return data;
}
```

Использование утилиты:

```typescript
// app/api/products/route.ts
import { getWithCache } from '@/lib/cache';
import { db } from '@/lib/db';

export async function GET() {
  const products = await getWithCache(
    'products:all',
    () => db.product.findMany({ where: { active: true } }),
    300
  );

  return Response.json(products);
}
```

### Валидация данных из кэша

Данные в Redis могут оказаться устаревшей схемы. Для критичных данных добавьте валидацию при десериализации:

```typescript
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  active: z.boolean(),
});

async function getCachedProduct(id: string) {
  const raw = await redis.get(`product:${id}`);
  if (!raw) return null;

  const result = ProductSchema.safeParse(JSON.parse(raw));
  return result.success ? result.data : null;
}
```

Если валидация проваливается, функция возвращает `null`, и вызывающий код обратится к базе данных, как при обычном cache miss.

### Выбор TTL

Правильный TTL — баланс между свежестью данных и нагрузкой на базу:

- Статичные справочники (категории, настройки) — 1-24 часа
- Списки сущностей — 1-5 минут
- Данные конкретной сущности — 5-10 минут
- Пользовательские сессии — 7-30 дней со скользящим окном
- Rate limiting — длина окна (обычно 60 секунд)

Подробнее об архитектуре Next.js-приложений, включая работу с внешними сервисами и оптимизацию производительности, рассматривается на курсе [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-redis-caching).

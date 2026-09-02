---
metaTitle: "Rate Limiting в Next.js: ограничение запросов к API"
metaDescription: "Как реализовать rate limiting в Next.js с помощью Middleware, Redis и библиотек. Защита API от злоупотреблений и DDoS-атак."
author: "Антон Ларичев"
title: "Next.js Rate Limiting: ограничение запросов к API"
preview: "Реализация ограничения запросов в Next.js через Middleware и Redis — защита API от злоупотреблений и перегрузок."
---

## Что такое Rate Limiting и зачем он нужен

Rate Limiting (ограничение частоты запросов) — механизм защиты API, который ограничивает количество запросов от одного источника за определённый промежуток времени. Без него любой желающий может отправить миллионы запросов к вашему API, что приведёт к перегрузке сервера, увеличению расходов и деградации сервиса для легитимных пользователей.

Типичные сценарии, где rate limiting необходим:

- Форма регистрации или авторизации — защита от брутфорса паролей
- Отправка email-уведомлений — предотвращение спама
- Платные API-операции (OpenAI, платёжные шлюзы) — контроль расходов
- Публичные эндпоинты — защита от автоматизированного скрейпинга
- Любые вычислительно-тяжёлые операции — стабильность под нагрузкой

## Стратегии ограничения запросов

Существует несколько алгоритмов rate limiting, каждый со своими характеристиками:

**Fixed Window (фиксированное окно)** — считает запросы в фиксированных временных окнах (например, 100 запросов в минуту). Прост в реализации, но уязвим к всплескам на границе окон.

**Sliding Window (скользящее окно)** — более точная версия, учитывает запросы за последние N секунд относительно текущего момента. Устраняет проблему граничных всплесков.

**Token Bucket (ведро токенов)** — клиент получает токены с фиксированной скоростью, каждый запрос тратит токен. Позволяет короткие всплески, сохраняя среднюю скорость.

**Leaky Bucket (дырявое ведро)** — запросы обрабатываются с постоянной скоростью, очередь ограничена. Обеспечивает максимально ровный поток.

Для большинства веб-приложений оптимальны Sliding Window или Token Bucket.

## Идентификация источника запроса

Прежде чем ограничивать запросы, нужно понять, кого ограничивать. Стандартные подходы:

```typescript
import { NextRequest } from 'next/server'

function getIdentifier(request: NextRequest): string {
  // По IP-адресу (для публичных эндпоинтов)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'

  // По API-ключу (для аутентифицированных клиентов)
  const apiKey = request.headers.get('x-api-key')
  if (apiKey) return `api:${apiKey}`

  // По токену сессии (для залогиненных пользователей)
  const sessionToken = request.cookies.get('session')?.value
  if (sessionToken) return `session:${sessionToken}`

  return `ip:${ip}`
}
```

Важно: за реверс-прокси (Nginx, Vercel, Cloudflare) реальный IP клиента приходит в заголовке `x-forwarded-for`. Заголовку нельзя безоговорочно доверять — клиент может подделать его. На Vercel используйте `x-real-ip` или пакет `@vercel/functions`.

## Простой in-memory rate limiter

Для несерьёзных проектов или локальной разработки подойдёт хранилище в памяти процесса. Главный недостаток — не работает при нескольких экземплярах приложения (нет общего состояния).

```typescript
// lib/rate-limit.ts

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    store.set(identifier, { count: 1, resetAt })
    return { success: true, remaining: limit - 1, resetAt }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}
```

Применение в Route Handler (App Router):

```typescript
// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const result = rateLimit(ip, 5, 60_000) // 5 запросов в минуту

  if (!result.success) {
    return NextResponse.json(
      { error: 'Слишком много запросов. Повторите позже.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  // Обработка запроса...
  return NextResponse.json({ success: true })
}
```

## Rate Limiting через Middleware

Middleware в Next.js выполняется на Edge Runtime до того, как запрос достигнет Route Handler. Это идеальное место для rate limiting — можно блокировать запросы ещё на входе, не нагружая обработчики.

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count += 1
  return true
}

export function middleware(request: NextRequest) {
  // Применяем rate limiting только к API-маршрутам
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const allowed = checkRateLimit(ip, 100, 60_000) // 100 запросов в минуту

  if (!allowed) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
```

## Продакшн-решение с Redis и Upstash

Для продакшн-приложений с несколькими инстансами нужно внешнее хранилище состояния. Redis — стандарт де-факто для rate limiting благодаря атомарным операциям и встроенному TTL.

[Upstash](https://upstash.com) предоставляет serverless Redis, который работает с Edge Runtime Next.js. Установите зависимости:

```bash
npm install @upstash/ratelimit @upstash/redis
```

Настройте переменные окружения в `.env.local`:

```bash
UPSTASH_REDIS_REST_URL=https://your-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

Создайте конфигурацию rate limiter:

```typescript
// lib/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Sliding window: 10 запросов за 10 секунд
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: 'api',
})

// Строже для чувствительных эндпоинтов: 5 запросов в минуту
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'auth',
})

// Token bucket для публичного API: позволяет кратковременные всплески
export const publicApiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.tokenBucket(20, '1 m', 5),
  analytics: true,
  prefix: 'public',
})
```

Применение в Middleware с Upstash:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { apiLimiter, authLimiter } from '@/lib/rate-limiter'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (!pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'

  // Отдельный лимит для эндпоинтов авторизации
  const limiter = pathname.startsWith('/api/auth') ? authLimiter : apiLimiter

  const { success, limit, remaining, reset } = await limiter.limit(ip)

  const response = success
    ? NextResponse.next()
    : NextResponse.json(
        { error: 'Слишком много запросов', retryAfter: Math.ceil((reset - Date.now()) / 1000) },
        { status: 429 }
      )

  response.headers.set('X-RateLimit-Limit', String(limit))
  response.headers.set('X-RateLimit-Remaining', String(remaining))
  response.headers.set('X-RateLimit-Reset', String(reset))

  return response
}

export const config = {
  matcher: '/api/:path*',
}
```

## Гранулярный rate limiting на уровне Route Handler

Иногда нужны разные лимиты для разных операций внутри одного маршрута или лимиты по пользователю (не по IP):

```typescript
// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Для платных AI-операций — жёсткий лимит по пользователю
const generateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(10, '1 h'),
  prefix: 'generate',
})

export async function POST(request: NextRequest) {
  const session = await getServerSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 })
  }

  const { success, remaining } = await generateLimiter.limit(session.user.id)

  if (!success) {
    return NextResponse.json(
      {
        error: 'Исчерпан лимит генераций на этот час',
        remaining: 0,
      },
      { status: 429 }
    )
  }

  const body = await request.json()
  // Вызов OpenAI или другой AI-операции...

  return NextResponse.json({ result: '...', remaining })
}
```

## Ответ клиенту при превышении лимита

Правильный ответ на 429 включает заголовки, помогающие клиенту понять, когда повторить запрос:

```typescript
// lib/rate-limit-response.ts
import { NextResponse } from 'next/server'

interface RateLimitHeaders {
  limit: number
  remaining: number
  reset: number
}

export function rateLimitExceededResponse(headers: RateLimitHeaders): NextResponse {
  const retryAfter = Math.ceil((headers.reset - Date.now()) / 1000)

  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message: `Превышен лимит запросов. Повторите через ${retryAfter} секунд.`,
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(headers.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(headers.reset / 1000)),
      },
    }
  )
}
```

Обработка на стороне клиента:

```typescript
// hooks/useApiRequest.ts
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 1) {
  const response = await fetch(url, options)

  if (response.status === 429 && maxRetries > 0) {
    const retryAfter = Number(response.headers.get('Retry-After') ?? 5)
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000))
    return fetchWithRetry(url, options, maxRetries - 1)
  }

  return response
}
```

## Тестирование rate limiting

Не забудьте покрыть rate limiting тестами — особенно логику граничных случаев:

```typescript
// __tests__/rate-limit.test.ts
import { rateLimit } from '@/lib/rate-limit'

describe('rateLimit', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('разрешает запросы в пределах лимита', () => {
    for (let i = 0; i < 5; i++) {
      const result = rateLimit('test-user', 5, 60_000)
      expect(result.success).toBe(true)
    }
  })

  it('блокирует запросы сверх лимита', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit('test-user-2', 5, 60_000)
    }
    const result = rateLimit('test-user-2', 5, 60_000)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('сбрасывает счётчик после истечения окна', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit('test-user-3', 5, 60_000)
    }

    jest.advanceTimersByTime(61_000)

    const result = rateLimit('test-user-3', 5, 60_000)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })
})
```

## Лучшие практики

**Устанавливайте заголовки всегда**, даже для успешных запросов — клиенты смогут реализовать превентивное замедление запросов до достижения лимита.

**Разделяйте лимиты по типам операций**: чтение данных допускает больше запросов, чем запись; AI-генерация — строже, чем получение профиля.

**Не применяйте rate limiting к статике** — middleware должен срабатывать только для `/api/` маршрутов, иначе вы замедлите загрузку страниц.

**Логируйте превышения лимитов** — это ценные данные для выявления атак и настройки порогов.

**Предусмотрите обход для доверенных источников** — внутренние сервисы, CI/CD, health-checks должны быть в allowlist:

```typescript
const TRUSTED_IPS = new Set([
  process.env.INTERNAL_SERVICE_IP,
  '127.0.0.1',
])

if (TRUSTED_IPS.has(ip)) {
  return NextResponse.next()
}
```

**Используйте разные Redis-ключи для разных контекстов** — через параметр `prefix` в Upstash Ratelimit или вручную при работе с нативным Redis, чтобы лимиты не пересекались.

**Комбинируйте с защитой Cloudflare или аналогами** — rate limiting на уровне приложения — второй эшелон защиты, а не единственный. Cloudflare, AWS WAF или Nginx снимут нагрузку ещё до Next.js.

## Мониторинг эффективности

Upstash Ratelimit с параметром `analytics: true` сохраняет статистику в Redis. Можно выводить дашборд:

```typescript
// app/api/admin/rate-limit-stats/route.ts
import { NextResponse } from 'next/server'
import { apiLimiter } from '@/lib/rate-limiter'

export async function GET() {
  const analytics = await apiLimiter.getAnalytics()
  return NextResponse.json(analytics)
}
```

Или подключить внешний мониторинг, добавив счётчики в Prometheus/Datadog при каждом срабатывании rate limit.

---

Rate limiting — важная часть production-готового Next.js приложения. Освоить построение надёжных fullstack-приложений с Next.js, включая защиту API, аутентификацию и деплой, можно на курсе PurpleSchool:

[Next.js — полный курс](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-rate-limiting)

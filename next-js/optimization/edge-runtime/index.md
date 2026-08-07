---
metaTitle: "Next.js Edge Runtime: функции на граничных серверах"
metaDescription: "Edge Runtime в Next.js: что это, как настроить, ограничения API, middleware и маршруты на граничных серверах. Примеры кода."
author: "Антон Ларичев"
title: "Next.js Edge Runtime — функции на граничных серверах"
preview: "Разбираемся, что такое Edge Runtime в Next.js, чем он отличается от Node.js-окружения и как использовать граничные функции для ускорения приложений."
---

## Что такое Edge Runtime

Edge Runtime — это облегчённое окружение выполнения JavaScript, которое Next.js использует для запуска кода максимально близко к пользователю, на граничных серверах (edge nodes) по всему миру. В отличие от традиционных серверных функций, которые работают в одном дата-центре, граничные функции развёртываются в десятках точек присутствия и отвечают из ближайшей к пользователю локации.

По сути, Edge Runtime — это урезанный JavaScript-движок на базе V8, похожий на Web Workers или среду выполнения Cloudflare Workers. Он намеренно ограничен: нет полного Node.js API, нет файловой системы, нет части нативных модулей. Взамен вы получаете молниеносный холодный старт (единицы миллисекунд против сотен у Node.js-функций) и глобальное распределение без дополнительной настройки.

## Node.js Runtime против Edge Runtime

Прежде чем перейти к коду, важно чётко понять различия между двумя доступными в Next.js окружениями.

| Характеристика | Node.js Runtime | Edge Runtime |
|---|---|---|n| Холодный старт | 100–500 мс | 0–5 мс |
| Доступные API | Полный Node.js | Web API (Fetch, Streams, Crypto) |
| Файловая система | Есть | Нет |
| npm-пакеты | Все совместимые | Только Edge-совместимые |
| Лимит бандла | ~50 МБ | ~1–4 МБ |
| Регионы | Один | Глобально |

Edge Runtime использует стандартные Web API, хорошо знакомые по браузерному JavaScript: `fetch`, `Request`, `Response`, `URL`, `TextEncoder`, `crypto.subtle`, `ReadableStream` и другие. Это делает код максимально переносимым и предсказуемым.

## Настройка Edge Runtime в Next.js

Чтобы включить Edge Runtime для конкретного маршрута или middleware, достаточно экспортировать константу `runtime`.

### Edge Runtime в Route Handler (App Router)

```typescript
// app/api/geo/route.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = request.headers.get('x-vercel-ip-city') ?? 'Unknown';
  const country = request.headers.get('x-vercel-ip-country') ?? 'Unknown';

  return Response.json({
    city: decodeURIComponent(city),
    country,
    query: searchParams.get('q'),
  });
}
```

Одна строка `export const runtime = 'edge'` переключает маршрут с Node.js на Edge Runtime. Next.js сам позаботится о правильной сборке и деплое.

### Edge Runtime в Pages Router (API Routes)

```typescript
// pages/api/hello.ts
import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default function handler(req: NextRequest) {
  return new Response(
    JSON.stringify({ message: 'Hello from the edge!' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

Обратите внимание: в Pages Router Edge-функции принимают `NextRequest` (расширение стандартного `Request`) и возвращают стандартный `Response`, а не объекты `req`/`res` от Node.js.

## Middleware на Edge Runtime

Middleware в Next.js всегда работает на Edge Runtime — это не настраивается. Файл `middleware.ts` в корне проекта запускается перед каждым запросом, что делает его идеальным местом для аутентификации, редиректов, A/B-тестирования и геолокации.

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Редирект устаревших URL
  if (pathname.startsWith('/blog/old-')) {
    const newPath = pathname.replace('/blog/old-', '/articles/');
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // Проверка токена из cookie
  const token = request.cookies.get('auth-token')?.value;
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/blog/:path*'],
};
```

### Передача данных из Middleware в страницы

Middleware может добавлять заголовки к запросу, которые затем читаются на странице или в серверном компоненте:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const country = request.headers.get('x-vercel-ip-country') ?? 'US';
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set('x-user-country', country);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}
```

```typescript
// app/page.tsx
import { headers } from 'next/headers';

export default async function Page() {
  const headersList = await headers();
  const country = headersList.get('x-user-country') ?? 'US';

  return <div>Ваша страна: {country}</div>;
}
```

## Доступные Web API

Edge Runtime предоставляет богатый набор стандартных Web API. Вот наиболее часто используемые:

### Fetch API

```typescript
export const runtime = 'edge';

export async function GET() {
  const response = await fetch('https://api.example.com/data', {
    headers: { Authorization: `Bearer ${process.env.API_KEY}` },
    next: { revalidate: 60 }, // Next.js расширение для кеширования
  });

  if (!response.ok) {
    return new Response('Upstream error', { status: 502 });
  }

  const data = await response.json();
  return Response.json(data);
}
```

### Web Crypto API

```typescript
export const runtime = 'edge';

async function generateHmac(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Buffer.from(signature).toString('hex');
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-signature') ?? '';
  const expectedSignature = await generateHmac(body, process.env.WEBHOOK_SECRET!);

  if (signature !== expectedSignature) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Обработка валидного вебхука
  return new Response('OK');
}
```

### Streaming Responses

Edge Runtime отлично подходит для стриминга данных — например, при работе с AI-генерацией текста:

```typescript
export const runtime = 'edge';

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const words = ['Hello', ' from', ' the', ' edge!'];

      for (const word of words) {
        const chunk = new TextEncoder().encode(word);
        controller.enqueue(chunk);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
```

## Ограничения Edge Runtime

Понимание ограничений не менее важно, чем знание возможностей. Edge Runtime намеренно ограничен для обеспечения быстрого старта и безопасности.

### Недоступные Node.js модули

Следующие модули недоступны в Edge Runtime:

- `fs` — файловая система
- `path`, `os` — системные утилиты
- `child_process` — запуск процессов
- `net`, `dgram` — низкоуровневые сетевые операции
- `crypto` (Node.js версия) — используйте `globalThis.crypto` вместо него
- `buffer` — частично доступен через глобальный `Buffer`

### Ограничения npm-пакетов

Многие популярные пакеты используют Node.js API под капотом и не работают на Edge Runtime. Перед добавлением зависимости проверьте совместимость:

```typescript
// Это НЕ работает на Edge Runtime
import { PrismaClient } from '@prisma/client'; // использует Node.js native bindings

// Это работает
import { createClient } from '@vercel/postgres'; // Edge-совместимый клиент
import { drizzle } from 'drizzle-orm/vercel-postgres';
```

### Лимиты размера бандла

Edge Runtime накладывает жёсткий лимит на размер бандла функции (обычно 1–4 МБ в зависимости от провайдера). Next.js предупреждает при превышении:

```bash
⚠ Edge function exceeded the 1 MB size limit
```

Для анализа бандла используйте:

```bash
NEXT_ANALYZE_BUNDLE=1 npm run build
```

## Практический пример: A/B-тестирование на Edge

Один из классических сценариев применения Edge Runtime — A/B-тестирование без дополнительной задержки:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EXPERIMENT_COOKIE = 'ab-experiment';
const VARIANTS = ['control', 'variant-a', 'variant-b'] as const;
type Variant = typeof VARIANTS[number];

function assignVariant(): Variant {
  // Случайное распределение 50/25/25
  const random = Math.random();
  if (random < 0.5) return 'control';
  if (random < 0.75) return 'variant-a';
  return 'variant-b';
}

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/landing')) {
    return NextResponse.next();
  }

  const existingVariant = request.cookies.get(EXPERIMENT_COOKIE)?.value as Variant | undefined;
  const variant = existingVariant ?? assignVariant();

  const response = NextResponse.rewrite(
    new URL(`/landing/${variant}`, request.url)
  );

  if (!existingVariant) {
    response.cookies.set(EXPERIMENT_COOKIE, variant, {
      maxAge: 60 * 60 * 24 * 30, // 30 дней
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: '/landing',
};
```

Пользователь получает свой вариант страницы из ближайшего граничного сервера — без лишнего round-trip к центральному бэкенду.

## Проверка окружения выполнения

Иногда нужно написать код, который работает в обоих окружениях. Next.js предоставляет утилиту для определения текущего Runtime:

```typescript
import { unstable_noStore as noStore } from 'next/cache';

// Проверка через переменную окружения
const isEdge = process.env.NEXT_RUNTIME === 'edge';

// Условная логика
async function getDatabase() {
  if (isEdge) {
    // Используем Edge-совместимый HTTP-клиент
    const { createClient } = await import('@vercel/postgres');
    return createClient();
  } else {
    // Полноценное Node.js подключение
    const { PrismaClient } = await import('@prisma/client');
    return new PrismaClient();
  }
}
```

## Локальная разработка и тестирование

Next.js поддерживает Edge Runtime в режиме разработки через `next dev`. Для тестирования Edge-функций используйте стандартные инструменты:

```bash
# Запуск dev-сервера с поддержкой Edge Runtime
npm run dev

# Тест Edge API Route через curl
curl http://localhost:3000/api/geo

# Проверка заголовков ответа
curl -I http://localhost:3000/api/hello
```

Для unit-тестирования Edge-функций удобно использовать `jest` с настройкой окружения:

```typescript
// __tests__/edge-route.test.ts
import { GET } from '../app/api/geo/route';

describe('GET /api/geo', () => {
  it('returns json response', async () => {
    const request = new Request('http://localhost/api/geo?q=test', {
      headers: {
        'x-vercel-ip-city': 'Moscow',
        'x-vercel-ip-country': 'RU',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.city).toBe('Moscow');
    expect(data.country).toBe('RU');
  });
});
```

## Когда использовать Edge Runtime

Edge Runtime — не серебряная пуля. Выбирайте его осознанно:

**Подходит для Edge Runtime:**
- Аутентификация и проверка JWT-токенов в Middleware
- Геолокация и персонализация по региону
- A/B-тестирование и feature flags
- Редиректы и реврайты URL
- Простые API, работающие с внешними HTTP-сервисами
- Стриминг данных от AI-моделей
- Rate limiting на уровне сети

**Лучше оставить на Node.js Runtime:**
- Работа с базами данных через нативные драйверы
- Операции с файловой системой
- Тяжёлые вычисления, требующие мощных библиотек
- Код, зависящий от Node.js-специфичных пакетов
- Сложная бизнес-логика с большим числом зависимостей

## Деплой на различные платформы

Edge Runtime поддерживается несколькими провайдерами:

```typescript
// vercel.json — настройки для Vercel Edge Functions
{
  "functions": {
    "app/api/edge/**": {
      "runtime": "edge"
    }
  }
}
```

При деплое на Cloudflare Pages через `@cloudflare/next-on-pages` Edge Runtime маппируется на Cloudflare Workers. При деплое на Vercel — на Vercel Edge Functions. Код при этом остаётся одинаковым — Next.js абстрагирует платформенные различия.

## Мониторинг и отладка

Для отладки Edge-функций в продакшене используйте логирование через `console.log` — вывод доступен в панели провайдера. Для метрик подключайте OpenTelemetry:

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge-совместимая телеметрия
    const { registerEdgeInstrumentation } = await import('./lib/telemetry-edge');
    registerEdgeInstrumentation();
  }
}
```

Edge Runtime в Next.js — мощный инструмент для построения глобально быстрых приложений. Главное — понимать его ограничения и использовать там, где действительно важна минимальная задержка и глобальное распределение.

Чтобы углублённо изучить Next.js, включая работу с Edge Runtime, Middleware, App Router и оптимизацию производительности, записывайтесь на курс: [Next.js — с нуля до профессионала](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=edge-runtime)
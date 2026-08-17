---
metaTitle: "Next.js after() — выполнение кода после ответа"
metaDescription: "Как использовать after() в Next.js для выполнения фоновых задач после отправки ответа клиенту: логирование, аналитика, уведомления."
author: "Антон Ларичев"
title: "Next.js after() — выполнение кода после отправки ответа"
preview: "Разбираем after() в Next.js: как запускать фоновые задачи после ответа клиенту без увеличения времени загрузки страницы."
---

## Что такое after() и зачем он нужен

При разработке серверных приложений часто возникает задача: выполнить какую-то работу после того, как ответ уже отправлен клиенту. Классические примеры — запись логов, отправка аналитики, инвалидация кэша или отправка уведомлений. Если делать всё это до отправки ответа, пользователь будет ждать дольше, хотя эти операции на содержимое страницы не влияют.

Функция `after()` появилась в Next.js 15 как стабильный API (в Next.js 14 она была доступна под именем `unstable_after`). Она позволяет запланировать выполнение произвольного кода после того, как ответ полностью отправлен или страница завершила рендеринг. Пользователь получает ответ мгновенно, а фоновая работа выполняется уже после.

## Как подключить after()

Функция импортируется из пакета `next/server`:

```typescript
import { after } from 'next/server';
```

Подключение не требует никакой дополнительной конфигурации в `next.config.ts` — в отличие от экспериментального `unstable_after`, стабильная версия работает из коробки.

## Синтаксис и базовый пример

`after()` принимает функцию-колбэк (синхронную или асинхронную) и возвращает `void`. Колбэк выполняется после того, как ответ отправлен клиенту.

```typescript
import { after } from 'next/server';

export default async function Page() {
  after(() => {
    console.log('Эта строка появится после отправки страницы клиенту');
  });

  return <main>Контент страницы</main>;
}
```

Важный момент: `after()` можно вызвать несколько раз в одном обработчике — все зарегистрированные колбэки выполнятся последовательно после отправки ответа.

```typescript
import { after } from 'next/server';

export default async function Page() {
  after(() => logPageView());
  after(async () => await updateAnalytics());
  after(() => notifyMonitoring());

  return <main>Контент страницы</main>;
}
```

## Где можно использовать after()

`after()` поддерживается в четырёх типах серверного кода Next.js:

- **Server Components** — серверные компоненты App Router
- **Server Actions** — серверные действия, вызываемые из форм или клиентских компонентов
- **Route Handlers** — файлы `route.ts` в директории `app/`
- **Middleware** — файл `middleware.ts`

В Client Components (`'use client'`) `after()` недоступен, поскольку клиентский код выполняется в браузере.

## Практические примеры

### Логирование в Server Component

Запись информации о посещении страницы — типичный сценарий для `after()`. Пользователь не должен ждать записи в базу данных или внешний сервис.

```typescript
import { after } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await db.product.findUnique({
    where: { id: params.id },
  });

  after(async () => {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') ?? 'unknown';
    const referer = headersList.get('referer') ?? '';

    await db.pageView.create({
      data: {
        productId: params.id,
        userAgent,
        referer,
        viewedAt: new Date(),
      },
    });
  });

  if (!product) {
    return <div>Товар не найден</div>;
  }

  return (
    <main>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </main>
  );
}
```

Продукт загружается и отображается пользователю немедленно. Запись просмотра в базу данных происходит уже после.

### Аналитика в Route Handler

```typescript
import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendToAnalytics } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const order = await db.order.create({
    data: {
      userId: body.userId,
      items: body.items,
      total: body.total,
    },
  });

  after(async () => {
    await sendToAnalytics({
      event: 'order_created',
      orderId: order.id,
      total: order.total,
      itemCount: body.items.length,
    });
  });

  return NextResponse.json({ orderId: order.id, status: 'created' });
}
```

Клиент получает ответ с идентификатором заказа сразу. Отправка события в аналитику не блокирует ответ.

### Server Action с фоновой задачей

```typescript
'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { sendNotification } from '@/lib/notifications';

export async function updateUserProfile(formData: FormData) {
  const userId = formData.get('userId') as string;
  const name = formData.get('name') as string;
  const bio = formData.get('bio') as string;

  await db.user.update({
    where: { id: userId },
    data: { name, bio },
  });

  revalidatePath(`/profile/${userId}`);

  after(async () => {
    await sendNotification({
      type: 'profile_updated',
      userId,
      message: `Профиль пользователя ${name} обновлён`,
    });

    await db.auditLog.create({
      data: {
        action: 'profile_update',
        userId,
        timestamp: new Date(),
        changes: { name, bio },
      },
    });
  });
}
```

Пользователь видит обновлённый профиль сразу после сабмита формы. Уведомления и аудит-лог записываются в фоне.

### Использование в Middleware

`after()` в middleware позволяет собирать метрики запросов, не влияя на их скорость:

```typescript
import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();

  after(() => {
    const duration = Date.now() - startTime;
    console.log(`[Metrics] ${request.method} ${pathname} — ${duration}ms`);
  });

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

## Доступ к контексту запроса внутри after()

Одна из ключевых особенностей `after()` — возможность использовать контекстные API Next.js внутри колбэка. `cookies()`, `headers()` и другие динамические функции работают в колбэке так же, как и в основном обработчике.

```typescript
import { after } from 'next/server';
import { cookies, headers } from 'next/headers';

export default async function DashboardPage() {
  after(async () => {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session-id')?.value;

    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') ?? 'unknown';

    if (sessionId) {
      await logActivity(sessionId, ip, '/dashboard');
    }
  });

  return <main>Дашборд</main>;
}
```

Это принципиальное отличие от подхода с `setTimeout` или `Promise` без `await` — там контекст запроса уже недоступен.

## Ограничения и важные нюансы

### Таймаут serverless-функции

Колбэки `after()` выполняются в рамках того же serverless-вызова, что и основной обработчик. Это значит, что общее время выполнения (основной код + колбэки) ограничено таймаутом платформы. Если фоновая задача займёт слишком много времени, она может быть прервана.

Для длительных задач (обработка файлов, сложные вычисления) лучше использовать очереди задач или внешние сервисы.

### Нельзя изменить ответ

Внутри колбэка `after()` невозможно изменить уже отправленный ответ — добавить заголовки, поменять статус-код или вернуть другое тело. Попытка это сделать приведёт к ошибке или будет проигнорирована.

```typescript
import { after } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.json({ ok: true });

  after(() => {
    // Это не сработает — ответ уже отправлен
    // response.headers.set('X-Custom', 'value'); // ошибка
  });

  return response;
}
```

### Ошибки в колбэках

Если колбэк `after()` выбрасывает исключение, это не влияет на ответ клиента — он уже получен. Ошибка будет залогирована сервером, но пользователь не увидит ничего необычного. Поэтому важно обрабатывать ошибки внутри колбэков самостоятельно.

```typescript
import { after } from 'next/server';
import { logError } from '@/lib/logger';

export default async function Page() {
  after(async () => {
    try {
      await sendAnalyticsEvent();
    } catch (error) {
      logError('Analytics failed', error);
    }
  });

  return <main>Контент</main>;
}
```

### Статическая генерация

Во время статической генерации (SSG) `after()` выполняется после завершения рендеринга страницы, а не после отправки ответа реальному пользователю. Это логично: при SSG ответы кэшируются, и «отправка ответа» происходит в момент сборки.

## Сравнение с альтернативными подходами

До появления `after()` разработчики использовали несколько обходных путей.

**`Promise` без `await`** — простой, но ненадёжный способ:

```typescript
export async function GET() {
  // Опасно: контекст запроса уже не доступен,
  // функция может быть прервана платформой
  logAnalytics(); // без await
  return NextResponse.json({ ok: true });
}
```

**`waitUntil` в Edge Runtime** — более надёжный вариант для edge-функций, но не поддерживается везде:

```typescript
import { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Только для Edge Runtime
  const ctx = (request as any).waitUntil;
  ctx?.(logRequest(request));
  return NextResponse.next();
}
```

`after()` решает проблемы обоих подходов: он работает в любом серверном контексте Next.js, сохраняет доступ к контексту запроса и интегрирован с системой жизненного цикла фреймворка.

## Реальный сценарий: инвалидация кэша после мутации

Предположим, у нас есть API для обновления товара в каталоге, и после изменения нужно инвалидировать кэш нескольких страниц, а также оповестить CDN.

```typescript
import { after } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { purgeFromCDN } from '@/lib/cdn';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const product = await db.product.update({
    where: { id: params.id },
    data: body,
  });

  after(async () => {
    revalidatePath(`/products/${params.id}`);
    revalidatePath('/products');
    revalidateTag(`product-${params.id}`);

    await purgeFromCDN([`/products/${params.id}`, '/products']);
  });

  return NextResponse.json(product);
}
```

Клиент получает обновлённый объект товара немедленно. Инвалидация кэша и очистка CDN происходят после — пользователь API не ждёт завершения этих операций.

## Итог

`after()` закрывает распространённую потребность: выполнять побочные эффекты после отправки ответа, не ухудшая пользовательский опыт. Это особенно ценно для логирования, аналитики, уведомлений и инвалидации кэша. API прост в использовании, работает во всех серверных контекстах Next.js и сохраняет доступ к данным запроса.

Чтобы глубже разобраться в архитектуре App Router и правильно проектировать серверные приложения на Next.js, рекомендуем курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=after-api).
---
metaTitle: "Next.js 15: новые возможности и breaking changes"
metaDescription: "Полный разбор Next.js 15: асинхронные API запросов, новая модель кэширования, стабильный Turbopack, React 19 и другие изменения."
author: "Антон Ларичев"
title: "Next.js 15: новые возможности и breaking changes"
preview: "Разбираем ключевые изменения Next.js 15: что сломалось, что появилось и как мигрировать существующий проект."
---

## Обзор Next.js 15

Next.js 15 — значительный релиз, который меняет несколько фундаментальных подходов к работе с фреймворком. Часть изменений затрагивает API, которые использовались во всех App Router приложениях, поэтому перед обновлением важно понять, что именно изменилось и как адаптировать код.

В этой статье рассмотрим breaking changes и новые возможности, которые появились в Next.js 15.

## Breaking change: асинхронные API запросов

Самое значительное изменение — переход к асинхронным API для доступа к данным запроса. Функции `cookies()`, `headers()`, `params` и `searchParams` теперь возвращают Promise.

### cookies() и headers()

Раньше эти функции были синхронными:

```typescript
// Next.js 14 — синхронно
import { cookies, headers } from 'next/headers';

export default function Page() {
  const cookieStore = cookies();
  const token = cookieStore.get('token');

  const headersList = headers();
  const userAgent = headersList.get('user-agent');

  return <div>{token?.value}</div>;
}
```

В Next.js 15 оба вызова стали асинхронными:

```typescript
// Next.js 15 — асинхронно
import { cookies, headers } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');

  const headersList = await headers();
  const userAgent = headersList.get('user-agent');

  return <div>{token?.value}</div>;
}
```

### params и searchParams

Те же изменения коснулись пропсов страниц и layout-компонентов:

```typescript
// Next.js 14
interface PageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function Page({ params, searchParams }: PageProps) {
  const { slug } = params;
  const { page } = searchParams;
  return <div>{slug}</div>;
}
```

```typescript
// Next.js 15
interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  return <div>{slug}</div>;
}
```

Это изменение относится к серверным компонентам. В клиентских компонентах, которые принимают `params` как пропс, нужно использовать `React.use()` для разворачивания промиса:

```typescript
'use client';

import { use } from 'react';

interface ClientPageProps {
  params: Promise<{ id: string }>;
}

export default function ClientPage({ params }: ClientPageProps) {
  const { id } = use(params);
  return <div>{id}</div>;
}
```

### Автоматическая миграция через codemod

Для облегчения перехода доступен официальный codemod:

```bash
npx @next/codemod@canary next-async-request-api .
```

Codemod обработает большую часть случаев автоматически, но после его работы нужно вручную проверить сложные сценарии с условными вызовами и динамическими вычислениями.

## Breaking change: новая модель кэширования

В Next.js 15 изменено поведение кэширования по умолчанию — теперь запросы и обработчики маршрутов не кэшируются автоматически.

### fetch-запросы

Предыдущее поведение кэшировало все `fetch`-запросы на сервере:

```typescript
// Next.js 14: кэшируется по умолчанию (эквивалентно cache: 'force-cache')
const data = await fetch('https://api.example.com/data');

// Next.js 14: чтобы отключить кэш
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store',
});
```

В Next.js 15 поведение изменилось на противоположное:

```typescript
// Next.js 15: НЕ кэшируется по умолчанию (эквивалентно cache: 'no-store')
const data = await fetch('https://api.example.com/data');

// Next.js 15: чтобы явно включить кэш
const data = await fetch('https://api.example.com/data', {
  cache: 'force-cache',
});

// Next.js 15: кэш с ревалидацией
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 },
});
```

### GET Route Handlers

Обработчики маршрутов с методом GET также перестали кэшироваться по умолчанию:

```typescript
// app/api/data/route.ts

// Next.js 15: НЕ кэшируется
export async function GET() {
  const data = await fetchSomeData();
  return Response.json(data);
}

// Чтобы включить кэширование в Next.js 15:
export const dynamic = 'force-static';

export async function GET() {
  const data = await fetchSomeData();
  return Response.json(data);
}
```

### Client Router Cache

Кэш клиентского роутера для Page сегментов теперь по умолчанию не кэширует данные между навигациями. Раньше переход между страницами использовал кэшированные данные, теперь каждая навигация выполняет свежий запрос.

Если предыдущее поведение было нужным, его можно восстановить через конфигурацию:

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30, // секунды кэширования для динамических страниц
      static: 180, // секунды для статических
    },
  },
};

export default nextConfig;
```

## Стабильный Turbopack для разработки

Turbopack Dev перешёл в статус стабильного. Это сборщик на Rust, который заменяет webpack в режиме разработки и значительно ускоряет время запуска и горячей перезагрузки.

```bash
# Теперь без флага --experimental-turbo
next dev --turbopack
```

По официальным данным Turbopack обеспечивает:
- запуск локального сервера до 76% быстрее
- обновления кода (Fast Refresh) до 96% быстрее

Turbopack Dev поддерживает все возможности App Router и большинство конфигураций webpack через соответствующие адаптеры в `next.config.ts`.

## Поддержка React 19

Next.js 15 поддерживает React 19. В App Router React 19 является рекомендованной версией, в Pages Router поддерживается обратная совместимость с React 18.

С React 19 доступны новые возможности:

```typescript
// React 19: новые хуки для форм
'use client';

import { useActionState, useFormStatus } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Отправка...' : 'Отправить'}
    </button>
  );
}

async function submitAction(prevState: any, formData: FormData) {
  'use server';
  const name = formData.get('name');
  // логика обработки
  return { success: true, name };
}

export default function ContactForm() {
  const [state, action] = useActionState(submitAction, null);

  return (
    <form action={action}>
      <input name="name" />
      <SubmitButton />
      {state?.success && <p>Форма отправлена, {state.name}!</p>}
    </form>
  );
}
```

## Экспериментальный React Compiler

Next.js 15 включает поддержку React Compiler — инструмента, который автоматически оптимизирует компоненты без необходимости вручную использовать `useMemo`, `useCallback` и `memo`.

```bash
npm install babel-plugin-react-compiler
```

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: true,
  },
};

export default nextConfig;
```

После включения компилятор анализирует компоненты и автоматически добавляет мемоизацию там, где это безопасно:

```typescript
// Написанный код
function ProductList({ products, onSelect }) {
  return (
    <ul>
      {products.map(p => (
        <li key={p.id} onClick={() => onSelect(p)}>
          {p.name}
        </li>
      ))}
    </ul>
  );
}

// React Compiler автоматически добавляет оптимизации,
// эквивалентные обёртке в memo() и useCallback()
```

Компилятор находится в стадии Beta, поэтому перед включением в продакшн рекомендуется тестирование.

## next/after: выполнение кода после ответа

Новый API `after()` позволяет выполнить код после отправки ответа пользователю. Это полезно для задач, которые не должны блокировать ответ: аналитика, логирование, синхронизация данных.

```typescript
import { after } from 'next/server';
import { logAnalyticsEvent } from '@/lib/analytics';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchProduct(id);

  // Логирование выполнится после отправки ответа
  after(async () => {
    await logAnalyticsEvent('product_view', { productId: id });
  });

  return <ProductDetail product={product} />;
}
```

`after()` работает в Server Components, Server Actions и Route Handlers. Для его включения нужна настройка в конфигурации (в ранних версиях он был экспериментальным, в Next.js 15 стал стабильным).

## next/form: улучшенные формы

Новый компонент `<Form>` из `next/form` расширяет стандартный HTML `<form>` возможностями Next.js:

```typescript
import Form from 'next/form';

export default function SearchPage() {
  return (
    <Form action="/search">
      <input name="query" placeholder="Поиск..." />
      <button type="submit">Найти</button>
    </Form>
  );
}
```

При отправке формы с `action`, указывающим на страницу Next.js, компонент:

- выполняет клиентскую навигацию без полной перезагрузки страницы
- автоматически префетчит целевую страницу при появлении формы в viewport
- сохраняет работу с URL-параметрами в соответствии с семантикой HTML-форм

Для серверных действий поведение не отличается от стандартного:

```typescript
import Form from 'next/form';
import { submitContactForm } from './actions';

export default function ContactPage() {
  return (
    <Form action={submitContactForm}>
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button type="submit">Отправить</button>
    </Form>
  );
}
```

## TypeScript конфигурация: next.config.ts

Next.js 15 добавляет нативную поддержку `next.config.ts` — конфигурационного файла на TypeScript:

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
      },
    ],
  },
  experimental: {
    after: true,
  },
};

export default nextConfig;
```

Теперь конфигурация проверяется типами на этапе написания кода, что исключает опечатки в названиях опций и помогает IDE подсказывать доступные параметры.

## instrumentation.js: стабильный API

Файл `instrumentation.ts` (или `.js`) в корне проекта позволяет подключаться к жизненному циклу сервера Next.js. В 15-й версии этот API перешёл в статус стабильного:

```typescript
// instrumentation.ts
import { registerOTel } from '@vercel/otel';

export function register() {
  // Выполняется при старте сервера
  registerOTel({ serviceName: 'my-app' });
}

export async function onRequestError(
  error: Error,
  request: { path: string; method: string },
  context: { routeType: string }
) {
  // Выполняется при каждой серверной ошибке
  await reportErrorToMonitoring(error, { request, context });
}
```

Хук `onRequestError` — новый в Next.js 15. Он получает все серверные ошибки с контекстом запроса, что удобно для интеграции с системами мониторинга.

## Обновлённый next/image

Компонент `<Image>` получил новый пропс `decoding` и теперь по умолчанию генерирует атрибут `decoding="async"`, что позволяет браузеру декодировать изображения в фоне:

```typescript
import Image from 'next/image';

export function Hero() {
  return (
    <Image
      src="/hero.jpg"
      alt="Главный баннер"
      width={1200}
      height={600}
      priority
      // decoding="auto" | "async" | "sync"
      // По умолчанию "async" для не-priority изображений
    />
  );
}
```

## Руководство по миграции с Next.js 14

### Шаг 1: обновление зависимостей

```bash
npm install next@latest react@latest react-dom@latest
```

### Шаг 2: запуск codemods

```bash
# Миграция асинхронных API запросов
npx @next/codemod@canary next-async-request-api .

# Если нужно обновить использование next/image
npx @next/codemod@canary next-image-experimental .
```

### Шаг 3: проверка кэширования

Просмотрите места, где явно или неявно рассчитывали на кэширование `fetch`-запросов. Добавьте `cache: 'force-cache'` или `next: { revalidate: N }` там, где кэш необходим.

### Шаг 4: обновление типов

Если проект написан на TypeScript, обновите типы пропсов для всех `page.tsx` и `layout.tsx` файлов — `params` и `searchParams` теперь Promise:

```typescript
// Было
type Props = { params: { id: string } };

// Стало
type Props = { params: Promise<{ id: string }> };
```

### Шаг 5: rename конфига (опционально)

Если хотите использовать TypeScript конфигурацию:

```bash
mv next.config.js next.config.ts
```

Добавьте импорт типа в начало файла:

```typescript
import type { NextConfig } from 'next';

const config: NextConfig = {
  // ваша конфигурация
};

export default config;
```

## Заключение

Next.js 15 делает ставку на явность: запросы данных и кэширование теперь требуют явных указаний вместо неочевидных значений по умолчанию. Это увеличивает предсказуемость поведения приложений, хотя и требует работы при миграции.

Ключевые изменения для запоминания:
- `cookies()`, `headers()`, `params`, `searchParams` — теперь асинхронные
- `fetch`-запросы и GET Route Handlers — не кэшируются по умолчанию
- Turbopack Dev — стабильный, рекомендован для разработки
- `after()` и `<Form>` — новые стабильные API
- `next.config.ts` — нативная поддержка TypeScript в конфигурации

Для глубокого изучения Next.js и практики с реальными проектами смотрите курс на PurpleSchool: https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs15-features
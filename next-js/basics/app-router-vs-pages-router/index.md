---
metaTitle: App Router vs Pages Router в Next.js — в чём разница и что выбрать
metaDescription: Сравниваем App Router и Pages Router в Next.js — отличия в маршрутизации, рендеринге, layouts, получении данных, метаданных и когда стоит мигрировать на App Router.
author: Антон Ларичев
title: App Router vs Pages Router в Next.js — сравнение и выбор
preview: Разбираем ключевые отличия App Router и Pages Router в Next.js — как изменилась маршрутизация, рендеринг, работа с данными и метаданными, и что выбрать для нового проекта.
---

## Введение

Next.js поддерживает две системы маршрутизации: старый **Pages Router** (существует с версии 1.0) и новый **App Router**, представленный в версии 13 и ставший стабильным в 13.4. Обе системы работают в одном проекте, что позволяет мигрировать постепенно.

Разобраться в отличиях важно, чтобы принять правильное решение для нового проекта и понять, стоит ли мигрировать существующий.

## Структура папок

**Pages Router** использует папку `pages/`:

```
pages/
├── index.tsx           # /
├── about.tsx           # /about
├── blog/
│   ├── index.tsx       # /blog
│   └── [slug].tsx      # /blog/:slug
└── api/
    └── users.ts        # /api/users
```

**App Router** использует папку `app/`:

```
app/
├── layout.tsx          # корневой layout (обязателен)
├── page.tsx            # /
├── about/
│   └── page.tsx        # /about
├── blog/
│   ├── page.tsx        # /blog
│   └── [slug]/
│       └── page.tsx    # /blog/:slug
└── api/
    └── users/
        └── route.ts    # /api/users (Route Handlers)
```

В App Router каждый маршрут — это папка с файлом `page.tsx`. Это добавляет гибкость: рядом с `page.tsx` можно положить `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` — и они автоматически привяжутся к маршруту.

## Рендеринг и серверные компоненты

**Pages Router**: все компоненты — клиентские по умолчанию. Серверная логика только в `getServerSideProps`, `getStaticProps`, `getInitialProps`.

**App Router**: все компоненты — **серверные** по умолчанию (React Server Components). Для клиентского кода нужна директива `'use client'`:

```typescript
// App Router — серверный компонент (по умолчанию)
// Может напрямую делать fetch, обращаться к БД
async function UserProfile({ userId }: { userId: string }) {
  const user = await fetchUser(userId); // прямо в компоненте!
  return <div>{user.name}</div>;
}

// App Router — клиентский компонент
'use client';

import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

В Pages Router такого разделения нет — все компоненты страниц могут использовать хуки.

## Получение данных

### Pages Router

```typescript
// pages/blog/[slug].tsx
import type { GetStaticProps, GetStaticPaths } from 'next';

interface Props {
  post: Post;
}

export default function BlogPost({ post }: Props) {
  return <article>{post.content}</article>;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await fetchAllPosts();
  return {
    paths: posts.map(p => ({ params: { slug: p.slug } })),
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const post = await fetchPost(params!.slug as string);
  return { props: { post }, revalidate: 60 };
};
```

### App Router

```typescript
// app/blog/[slug]/page.tsx
interface Props {
  params: { slug: string };
}

// Данные получают прямо в компоненте
export default async function BlogPost({ params }: Props) {
  const post = await fetchPost(params.slug); // async компонент
  return <article>{post.content}</article>;
}

// Генерация статических путей
export async function generateStaticParams() {
  const posts = await fetchAllPosts();
  return posts.map(p => ({ slug: p.slug }));
}
```

App Router убирает специальные функции (`getStaticProps` и т.д.) — данные получаются прямо в `async`-компонентах.

## Layouts — вложенные макеты

**Pages Router**: общие макеты реализуются вручную через `_app.tsx` или оборачиванием компонентов.

**App Router**: вложенные layouts встроены в систему маршрутизации:

```typescript
// app/layout.tsx — применяется ко всему сайту
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

// app/dashboard/layout.tsx — применяется только к /dashboard/*
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

Layouts сохраняют своё состояние при навигации между страницами одного уровня — это важное преимущество для производительности.

## Метаданные

**Pages Router**: метаданные через компонент `<Head>` из `next/head`:

```typescript
import Head from 'next/head';

export default function Page() {
  return (
    <>
      <Head>
        <title>Заголовок страницы</title>
        <meta name="description" content="Описание" />
      </Head>
      <main>...</main>
    </>
  );
}
```

**App Router**: Metadata API через экспорт объекта `metadata` или функции `generateMetadata`:

```typescript
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPost(params.slug);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { images: [post.coverImage] },
  };
}
```

## Сравнительная таблица

| Параметр | Pages Router | App Router |
|---|---|---|
| Папка | `pages/` | `app/` |
| Компоненты | Клиентские | Серверные по умолчанию |
| Получение данных | `getServerSideProps` / `getStaticProps` | async-компоненты + fetch |
| Layouts | Ручная реализация | Встроенные вложенные layouts |
| Метаданные | `<Head>` из next/head | Metadata API |
| Loading-состояния | Ручная реализация | `loading.tsx` |
| Error Boundaries | Ручная реализация | `error.tsx` |
| Стримминг / Suspense | Ограниченная поддержка | Полная поддержка |
| Стабильность | Стабильный (устаревающий) | Стабильный (рекомендуемый) |

## Что выбрать для нового проекта

**Новый проект → App Router**. Это официально рекомендованный подход. Он даёт Server Components, встроенные layouts, стримминг и лучший SEO через Metadata API. Экосистема библиотек активно адаптируется под App Router.

**Существующий Pages Router проект** — можно не мигрировать немедленно. Pages Router поддерживается и не планируется к удалению. Миграция имеет смысл, если нужны специфические возможности App Router.

**Постепенная миграция** возможна: в одном проекте могут сосуществовать обе папки (`pages/` и `app/`). Маршруты из `app/` имеют приоритет.

## Итог

App Router — это эволюция Next.js, которая меняет фундаментальный подход к рендерингу: от клиентских компонентов с серверными функциями к серверным компонентам по умолчанию. Это требует нового мышления, но даёт лучшую производительность и более чистую архитектуру.

Для углублённого изучения — смотрите курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledge-base&utm_medium=article&utm_campaign=next-app-router-vs-pages-router).

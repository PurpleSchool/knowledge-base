---
metaTitle: Metadata API в Next.js 13+ — title, description, Open Graph, robots
metaDescription: Разбираем Metadata API в Next.js 13 App Router — статические и динамические метаданные, title.template, Open Graph, Twitter Card, robots, canonical и generateMetadata.
author: Антон Ларичев
title: Metadata API в Next.js 13+ — SEO-метаданные в App Router
preview: Полный разбор Metadata API в Next.js App Router — как задавать title, description, Open Graph, Twitter Card, robots и canonical через экспорт metadata или функцию generateMetadata.
---

## Введение

SEO-метаданные — title, description, Open Graph, canonical URL — критически важны для продвижения сайта в поисковых системах и красивого отображения ссылок в социальных сетях.

В Pages Router метаданные задавались через компонент `<Head>` из `next/head`. В App Router (Next.js 13+) появился новый **Metadata API** — декларативный способ управления метаданными через экспорт объекта или функции из файлов `layout.tsx` и `page.tsx`.

## Статические метаданные

Для страниц с фиксированными метаданными экспортируйте объект `metadata`:

```typescript
// app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'О компании — PurpleSchool',
  description: 'Онлайн-школа программирования PurpleSchool — курсы по React, Next.js, TypeScript и Node.js.',
};

export default function AboutPage() {
  return <main>...</main>;
}
```

## Шаблон заголовка — title.template

Чтобы не повторять название сайта в каждом заголовке, используйте `title.template` в корневом layout:

```typescript
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | PurpleSchool',
    default: 'PurpleSchool — онлайн-школа программирования',
  },
  description: 'Курсы по React, Next.js, TypeScript и Node.js.',
};
```

```typescript
// app/courses/page.tsx
export const metadata: Metadata = {
  title: 'Каталог курсов', // → "Каталог курсов | PurpleSchool"
};
```

`%s` заменяется на `title` дочерней страницы. `default` используется если страница не задала собственный `title`.

## Динамические метаданные — generateMetadata

Для страниц с динамическими данными (например, статья блога или страница курса) используйте функцию `generateMetadata`:

```typescript
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await fetchPost(params.slug);

  if (!post) {
    return {
      title: 'Статья не найдена',
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [
        {
          url: post.coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
  };
}
```

`generateMetadata` выполняется на сервере, может делать async-запросы, и её результат кешируется вместе со страницей.

## Open Graph и социальные сети

```typescript
export const metadata: Metadata = {
  title: 'Курс по Next.js',
  description: 'Полное руководство по Next.js с нуля до продакшена.',
  openGraph: {
    title: 'Курс по Next.js — PurpleSchool',
    description: 'Полное руководство по Next.js с нуля до продакшена.',
    url: 'https://purpleschool.ru/course/nextjs',
    siteName: 'PurpleSchool',
    images: [
      {
        url: 'https://purpleschool.ru/og/nextjs-course.jpg',
        width: 1200,
        height: 630,
        alt: 'Курс по Next.js',
      },
    ],
    locale: 'ru_RU',
    type: 'website',
  },
};
```

Open Graph используется Facebook, VK, Telegram и другими платформами для формирования превью ссылки.

## Twitter Card

```typescript
export const metadata: Metadata = {
  twitter: {
    card: 'summary_large_image',
    title: 'Курс по Next.js',
    description: 'Полное руководство по Next.js.',
    images: ['https://purpleschool.ru/og/nextjs-course.jpg'],
    creator: '@purpleschool',
  },
};
```

## Robots — управление индексацией

```typescript
export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};
```

Для страниц, которые не должны индексироваться (например, страница входа, корзина):

```typescript
// app/login/page.tsx
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
```

## Canonical URL

Canonical URL указывает поисковику основной адрес страницы — важно при дублировании контента:

```typescript
export const metadata: Metadata = {
  alternates: {
    canonical: 'https://purpleschool.ru/course/nextjs',
    languages: {
      'ru-RU': 'https://purpleschool.ru/course/nextjs',
    },
  },
};
```

## Иконки и манифест приложения

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};
```

## Файл opengraph-image и twitter-image

Для удобства Next.js поддерживает специальные файлы изображений. Если положить `opengraph-image.jpg` рядом с `page.tsx`, он автоматически станет OG-изображением для этой страницы:

```
app/
├── layout.tsx
├── page.tsx
├── opengraph-image.jpg   # OG-изображение для /
└── blog/
    ├── page.tsx
    └── [slug]/
        ├── page.tsx
        └── opengraph-image.tsx  # динамическое OG-изображение
```

Файл `opengraph-image.tsx` может генерировать изображение динамически через `ImageResponse`:

```typescript
// app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);

  return new ImageResponse(
    (
      <div
        style={{
          background: '#1a1a2e',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          color: 'white',
        }}
      >
        {post.title}
      </div>
    ),
    { ...size }
  );
}
```

## Metadata в Pages Router

В Pages Router используется компонент `<Head>`. Metadata API там недоступен:

```typescript
// pages/about.tsx
import Head from 'next/head';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>О компании | PurpleSchool</title>
        <meta name="description" content="Описание страницы" />
        <meta property="og:title" content="О компании" />
        <meta property="og:image" content="/og/about.jpg" />
      </Head>
      <main>...</main>
    </>
  );
}
```

## Итог

Metadata API в App Router — декларативный и мощный способ управлять SEO:

- **`metadata`** — статические метаданные для фиксированных страниц
- **`generateMetadata`** — динамические метаданные для страниц с данными
- **`title.template`** — шаблон заголовка для всего сайта
- **Open Graph / Twitter Card** — красивые превью в социальных сетях
- **Canonical** — управление дублированием контента
- **opengraph-image.tsx** — динамическая генерация OG-изображений

Подробнее про Next.js — на курсе [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledge-base&utm_medium=article&utm_campaign=next-metadata-api).

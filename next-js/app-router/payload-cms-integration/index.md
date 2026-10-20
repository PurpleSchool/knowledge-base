---
metaTitle: "Next.js и Payload CMS: интеграция и настройка"
metaDescription: "Пошаговое руководство по интеграции Payload CMS с Next.js App Router: настройка, коллекции, получение данных и рендеринг страниц."
author: "Антон Ларичев"
title: "Интеграция Payload CMS с Next.js"
preview: "Как подключить Payload CMS к проекту на Next.js, настроить коллекции и получать данные через REST и Local API."
---

## Что такое Payload CMS

Payload CMS — это headless CMS с открытым исходным кодом, написанная на TypeScript. В отличие от Contentful или Sanity, Payload разворачивается прямо в вашем проекте и работает рядом с Next.js-приложением. Это означает полный контроль над данными, отсутствие внешних зависимостей и возможность использовать Local API без сетевых запросов.

Начиная с версии 2.0, Payload официально поддерживает Next.js App Router и может быть встроен прямо в Next.js-приложение как часть монорепозитория или единого проекта.

## Создание проекта

Самый быстрый способ начать — использовать официальный шаблон:

```bash
npx create-payload-app@latest
```

Выберите шаблон `website` или `blank` и укажите, что хотите использовать Next.js. Либо добавьте Payload в существующий Next.js-проект:

```bash
npm install payload @payloadcms/next @payloadcms/richtext-lexical @payloadcms/db-sqlite
```

Для продакшена рекомендуется использовать PostgreSQL:

```bash
npm install @payloadcms/db-postgres
```

## Структура файлов

Payload в Next.js-проекте размещается следующим образом:

```
/app
  /(payload)
    admin/
      [[...segments]]/
        page.tsx
        not-found.tsx
    api/
      [...slug]/
        route.ts
    custom.scss
    layout.tsx
/payload.config.ts
/collections/
  Posts.ts
  Media.ts
  Users.ts
```

Папка `(payload)` — это route group, который изолирует маршруты Payload-админки от остального приложения.

## Конфигурация Payload

Основная конфигурация описывается в файле `payload.config.ts` в корне проекта:

```typescript
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { nextPayload } from '@payloadcms/next'
import path from 'path'
import { fileURLToPath } from 'url'
import { Posts } from './collections/Posts'
import { Media } from './collections/Media'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Posts, Media, Users],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp: true,
})
```

Переменные окружения в `.env.local`:

```bash
DATABASE_URI=postgresql://user:password@localhost:5432/mydb
PAYLOAD_SECRET=your-super-secret-key-at-least-32-chars
```

## Создание коллекций

Коллекции — это основная единица данных в Payload. Каждая коллекция соответствует таблице в базе данных.

### Коллекция постов

```typescript
// collections/Posts.ts
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Черновик', value: 'draft' },
        { label: 'Опубликован', value: 'published' },
      ],
      defaultValue: 'draft',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}
```

### Коллекция медиафайлов

```typescript
// collections/Media.ts
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  upload: {
    staticDir: 'public/media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 512,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
```

## Настройка маршрутов Payload в App Router

Payload требует двух маршрутов в App Router.

### API-маршрут

```typescript
// app/(payload)/api/[...slug]/route.ts
import { REST_DELETE, REST_GET, REST_PATCH, REST_POST } from '@payloadcms/next/routes'
import config from '@payload-config'

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
```

### Страница админки

```typescript
// app/(payload)/admin/[[...segments]]/page.tsx
import type { Metadata } from 'next'
import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'

export const generateMetadata = ({ params }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params })

type Args = {
  params: Promise<{
    segments: string[]
  }>
}

export default async function Page({ params }: Args) {
  return RootPage({ config, params, importMap })
}
```

```typescript
// app/(payload)/admin/[[...segments]]/not-found.tsx
import { NotFoundPage } from '@payloadcms/next/views'
import config from '@payload-config'
import { importMap } from '../importMap'

export default async function NotFound() {
  return NotFoundPage({ config, importMap })
}
```

### Layout для Payload

```typescript
// app/(payload)/layout.tsx
import config from '@payload-config'
import { RootLayout } from '@payloadcms/next/layouts'
import { importMap } from './importMap'
import React from 'react'

type Args = {
  children: React.ReactNode
}

export default async function Layout({ children }: Args) {
  return RootLayout({ children, config, importMap })
}
```

## Получение данных через Local API

Local API — главное преимущество Payload при использовании с Next.js. Запросы выполняются напрямую к базе данных без HTTP, что значительно быстрее.

### Утилита для инициализации Payload

```typescript
// lib/payload.ts
import config from '@payload-config'
import { getPayload } from 'payload'

export async function getPayloadClient() {
  return getPayload({ config })
}
```

### Страница со списком постов

```typescript
// app/blog/page.tsx
import { getPayloadClient } from '@/lib/payload'

export const revalidate = 60

export default async function BlogPage() {
  const payload = await getPayloadClient()

  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: {
      status: {
        equals: 'published',
      },
    },
    sort: '-publishedAt',
    limit: 10,
  })

  return (
    <main>
      <h1>Блог</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <a href={`/blog/${post.slug}`}>{post.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

### Динамические страницы с generateStaticParams

```typescript
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'

export async function generateStaticParams() {
  const payload = await getPayloadClient()

  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: {
      status: { equals: 'published' },
    },
    select: { slug: true },
    limit: 1000,
  })

  return posts.map((post) => ({ slug: post.slug }))
}

type Props = {
  params: Promise<{ slug: string }>
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'posts',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    depth: 1,
    limit: 1,
  })

  if (!docs[0]) {
    notFound()
  }

  const post = docs[0]

  return (
    <article>
      <h1>{post.title}</h1>
      {post.publishedAt && (
        <time dateTime={post.publishedAt}>
          {new Date(post.publishedAt).toLocaleDateString('ru-RU')}
        </time>
      )}
    </article>
  )
}
```

### Параметр depth

Параметр `depth` управляет тем, насколько глубоко Payload раскрывает связанные документы. При `depth: 0` вы получите только ID связанных записей, при `depth: 1` — полные объекты.

```typescript
const { docs } = await payload.find({
  collection: 'posts',
  depth: 2, // раскрыть посты -> автора -> его аватар
})

// При depth: 1 coverImage будет объектом с полями файла,
// а не просто строкой с ID
const imageUrl = post.coverImage?.url
```

## Типизация с Payload

Payload автоматически генерирует TypeScript-типы из конфигурации. После запуска `payload generate:types` в файле `payload-types.ts` появятся все типы:

```typescript
import type { Post, Media } from '@/payload-types'

async function getPost(slug: string): Promise<Post | null> {
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  return docs[0] ?? null
}
```

Добавьте скрипт в `package.json`:

```json
{
  "scripts": {
    "generate:types": "payload generate:types",
    "generate:importmap": "payload generate:importmap"
  }
}
```

## REST API

Помимо Local API, Payload автоматически создаёт REST API. Это полезно для клиентских компонентов или внешних сервисов:

```typescript
// Получить посты через REST
const response = await fetch(
  `${process.env.NEXT_PUBLIC_SERVER_URL}/api/posts?where[status][equals]=published&sort=-publishedAt&limit=10`,
  { next: { revalidate: 60 } }
)

const data = await response.json()
```

Структура URL для запросов:
- `GET /api/{collection}` — список документов
- `GET /api/{collection}/{id}` — один документ
- `POST /api/{collection}` — создание
- `PATCH /api/{collection}/{id}` — обновление
- `DELETE /api/{collection}/{id}` — удаление

## Draft Preview с черновиками

Payload поддерживает черновики и Preview-режим из коробки. Включите версии в коллекции:

```typescript
export const Posts: CollectionConfig = {
  slug: 'posts',
  versions: {
    drafts: {
      autosave: {
        interval: 375,
      },
    },
  },
  // ...поля
}
```

Для Preview добавьте обработчик в Next.js:

```typescript
// app/api/draft/route.ts
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const collection = searchParams.get('collection')

  const draft = await draftMode()
  draft.enable()

  redirect(`/${collection}/${slug}`)
}
```

В компоненте страницы проверяйте режим черновика:

```typescript
import { draftMode } from 'next/headers'

export default async function PostPage({ params }: Props) {
  const { isEnabled: isDraft } = await draftMode()
  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    draft: isDraft,
    depth: 1,
    limit: 1,
  })

  // ...
}
```

## Итог

Payload CMS и Next.js образуют продуктивную связку: TypeScript от начала до конца, Local API без HTTP-оверхеда, автоматическая генерация типов и встроенный Preview-режим. Такой стек позволяет разрабатывать контентные проекты с полным контролем над кодом и данными, не прибегая к сторонним SaaS-платформам.

Основные шаги интеграции:
1. Установить Payload и настроить `payload.config.ts`
2. Описать коллекции с нужными полями
3. Добавить маршруты `app/(payload)/api` и `app/(payload)/admin`
4. Использовать Local API через `getPayload` в серверных компонентах
5. Сгенерировать типы командой `payload generate:types`

Изучить Next.js и научиться строить полноценные приложения с нуля можно на курсе [Next.js для разработчиков](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=payload-cms-integration) на PurpleSchool.
---
metaTitle: "revalidateTag и revalidatePath в Next.js — инвалидация кэша"
metaDescription: "Как работают revalidateTag и revalidatePath в Next.js App Router: сброс кэша по тегу и маршруту, примеры с Server Actions и Route Handlers."
author: "Антон Ларичев"
title: "revalidateTag и revalidatePath — инвалидация кэша в Next.js"
preview: "Разбираем два механизма инвалидации кэша в Next.js App Router: revalidateTag для точечного сброса по тегу и revalidatePath для инвалидации по маршруту."
---

## Зачем нужна инвалидация кэша

Next.js App Router агрессивно кэширует данные. Запросы через `fetch` по умолчанию кэшируются на неопределённое время — это ускоряет приложение, но создаёт проблему: когда данные на сервере обновляются, пользователи продолжают видеть устаревшую версию страницы.

Для решения этой задачи Next.js предоставляет два инструмента:

- `revalidatePath` — сбрасывает кэш для конкретного маршрута
- `revalidateTag` — сбрасывает кэш для всех запросов, помеченных определённым тегом

Оба инструмента работают по принципу «отложенной инвалидации»: после вызова функции кэш помечается как устаревший, и следующий запрос к этому ресурсу получит свежие данные с сервера.

## revalidatePath

`revalidatePath` инвалидирует кэшированные данные для конкретного пути. После вызова следующий запрос к этому маршруту получит актуальные данные.

### Синтаксис

```typescript
revalidatePath(path: string, type?: 'page' | 'layout')
```

Параметр `type` определяет область инвалидации:

- `'page'` (значение по умолчанию) — инвалидирует только страницу по указанному пути
- `'layout'` — инвалидирует все страницы, использующие данный layout

### Использование в Server Action

Наиболее распространённый паттерн — вызов `revalidatePath` внутри Server Action после изменения данных:

```typescript
'use server'

import { revalidatePath } from 'next/cache'

export async function updatePost(id: string, data: FormData) {
  await db.post.update({
    where: { id },
    data: { title: data.get('title') as string }
  })

  // Инвалидируем список постов и страницу конкретного поста
  revalidatePath('/blog')
  revalidatePath(`/blog/${id}`)
}
```

### Использование в Route Handler

```typescript
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()

  revalidatePath(body.path)

  return NextResponse.json({ revalidated: true })
}
```

### Инвалидация через layout

Если нужно сбросить кэш всех страниц внутри определённого раздела, используйте тип `'layout'`:

```typescript
import { revalidatePath } from 'next/cache'

// Инвалидирует все страницы, использующие layout /dashboard
revalidatePath('/dashboard', 'layout')

// Инвалидирует только конкретную страницу
revalidatePath('/dashboard/settings', 'page')
```

При `type: 'layout'` Next.js пройдёт по дереву маршрутов и сбросит кэш для всех страниц, которые рендерятся через указанный layout.

## revalidateTag

`revalidateTag` работает иначе: запросы `fetch` помечаются тегами, и при инвалидации кэш сбрасывается для всех запросов с указанным тегом — независимо от того, на каких маршрутах они используются.

Это более гибкий подход, когда одни и те же данные отображаются на нескольких страницах.

### Добавление тегов к запросам

Теги добавляются через опцию `next.tags` в `fetch`:

```typescript
async function getPosts() {
  const response = await fetch('https://api.example.com/posts', {
    next: { tags: ['posts'] }
  })
  return response.json()
}

async function getPost(id: string) {
  const response = await fetch(`https://api.example.com/posts/${id}`, {
    next: { tags: ['posts', `post-${id}`] }
  })
  return response.json()
}
```

Один запрос может иметь несколько тегов — это позволяет инвалидировать его как точечно (по тегу конкретной записи), так и группово (по общему тегу коллекции).

### Инвалидация по тегу

```typescript
'use server'

import { revalidateTag } from 'next/cache'

export async function createPost(data: FormData) {
  await db.post.create({
    data: {
      title: data.get('title') as string,
      content: data.get('content') as string
    }
  })

  // Инвалидирует все запросы с тегом 'posts'
  revalidateTag('posts')
}

export async function updatePost(id: string, data: FormData) {
  await db.post.update({
    where: { id },
    data: {
      title: data.get('title') as string,
      content: data.get('content') as string
    }
  })

  // Инвалидирует только конкретный пост
  revalidateTag(`post-${id}`)
  // Также обновляем список, если нужно актуализировать превью
  revalidateTag('posts')
}

export async function deletePost(id: string) {
  await db.post.delete({ where: { id } })

  revalidateTag('posts')
  revalidateTag(`post-${id}`)
}
```

### Полный пример: блог с постами

Рассмотрим типичный сценарий — блог, где список постов и страница отдельного поста используют одни и те же данные:

```typescript
// app/blog/page.tsx
export default async function BlogPage() {
  const posts = await fetch('https://api.example.com/posts', {
    next: { tags: ['posts'] }
  }).then(r => r.json())

  return (
    <ul>
      {posts.map((post: { id: string; title: string }) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

```typescript
// app/blog/[id]/page.tsx
export default async function PostPage({
  params
}: {
  params: { id: string }
}) {
  const post = await fetch(`https://api.example.com/posts/${params.id}`, {
    next: { tags: ['posts', `post-${params.id}`] }
  }).then(r => r.json())

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  )
}
```

```typescript
// app/actions/posts.ts
'use server'

import { revalidateTag } from 'next/cache'

export async function updatePost(id: string, data: FormData) {
  await db.post.update({
    where: { id },
    data: { title: data.get('title') as string }
  })

  // Инвалидирует:
  // - список постов на /blog (тег 'posts')
  // - страницу /blog/[id] (тег `post-${id}` и тег 'posts')
  revalidateTag(`post-${id}`)
  revalidateTag('posts')
}
```

После вызова `revalidateTag('posts')` следующий рендер `/blog` получит свежие данные. После `revalidateTag('post-123')` обновится только страница `/blog/123`.

## Сравнение подходов

| | revalidatePath | revalidateTag |
|---|---|---|
| Единица инвалидации | Маршрут (URL) | Тег запроса |
| Охват | Один путь или layout | Все запросы с тегом |
| Настройка fetch | Не требуется | Нужно добавить `next.tags` |
| Лучший случай | Данные только на одной странице | Данные на нескольких страницах |

**Используйте `revalidatePath` когда:**
- Данные используются только на одной странице
- Нужно быстро инвалидировать весь маршрут без дополнительной настройки
- Простая структура без перекрёстных зависимостей

**Используйте `revalidateTag` когда:**
- Одни данные отображаются на нескольких страницах
- Нужна точечная инвалидация (только один пост, а не весь список)
- Сложная иерархия: список + детальная страница + виджет на другой странице

## Интеграция с Webhook

Распространённый паттерн — инвалидация кэша при получении webhook от внешнего сервиса (CMS, магазин, база данных):

```typescript
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json(
      { message: 'Invalid secret' },
      { status: 401 }
    )
  }

  const body = await request.json()
  const { type, id } = body

  switch (type) {
    case 'post':
      revalidateTag('posts')
      if (id) revalidateTag(`post-${id}`)
      break
    case 'category':
      revalidateTag('categories')
      break
    default:
      return NextResponse.json(
        { message: 'Unknown type' },
        { status: 400 }
      )
  }

  return NextResponse.json({ revalidated: true })
}
```

CMS отправляет POST-запрос с секретом при сохранении материала — Next.js сбрасывает нужный кэш и следующий пользователь видит актуальную версию.

## Использование с unstable_cache

Если вы кэшируете произвольные функции через `unstable_cache` (не только `fetch`), теги работают аналогично:

```typescript
import { unstable_cache } from 'next/cache'

const getCachedPosts = unstable_cache(
  async () => {
    return db.post.findMany({ orderBy: { createdAt: 'desc' } })
  },
  ['posts-db-cache'],
  { tags: ['posts'] }
)
```

```typescript
'use server'

import { revalidateTag } from 'next/cache'

export async function createPost(data: FormData) {
  await db.post.create({ data: { title: data.get('title') as string } })

  // Инвалидирует и fetch с тегом 'posts',
  // и unstable_cache с тегом 'posts'
  revalidateTag('posts')
}
```

Один вызов `revalidateTag` сбрасывает кэш из обоих источников — и `fetch`, и `unstable_cache`.

## Типичные ошибки

### Забыть добавить теги к fetch

```typescript
// Не сработает — тег не задан, revalidateTag не найдёт этот запрос
const posts = await fetch('/api/posts').then(r => r.json())

// Правильно
const posts = await fetch('/api/posts', {
  next: { tags: ['posts'] }
}).then(r => r.json())
```

### Передать динамический сегмент вместо реального пути

```typescript
// Неправильно — инвалидирует маршрут с литеральным '[id]', не конкретные посты
revalidatePath('/blog/[id]')

// Правильно — передавайте реальный путь
revalidatePath(`/blog/${postId}`)

// Или инвалидируйте все страницы через layout
revalidatePath('/blog', 'layout')
```

### Вызов на клиенте

```typescript
// Ошибка — revalidateTag нельзя вызывать в клиентских компонентах
'use client'

import { revalidateTag } from 'next/cache'

export function DeleteButton({ id }: { id: string }) {
  return (
    <button onClick={() => revalidateTag('posts')}>
      Удалить
    </button>
  )
}
```

```typescript
// Правильно — выносите в Server Action
'use server'

import { revalidateTag } from 'next/cache'

export async function deletePost(id: string) {
  await db.post.delete({ where: { id } })
  revalidateTag('posts')
}
```

```typescript
// Клиентский компонент вызывает Server Action
'use client'

import { deletePost } from './actions'

export function DeleteButton({ id }: { id: string }) {
  return (
    <button onClick={() => deletePost(id)}>
      Удалить
    </button>
  )
}
```

### Ожидать немедленного эффекта

Кэш не сбрасывается в момент вызова — он помечается как устаревший. Текущий HTTP-запрос продолжит видеть закэшированные данные. Свежие данные появятся только при следующем обращении к ресурсу. Это нормальное поведение, не баг.

### Тестировать в режиме разработки

В `next dev` кэширование работает иначе: запросы не кэшируются так агрессивно, поэтому инвалидация может казаться ненужной или работать неожиданно. Тестируйте поведение кэша в production-сборке:

```bash
npx next build && npx next start
```

## Итог

`revalidatePath` и `revalidateTag` решают одну задачу разными способами. `revalidatePath` проще в использовании — укажи путь, и кэш для него сбросится. `revalidateTag` требует предварительной разметки запросов тегами, но даёт точечный контроль: можно инвалидировать только данные конкретной сущности на всех страницах сразу, не затрагивая несвязанные данные.

Для большинства приложений оба инструмента используются вместе: `revalidateTag` для данных с перекрёстными зависимостями, `revalidatePath` для быстрого сброса конкретного маршрута.

Чтобы глубже разобраться с кэшированием, роутингом и Server Actions в Next.js App Router, смотрите курс на PurpleSchool: https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=revalidate-cache
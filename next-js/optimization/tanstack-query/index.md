---
metaTitle: "Next.js с TanStack Query — кэширование и синхронизация данных"
metaDescription: "Подключение TanStack Query к Next.js App Router: QueryClient, prefetch, dehydrate, мутации и серверный рендеринг на практике."
author: "Антон Ларичев"
title: "Next.js с TanStack Query"
preview: "Как интегрировать TanStack Query в Next.js App Router: настройка провайдера, серверный prefetch, гидратация и мутации."
---

## Зачем TanStack Query в Next.js

Next.js App Router предоставляет Server Components и встроенный `fetch` с кэшированием, но для клиентских сценариев этого часто недостаточно. Когда нужны фоновые обновления, polling, оптимистичные обновления, пагинация с кэшем или синхронизация состояния между компонентами — TanStack Query (ранее React Query) решает эти задачи значительно элегантнее самописных решений.

При правильной интеграции TanStack Query и Next.js можно получить лучшее из двух миров: серверный рендеринг с prefetch-данными и богатый клиентский UX без водопада запросов.

## Установка

```bash
npm install @tanstack/react-query
# Опционально — инструменты для разработки
npm install @tanstack/react-query-devtools
```

## Настройка QueryClient провайдера

App Router разграничивает серверные и клиентские компоненты. `QueryClientProvider` использует React Context, поэтому его нужно вынести в клиентский компонент.

```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

Важный момент: `QueryClient` создаётся внутри `useState`, а не на уровне модуля. Это гарантирует, что каждый запрос в SSR получит собственный экземпляр клиента без утечки данных между пользователями.

Подключаем провайдер в корневой layout:

```typescript
// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

## Базовые запросы в клиентских компонентах

Для простых случаев достаточно `useQuery` в Client Component:

```typescript
// app/posts/PostsList.tsx
'use client'

import { useQuery } from '@tanstack/react-query'

type Post = {
  id: number
  title: string
  body: string
}

async function fetchPosts(): Promise<Post[]> {
  const res = await fetch('/api/posts')
  if (!res.ok) throw new Error('Ошибка загрузки постов')
  return res.json()
}

export function PostsList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <p>Загрузка...</p>
  if (isError) return <p>Ошибка: {error.message}</p>

  return (
    <ul>
      {data?.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

`queryKey` — уникальный идентификатор запроса для кэша. Принято использовать массивы с иерархией: `['posts']`, `['posts', postId]`, `['posts', { status: 'published' }]`.

## Серверный prefetch и гидратация

Самый мощный паттерн интеграции с App Router — prefetch данных на сервере и передача их клиенту через гидратацию. Страница рендерится с данными сразу, без скелетона.

### Настройка серверного QueryClient

```typescript
// lib/query.ts
import { QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

export const getQueryClient = cache(() => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
}))
```

`cache` из React гарантирует один экземпляр `QueryClient` на один серверный рендер-проход (Request Memoization).

### HydrationBoundary

```typescript
// app/providers.tsx — добавляем HydrationBoundary
'use client'

import {
  QueryClient,
  QueryClientProvider,
  HydrationBoundary,
  dehydrate,
} from '@tanstack/react-query'
```

Применяем на странице:

```typescript
// app/posts/page.tsx (Server Component)
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query'
import { PostsList } from './PostsList'

async function fetchPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 },
  })
  return res.json()
}

export default async function PostsPage() {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostsList />
    </HydrationBoundary>
  )
}
```

Когда `PostsList` монтируется на клиенте, TanStack Query обнаруживает, что данные по ключу `['posts']` уже есть в гидратированном состоянии — и не делает повторный запрос, пока данные не устареют.

## Запросы с параметрами

Динамические страницы с параметром в URL:

```typescript
// app/posts/[id]/page.tsx (Server Component)
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query'
import { PostDetail } from './PostDetail'

type Props = {
  params: { id: string }
}

async function fetchPost(id: string) {
  const res = await fetch(`https://api.example.com/posts/${id}`)
  if (!res.ok) throw new Error('Пост не найден')
  return res.json()
}

export default async function PostPage({ params }: Props) {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['posts', params.id],
    queryFn: () => fetchPost(params.id),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostDetail postId={params.id} />
    </HydrationBoundary>
  )
}
```

```typescript
// app/posts/[id]/PostDetail.tsx
'use client'

import { useQuery } from '@tanstack/react-query'

type Props = {
  postId: string
}

export function PostDetail({ postId }: Props) {
  const { data: post } = useQuery({
    queryKey: ['posts', postId],
    queryFn: () => fetch(`/api/posts/${postId}`).then((r) => r.json()),
  })

  if (!post) return null

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  )
}
```

Клиентский `queryKey` совпадает с серверным — гидратация сработает автоматически.

## Мутации

`useMutation` управляет запросами на изменение данных: создание, обновление, удаление.

```typescript
// app/posts/CreatePostForm.tsx
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

type NewPost = {
  title: string
  body: string
}

async function createPost(data: NewPost) {
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Не удалось создать пост')
  return res.json()
}

export function CreatePostForm() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      // Инвалидируем кэш — список постов обновится
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      setTitle('')
      setBody('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ title, body })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Заголовок"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Текст поста"
      />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Создание...' : 'Создать'}
      </button>
      {mutation.isError && <p>Ошибка: {mutation.error.message}</p>}
    </form>
  )
}
```

### Оптимистичные обновления

Оптимистичное обновление показывает результат немедленно, до ответа сервера:

```typescript
const mutation = useMutation({
  mutationFn: (postId: number) =>
    fetch(`/api/posts/${postId}`, { method: 'DELETE' }).then((r) => r.json()),

  onMutate: async (postId) => {
    // Отменяем текущие запросы, чтобы не перезаписать оптимистичный апдейт
    await queryClient.cancelQueries({ queryKey: ['posts'] })

    // Сохраняем предыдущее состояние для отката
    const previousPosts = queryClient.getQueryData(['posts'])

    // Оптимистично удаляем из кэша
    queryClient.setQueryData(['posts'], (old: Post[]) =>
      old.filter((p) => p.id !== postId)
    )

    return { previousPosts }
  },

  onError: (_err, _postId, context) => {
    // Откатываем при ошибке
    queryClient.setQueryData(['posts'], context?.previousPosts)
  },

  onSettled: () => {
    // После завершения (успех или ошибка) синхронизируем с сервером
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  },
})
```

## Бесконечная пагинация

`useInfiniteQuery` подходит для лент и списков с кнопкой «Загрузить ещё»:

```typescript
'use client'

import { useInfiniteQuery } from '@tanstack/react-query'

type PostsPage = {
  posts: Post[]
  nextCursor: number | null
}

async function fetchPostsPage({ pageParam = 0 }): Promise<PostsPage> {
  const res = await fetch(`/api/posts?cursor=${pageParam}&limit=10`)
  return res.json()
}

export function InfinitePosts() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts', 'infinite'],
    queryFn: fetchPostsPage,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  const posts = data?.pages.flatMap((page) => page.posts) ?? []

  return (
    <div>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Загрузка...' : 'Загрузить ещё'}
        </button>
      )}
    </div>
  )
}
```

## Вынесение логики запросов

Для повторного использования запросов удобно выносить их в хуки:

```typescript
// hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const postsKeys = {
  all: ['posts'] as const,
  detail: (id: string) => ['posts', id] as const,
}

export function usePosts() {
  return useQuery({
    queryKey: postsKeys.all,
    queryFn: () => fetch('/api/posts').then((r) => r.json()),
  })
}

export function usePost(id: string) {
  return useQuery({
    queryKey: postsKeys.detail(id),
    queryFn: () => fetch(`/api/posts/${id}`).then((r) => r.json()),
    enabled: Boolean(id),
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/posts/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postsKeys.all })
    },
  })
}
```

Объект `postsKeys` централизует ключи запросов и исключает опечатки при инвалидации.

## Параллельные запросы

Для нескольких независимых запросов используется `useQueries`:

```typescript
'use client'

import { useQueries } from '@tanstack/react-query'

export function UserDashboard({ userId }: { userId: string }) {
  const results = useQueries({
    queries: [
      {
        queryKey: ['user', userId],
        queryFn: () => fetch(`/api/users/${userId}`).then((r) => r.json()),
      },
      {
        queryKey: ['user', userId, 'posts'],
        queryFn: () =>
          fetch(`/api/users/${userId}/posts`).then((r) => r.json()),
      },
      {
        queryKey: ['user', userId, 'stats'],
        queryFn: () =>
          fetch(`/api/users/${userId}/stats`).then((r) => r.json()),
      },
    ],
  })

  const [userQuery, postsQuery, statsQuery] = results
  const isLoading = results.some((r) => r.isLoading)

  if (isLoading) return <p>Загрузка...</p>

  return (
    <div>
      <h2>{userQuery.data?.name}</h2>
      <p>Постов: {postsQuery.data?.length}</p>
      <p>Просмотров: {statsQuery.data?.views}</p>
    </div>
  )
}
```

Все три запроса выполняются параллельно.

## Фоновое обновление и polling

TanStack Query поддерживает автоматическое обновление данных по интервалу:

```typescript
export function LiveOrderStatus({ orderId }: { orderId: string }) {
  const { data } = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => fetch(`/api/orders/${orderId}`).then((r) => r.json()),
    // Опрашиваем каждые 5 секунд
    refetchInterval: 5000,
    // Останавливаем polling, когда заказ завершён
    refetchIntervalInBackground: false,
    enabled: true,
  })

  return <p>Статус: {data?.status}</p>
}
```

## Типичные ошибки

**Создание QueryClient на уровне модуля.** В SSR это приведёт к шарингу кэша между запросами разных пользователей. Всегда используйте `useState` или `cache` от React.

**Несовпадение queryKey на сервере и клиенте.** Гидратация не сработает, если ключи отличаются хотя бы одним элементом. Используйте один объект с ключами (`postsKeys`) для обоих сторон.

**Слишком маленький `staleTime`.** По умолчанию `staleTime: 0` — данные считаются устаревшими сразу после загрузки. При серверном prefetch это означает немедленный повторный запрос на клиенте. Устанавливайте значение, соответствующее частоте изменения данных.

**Вызов хуков в Server Components.** `useQuery` и `useMutation` работают только в Client Components. Для серверной стороны используйте только `prefetchQuery` и `dehydrate`.

## Заключение

TanStack Query дополняет Next.js App Router там, где встроенных инструментов не хватает: клиентский кэш, оптимистичные обновления, polling, бесконечная пагинация. Паттерн «prefetch на сервере + гидратация на клиенте» позволяет получить быстрый первый рендер без дублирования запросов.

Основной рецепт успешной интеграции:
1. Клиентский `QueryClientProvider` со своим провайдером.
2. Серверный `getQueryClient()` через `cache` для prefetch в Server Components.
3. `HydrationBoundary` на страницах с серверными данными.
4. Централизованные `queryKey` для надёжной гидратации и инвалидации.

Подробнее о работе с Next.js и современными инструментами для фронтенда вы можете узнать на курсе [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-tanstack-query).

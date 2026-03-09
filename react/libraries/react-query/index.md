---
metaTitle: React Query (TanStack Query) - работа с сервером в React
metaDescription: Полное руководство по TanStack Query: useQuery, useMutation, кеширование, инвалидация данных и оптимистичные обновления
author: Олег Марков
title: React Query (TanStack Query) - работа с сервером
preview: Изучите TanStack Query для управления серверным состоянием в React. useQuery, useMutation, кеширование и синхронизация данных с сервером
---

## Введение

Каждое React-приложение рано или поздно сталкивается с задачей получения данных с сервера. На первый взгляд кажется, что `useEffect` + `useState` вполне справляются с этой задачей. Но стоит приложению немного вырасти, и вы обнаружите целый пласт проблем: дублирование запросов, устаревание данных, race conditions, ручное управление состояниями загрузки и ошибки, сложная логика обновления кэша.

**TanStack Query** (ранее известная как **React Query**) — это библиотека для управления «серверным состоянием» в React-приложениях. Она берёт на себя все сложности работы с асинхронными данными: кэширование, фоновую синхронизацию, инвалидацию, пагинацию и многое другое.

В этой статье вы узнаете, как установить и настроить TanStack Query, как использовать ключевые хуки `useQuery` и `useMutation`, научитесь управлять кэшем, реализуете бесконечную прокрутку и оптимистичные обновления.

## Что такое серверное состояние и зачем нужна TanStack Query

Прежде чем переходить к коду, важно понять концептуальное различие между двумя типами состояния в React-приложениях.

**Клиентское состояние** — это данные, которые существуют только в браузере: открыт ли модальное окно, выбранный пункт меню, значение в поле ввода. Оно синхронное, предсказуемое и полностью под вашим контролем.

**Серверное состояние** — это данные, которые хранятся на сервере и лишь отображаются в браузере: список пользователей, содержимое статьи, данные профиля. У него принципиально другие характеристики:

- Оно асинхронное — получение данных требует времени
- Оно может устареть — другой пользователь мог изменить данные пока вы работаете
- Оно разделяется между несколькими компонентами
- Оно требует кэширования для производительности

Попытка управлять серверным состоянием теми же инструментами, что и клиентским (Redux, Zustand), приводит к значительному усложнению кода. TanStack Query решает эту проблему, предоставляя специализированные инструменты именно для серверного состояния.

Вот что вы получаете «из коробки»:

- Автоматическое кэширование с настраиваемым временем жизни
- Фоновое обновление устаревших данных
- Дедупликация одновременных запросов
- Автоматические повторные попытки при ошибках сети
- Инвалидация и синхронизация кэша
- Оптимистичные обновления
- Пагинация и бесконечная прокрутка
- DevTools для отладки

## Установка и настройка

### Установка пакетов

```bash
npm install @tanstack/react-query
```

Для работы с DevTools (рекомендуется в разработке):

```bash
npm install @tanstack/react-query-devtools
```

### Создание QueryClient

`QueryClient` — это центральный объект, который управляет всем кэшем запросов. Он хранит данные, отслеживает состояние запросов и обеспечивает связь между компонентами.

```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Время, в течение которого данные считаются «свежими»
      // Пока данные свежие, повторный запрос не выполняется
      staleTime: 1000 * 60 * 5, // 5 минут

      // Время хранения неиспользуемых данных в кэше
      gcTime: 1000 * 60 * 10, // 10 минут (раньше называлось cacheTime)

      // Количество повторных попыток при ошибке
      retry: 3,

      // Задержка между повторными попытками (экспоненциальная)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Обновлять данные при фокусе окна браузера
      refetchOnWindowFocus: true,

      // Обновлять данные при восстановлении сетевого соединения
      refetchOnReconnect: true,
    },
    mutations: {
      // Количество повторных попыток для мутаций
      retry: 0,
    },
  },
});
```

### Подключение QueryClientProvider

`QueryClientProvider` — это React-провайдер, который делает `QueryClient` доступным для всех компонентов приложения. Его нужно разместить как можно выше в дереве компонентов.

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/query-client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* DevTools отображаются только в режиме разработки */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

Если вы используете Next.js App Router, создайте отдельный компонент-провайдер, поскольку провайдер требует `'use client'`:

```tsx
// src/components/providers/QueryProvider.tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

```tsx
// src/app/layout.tsx
import { QueryProvider } from '@/components/providers/QueryProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

## useQuery: получение данных

`useQuery` — основной хук для получения и кэширования данных. Он принимает объект конфигурации и возвращает объект с состоянием запроса.

### Базовое использование

```typescript
// src/api/posts.ts
// Функция для получения данных — обычная async функция
interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

export async function fetchPosts(): Promise<Post[]> {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function fetchPostById(id: number): Promise<Post> {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);

  if (!response.ok) {
    throw new Error(`Post ${id} not found`);
  }

  return response.json();
}
```

```tsx
// src/components/PostsList.tsx
import { useQuery } from '@tanstack/react-query';
import { fetchPosts } from '../api/posts';

function PostsList() {
  const {
    data: posts,       // Данные ответа (типизированы автоматически)
    isLoading,         // true при первой загрузке (нет данных в кэше)
    isFetching,        // true при любом запросе (включая фоновое обновление)
    isSuccess,         // true если запрос успешно завершён
    isError,           // true если запрос завершился ошибкой
    error,             // Объект ошибки
    refetch,           // Функция для ручного перезапроса
    dataUpdatedAt,     // Время последнего успешного обновления данных
  } = useQuery({
    queryKey: ['posts'],        // Уникальный ключ для кэша
    queryFn: fetchPosts,        // Функция получения данных
    staleTime: 1000 * 60 * 2,  // Перезаписать глобальные настройки: 2 минуты
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <span className="animate-spin">⏳</span>
        <span>Загрузка постов...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500">
        <p>Ошибка загрузки: {error.message}</p>
        <button onClick={() => refetch()}>Повторить</button>
      </div>
    );
  }

  return (
    <div>
      {/* isFetching будет true при фоновом обновлении */}
      {isFetching && <div className="text-sm text-gray-400">Обновление...</div>}

      <ul>
        {posts?.map((post) => (
          <li key={post.id}>
            <h3>{post.title}</h3>
            <p>{post.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Ключи запросов (Query Keys)

Ключ запроса — это уникальный идентификатор для данных в кэше. Это может быть строка, массив строк или массив с дополнительными параметрами. TanStack Query использует ключ для дедупликации запросов и управления инвалидацией.

```typescript
// Простой строковый ключ
useQuery({ queryKey: ['todos'], queryFn: fetchTodos });

// Массив с идентификатором — для запросов с параметрами
useQuery({ queryKey: ['posts', 42], queryFn: () => fetchPostById(42) });

// Массив с объектом — для запросов с несколькими параметрами
useQuery({
  queryKey: ['posts', { page: 1, limit: 10, status: 'published' }],
  queryFn: () => fetchPosts({ page: 1, limit: 10, status: 'published' }),
});

// Ключи с вложенностью — удобно для инвалидации групп
useQuery({ queryKey: ['users', userId, 'profile'], queryFn: () => fetchUserProfile(userId) });
useQuery({ queryKey: ['users', userId, 'posts'], queryFn: () => fetchUserPosts(userId) });
// Инвалидация ['users', userId] инвалидирует оба запроса
```

Важно: ключи сравниваются структурно (deep equality), поэтому `['posts', { id: 1 }]` и `['posts', { id: 1 }]` — это один и тот же ключ.

### Запрос с параметрами

```tsx
// src/components/PostDetail.tsx
import { useQuery } from '@tanstack/react-query';
import { fetchPostById } from '../api/posts';

interface PostDetailProps {
  postId: number;
}

function PostDetail({ postId }: PostDetailProps) {
  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['posts', postId],         // Ключ включает параметр запроса
    queryFn: () => fetchPostById(postId), // Функция использует параметр из замыкания
    enabled: postId > 0,                  // Запрос выполняется только если postId > 0
  });

  if (isLoading) return <div>Загрузка...</div>;
  if (isError) return <div>Пост не найден</div>;

  return (
    <article>
      <h1>{post?.title}</h1>
      <p>{post?.body}</p>
    </article>
  );
}
```

### Параметры useQuery

```typescript
const query = useQuery({
  // Уникальный ключ запроса (обязательно)
  queryKey: ['posts'],

  // Функция для получения данных (обязательно)
  queryFn: fetchPosts,

  // Включить/выключить запрос
  // Полезно для условных запросов или зависимых запросов
  enabled: true,

  // Считать данные свежими N миллисекунд
  // 0 = всегда устаревшие (запрашивать при каждом монтировании)
  // Infinity = никогда не устаревают
  staleTime: 1000 * 60 * 5,

  // Как долго хранить неиспользуемые данные в кэше
  gcTime: 1000 * 60 * 10,

  // Обновлять при монтировании компонента (если данные устарели)
  refetchOnMount: true,

  // Обновлять при получении фокуса окном браузера
  refetchOnWindowFocus: true,

  // Обновлять при восстановлении соединения
  refetchOnReconnect: true,

  // Интервал автоматического обновления (в мс), 0 = отключено
  refetchInterval: 0,

  // Продолжать обновление, когда вкладка неактивна
  refetchIntervalInBackground: false,

  // Количество повторных попыток при ошибке
  retry: 3,

  // Задержка между попытками
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

  // Начальные данные (не помечаются как устаревшие автоматически)
  initialData: [],

  // Данные-заменитель (не сохраняются в кэш)
  placeholderData: [],

  // Выбрать/преобразовать данные
  select: (data) => data.filter(post => post.userId === 1),

  // Коллбэки
  meta: { source: 'posts-component' },
});
```

### Зависимые запросы

Часто второй запрос зависит от результата первого. Используйте параметр `enabled` для создания цепочки запросов:

```tsx
function UserPosts({ userId }: { userId: number }) {
  // Первый запрос: получаем профиль пользователя
  const userQuery = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
  });

  // Второй запрос: получаем посты только после загрузки профиля
  const postsQuery = useQuery({
    queryKey: ['users', userId, 'posts'],
    queryFn: () => fetchUserPosts(userQuery.data!.id),
    // Запрос не выполняется пока не получены данные пользователя
    enabled: !!userQuery.data,
  });

  if (userQuery.isLoading) return <div>Загрузка профиля...</div>;
  if (postsQuery.isLoading) return <div>Загрузка постов пользователя...</div>;

  return (
    <div>
      <h2>{userQuery.data?.name}</h2>
      <ul>
        {postsQuery.data?.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Параллельные запросы

Несколько вызовов `useQuery` выполняются параллельно автоматически:

```tsx
function Dashboard() {
  // Все три запроса выполняются одновременно
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const postsQuery = useQuery({ queryKey: ['posts'], queryFn: fetchPosts });
  const statsQuery = useQuery({ queryKey: ['stats'], queryFn: fetchStats });

  const isLoading = usersQuery.isLoading || postsQuery.isLoading || statsQuery.isLoading;

  if (isLoading) return <div>Загрузка дашборда...</div>;

  return (
    <div>
      <UsersWidget data={usersQuery.data} />
      <PostsWidget data={postsQuery.data} />
      <StatsWidget data={statsQuery.data} />
    </div>
  );
}
```

Если количество запросов динамическое, используйте `useQueries`:

```tsx
import { useQueries } from '@tanstack/react-query';

function PostsGallery({ postIds }: { postIds: number[] }) {
  const postQueries = useQueries({
    queries: postIds.map(id => ({
      queryKey: ['posts', id],
      queryFn: () => fetchPostById(id),
    })),
  });

  const isLoading = postQueries.some(q => q.isLoading);
  const posts = postQueries.map(q => q.data).filter(Boolean);

  if (isLoading) return <div>Загрузка постов...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {posts.map(post => (
        <PostCard key={post?.id} post={post!} />
      ))}
    </div>
  );
}
```

## useMutation: отправка данных

`useMutation` используется для операций, которые изменяют данные на сервере: создание, обновление, удаление. В отличие от `useQuery`, мутации не выполняются автоматически — вы вызываете их вручную.

### Базовое использование

```typescript
// src/api/posts.ts
interface CreatePostData {
  title: string;
  body: string;
  userId: number;
}

export async function createPost(data: CreatePostData): Promise<Post> {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Не удалось создать пост');
  }

  return response.json();
}

export async function updatePost(id: number, data: Partial<CreatePostData>): Promise<Post> {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Не удалось обновить пост ${id}`);
  }

  return response.json();
}

export async function deletePost(id: number): Promise<void> {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Не удалось удалить пост ${id}`);
  }
}
```

```tsx
// src/components/CreatePostForm.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from '../api/posts';
import { useState } from 'react';

function CreatePostForm() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const mutation = useMutation({
    mutationFn: createPost,

    // Вызывается при успешном завершении
    onSuccess: (newPost) => {
      console.log('Пост создан:', newPost);
      // Инвалидируем кэш списка постов, чтобы он обновился
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      // Очищаем форму
      setTitle('');
      setBody('');
    },

    // Вызывается при ошибке
    onError: (error) => {
      console.error('Ошибка создания поста:', error.message);
    },

    // Вызывается всегда (и при успехе, и при ошибке)
    onSettled: () => {
      console.log('Запрос завершён');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      title,
      body,
      userId: 1,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок поста"
          required
        />
      </div>
      <div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Содержимое поста"
          required
        />
      </div>

      {mutation.isError && (
        <div className="text-red-500">{mutation.error.message}</div>
      )}

      {mutation.isSuccess && (
        <div className="text-green-500">Пост успешно создан!</div>
      )}

      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Создаём...' : 'Создать пост'}
      </button>
    </form>
  );
}
```

### mutateAsync для работы с промисами

Метод `mutate` работает с коллбэками, но иногда удобнее использовать `mutateAsync`, который возвращает промис:

```tsx
function PostActions({ postId }: { postId: number }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleDelete = async () => {
    const confirmed = window.confirm('Удалить пост?');
    if (!confirmed) return;

    try {
      // mutateAsync возвращает промис — удобно в async/await
      await deleteMutation.mutateAsync(postId);
      console.log('Пост удалён');
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleteMutation.isPending}
    >
      {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
    </button>
  );
}
```

### Состояния мутации

`useMutation` возвращает объект с несколькими полезными свойствами:

```typescript
const {
  mutate,        // Функция запуска мутации (без возвращаемого значения)
  mutateAsync,   // Функция запуска мутации (возвращает промис)
  isPending,     // true пока мутация выполняется
  isSuccess,     // true после успешного завершения
  isError,       // true после ошибки
  isIdle,        // true если мутация ещё не запускалась
  data,          // Данные ответа после успешного завершения
  error,         // Объект ошибки
  reset,         // Сбрасывает состояние мутации в isIdle
  variables,     // Аргументы последнего вызова mutate
  submittedAt,   // Время последнего вызова
} = useMutation({ mutationFn: createPost });
```

### Коллбэки с переменными и контекстом

Все коллбэки мутации получают переменные (аргументы вызова), результат/ошибку и контекст:

```tsx
interface UpdatePostVariables {
  id: number;
  title: string;
}

const updateMutation = useMutation({
  mutationFn: ({ id, title }: UpdatePostVariables) => updatePost(id, { title }),

  // variables — аргументы вызова mutate
  onMutate: async (variables) => {
    console.log('Начинаем обновление поста', variables.id);
    // Можно вернуть контекст для использования в onSuccess/onError
    return { previousTitle: 'Старый заголовок' };
  },

  // data — ответ сервера, variables — аргументы, context — результат onMutate
  onSuccess: (data, variables, context) => {
    console.log(`Пост ${variables.id} обновлён`);
    console.log('Старый заголовок был:', context?.previousTitle);
  },

  onError: (error, variables, context) => {
    console.error(`Ошибка обновления поста ${variables.id}:`, error.message);
  },

  onSettled: (data, error, variables) => {
    // Вызывается всегда после завершения
    queryClient.invalidateQueries({ queryKey: ['posts', variables.id] });
  },
});
```

## Инвалидация кэша с queryClient.invalidateQueries

Инвалидация кэша — ключевая концепция TanStack Query. Когда вы изменяете данные на сервере, нужно пометить соответствующие кэшированные данные как устаревшие, чтобы они были обновлены при следующем отображении.

### Базовая инвалидация

```tsx
import { useQueryClient } from '@tanstack/react-query';

function PostManager() {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      // Инвалидировать все запросы с ключом, начинающимся с 'posts'
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Post> }) => updatePost(id, data),
    onSuccess: (updatedPost) => {
      // Инвалидировать конкретный пост
      queryClient.invalidateQueries({ queryKey: ['posts', updatedPost.id] });
      // Также инвалидировать список постов
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
```

### Точная инвалидация с exact

По умолчанию `invalidateQueries` инвалидирует все запросы, ключ которых **начинается** с указанного ключа. Используйте `exact: true` для точного совпадения:

```typescript
// Инвалидирует ['posts'], ['posts', 1], ['posts', { page: 1 }] и т.д.
queryClient.invalidateQueries({ queryKey: ['posts'] });

// Инвалидирует ТОЛЬКО запросы с ключом ['posts']
queryClient.invalidateQueries({ queryKey: ['posts'], exact: true });

// Инвалидирует только запрос для поста с id=1
queryClient.invalidateQueries({ queryKey: ['posts', 1], exact: true });

// Инвалидировать все запросы с предикатом
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'posts' &&
    typeof query.queryKey[1] === 'number' &&
    query.queryKey[1] > 100,
});
```

### Прямое обновление кэша без перезапроса

Вместо инвалидации (которая вызывает новый запрос) можно напрямую обновить данные в кэше через `setQueryData`:

```typescript
const createMutation = useMutation({
  mutationFn: createPost,
  onSuccess: (newPost) => {
    // Вариант 1: Инвалидировать и перезапросить
    // queryClient.invalidateQueries({ queryKey: ['posts'] });

    // Вариант 2: Напрямую добавить новый пост в кэш (без нового HTTP-запроса)
    queryClient.setQueryData<Post[]>(['posts'], (oldPosts) => {
      if (!oldPosts) return [newPost];
      return [...oldPosts, newPost];
    });

    // Также сохранить данные нового поста для запроса по id
    queryClient.setQueryData(['posts', newPost.id], newPost);
  },
});
```

### Предзагрузка данных (Prefetching)

Предзагрузка позволяет загружать данные заранее — например, при наведении мыши на ссылку:

```tsx
function PostLink({ postId, title }: { postId: number; title: string }) {
  const queryClient = useQueryClient();

  const prefetchPost = () => {
    // Загружаем данные заранее, они попадут в кэш
    queryClient.prefetchQuery({
      queryKey: ['posts', postId],
      queryFn: () => fetchPostById(postId),
      // Не загружать если данные в кэше свежее 10 минут
      staleTime: 10 * 60 * 1000,
    });
  };

  return (
    <a
      href={`/posts/${postId}`}
      onMouseEnter={prefetchPost} // Начинаем загрузку при наведении
      onFocus={prefetchPost}       // И при фокусе (для доступности)
    >
      {title}
    </a>
  );
}
```

## useInfiniteQuery для пагинации

`useInfiniteQuery` — специализированный хук для реализации бесконечной прокрутки и «Загрузить ещё». Он автоматически объединяет данные нескольких страниц.

### Настройка API для бесконечной прокрутки

```typescript
// src/api/posts.ts
interface PostsPage {
  posts: Post[];
  nextPage: number | null;
  totalPages: number;
}

export async function fetchPostsPage(page: number = 1): Promise<PostsPage> {
  const limit = 10;
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=${limit}`
  );

  const posts: Post[] = await response.json();
  const total = parseInt(response.headers.get('X-Total-Count') ?? '100');
  const totalPages = Math.ceil(total / limit);

  return {
    posts,
    nextPage: page < totalPages ? page + 1 : null,
    totalPages,
  };
}
```

### Использование useInfiniteQuery

```tsx
// src/components/InfinitePostsList.tsx
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchPostsPage } from '../api/posts';
import { useRef, useEffect } from 'react';

function InfinitePostsList() {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,                   // Объект с pages[] и pageParams[]
    fetchNextPage,          // Загрузить следующую страницу
    fetchPreviousPage,      // Загрузить предыдущую страницу
    hasNextPage,            // true если есть ещё страницы
    hasPreviousPage,        // true если есть предыдущие страницы
    isFetchingNextPage,     // true при загрузке следующей страницы
    isFetchingPreviousPage, // true при загрузке предыдущей страницы
    isLoading,              // true при первой загрузке
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['posts', 'infinite'],
    queryFn: ({ pageParam }) => fetchPostsPage(pageParam),

    // Начальный параметр первой страницы
    initialPageParam: 1,

    // Возвращает параметр следующей страницы
    // Возвращает undefined если следующей страницы нет
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,

    // Опционально: для двунаправленной пагинации
    // getPreviousPageParam: (firstPage) => firstPage.previousPage ?? undefined,
  });

  // Автоматическая подгрузка при прокрутке с Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <div>Загрузка...</div>;
  if (isError) return <div>Ошибка: {error.message}</div>;

  // data.pages — массив ответов для каждой загруженной страницы
  const allPosts = data.pages.flatMap(page => page.posts);

  return (
    <div>
      <ul>
        {allPosts.map((post) => (
          <li key={post.id} className="mb-4 p-4 border rounded">
            <h3 className="font-semibold">{post.title}</h3>
            <p className="text-gray-600">{post.body}</p>
          </li>
        ))}
      </ul>

      {/* Элемент для отслеживания прокрутки */}
      <div ref={loadMoreRef} className="py-4 text-center">
        {isFetchingNextPage ? (
          <span>Загрузка...</span>
        ) : hasNextPage ? (
          <button onClick={() => fetchNextPage()}>
            Загрузить ещё
          </button>
        ) : (
          <span className="text-gray-400">Все посты загружены</span>
        )}
      </div>
    </div>
  );
}
```

### Пагинация с кнопками (классическая)

Если нужна классическая постраничная навигация, а не бесконечная прокрутка, используйте обычный `useQuery` с параметром `placeholderData`:

```tsx
import { useQuery, keepPreviousData } from '@tanstack/react-query';

function PaginatedPosts() {
  const [page, setPage] = useState(1);

  const { data, isPlaceholderData, isLoading } = useQuery({
    queryKey: ['posts', 'paginated', page],
    queryFn: () => fetchPostsPage(page),
    // Показывать предыдущие данные пока загружается новая страница
    // Это убирает "мигание" при переключении страниц
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      {isLoading ? (
        <div>Загрузка...</div>
      ) : (
        <>
          <ul>
            {data?.posts.map((post) => (
              <li key={post.id}>{post.title}</li>
            ))}
          </ul>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isPlaceholderData}
            >
              Назад
            </button>

            <span>Страница {page} из {data?.totalPages}</span>

            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!data?.nextPage || isPlaceholderData}
            >
              Вперёд
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

## Оптимистичные обновления

Оптимистичные обновления — техника, при которой UI обновляется немедленно, не дожидаясь ответа сервера. Если запрос завершается ошибкой, изменения откатываются. Это значительно улучшает ощущение отзывчивости интерфейса.

### Оптимистичное удаление

```tsx
interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

function TodoList() {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTodo(id),

    // onMutate вызывается СИНХРОННО до отправки запроса
    onMutate: async (deletedId) => {
      // 1. Отменяем исходящие запросы для этого ключа,
      //    чтобы они не перезаписали наши оптимистичные данные
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      // 2. Сохраняем текущие данные (для возможного отката)
      const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);

      // 3. Оптимистично обновляем кэш
      queryClient.setQueryData<Todo[]>(['todos'], (oldTodos) =>
        oldTodos?.filter(todo => todo.id !== deletedId) ?? []
      );

      // 4. Возвращаем контекст с сохранёнными данными
      return { previousTodos };
    },

    // При ошибке откатываем изменения
    onError: (error, deletedId, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
      console.error('Ошибка удаления, откатываем изменения');
    },

    // После завершения (успех или ошибка) синхронизируемся с сервером
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const todosQuery = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });

  return (
    <ul>
      {todosQuery.data?.map(todo => (
        <li key={todo.id} className="flex items-center gap-2">
          <span>{todo.title}</span>
          <button
            onClick={() => deleteMutation.mutate(todo.id)}
            disabled={deleteMutation.isPending}
          >
            Удалить
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### Оптимистичное обновление

```tsx
function TodoItem({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: (todo: Todo) =>
      updateTodo(todo.id, { completed: !todo.completed }),

    onMutate: async (toggledTodo) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);

      // Оптимистично переключаем статус
      queryClient.setQueryData<Todo[]>(['todos'], (oldTodos) =>
        oldTodos?.map(t =>
          t.id === toggledTodo.id
            ? { ...t, completed: !t.completed }
            : t
        ) ?? []
      );

      return { previousTodos };
    },

    onError: (error, variables, context) => {
      // Откатываем при ошибке
      queryClient.setQueryData(['todos'], context?.previousTodos);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return (
    <li
      className={`cursor-pointer ${todo.completed ? 'line-through text-gray-400' : ''}`}
      onClick={() => toggleMutation.mutate(todo)}
    >
      {todo.title}
    </li>
  );
}
```

### Оптимистичное добавление с временным ID

```tsx
function AddTodoForm() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');

  const addMutation = useMutation({
    mutationFn: (title: string) => createTodo({ title, completed: false }),

    onMutate: async (newTitle) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);

      // Создаём временный объект с отрицательным ID
      const optimisticTodo: Todo = {
        id: -Date.now(), // Временный уникальный ID
        title: newTitle,
        completed: false,
      };

      queryClient.setQueryData<Todo[]>(['todos'], (old) =>
        [...(old ?? []), optimisticTodo]
      );

      return { previousTodos, optimisticTodo };
    },

    onSuccess: (realTodo, variables, context) => {
      // Заменяем временный элемент реальным ответом сервера
      queryClient.setQueryData<Todo[]>(['todos'], (old) =>
        old?.map(todo =>
          todo.id === context?.optimisticTodo.id ? realTodo : todo
        ) ?? []
      );
    },

    onError: (error, variables, context) => {
      queryClient.setQueryData(['todos'], context?.previousTodos);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addMutation.mutate(title);
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Новая задача"
      />
      <button type="submit" disabled={addMutation.isPending}>
        Добавить
      </button>
    </form>
  );
}
```

## QueryClient DevTools для отладки

TanStack Query DevTools — незаменимый инструмент разработчика, который отображает состояние кэша в реальном времени.

### Установка и подключение

```bash
npm install @tanstack/react-query-devtools
```

```tsx
// Базовое подключение (уже показано выше)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      {/* Отображается только в process.env.NODE_ENV === 'development' */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Настройка DevTools

```tsx
<ReactQueryDevtools
  // Открыт по умолчанию
  initialIsOpen={false}

  // Позиция кнопки: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  buttonPosition="bottom-right"

  // Позиция панели: 'top' | 'bottom' | 'left' | 'right'
  position="bottom"
/>
```

### Что показывают DevTools

DevTools предоставляют полную информацию о состоянии кэша:

- **Список всех запросов** с их ключами и статусами (fresh, stale, fetching, paused, inactive)
- **Данные кэша** для каждого запроса — можно изучить прямо в интерфейсе
- **Время последнего обновления** и время до следующего устаревания
- **Количество наблюдателей** — сколько компонентов используют данный запрос
- **История запросов** и ошибки

### Программное использование QueryClient

Помимо UI-инструмента, можно работать с кэшем программно:

```typescript
import { useQueryClient } from '@tanstack/react-query';

function DebugPanel() {
  const queryClient = useQueryClient();

  const logCacheState = () => {
    // Получить все запросы из кэша
    const queries = queryClient.getQueryCache().getAll();
    console.log('Все запросы в кэше:', queries.map(q => ({
      key: q.queryKey,
      state: q.state.status,
      dataUpdatedAt: new Date(q.state.dataUpdatedAt).toISOString(),
    })));
  };

  const clearCache = () => {
    // Очистить весь кэш
    queryClient.clear();
    console.log('Кэш очищен');
  };

  const refetchAll = () => {
    // Перезапросить все активные запросы
    queryClient.refetchQueries({ type: 'active' });
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2">
      <button onClick={logCacheState}>Показать кэш в консоли</button>
      <button onClick={clearCache}>Очистить кэш</button>
      <button onClick={refetchAll}>Обновить все данные</button>
    </div>
  );
}
```

## Пользовательские хуки для инкапсуляции логики

Хорошей практикой является создание пользовательских хуков, которые инкапсулируют логику работы с конкретными данными:

```typescript
// src/hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPosts, fetchPostById, createPost, updatePost, deletePost } from '../api/posts';

// Хук для получения всех постов
export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    staleTime: 1000 * 60 * 5,
  });
}

// Хук для получения конкретного поста
export function usePost(id: number) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: () => fetchPostById(id),
    enabled: id > 0,
  });
}

// Хук для создания поста с инвалидацией
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: (newPost) => {
      queryClient.setQueryData<Post[]>(['posts'], (old) =>
        old ? [...old, newPost] : [newPost]
      );
    },
  });
}

// Хук для обновления поста с оптимистичным обновлением
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Post> }) =>
      updatePost(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['posts', id] });
      const previousPost = queryClient.getQueryData<Post>(['posts', id]);

      queryClient.setQueryData<Post>(['posts', id], (old) =>
        old ? { ...old, ...data } : old
      );

      return { previousPost };
    },

    onError: (error, { id }, context) => {
      if (context?.previousPost) {
        queryClient.setQueryData(['posts', id], context.previousPost);
      }
    },

    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['posts', id] });
    },
  });
}

// Хук для удаления поста
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<Post[]>(['posts'], (old) =>
        old?.filter(post => post.id !== deletedId) ?? []
      );
      queryClient.removeQueries({ queryKey: ['posts', deletedId] });
    },
  });
}
```

Использование этих хуков в компонентах становится очень чистым:

```tsx
function PostsPage() {
  const { data: posts, isLoading } = usePosts();
  const createPost = useCreatePost();
  const deletePost = useDeletePost();

  if (isLoading) return <div>Загрузка...</div>;

  return (
    <div>
      {posts?.map(post => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <button onClick={() => deletePost.mutate(post.id)}>
            Удалить
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Обработка ошибок

TanStack Query предоставляет несколько механизмов для обработки ошибок.

### Глобальный обработчик ошибок

```typescript
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Глобальный обработчик для всех query-ошибок
      console.error(`Ошибка запроса ${String(query.queryKey)}:`, error.message);
      // Можно показать тост-уведомление
      // toast.error(`Ошибка: ${error.message}`);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      // Глобальный обработчик для всех mutation-ошибок
      console.error('Ошибка мутации:', error.message);
    },
  }),
});
```

### Error Boundary интеграция

TanStack Query поддерживает интеграцию с React Error Boundaries через параметр `throwOnError`:

```tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div>
              <p>Произошла ошибка: {error.message}</p>
              <button onClick={resetErrorBoundary}>Повторить</button>
            </div>
          )}
        >
          <PostsList />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

function PostsList() {
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
    // Пробрасывать ошибку в Error Boundary
    throwOnError: true,
  });

  return <ul>{data?.map(/* ... */)}</ul>;
}
```

## Заключение

TanStack Query — одна из наиболее удачных библиотек для управления серверным состоянием в React. Она решает реальные проблемы, с которыми сталкивается каждый разработчик при работе с асинхронными данными, и делает это элегантно и без лишней сложности.

Ключевые преимущества библиотеки:

- **Автоматическое кэширование** избавляет от лишних запросов и ускоряет приложение
- **Фоновая синхронизация** поддерживает данные актуальными без явных усилий
- **useQuery и useMutation** — простые, но мощные примитивы для любых сценариев
- **useInfiniteQuery** упрощает реализацию бесконечной прокрутки
- **Оптимистичные обновления** улучшают UX с минимальным кодом
- **DevTools** делают отладку прозрачной и удобной
- **TypeScript-first** — полная типизация без дополнительных усилий

Рекомендуется использовать TanStack Query как основной инструмент для работы с серверными данными в любом React-приложении, независимо от того, используете ли вы Redux, Zustand или другое решение для клиентского состояния.

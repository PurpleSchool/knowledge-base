---
metaTitle: "Next.js с GraphQL и Apollo Client: полное руководство"
metaDescription: "Как настроить Apollo Client в Next.js App Router: запросы, мутации, кеширование и работа с серверными компонентами."
author: "Антон Ларичев"
title: "Next.js с GraphQL и Apollo Client"
preview: "Настройка Apollo Client в Next.js App Router: серверные и клиентские компоненты, запросы, мутации и стратегии кеширования."
---

## Введение

GraphQL — это язык запросов для API, который позволяет клиенту запрашивать ровно те данные, которые ему нужны. В связке с Apollo Client и Next.js App Router вы получаете мощный стек для построения типобезопасных, производительных приложений.

В этой статье разберём полный цикл интеграции: от установки пакетов до работы с мутациями и кешированием в серверных и клиентских компонентах.

## Установка зависимостей

Создайте проект Next.js, если его ещё нет:

```bash
npx create-next-app@latest my-app --typescript
cd my-app
```

Установите Apollo Client и необходимые пакеты:

```bash
npm install @apollo/client graphql
npm install @apollo/experimental-nextjs-app-support
```

Пакет `@apollo/experimental-nextjs-app-support` специально разработан для интеграции Apollo Client с App Router и решает проблемы совместимости с серверными компонентами React.

## Настройка Apollo Client

Создайте файл конфигурации клиента. App Router требует особого подхода — нельзя использовать один экземпляр клиента для всего приложения из-за архитектуры серверных компонентов.

```typescript
// lib/apollo-client.ts
import { HttpLink } from '@apollo/client';
import {
  registerApolloClient,
  ApolloClient,
  InMemoryCache,
} from '@apollo/experimental-nextjs-app-support';

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://api.example.com/graphql',
    }),
  });
});
```

`registerApolloClient` создаёт новый экземпляр клиента для каждого серверного запроса, что предотвращает утечку данных между пользователями.

## Провайдер для клиентских компонентов

Клиентские компоненты требуют отдельного провайдера. Создайте его:

```typescript
// lib/apollo-provider.tsx
'use client';

import { ApolloLink, HttpLink } from '@apollo/client';
import {
  ApolloNextAppProvider,
  InMemoryCache,
  ApolloClient,
} from '@apollo/experimental-nextjs-app-support';

function makeClient() {
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://api.example.com/graphql',
    fetchOptions: { cache: 'no-store' },
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([httpLink]),
  });
}

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
```

Подключите провайдер в корневом layout:

```typescript
// app/layout.tsx
import { ApolloProvider } from '@/lib/apollo-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <ApolloProvider>{children}</ApolloProvider>
      </body>
    </html>
  );
}
```

## Запросы в серверных компонентах

Одно из главных преимуществ App Router — возможность делать GraphQL-запросы прямо в серверных компонентах без хуков.

Определите типы и запрос:

```typescript
// types/post.ts
export interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar: string;
  };
  createdAt: string;
}

export interface PostsQueryResult {
  posts: Post[];
}
```

```typescript
// graphql/queries.ts
import { gql } from '@apollo/client';

export const GET_POSTS = gql`
  query GetPosts($limit: Int, $offset: Int) {
    posts(limit: $limit, offset: $offset) {
      id
      title
      content
      author {
        name
        avatar
      }
      createdAt
    }
  }
`;

export const GET_POST_BY_ID = gql`
  query GetPostById($id: ID!) {
    post(id: $id) {
      id
      title
      content
      author {
        name
        avatar
      }
      createdAt
    }
  }
`;
```

Используйте запрос в серверном компоненте:

```typescript
// app/posts/page.tsx
import { query } from '@/lib/apollo-client';
import { GET_POSTS } from '@/graphql/queries';
import { PostsQueryResult } from '@/types/post';

export default async function PostsPage() {
  const { data } = await query<PostsQueryResult>({
    query: GET_POSTS,
    variables: { limit: 10, offset: 0 },
  });

  return (
    <main>
      <h1>Статьи</h1>
      <ul>
        {data.posts.map((post) => (
          <li key={post.id}>
            <a href={`/posts/${post.id}`}>{post.title}</a>
            <p>Автор: {post.author.name}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

Данный компонент выполняется на сервере — HTML-страница с данными отдаётся клиенту уже готовой, что положительно влияет на SEO и время первой отрисовки.

## Динамические маршруты с GraphQL

Для страниц с динамическими параметрами используйте `generateStaticParams` для статической генерации:

```typescript
// app/posts/[id]/page.tsx
import { query } from '@/lib/apollo-client';
import { GET_POST_BY_ID, GET_POSTS } from '@/graphql/queries';
import { Post, PostsQueryResult } from '@/types/post';
import { notFound } from 'next/navigation';

interface Props {
  params: { id: string };
}

export async function generateStaticParams() {
  const { data } = await query<PostsQueryResult>({
    query: GET_POSTS,
    variables: { limit: 100, offset: 0 },
  });

  return data.posts.map((post) => ({ id: post.id }));
}

export default async function PostPage({ params }: Props) {
  const { data, error } = await query<{ post: Post }>(
    {
      query: GET_POST_BY_ID,
      variables: { id: params.id },
    }
  );

  if (error || !data.post) {
    notFound();
  }

  const { post } = data;

  return (
    <article>
      <h1>{post.title}</h1>
      <div>
        <img src={post.author.avatar} alt={post.author.name} />
        <span>{post.author.name}</span>
        <time>{new Date(post.createdAt).toLocaleDateString('ru-RU')}</time>
      </div>
      <div>{post.content}</div>
    </article>
  );
}
```

## Запросы в клиентских компонентах

Для интерактивных частей приложения — фильтры, поиск, бесконечная прокрутка — используйте хуки Apollo в клиентских компонентах.

```typescript
// components/PostSearch.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const SEARCH_POSTS = gql`
  query SearchPosts($query: String!, $limit: Int) {
    searchPosts(query: $query, limit: $limit) {
      id
      title
      preview
    }
  }
`;

interface SearchResult {
  searchPosts: Array<{
    id: string;
    title: string;
    preview: string;
  }>;
}

export function PostSearch() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, loading, error } = useQuery<SearchResult>(SEARCH_POSTS, {
    variables: { query: searchTerm, limit: 5 },
    skip: searchTerm.length < 3,
  });

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Поиск статей..."
      />

      {loading && <p>Загрузка...</p>}
      {error && <p>Ошибка: {error.message}</p>}

      {data && (
        <ul>
          {data.searchPosts.map((post) => (
            <li key={post.id}>
              <a href={`/posts/${post.id}`}>{post.title}</a>
              <p>{post.preview}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

Опция `skip` позволяет не выполнять запрос до тех пор, пока строка поиска не достигнет минимальной длины.

## Мутации

Мутации используются для изменения данных — создание, обновление, удаление.

```typescript
// graphql/mutations.ts
import { gql } from '@apollo/client';

export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      content
      createdAt
    }
  }
`;

export const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      success
      message
    }
  }
`;
```

```typescript
// components/CreatePostForm.tsx
'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_POST } from '@/graphql/mutations';
import { GET_POSTS } from '@/graphql/queries';

interface CreatePostInput {
  title: string;
  content: string;
}

export function CreatePostForm() {
  const [form, setForm] = useState<CreatePostInput>({
    title: '',
    content: '',
  });

  const [createPost, { loading, error }] = useMutation(CREATE_POST, {
    refetchQueries: [{ query: GET_POSTS, variables: { limit: 10, offset: 0 } }],
    onCompleted: () => {
      setForm({ title: '', content: '' });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPost({ variables: { input: form } });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Заголовок"
        required
      />
      <textarea
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        placeholder="Содержание"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Сохранение...' : 'Создать статью'}
      </button>
      {error && <p>Ошибка: {error.message}</p>}
    </form>
  );
}
```

Параметр `refetchQueries` автоматически перезапрашивает список постов после успешного создания, обновляя UI.

## Оптимистичные обновления

Чтобы интерфейс реагировал мгновенно, не дожидаясь ответа сервера, используйте оптимистичные обновления:

```typescript
// components/LikeButton.tsx
'use client';

import { useMutation, gql } from '@apollo/client';

const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
      likesCount
      isLikedByMe
    }
  }
`;

interface Props {
  postId: string;
  likesCount: number;
  isLikedByMe: boolean;
}

export function LikeButton({ postId, likesCount, isLikedByMe }: Props) {
  const [likePost] = useMutation(LIKE_POST, {
    optimisticResponse: {
      likePost: {
        __typename: 'Post',
        id: postId,
        likesCount: isLikedByMe ? likesCount - 1 : likesCount + 1,
        isLikedByMe: !isLikedByMe,
      },
    },
  });

  return (
    <button onClick={() => likePost({ variables: { postId } })}>
      {isLikedByMe ? 'Убрать лайк' : 'Лайк'} ({likesCount})
    </button>
  );
}
```

`optimisticResponse` немедленно обновляет кеш Apollo с предполагаемым результатом. Если сервер вернёт другие данные, кеш обновится снова.

## Управление кешем

InMemoryCache Apollo хранит нормализованный граф объектов. Можно настроить политики кеширования:

```typescript
// lib/apollo-client.ts
import { HttpLink, InMemoryCache } from '@apollo/client';
import { registerApolloClient, ApolloClient } from '@apollo/experimental-nextjs-app-support';

export const { getClient, query } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            posts: {
              // Слияние пагинированных результатов
              keyArgs: false,
              merge(existing = [], incoming) {
                return [...existing, ...incoming];
              },
            },
          },
        },
        Post: {
          // Apollo идентифицирует объекты по id по умолчанию
          // Это явное указание для ясности
          keyFields: ['id'],
        },
      },
    }),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
    }),
  });
});
```

Политика `keyArgs: false` говорит Apollo не разделять кеш по аргументам запроса, а функция `merge` объединяет страницы пагинации.

## Обработка ошибок

Apollo различает сетевые ошибки и ошибки GraphQL:

```typescript
// components/PostsList.tsx
'use client';

import { useQuery } from '@apollo/client';
import { GET_POSTS } from '@/graphql/queries';

export function PostsList() {
  const { data, loading, error, networkStatus } = useQuery(GET_POSTS, {
    variables: { limit: 10, offset: 0 },
    notifyOnNetworkStatusChange: true,
  });

  if (loading) return <div>Загрузка...</div>;

  if (error) {
    // Сетевая ошибка
    if (error.networkError) {
      return <div>Ошибка сети: проверьте подключение к интернету</div>;
    }

    // Ошибки GraphQL
    if (error.graphQLErrors.length > 0) {
      return (
        <ul>
          {error.graphQLErrors.map((err, i) => (
            <li key={i}>GraphQL ошибка: {err.message}</li>
          ))}
        </ul>
      );
    }
  }

  return (
    <ul>
      {data?.posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

## Переменные окружения

Настройте URL GraphQL API в файле `.env.local`:

```bash
# .env.local
NEXT_PUBLIC_GRAPHQL_URL=https://api.example.com/graphql

# Для серверных запросов (не передаётся на клиент)
GRAPHQL_URL=https://internal-api.example.com/graphql
GRAPHQL_TOKEN=your-secret-token
```

Для серверных компонентов можно использовать `process.env.GRAPHQL_URL` — эта переменная не попадёт в бандл клиента.

## Практические рекомендации

**Разделяйте запросы на серверные и клиентские.** Используйте серверные компоненты для начальной загрузки данных, клиентские — для интерактивных частей с обновлением в реальном времени.

**Избегайте дублирования данных.** Если данные уже загружены в серверном компоненте, передайте их как пропсы в клиентский, а не делайте повторный запрос.

**Используйте фрагменты** для переиспользования частей запросов:

```typescript
import { gql } from '@apollo/client';

export const POST_FRAGMENT = gql`
  fragment PostFields on Post {
    id
    title
    createdAt
    author {
      name
      avatar
    }
  }
`;

export const GET_POSTS = gql`
  ${POST_FRAGMENT}
  query GetPosts($limit: Int) {
    posts(limit: $limit) {
      ...PostFields
    }
  }
`;
```

**Включайте TypeScript-генерацию** для автоматической типизации из схемы GraphQL с помощью `@graphql-codegen/cli` — это исключает несоответствие типов между API и фронтендом.

## Итог

Вы настроили Apollo Client для работы как в серверных, так и в клиентских компонентах Next.js App Router. Ключевые моменты:

- `registerApolloClient` создаёт изолированный экземпляр для каждого серверного запроса
- `ApolloNextAppProvider` обеспечивает работу хуков в клиентских компонентах
- Серверные компоненты напрямую вызывают `query()` без хуков
- Клиентские компоненты используют `useQuery`, `useMutation` из `@apollo/client`
- Оптимистичные обновления и политики кеширования делают UX плавным

Чтобы глубже разобраться в Next.js и современных паттернах разработки, посмотрите курс по Next.js на PurpleSchool: https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-graphql-apollo
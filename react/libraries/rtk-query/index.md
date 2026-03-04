---
metaTitle: "RTK Query - работа с API в Redux Toolkit"
metaDescription: "Полное руководство по RTK Query: createApi, fetchBaseQuery, queries, mutations, кэширование, инвалидация тегов, оптимистичные обновления, пагинация, TypeScript и сравнение с React Query"
author: Олег Марков
title: RTK Query - работа с API
preview: RTK Query — мощный инструмент для работы с API, встроенный в Redux Toolkit. Изучите создание API срезов, управление кэшем, мутации, оптимистичные обновления и пагинацию с полными примерами кода.
---

## Введение

RTK Query — это инструмент для получения данных и кэширования, встроенный в Redux Toolkit. Он позволяет значительно сократить количество шаблонного кода при работе с API, автоматически управляет кэшированием, инвалидацией и синхронизацией данных.

В отличие от написания вручную thunk-экшенов, редьюсеров и селекторов для каждого запроса, RTK Query позволяет определить всё API в одном месте и автоматически генерирует React-хуки для использования в компонентах.

## Установка и настройка

RTK Query входит в состав Redux Toolkit, поэтому дополнительная установка не требуется:

```bash
npm install @reduxjs/toolkit react-redux
```

## Создание API с помощью createApi

Основа RTK Query — функция `createApi`. Она принимает объект конфигурации и возвращает API-объект с хуками и утилитами.

```typescript
// src/services/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export const postsApi = createApi({
  // Уникальный ключ для хранения в Redux store
  reducerPath: 'postsApi',
  
  // Базовая конфигурация запросов
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'https://jsonplaceholder.typicode.com/' 
  }),
  
  // Теги для инвалидации кэша
  tagTypes: ['Post', 'User'],
  
  // Определение эндпоинтов
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], void>({
      query: () => 'posts',
      providesTags: ['Post'],
    }),
    
    getPostById: builder.query<Post, number>({
      query: (id) => `posts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    
    createPost: builder.mutation<Post, Partial<Post>>({
      query: (body) => ({
        url: 'posts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Post'],
    }),
    
    updatePost: builder.mutation<Post, Partial<Post> & Pick<Post, 'id'>>({
      query: ({ id, ...patch }) => ({
        url: `posts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }],
    }),
    
    deletePost: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Post'],
    }),
  }),
});

// Экспортируем автоматически сгенерированные хуки
export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} = postsApi;
```

## Подключение к Redux Store

```typescript
// src/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { postsApi } from './services/api';

export const store = configureStore({
  reducer: {
    // Добавляем редьюсер API
    [postsApi.reducerPath]: postsApi.reducer,
  },
  // Добавляем middleware для кэширования, инвалидации и polling
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(postsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```tsx
// src/main.tsx
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  return (
    <Provider store={store}>
      <YourApp />
    </Provider>
  );
}
```

## Использование Query-хуков

### Базовый запрос

```tsx
import { useGetPostsQuery } from './services/api';

function PostsList() {
  // Хук возвращает объект с состоянием запроса
  const { 
    data: posts,      // Данные ответа
    isLoading,        // true при первой загрузке
    isFetching,       // true при любой загрузке (включая refetch)
    isSuccess,        // true если запрос успешен
    isError,          // true при ошибке
    error,            // Объект ошибки
    refetch,          // Функция для ручного перезапроса
  } = useGetPostsQuery();

  if (isLoading) return <div>Загрузка...</div>;
  if (isError) return <div>Ошибка: {JSON.stringify(error)}</div>;

  return (
    <ul>
      {posts?.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Запрос с аргументом

```tsx
import { useGetPostByIdQuery } from './services/api';

function PostDetail({ postId }: { postId: number }) {
  const { data: post, isLoading } = useGetPostByIdQuery(postId);

  if (isLoading) return <div>Загрузка поста...</div>;
  
  return (
    <div>
      <h1>{post?.title}</h1>
      <p>{post?.body}</p>
    </div>
  );
}
```

### Условные запросы

```tsx
function ConditionalPost({ postId }: { postId: number | null }) {
  // Запрос не выполняется, если postId равен null
  const { data } = useGetPostByIdQuery(postId!, {
    skip: postId === null,
  });

  return <div>{data?.title}</div>;
}
```

### Polling (автоматическое обновление)

```tsx
function LiveData() {
  // Обновляем данные каждые 30 секунд
  const { data } = useGetPostsQuery(undefined, {
    pollingInterval: 30000,
  });

  return <div>{/* ... */}</div>;
}
```

### Опции запросов

```tsx
const { data } = useGetPostsQuery(undefined, {
  // Не выполнять запрос
  skip: false,
  
  // Интервал опроса в миллисекундах
  pollingInterval: 0,
  
  // Перезапрашивать при фокусе окна
  refetchOnFocus: true,
  
  // Перезапрашивать при восстановлении соединения
  refetchOnReconnect: true,
  
  // Перезапрашивать при монтировании компонента
  refetchOnMountOrArgChange: true,
  
  // Считать данные свежими N секунд после последнего запроса
  refetchOnMountOrArgChange: 60,
});
```

## Мутации

Мутации используются для изменения данных на сервере (POST, PUT, PATCH, DELETE).

```tsx
import { useCreatePostMutation, useUpdatePostMutation, useDeletePostMutation } from './services/api';

function PostForm() {
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const [deletePost] = useDeletePostMutation();

  const handleCreate = async () => {
    try {
      // unwrap() выбрасывает ошибку если запрос завершился неудачно
      const newPost = await createPost({
        title: 'Новый пост',
        body: 'Содержимое поста',
        userId: 1,
      }).unwrap();
      
      console.log('Создан пост:', newPost);
    } catch (error) {
      console.error('Ошибка создания:', error);
    }
  };

  const handleUpdate = async (id: number) => {
    await updatePost({ id, title: 'Обновлённый заголовок' }).unwrap();
  };

  const handleDelete = async (id: number) => {
    await deletePost(id).unwrap();
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={isCreating}>
        {isCreating ? 'Создаём...' : 'Создать пост'}
      </button>
    </div>
  );
}
```

### Состояния мутации

```tsx
const [createPost, mutationResult] = useCreatePostMutation();

const {
  isLoading,    // Мутация выполняется
  isSuccess,    // Мутация успешно завершена
  isError,      // Мутация завершилась ошибкой
  error,        // Объект ошибки
  data,         // Данные ответа
  reset,        // Сброс состояния мутации
} = mutationResult;
```

## fetchBaseQuery: настройка базового запроса

`fetchBaseQuery` — упрощённая обёртка над `fetch`, поддерживающая типичные сценарии:

```typescript
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

const baseQuery = fetchBaseQuery({
  // Базовый URL
  baseUrl: 'https://api.example.com/',
  
  // Добавление заголовков к каждому запросу
  prepareHeaders: (headers, { getState }) => {
    // Получаем токен из Redux state
    const token = (getState() as RootState).auth.token;
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    headers.set('Content-Type', 'application/json');
    return headers;
  },
  
  // Кастомный обработчик ответа
  responseHandler: 'json', // 'json' | 'text' | 'blob' | custom function
  
  // Валидация статуса (по умолчанию 200-299)
  validateStatus: (response, body) => response.status === 200 && body.success,
});
```

## Кастомный baseQuery

Для более сложных сценариев можно написать полностью кастомный baseQuery. Например, с обновлением токена:

```typescript
import { 
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { tokenReceived, loggedOut } from './authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: 'https://api.example.com',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// baseQuery с автоматическим обновлением токена
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Пробуем обновить токен
    const refreshResult = await baseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Сохраняем новый токен
      api.dispatch(tokenReceived(refreshResult.data));
      // Повторяем оригинальный запрос
      result = await baseQuery(args, api, extraOptions);
    } else {
      // Разлогиниваем пользователя
      api.dispatch(loggedOut());
    }
  }

  return result;
};

// Используем в createApi
export const api = createApi({
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({ /* ... */ }),
});
```

## Теги и инвалидация кэша

Теги — ключевая концепция RTK Query для управления кэшем. Запросы "предоставляют" теги, а мутации "инвалидируют" их.

### Базовые теги

```typescript
const api = createApi({
  tagTypes: ['Post', 'User', 'Comment'],
  endpoints: (builder) => ({
    // Запрос предоставляет список тегов 'Post'
    getPosts: builder.query<Post[], void>({
      query: () => 'posts',
      providesTags: ['Post'],
    }),
    
    // Мутация инвалидирует все кэши с тегом 'Post'
    addPost: builder.mutation<Post, Partial<Post>>({
      query: (body) => ({ url: 'posts', method: 'POST', body }),
      invalidatesTags: ['Post'],
    }),
  }),
});
```

### Теги с идентификаторами

Для точечной инвалидации используйте теги с ID:

```typescript
const api = createApi({
  tagTypes: ['Post'],
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], void>({
      query: () => 'posts',
      // Предоставляем LIST-тег и тег для каждого поста
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Post' as const, id })),
              { type: 'Post', id: 'LIST' },
            ]
          : [{ type: 'Post', id: 'LIST' }],
    }),
    
    getPost: builder.query<Post, number>({
      query: (id) => `posts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    
    addPost: builder.mutation<Post, Partial<Post>>({
      query: (body) => ({ url: 'posts', method: 'POST', body }),
      // Инвалидируем только список, не отдельные посты
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),
    
    updatePost: builder.mutation<Post, Partial<Post> & Pick<Post, 'id'>>({
      query: ({ id, ...patch }) => ({
        url: `posts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      // Инвалидируем только конкретный пост
      invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }],
    }),
    
    deletePost: builder.mutation<void, number>({
      query: (id) => ({ url: `posts/${id}`, method: 'DELETE' }),
      // Инвалидируем конкретный пост и список
      invalidatesTags: (result, error, id) => [
        { type: 'Post', id },
        { type: 'Post', id: 'LIST' },
      ],
    }),
  }),
});
```

## Трансформация данных

Для преобразования ответа сервера используйте `transformResponse`:

```typescript
const api = createApi({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => 'users',
      // Преобразуем ответ: берём только нужные поля
      transformResponse: (response: User[]) =>
        response.map(({ id, name, email }) => ({ id, name, email })),
    }),
    
    getPaginatedPosts: builder.query<{ posts: Post[]; total: number }, number>({
      query: (page) => `posts?_page=${page}&_limit=10`,
      // Используем заголовки ответа
      transformResponse: (response: Post[], meta) => ({
        posts: response,
        total: parseInt(meta?.response?.headers.get('X-Total-Count') ?? '0'),
      }),
    }),
    
    getPost: builder.query<Post, number>({
      query: (id) => `posts/${id}`,
      // Трансформация ошибки
      transformErrorResponse: (response: { status: string | number; data: unknown }) => ({
        status: response.status,
        message: 'Ошибка загрузки поста',
      }),
    }),
  }),
});
```

## Оптимистичные обновления

Оптимистичные обновления позволяют немедленно обновить UI до получения ответа сервера:

```typescript
const api = createApi({
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], void>({
      query: () => 'posts',
      providesTags: ['Post'],
    }),
    
    updatePost: builder.mutation<Post, Partial<Post> & Pick<Post, 'id'>>({
      query: ({ id, ...patch }) => ({
        url: `posts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      
      // Оптимистичное обновление
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        // Немедленно обновляем кэш
        const patchResult = dispatch(
          api.util.updateQueryData('getPosts', undefined, (draft) => {
            const post = draft.find((p) => p.id === id);
            if (post) {
              Object.assign(post, patch);
            }
          })
        );
        
        try {
          // Ждём завершения запроса
          await queryFulfilled;
        } catch {
          // При ошибке откатываем изменения
          patchResult.undo();
        }
      },
    }),
  }),
});
```

### Оптимистичное обновление отдельного элемента

```typescript
updatePost: builder.mutation<Post, Partial<Post> & Pick<Post, 'id'>>({
  query: ({ id, ...patch }) => ({
    url: `posts/${id}`,
    method: 'PATCH',
    body: patch,
  }),
  
  async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
    // Обновляем кэш конкретного поста
    const patchResult = dispatch(
      api.util.updateQueryData('getPostById', id, (draft) => {
        Object.assign(draft, patch);
      })
    );
    
    try {
      await queryFulfilled;
    } catch {
      patchResult.undo();
    }
  },
}),
```

## Пагинация

### Смещение (offset-based pagination)

```typescript
interface PaginatedPosts {
  posts: Post[];
  total: number;
  page: number;
}

const api = createApi({
  endpoints: (builder) => ({
    getPaginatedPosts: builder.query<PaginatedPosts, number>({
      query: (page) => `posts?_page=${page}&_limit=10`,
      transformResponse: (response: Post[], meta) => ({
        posts: response,
        total: parseInt(meta?.response?.headers.get('X-Total-Count') ?? '0'),
        page: 1,
      }),
      providesTags: (result, error, page) => [{ type: 'Post', id: `PAGE_${page}` }],
    }),
  }),
});

// Использование в компоненте
function PaginatedList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetPaginatedPostsQuery(page);

  return (
    <div>
      {isLoading ? (
        <div>Загрузка...</div>
      ) : (
        <>
          {data?.posts.map((post) => (
            <div key={post.id}>{post.title}</div>
          ))}
          <div>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Назад
            </button>
            <span>Страница {page}</span>
            <button onClick={() => setPage(p => p + 1)}>
              Вперёд
            </button>
          </div>
        </>
      )}
      {isFetching && <div>Обновление...</div>}
    </div>
  );
}
```

### Бесконечная прокрутка с merge

```typescript
const api = createApi({
  endpoints: (builder) => ({
    getInfinitePosts: builder.query<Post[], number>({
      query: (page) => `posts?_page=${page}&_limit=10`,
      
      // Объединяем данные при подгрузке следующих страниц
      serializeQueryArgs: ({ endpointName }) => endpointName,
      
      merge: (currentCache, newItems) => {
        currentCache.push(...newItems);
      },
      
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
    }),
  }),
});

function InfiniteList() {
  const [page, setPage] = useState(1);
  const { data: posts, isFetching } = useGetInfinitePostsQuery(page);

  return (
    <div>
      {posts?.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
      <button onClick={() => setPage(p => p + 1)} disabled={isFetching}>
        Загрузить ещё
      </button>
    </div>
  );
}
```

## TypeScript интеграция

RTK Query отлично интегрируется с TypeScript и обеспечивает полную типизацию:

### Типизация эндпоинтов

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Типы данных
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}

interface CreateTodoRequest {
  title: string;
  completed?: boolean;
  userId: number;
}

interface UpdateTodoRequest {
  id: number;
  title?: string;
  completed?: boolean;
}

// Создание API с типизацией
export const todosApi = createApi({
  reducerPath: 'todosApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Todo'],
  endpoints: (builder) => ({
    // builder.query<ResponseType, ArgType>
    getTodos: builder.query<Todo[], void>({
      query: () => 'todos',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Todo' as const, id })),
              { type: 'Todo', id: 'LIST' },
            ]
          : [{ type: 'Todo', id: 'LIST' }],
    }),
    
    // builder.mutation<ResponseType, ArgType>
    createTodo: builder.mutation<Todo, CreateTodoRequest>({
      query: (newTodo) => ({
        url: 'todos',
        method: 'POST',
        body: newTodo,
      }),
      invalidatesTags: [{ type: 'Todo', id: 'LIST' }],
    }),
    
    updateTodo: builder.mutation<Todo, UpdateTodoRequest>({
      query: ({ id, ...changes }) => ({
        url: `todos/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Todo', id }],
    }),
  }),
});

export const {
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
} = todosApi;
```

### Типизация хранилища

```typescript
// store.ts
import { configureStore } from '@reduxjs/toolkit';
import { todosApi } from './services/todosApi';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

export const store = configureStore({
  reducer: {
    [todosApi.reducerPath]: todosApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(todosApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Типизированные хуки
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Инжекция эндпоинтов

Для разделения API на модули используйте `injectEndpoints`:

```typescript
// services/baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Post', 'User', 'Comment'],
  endpoints: () => ({}),
});

// services/postsApi.ts
import { baseApi } from './baseApi';

export const postsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], void>({
      query: () => 'posts',
    }),
  }),
  overrideExisting: false,
});

export const { useGetPostsQuery } = postsApi;

// services/usersApi.ts
import { baseApi } from './baseApi';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => 'users',
    }),
  }),
  overrideExisting: false,
});

export const { useGetUsersQuery } = usersApi;
```

## Утилиты и ручное управление кэшем

```typescript
import { store } from './store';
import { postsApi } from './services/api';

// Ручной запрос без компонента
const result = await store.dispatch(
  postsApi.endpoints.getPosts.initiate()
);

// Ручное обновление кэша
store.dispatch(
  postsApi.util.updateQueryData('getPosts', undefined, (draft) => {
    draft.push({ id: 999, title: 'Новый пост', body: '', userId: 1 });
  })
);

// Ручная инвалидация тегов
store.dispatch(postsApi.util.invalidateTags(['Post']));

// Сброс всего кэша API
store.dispatch(postsApi.util.resetApiState());

// Предзагрузка данных
store.dispatch(
  postsApi.util.prefetch('getPosts', undefined, { force: false })
);
```

### Предзагрузка в компонентах

```tsx
import { useGetPostsQuery } from './services/api';

function PostsPreloader() {
  const prefetchPosts = useGetPostsQuery.usePrefetch
    ? postsApi.usePrefetchPost 
    : undefined;
    
  // Или используйте хук предзагрузки
  return (
    <div 
      onMouseEnter={() => {
        // Предзагружаем при наведении
        store.dispatch(
          postsApi.util.prefetch('getPostById', 1, { ifOlderThan: 60 })
        );
      }}
    >
      Наведите для предзагрузки
    </div>
  );
}
```

## RTK Query vs React Query

Оба инструмента решают схожие задачи, но имеют разный подход:

| Критерий | RTK Query | React Query |
|----------|-----------|-------------|
| **Интеграция** | Встроен в Redux Toolkit | Независимая библиотека |
| **Хранилище** | Redux store | Собственный кэш |
| **Bundle size** | ~9KB (если Redux уже есть) | ~13KB |
| **Конфигурация** | Централизованная (createApi) | Распределённая (useQuery) |
| **DevTools** | Redux DevTools | React Query DevTools |
| **Мутации** | Автоматическая инвалидация тегов | Ручная инвалидация |
| **Infinite queries** | Поддерживается (с serializeQueryArgs) | Встроенная поддержка (useInfiniteQuery) |
| **Оптимистичные обновления** | onQueryStarted | onMutate |

### Когда выбрать RTK Query

- Проект уже использует Redux
- Нужна централизованная конфигурация API
- Важна типобезопасность в стиле Redux
- Нужна глубокая интеграция с Redux state

### Когда выбрать React Query

- Нет Redux в проекте
- Нужна более гибкая конфигурация отдельных запросов
- Активно используется бесконечная прокрутка
- Важен меньший размер бандла при отсутствии Redux

## Лучшие практики

### 1. Организация API файлов

```
src/
├── store/
│   ├── index.ts          # Конфигурация store
│   └── hooks.ts          # Типизированные хуки
└── services/
    ├── baseApi.ts        # Базовый API (fetchBaseQuery)
    ├── postsApi.ts       # Эндпоинты постов
    └── usersApi.ts       # Эндпоинты пользователей
```

### 2. Обработка ошибок

```tsx
import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';

function isApiError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

function getErrorMessage(error: FetchBaseQueryError | SerializedError): string {
  if (isApiError(error)) {
    if (typeof error.status === 'number') {
      return `HTTP ${error.status}: ${JSON.stringify(error.data)}`;
    }
    return error.error;
  }
  return error.message ?? 'Неизвестная ошибка';
}

function PostsList() {
  const { data, error, isError } = useGetPostsQuery();

  if (isError) {
    return <div className="error">{getErrorMessage(error)}</div>;
  }

  return <ul>{data?.map(/* ... */)}</ul>;
}
```

### 3. Кастомные базовые хуки

```typescript
// Хук с обработкой ошибок по умолчанию
function usePostsWithToast() {
  const result = useGetPostsQuery();
  
  useEffect(() => {
    if (result.isError) {
      toast.error('Не удалось загрузить посты');
    }
  }, [result.isError]);
  
  return result;
}
```

### 4. Нормализация данных

Для больших наборов данных используйте `createEntityAdapter` совместно с RTK Query:

```typescript
import { createEntityAdapter } from '@reduxjs/toolkit';

const postsAdapter = createEntityAdapter<Post>();
const initialState = postsAdapter.getInitialState();

const api = createApi({
  endpoints: (builder) => ({
    getPosts: builder.query<ReturnType<typeof postsAdapter.setAll>, void>({
      query: () => 'posts',
      transformResponse: (response: Post[]) =>
        postsAdapter.setAll(initialState, response),
    }),
  }),
});

// Получение нормализованных данных через selectors
const selectPostsResult = api.endpoints.getPosts.select();
const selectPostsData = createSelector(
  selectPostsResult,
  (result) => result.data ?? initialState
);

export const { selectAll: selectAllPosts, selectById: selectPostById } =
  postsAdapter.getSelectors(
    (state: RootState) => selectPostsData(state)
  );
```

## Заключение

RTK Query — мощный инструмент, который автоматизирует большинство задач при работе с API в React-приложениях. Благодаря встроенному кэшированию, автоматической инвалидации, поддержке TypeScript и интеграции с Redux DevTools, он значительно упрощает разработку и отладку.

Основные преимущества:
- **Меньше шаблонного кода**: автоматическая генерация хуков
- **Умное кэширование**: автоматическое управление состоянием данных
- **TypeScript-first**: полная типизация из коробки
- **Оптимистичные обновления**: улучшение UX без сложного кода
- **Интеграция с Redux**: единое хранилище для всего состояния приложения

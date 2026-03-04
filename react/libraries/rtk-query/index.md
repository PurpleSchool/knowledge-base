---
metaTitle: RTK Query - работа с API в React и Redux Toolkit
metaDescription: Полное руководство по RTK Query — встроенному инструменту для работы с API в Redux Toolkit. Кэширование, запросы, мутации, инвалидация кэша, TypeScript и оптимистичные обновления
author: Олег Марков
title: RTK Query - работа с API
preview: Узнайте, как использовать RTK Query для загрузки данных, кэширования, мутаций и инвалидации кэша в React-приложениях — с минимумом шаблонного кода и полной интеграцией с Redux DevTools
---

## Введение

Работа с API — одна из самых рутинных задач в разработке React-приложений. Типичный сценарий: загрузить данные, показать состояние загрузки, обработать ошибки, кэшировать результат, инвалидировать кэш после мутации. Если делать это вручную через `createAsyncThunk`, приходится писать значительный объём шаблонного кода для каждого эндпоинта.

**RTK Query** — это мощный инструмент для загрузки и кэширования данных, встроенный в Redux Toolkit. Он автоматически генерирует хуки для запросов и мутаций, управляет кэшем, обрабатывает загрузку и ошибки, а также полностью интегрируется с Redux DevTools.

RTK Query вдохновлён библиотеками React Query и SWR, но работает внутри Redux-экосистемы, что позволяет видеть все запросы и кэш в Redux DevTools.

## Почему RTK Query

### Проблема: ручное управление запросами

```typescript
// Без RTK Query: много шаблонного кода для каждого запроса
interface PostsState {
  posts: Post[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const fetchPosts = createAsyncThunk('posts/fetchAll', async () => {
  const response = await fetch('/api/posts');
  return response.json();
});

const postsSlice = createSlice({
  name: 'posts',
  initialState: { posts: [], status: 'idle', error: null } as PostsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.posts = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? null;
      });
  },
});

// И это только для одного запроса. Для каждого CRUD — новый thunk + обработчики
```

### Решение с RTK Query

```typescript
// С RTK Query: весь API — в одном месте
const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], void>({
      query: () => '/posts',
    }),
    getPostById: builder.query<Post, number>({
      query: (id) => `/posts/${id}`,
    }),
    createPost: builder.mutation<Post, Partial<Post>>({
      query: (body) => ({ url: '/posts', method: 'POST', body }),
    }),
  }),
});

// Автоматически генерируются хуки:
// useGetPostsQuery, useGetPostByIdQuery, useCreatePostMutation
```

## Установка

RTK Query входит в `@reduxjs/toolkit` — устанавливать ничего дополнительно не нужно:

```bash
npm install @reduxjs/toolkit react-redux
```

## createApi — основа RTK Query

Весь API-слой описывается с помощью `createApi`:

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  // Ключ в Redux store, где будет храниться кэш
  reducerPath: 'api',

  // Базовая функция для выполнения запросов
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://jsonplaceholder.typicode.com',
    // Заголовки по умолчанию
    prepareHeaders: (headers, { getState }) => {
      // Можно получить токен из стора
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),

  // Теги для управления кэшем и инвалидацией
  tagTypes: ['Post', 'User', 'Comment'],

  // Эндпоинты
  endpoints: (builder) => ({
    // ... описываем запросы и мутации
  }),
});
```

## Запросы (Queries)

Запросы используются для **получения данных** (GET-запросы).

### Базовый запрос

```typescript
interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

export const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://jsonplaceholder.typicode.com' }),
  endpoints: (builder) => ({
    // Запрос без параметров
    getPosts: builder.query<Post[], void>({
      query: () => '/posts',
    }),

    // Запрос с параметром
    getPostById: builder.query<Post, number>({
      query: (id) => `/posts/${id}`,
    }),

    // Запрос с несколькими параметрами
    getPostsByUser: builder.query<Post[], { userId: number; limit?: number }>({
      query: ({ userId, limit = 10 }) =>
        `/posts?userId=${userId}&_limit=${limit}`,
    }),
  }),
});

// Автогенерация хуков
export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useGetPostsByUserQuery,
} = postsApi;
```

### Использование в компоненте

```tsx
function PostsList() {
  const {
    data: posts,     // Данные
    isLoading,       // true при первой загрузке
    isFetching,      // true при любой загрузке (включая обновление)
    isSuccess,       // true при успешном запросе
    isError,         // true при ошибке
    error,           // Объект ошибки
    refetch,         // Функция для повторного запроса
  } = useGetPostsQuery();

  if (isLoading) return <p>Загрузка...</p>;
  if (isError) return <p>Ошибка: {JSON.stringify(error)}</p>;

  return (
    <div>
      <button onClick={refetch}>Обновить</button>
      <ul>
        {posts?.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}

function PostDetail({ id }: { id: number }) {
  const { data: post, isLoading } = useGetPostByIdQuery(id);

  if (isLoading) return <p>Загрузка...</p>;

  return (
    <article>
      <h2>{post?.title}</h2>
      <p>{post?.body}</p>
    </article>
  );
}
```

### Опции запроса

```tsx
function PostsList() {
  const { data } = useGetPostsQuery(undefined, {
    // Пропустить запрос (например, если нет авторизации)
    skip: !isAuthenticated,

    // Автоматически повторять запрос каждые 30 секунд
    pollingInterval: 30000,

    // Считать кэш устаревшим и перезапрашивать при фокусе окна
    refetchOnFocus: true,

    // Перезапрашивать при восстановлении соединения
    refetchOnReconnect: true,

    // Игнорировать кэш и всегда делать новый запрос
    refetchOnMountOrArgChange: true,

    // Использовать данные из кэша в течение N секунд
    selectFromResult: ({ data, isLoading }) => ({
      posts: data?.filter((p) => p.userId === currentUserId),
      isLoading,
    }),
  });
}
```

### Условные запросы

```tsx
function UserPosts({ userId }: { userId: number | null }) {
  // Запрос выполнится только если userId не null
  const { data } = useGetPostsByUserQuery(
    { userId: userId! },
    { skip: userId === null }
  );

  // Или с хуком skipToken
  const { data: user } = useGetUserQuery(userId ?? skipToken);
}
```

## Мутации (Mutations)

Мутации используются для **изменения данных** (POST, PUT, PATCH, DELETE).

### Определение мутаций

```typescript
export const postsApi = createApi({
  reducerPath: 'postsApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://jsonplaceholder.typicode.com' }),
  tagTypes: ['Post'],
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], void>({
      query: () => '/posts',
      providesTags: ['Post'],
    }),

    createPost: builder.mutation<Post, Omit<Post, 'id'>>({
      query: (newPost) => ({
        url: '/posts',
        method: 'POST',
        body: newPost,
      }),
      // Инвалидирует кэш тега 'Post' — запрос getPosts выполнится заново
      invalidatesTags: ['Post'],
    }),

    updatePost: builder.mutation<Post, Partial<Post> & { id: number }>({
      query: ({ id, ...patch }) => ({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Post', id }],
    }),

    deletePost: builder.mutation<void, number>({
      query: (id) => ({
        url: `/posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Post', id }],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} = postsApi;
```

### Использование мутаций

```tsx
function CreatePostForm() {
  const [createPost, { isLoading, isSuccess, isError, error }] =
    useCreatePostMutation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createPost({ title, body, userId: 1 }).unwrap();
      console.log('Создан пост:', result);
      setTitle('');
      setBody('');
    } catch (err) {
      console.error('Ошибка создания:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Заголовок"
        disabled={isLoading}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Текст"
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Создание...' : 'Создать'}
      </button>
      {isSuccess && <p>✅ Пост создан!</p>}
      {isError && <p>❌ Ошибка: {JSON.stringify(error)}</p>}
    </form>
  );
}
```

## Теги и инвалидация кэша

Теги — ключевой механизм RTK Query для синхронизации кэша. Запросы **предоставляют** теги, мутации их **инвалидируют**.

```typescript
const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Post', 'User'],
  endpoints: (builder) => ({
    // Запрос предоставляет теги
    getPosts: builder.query<Post[], void>({
      query: () => '/posts',
      // Предоставляет тег 'Post' для каждого поста + общий тег 'Post'
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Post' as const, id })),
              { type: 'Post', id: 'LIST' },
            ]
          : [{ type: 'Post', id: 'LIST' }],
    }),

    getPostById: builder.query<Post, number>({
      query: (id) => `/posts/${id}`,
      // Предоставляет тег для конкретного поста
      providesTags: (_result, _error, id) => [{ type: 'Post', id }],
    }),

    // Создание инвалидирует список
    createPost: builder.mutation<Post, Partial<Post>>({
      query: (body) => ({ url: '/posts', method: 'POST', body }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),

    // Обновление инвалидирует конкретный пост
    updatePost: builder.mutation<Post, { id: number; changes: Partial<Post> }>({
      query: ({ id, changes }) => ({
        url: `/posts/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Post', id }],
    }),

    // Удаление инвалидирует конкретный пост и список
    deletePost: builder.mutation<void, number>({
      query: (id) => ({ url: `/posts/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Post', id },
        { type: 'Post', id: 'LIST' },
      ],
    }),
  }),
});
```

## Оптимистичные обновления

RTK Query поддерживает оптимистичные обновления — UI обновляется сразу, без ожидания ответа сервера.

```typescript
updatePost: builder.mutation<Post, { id: number; changes: Partial<Post> }>({
  query: ({ id, changes }) => ({
    url: `/posts/${id}`,
    method: 'PATCH',
    body: changes,
  }),
  async onQueryStarted({ id, changes }, { dispatch, queryFulfilled }) {
    // Оптимистично обновляем кэш
    const patchResult = dispatch(
      api.util.updateQueryData('getPostById', id, (draft) => {
        Object.assign(draft, changes);
      })
    );

    try {
      await queryFulfilled;
      // Запрос успешен — ничего не делаем, кэш уже обновлён
    } catch {
      // Запрос провалился — откатываем изменения
      patchResult.undo();
    }
  },
}),
```

## Настройка стора

```typescript
// app/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { postsApi } from './postsApi';
import { usersApi } from './usersApi';

export const store = configureStore({
  reducer: {
    [postsApi.reducerPath]: postsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
  },
  // Добавляем middleware для кэширования, инвалидации и polling
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(postsApi.middleware)
      .concat(usersApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## Трансформация ответа

```typescript
endpoints: (builder) => ({
  getUsers: builder.query<User[], void>({
    query: () => '/users',
    // Трансформируем ответ перед сохранением в кэш
    transformResponse: (response: ApiUser[]) =>
      response.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email.toLowerCase(),
        avatar: user.profileImage ?? '/default-avatar.png',
      })),
    // Трансформируем ошибку
    transformErrorResponse: (response: { status: number; data: ApiError }) => ({
      status: response.status,
      message: response.data.message || 'Неизвестная ошибка',
    }),
  }),
}),
```

## Пагинация

```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

interface PaginationParams {
  page: number;
  perPage: number;
  search?: string;
}

endpoints: (builder) => ({
  getPaginatedPosts: builder.query<PaginatedResponse<Post>, PaginationParams>({
    query: ({ page, perPage, search }) => ({
      url: '/posts',
      params: { page, perPage, search },
    }),
    providesTags: (result) =>
      result
        ? [
            ...result.data.map(({ id }) => ({ type: 'Post' as const, id })),
            { type: 'Post', id: 'PARTIAL-LIST' },
          ]
        : [{ type: 'Post', id: 'PARTIAL-LIST' }],
  }),
}),
```

```tsx
function PaginatedPosts() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useGetPaginatedPostsQuery({
    page,
    perPage: 10,
  });

  return (
    <div>
      {isFetching && <p>Обновление...</p>}
      <ul>
        {data?.data.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
      <div>
        <button
          onClick={() => setPage((p) => p - 1)}
          disabled={page === 1 || isLoading}
        >
          Назад
        </button>
        <span>Страница {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoading || !data || page * 10 >= data.total}
        >
          Вперёд
        </button>
      </div>
    </div>
  );
}
```

## TypeScript и генерация типов

RTK Query отлично работает с TypeScript — типы API выводятся автоматически:

```typescript
// Типы для базового запроса с авторизацией
import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

// Кастомный baseQuery с обновлением токена
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // Попытка обновить токен
    const refreshResult = await baseQuery('/auth/refresh', api, extraOptions);
    if (refreshResult.data) {
      api.dispatch(setCredentials(refreshResult.data as AuthTokens));
      // Повторяем оригинальный запрос
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};
```

## Сравнение RTK Query с React Query

| Аспект | RTK Query | React Query / TanStack Query |
|--------|-----------|------------------------------|
| Интеграция | Встроен в Redux | Независимая библиотека |
| DevTools | Redux DevTools | Отдельные React Query DevTools |
| Размер | Часть RTK (~40 КБ) | ~13 КБ |
| Настройка | Требует Redux | Только провайдер |
| Мутации | Хуки + инвалидация | Хуки + инвалидация |
| Infinite queries | Ограниченно | Полная поддержка |
| Оптимистичные обновления | Да | Да |
| SSR | Да | Отличная поддержка |

RTK Query лучше, если вы уже используете Redux. React Query — отличный выбор для проектов без Redux.

## Заключение

RTK Query — это серьёзный инструмент для работы с API, который берёт на себя всю рутину: кэширование, состояния загрузки, обработку ошибок и инвалидацию. Ключевые преимущества:

- **Автогенерация хуков** — не нужно писать thunks и reducers вручную
- **Умный кэш** с тегами и автоматической инвалидацией
- **Интеграция с Redux DevTools** — видите все запросы и кэш в реальном времени
- **Оптимистичные обновления** для отзывчивого UI
- **Полная поддержка TypeScript** из коробки

Если ваш проект использует Redux Toolkit, RTK Query — естественный следующий шаг для работы с серверными данными.

---
metaTitle: Axios с React - HTTP запросы в React приложениях
metaDescription: Полное руководство по использованию Axios в React: GET/POST запросы, interceptors, отмена запросов и TypeScript типизация
author: Олег Марков
title: Axios с React
preview: Изучите как использовать Axios для HTTP запросов в React. Установка, базовые методы, interceptors, отмена запросов и примеры с TypeScript
---

## Введение

Когда вы начинаете строить React-приложения, работающие с внешними данными, перед вами встаёт вопрос: чем делать HTTP-запросы? Браузер предоставляет встроенный `fetch`, но на практике разработчики всё чаще выбирают **Axios** — и на то есть весомые причины.

**Axios** — это JavaScript-библиотека для выполнения HTTP-запросов как в браузере, так и в Node.js. Она построена поверх `XMLHttpRequest` в браузере и `http`/`https` в Node.js, предоставляя удобный, promise-based API.

### Почему Axios, а не fetch?

Вот ключевые преимущества Axios перед нативным `fetch`:

| Возможность | fetch | Axios |
|---|---|---|
| Автоматический JSON-парсинг | Нет, нужен `.json()` | Да, автоматически |
| Обработка ошибок HTTP | Нет, нужно проверять `response.ok` | Да, 4xx/5xx — это ошибки |
| Перехватчики запросов/ответов | Нет | Да, interceptors |
| Отмена запросов | AbortController | AbortController + CancelToken |
| Прогресс загрузки | Нет | Да, onUploadProgress |
| Автоматические заголовки | Нет | Да, для JSON |
| Поддержка Node.js | Нет | Да |
| Таймауты | Только через AbortController | Встроены |

`fetch` возвращает успешный промис даже при статусах 404 или 500 — вам нужно вручную проверять `response.ok`. Axios же автоматически выбрасывает ошибку при любом HTTP-статусе вне диапазона 2xx. Это существенно упрощает обработку ошибок.

В этой статье вы узнаете, как установить Axios, сделать базовые запросы, интегрировать его в React-компоненты, настроить перехватчики, отменять запросы и работать с TypeScript-типизацией.

## Установка

Добавить Axios в проект очень просто:

```bash
npm install axios
```

Или с использованием yarn/pnpm:

```bash
yarn add axios
# или
pnpm add axios
```

Axios поставляется с встроенными TypeScript-типами, поэтому дополнительно устанавливать `@types/axios` не нужно.

После установки вы можете импортировать axios в любой файл:

```typescript
import axios from 'axios';
```

## Базовые методы HTTP

Axios предоставляет методы для всех основных HTTP-операций. Давайте разберём каждый из них.

### GET-запрос

GET используется для получения данных с сервера. Это самый распространённый тип запроса:

```typescript
import axios from 'axios';

// Простой GET-запрос
async function fetchUsers() {
  const response = await axios.get('https://jsonplaceholder.typicode.com/users');
  console.log(response.data); // Массив пользователей
}

// GET с параметрами запроса
async function fetchUserPosts(userId: number) {
  const response = await axios.get('https://jsonplaceholder.typicode.com/posts', {
    params: {
      userId: userId,
      _limit: 10,
    },
  });
  // URL станет: /posts?userId=1&_limit=10
  return response.data;
}
```

Обратите внимание: `response.data` уже содержит распарсенный JSON — Axios делает это автоматически.

### POST-запрос

POST используется для создания новых ресурсов:

```typescript
interface CreatePostData {
  title: string;
  body: string;
  userId: number;
}

async function createPost(data: CreatePostData) {
  const response = await axios.post(
    'https://jsonplaceholder.typicode.com/posts',
    data // Axios автоматически сериализует объект в JSON
  );
  console.log('Создан пост:', response.data);
  console.log('Статус:', response.status); // 201
  return response.data;
}

// Вызов
createPost({
  title: 'Моя первая статья',
  body: 'Содержание статьи',
  userId: 1,
});
```

### PUT-запрос

PUT заменяет ресурс целиком:

```typescript
interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

async function updatePost(id: number, data: Omit<Post, 'id'>) {
  const response = await axios.put<Post>(
    `https://jsonplaceholder.typicode.com/posts/${id}`,
    data
  );
  return response.data;
}
```

### PATCH-запрос

PATCH обновляет только указанные поля ресурса:

```typescript
async function patchPost(id: number, partialData: Partial<Post>) {
  const response = await axios.patch<Post>(
    `https://jsonplaceholder.typicode.com/posts/${id}`,
    partialData
  );
  return response.data;
}

// Обновляем только заголовок
patchPost(1, { title: 'Новый заголовок' });
```

### DELETE-запрос

DELETE удаляет ресурс:

```typescript
async function deletePost(id: number) {
  const response = await axios.delete(
    `https://jsonplaceholder.typicode.com/posts/${id}`
  );
  console.log('Статус удаления:', response.status); // 200
}
```

## Использование Axios в React-компонентах

Теперь разберём, как интегрировать Axios в реальные React-компоненты с хуками `useState` и `useEffect`.

### Базовый компонент с загрузкой данных

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
}

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get<User[]>(
          'https://jsonplaceholder.typicode.com/users'
        );
        setUsers(response.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          // Это ошибка Axios — у неё есть структурированные данные
          setError(err.response?.data?.message ?? err.message);
        } else {
          setError('Произошла непредвиденная ошибка');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []); // Пустой массив — запрос выполняется один раз при монтировании

  if (loading) return <div>Загрузка пользователей...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          <strong>{user.name}</strong> — {user.email}
        </li>
      ))}
    </ul>
  );
};

export default UsersList;
```

### Компонент с POST-запросом (форма)

```typescript
import React, { useState } from 'react';
import axios from 'axios';

interface PostFormData {
  title: string;
  body: string;
}

interface CreatedPost extends PostFormData {
  id: number;
  userId: number;
}

const CreatePostForm: React.FC = () => {
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    body: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreatedPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await axios.post<CreatedPost>(
        'https://jsonplaceholder.typicode.com/posts',
        { ...formData, userId: 1 }
      );
      setResult(response.data);
      setFormData({ title: '', body: '' }); // Очищаем форму
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(`Ошибка сервера: ${err.response?.status} — ${err.message}`);
      } else {
        setError('Неизвестная ошибка');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Заголовок:</label>
          <input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="body">Содержание:</label>
          <textarea
            id="body"
            name="body"
            value={formData.body}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Отправка...' : 'Создать пост'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && (
        <div>
          <h3>Пост создан!</h3>
          <p>ID: {result.id}</p>
          <p>Заголовок: {result.title}</p>
        </div>
      )}
    </div>
  );
};

export default CreatePostForm;
```

### Кастомный хук для запросов

Вынесем логику запросов в переиспользуемый хук:

```typescript
import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosRequestConfig, AxiosError } from 'axios';

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useFetch<T>(
  url: string,
  config?: AxiosRequestConfig
): UseFetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => {
    setTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get<T>(url, {
          ...config,
          signal: controller.signal,
        });
        setData(response.data);
      } catch (err) {
        if (axios.isCancel(err)) {
          // Запрос отменён — это нормально при размонтировании компонента
          return;
        }
        const axiosError = err as AxiosError;
        setError(axiosError.message || 'Ошибка запроса');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort(); // Отменяем запрос при размонтировании
    };
  }, [url, trigger]);

  return { data, loading, error, refetch };
}

// Использование
const PostsList: React.FC = () => {
  const { data: posts, loading, error, refetch } = useFetch<Post[]>(
    'https://jsonplaceholder.typicode.com/posts?_limit=5'
  );

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error} <button onClick={refetch}>Повторить</button></div>;

  return (
    <div>
      <button onClick={refetch}>Обновить</button>
      {posts?.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.body}</p>
        </article>
      ))}
    </div>
  );
};
```

## Создание Axios Instance

В реальных проектах вы обычно взаимодействуете с одним API, у которого есть базовый URL, общие заголовки и настройки. Для этого Axios предоставляет возможность создания экземпляров:

```typescript
// src/api/axiosInstance.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.myapp.com/v1',
  timeout: 10000, // 10 секунд
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export default apiClient;
```

Теперь вместо указания полного URL в каждом запросе:

```typescript
// Без instance — повторяем baseURL каждый раз
await axios.get('https://api.myapp.com/v1/users');
await axios.post('https://api.myapp.com/v1/posts', data);

// С instance — чисто и без повторений
import apiClient from './api/axiosInstance';

await apiClient.get('/users');
await apiClient.post('/posts', data);
```

### Авторизованный клиент

Часто нужно автоматически добавлять токен авторизации ко всем запросам:

```typescript
// src/api/authClient.ts
import axios from 'axios';

const authClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 15000,
});

// Добавляем токен перед каждым запросом
authClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default authClient;
```

## Перехватчики (Interceptors)

Interceptors — одна из самых мощных возможностей Axios. Они позволяют перехватывать запросы или ответы до их обработки в `then` или `catch`.

### Request Interceptor

```typescript
import axios from 'axios';

// Добавляем перехватчик запросов
const requestInterceptor = axios.interceptors.request.use(
  (config) => {
    // Выполняется перед каждым запросом
    console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`);

    // Добавляем токен авторизации
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Добавляем временную метку
    config.headers['X-Request-Time'] = new Date().toISOString();

    return config;
  },
  (error) => {
    // Обработка ошибки конфигурации запроса
    console.error('[Request Error]', error);
    return Promise.reject(error);
  }
);

// Удаление перехватчика, когда он больше не нужен
// axios.interceptors.request.eject(requestInterceptor);
```

### Response Interceptor

```typescript
import axios from 'axios';

// Перехватчик ответов
axios.interceptors.response.use(
  (response) => {
    // Код выполняется для любого ответа со статусом 2xx
    console.log(`[Response] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    // Код выполняется для ответов за пределами диапазона 2xx
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Токен истёк — пробуем обновить
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('/auth/refresh', { refreshToken });
        const newToken = response.data.accessToken;

        localStorage.setItem('accessToken', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Повторяем оригинальный запрос с новым токеном
        return axios(originalRequest);
      } catch (refreshError) {
        // Не удалось обновить токен — выход из системы
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      console.error('Недостаточно прав доступа');
    }

    if (error.response?.status === 500) {
      console.error('Ошибка сервера');
    }

    return Promise.reject(error);
  }
);
```

### Практический пример: полная настройка instance с interceptors

```typescript
// src/api/client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor
client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          console.error('Неверный запрос:', data.details);
          break;
        case 401:
          localStorage.clear();
          window.location.href = '/login';
          break;
        case 404:
          console.error('Ресурс не найден');
          break;
        case 429:
          console.error('Слишком много запросов, попробуйте позже');
          break;
        case 500:
          console.error('Внутренняя ошибка сервера');
          break;
      }
    } else if (error.request) {
      console.error('Нет ответа от сервера. Проверьте соединение.');
    }

    return Promise.reject(error);
  }
);

export default client;
```

## Отмена запросов

Отмена запросов важна для предотвращения утечек памяти и race conditions в React-компонентах.

### Использование AbortController (рекомендуемый способ)

AbortController — это стандартный браузерный API, который Axios поддерживает начиная с версии 0.22.0:

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SearchResult {
  id: number;
  title: string;
}

const SearchComponent: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    const search = async () => {
      setLoading(true);
      try {
        const response = await axios.get<SearchResult[]>('/api/search', {
          params: { q: query },
          signal: controller.signal, // Передаём сигнал отмены
        });
        setResults(response.data);
      } catch (err) {
        if (axios.isCancel(err)) {
          // Запрос был отменён — это ожидаемое поведение
          console.log('Запрос отменён:', err.message);
          return;
        }
        console.error('Ошибка поиска:', err);
      } finally {
        setLoading(false);
      }
    };

    // Небольшая задержка для debounce
    const timer = setTimeout(search, 300);

    return () => {
      clearTimeout(timer);
      controller.abort(); // Отменяем предыдущий запрос при каждом изменении query
    };
  }, [query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск..."
      />
      {loading && <span>Поиск...</span>}
      <ul>
        {results.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
    </div>
  );
};
```

### CancelToken (устаревший API, для справки)

До появления AbortController Axios использовал собственный механизм CancelToken. Он всё ещё работает, но AbortController предпочтительнее:

```typescript
import axios, { CancelTokenSource } from 'axios';

// Создание токена отмены
const source: CancelTokenSource = axios.CancelToken.source();

// Передача токена в запрос
axios.get('/api/data', {
  cancelToken: source.token,
});

// Отмена запроса
source.cancel('Запрос отменён пользователем');

// Проверка отмены
if (axios.isCancel(error)) {
  console.log('Запрос был отменён:', error.message);
}
```

### Правильная отмена в React с useEffect

Каждый `useEffect`, который выполняет асинхронные запросы, должен возвращать функцию очистки:

```typescript
useEffect(() => {
  const controller = new AbortController();
  let isMounted = true; // Флаг для предотвращения обновления размонтированного компонента

  const loadData = async () => {
    try {
      const response = await axios.get('/api/data', {
        signal: controller.signal,
      });
      if (isMounted) {
        setData(response.data);
      }
    } catch (error) {
      if (!axios.isCancel(error) && isMounted) {
        setError('Ошибка загрузки');
      }
    }
  };

  loadData();

  return () => {
    isMounted = false;
    controller.abort();
  };
}, []);
```

## TypeScript-типизация с Axios

Axios отлично работает с TypeScript. Рассмотрим основные паттерны типизации.

### Типизация ответов

Axios поддерживает Generic-параметр для типизации `response.data`:

```typescript
import axios, { AxiosResponse } from 'axios';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

interface ApiResponse<T> {
  data: T;
  total: number;
  page: number;
  limit: number;
}

// Типизированный GET-запрос
async function getProducts(): Promise<Product[]> {
  const response: AxiosResponse<ApiResponse<Product[]>> = await axios.get(
    '/api/products'
  );
  return response.data.data; // response.data — это ApiResponse<Product[]>
}

// Сокращённая форма через дженерик
async function getProduct(id: number): Promise<Product> {
  const { data } = await axios.get<Product>(`/api/products/${id}`);
  return data; // Уже типизировано как Product
}
```

### Типизация ошибок

```typescript
import axios, { AxiosError } from 'axios';

interface ValidationError {
  field: string;
  message: string;
}

interface ApiErrorResponse {
  error: string;
  validationErrors?: ValidationError[];
}

async function createUser(userData: CreateUserDto) {
  try {
    const response = await axios.post<User>('/api/users', userData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // error теперь типизирован как AxiosError
      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response) {
        const { status, data } = axiosError.response;

        if (status === 422 && data.validationErrors) {
          // Обрабатываем ошибки валидации
          data.validationErrors.forEach((err) => {
            console.log(`Поле "${err.field}": ${err.message}`);
          });
        }

        throw new Error(data.error || `HTTP ${status}`);
      }
    }

    throw error; // Пробрасываем неизвестные ошибки
  }
}
```

### Типизация конфигурации и instance

```typescript
import axios, { CreateAxiosDefaults, AxiosRequestConfig } from 'axios';

// Типизированная конфигурация instance
const config: CreateAxiosDefaults = {
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'X-API-Key': process.env.REACT_APP_API_KEY,
  },
};

const api = axios.create(config);

// Типизированная обёртка для запросов
async function apiRequest<T>(
  config: AxiosRequestConfig
): Promise<T> {
  const response = await api.request<T>(config);
  return response.data;
}

// Использование
const users = await apiRequest<User[]>({
  method: 'GET',
  url: '/users',
  params: { page: 1 },
});
```

### Создание типизированного API-сервиса

```typescript
// src/services/postsService.ts
import apiClient from '../api/client';

export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

export type CreatePostDto = Omit<Post, 'id'>;
export type UpdatePostDto = Partial<CreatePostDto>;

export const postsService = {
  async getAll(params?: { userId?: number; _limit?: number }): Promise<Post[]> {
    const { data } = await apiClient.get<Post[]>('/posts', { params });
    return data;
  },

  async getById(id: number): Promise<Post> {
    const { data } = await apiClient.get<Post>(`/posts/${id}`);
    return data;
  },

  async create(dto: CreatePostDto): Promise<Post> {
    const { data } = await apiClient.post<Post>('/posts', dto);
    return data;
  },

  async update(id: number, dto: UpdatePostDto): Promise<Post> {
    const { data } = await apiClient.patch<Post>(`/posts/${id}`, dto);
    return data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/posts/${id}`);
  },
};
```

И компонент, использующий этот сервис:

```typescript
// src/components/PostsManager.tsx
import React, { useState, useEffect } from 'react';
import { postsService, Post, CreatePostDto } from '../services/postsService';

const PostsManager: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    postsService
      .getAll({ _limit: 10 })
      .then(setPosts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const handleCreate = async (dto: CreatePostDto) => {
    try {
      const newPost = await postsService.create(dto);
      setPosts((prev) => [newPost, ...prev]);
    } catch (err) {
      console.error('Ошибка создания поста:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await postsService.delete(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Ошибка удаления поста:', err);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      <h1>Посты ({posts.length})</h1>
      {posts.map((post) => (
        <div key={post.id} style={{ border: '1px solid #ccc', margin: 8, padding: 12 }}>
          <h3>{post.title}</h3>
          <p>{post.body}</p>
          <button onClick={() => handleDelete(post.id)}>Удалить</button>
        </div>
      ))}
    </div>
  );
};

export default PostsManager;
```

## Параллельные запросы

Иногда нужно выполнить несколько запросов одновременно. Используйте `Promise.all` или `axios.all`:

```typescript
import axios from 'axios';

// С Promise.all (предпочтительный способ)
async function loadDashboardData() {
  try {
    const [usersResponse, postsResponse, commentsResponse] = await Promise.all([
      axios.get<User[]>('/api/users'),
      axios.get<Post[]>('/api/posts?_limit=5'),
      axios.get<Comment[]>('/api/comments?_limit=10'),
    ]);

    return {
      users: usersResponse.data,
      posts: postsResponse.data,
      comments: commentsResponse.data,
    };
  } catch (error) {
    // Если хотя бы один запрос упадёт — Promise.all выбросит ошибку
    throw error;
  }
}

// С Promise.allSettled — продолжаем даже при частичных ошибках
async function loadPartialData() {
  const results = await Promise.allSettled([
    axios.get<User[]>('/api/users'),
    axios.get<Post[]>('/api/posts'),
    axios.get<Comment[]>('/api/comments'),
  ]);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value.data;
    } else {
      console.error(`Запрос ${index} завершился ошибкой:`, result.reason);
      return null;
    }
  });
}
```

## Загрузка файлов

Axios поддерживает отслеживание прогресса загрузки файлов:

```typescript
import axios from 'axios';
import React, { useState } from 'react';

const FileUploadComponent: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);

    setUploading(true);
    setProgress(0);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        },
      });

      console.log('Файл загружен:', response.data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        disabled={uploading}
      />
      {uploading && (
        <div>
          <progress value={progress} max={100} />
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;
```

## Настройка глобальных умолчаний

Вы можете настроить умолчания для всех запросов через глобальный объект конфигурации:

```typescript
import axios from 'axios';

// Глобальные настройки
axios.defaults.baseURL = 'https://api.example.com';
axios.defaults.timeout = 10000;
axios.defaults.headers.common['Authorization'] = `Bearer ${getToken()}`;
axios.defaults.headers.post['Content-Type'] = 'application/json';

// Или через instance — предпочтительный способ в больших приложениях
const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
});
```

Настройка через instance предпочтительнее, потому что она не загрязняет глобальный объект axios и позволяет иметь несколько независимых клиентов (например, для разных API).

## Обработка ошибок — лучшие практики

Axios предоставляет удобный способ проверить, является ли ошибка AxiosError:

```typescript
import axios, { AxiosError } from 'axios';

function handleAxiosError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message: string }>;

    if (axiosError.response) {
      // Сервер ответил с кодом ошибки
      const status = axiosError.response.status;
      const serverMessage = axiosError.response.data?.message;

      return serverMessage || `Ошибка сервера: ${status}`;
    } else if (axiosError.request) {
      // Запрос был сделан, но ответа нет
      return 'Нет ответа от сервера. Проверьте подключение к интернету.';
    } else {
      // Ошибка при настройке запроса
      return `Ошибка запроса: ${axiosError.message}`;
    }
  }

  // Не AxiosError
  if (error instanceof Error) {
    return error.message;
  }

  return 'Произошла неизвестная ошибка';
}

// Использование в компоненте
async function fetchData() {
  try {
    const response = await axios.get('/api/data');
    return response.data;
  } catch (error) {
    const errorMessage = handleAxiosError(error);
    // Показываем пользователю понятное сообщение
    toast.error(errorMessage);
    throw error;
  }
}
```

## Итоги

В этой статье мы разобрали все ключевые аспекты работы с Axios в React-приложениях:

- **Установка** — `npm install axios`, TypeScript-типы включены
- **Базовые методы** — GET, POST, PUT, PATCH, DELETE с автоматическим JSON-парсингом
- **React-интеграция** — использование с `useState` и `useEffect`, кастомные хуки
- **Axios Instance** — создание переиспользуемого клиента с baseURL и общими заголовками
- **Interceptors** — перехват запросов и ответов для авторизации и глобальной обработки ошибок
- **Отмена запросов** — использование `AbortController` для предотвращения утечек памяти
- **TypeScript** — типизация ответов, ошибок и API-сервисов
- **Параллельные запросы** — `Promise.all` и `Promise.allSettled`
- **Загрузка файлов** — с отслеживанием прогресса через `onUploadProgress`

Axios остаётся одной из самых популярных библиотек для HTTP-запросов в экосистеме React. Его богатые возможности — interceptors, автоматический JSON-парсинг, встроенная обработка ошибок и TypeScript-поддержка — делают работу с API значительно удобнее, чем с нативным `fetch`.

Для более сложных сценариев управления серверными данными (кэширование, фоновая синхронизация, оптимистичные обновления) рассмотрите использование Axios совместно с TanStack Query или SWR.

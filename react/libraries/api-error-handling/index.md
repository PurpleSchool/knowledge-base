---
metaTitle: Обработка ошибок API в React - fetch, Axios и Error Boundary
metaDescription: Как обрабатывать ошибки API в React приложениях: fetch, Axios interceptors, Error Boundary, retry логика и отображение ошибок
author: Олег Марков
title: Обработка ошибок API
preview: Узнайте как правильно обрабатывать ошибки API в React. Обработка HTTP ошибок, Error Boundary, централизованная обработка и retry логика
---

## Введение

Работа с внешними API — неотъемлемая часть современной разработки на React. Но сетевые запросы могут завершаться неудачей по многим причинам: сервер недоступен, пользователь ввёл некорректные данные, истёк токен авторизации. Если не обрабатывать эти ситуации правильно, пользователь увидит белый экран, зависший интерфейс или непонятное сообщение об ошибке.

В этой статье вы узнаете, как системно подходить к обработке ошибок API в React-приложениях: разберём типы ошибок, паттерны работы с `fetch` и Axios, использование Error Boundary, централизованную обработку, отображение ошибок пользователю, retry-логику и TypeScript-типизацию.

## Типы ошибок при работе с API

Прежде чем писать код, важно понять, с какими ошибками вы можете столкнуться. Их можно разделить на несколько категорий.

### Сетевые ошибки

Сетевые ошибки возникают, когда браузер не может установить соединение с сервером. Это может происходить по следующим причинам:

- Нет подключения к интернету
- Сервер недоступен (упал, перегружен)
- Запрос заблокирован CORS-политикой
- Превышен таймаут соединения

При использовании `fetch` сетевые ошибки приводят к тому, что промис **отклоняется** (rejected). При использовании Axios — аналогично.

```typescript
// Сетевая ошибка: промис отклонён
try {
  const response = await fetch('https://api.example.com/users');
} catch (error) {
  // Сюда попадём при сетевой ошибке
  console.error('Сетевая ошибка:', error);
}
```

### HTTP-ошибки (коды 4xx и 5xx)

HTTP-ошибки возвращаются сервером и обозначают конкретные проблемы:

| Код | Описание | Типичная причина |
|-----|----------|-----------------|
| 400 | Bad Request | Некорректные данные в запросе |
| 401 | Unauthorized | Не авторизован, нужен токен |
| 403 | Forbidden | Доступ запрещён |
| 404 | Not Found | Ресурс не существует |
| 422 | Unprocessable Entity | Ошибки валидации |
| 429 | Too Many Requests | Превышен лимит запросов |
| 500 | Internal Server Error | Ошибка на сервере |
| 502 | Bad Gateway | Проблема с прокси/gateway |
| 503 | Service Unavailable | Сервис временно недоступен |

Важно понимать: при использовании `fetch` HTTP-ошибки (4xx, 5xx) **не** приводят к отклонению промиса — промис выполняется успешно, но свойство `response.ok` будет `false`. Это одна из самых частых ошибок начинающих разработчиков.

### Ошибки валидации и бизнес-логики

Некоторые API возвращают статус 200, но в теле ответа содержится информация об ошибке:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Email уже используется",
    "fields": {
      "email": "Этот адрес уже зарегистрирован"
    }
  }
}
```

Такие ошибки нужно обрабатывать отдельно, анализируя тело ответа.

## Обработка ошибок с fetch

### Проверка response.ok

Базовый паттерн работы с `fetch` — всегда проверять `response.ok` после каждого запроса:

```typescript
async function fetchUser(id: number) {
  const response = await fetch(`/api/users/${id}`);

  // fetch не бросает ошибку при 4xx/5xx!
  // Нужно проверять response.ok вручную
  if (!response.ok) {
    throw new Error(`HTTP ошибка: ${response.status}`);
  }

  return response.json();
}
```

### Создание wrapper-функции для fetch

Чтобы не дублировать проверку в каждом запросе, создайте обёртку:

```typescript
// lib/api.ts

interface ApiError {
  message: string;
  status: number;
  data?: unknown;
}

class HttpError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  // Пробуем прочитать тело ответа
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      (data as any)?.message ||
      (data as any)?.error ||
      `Ошибка ${response.status}`;
    throw new HttpError(message, response.status, data);
  }

  return data as T;
}

export { apiFetch, HttpError };
export type { ApiError };
```

Теперь вы можете использовать `apiFetch` в компонентах:

```typescript
// В компоненте
import { apiFetch, HttpError } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<User>(`/api/users/${userId}`)
      .then(setUser)
      .catch((err) => {
        if (err instanceof HttpError) {
          if (err.status === 404) {
            setError('Пользователь не найден');
          } else if (err.status === 403) {
            setError('У вас нет доступа к этому профилю');
          } else {
            setError(`Ошибка загрузки: ${err.message}`);
          }
        } else {
          setError('Проблема с подключением к интернету');
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!user) return null;

  return <div>{user.name}</div>;
}
```

### Обработка ошибок с async/await и try-catch

Паттерн `try-catch` делает код более читаемым:

```typescript
async function loadUserData(userId: number) {
  try {
    const user = await apiFetch<User>(`/api/users/${userId}`);
    const posts = await apiFetch<Post[]>(`/api/users/${userId}/posts`);
    return { user, posts };
  } catch (error) {
    if (error instanceof HttpError) {
      // Обрабатываем HTTP-ошибки
      switch (error.status) {
        case 401:
          // Перенаправляем на страницу входа
          window.location.href = '/login';
          break;
        case 404:
          throw new Error('Данные не найдены');
        default:
          throw new Error(`Ошибка сервера: ${error.message}`);
      }
    }
    // Прокидываем сетевые и другие ошибки дальше
    throw error;
  }
}
```

## Обработка ошибок с Axios

Axios предоставляет более удобную работу с ошибками из коробки: HTTP-ошибки (4xx, 5xx) автоматически приводят к отклонению промиса, и вам не нужно проверять `response.ok`.

### Базовая обработка ошибок Axios

```typescript
import axios, { AxiosError } from 'axios';

interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

async function fetchPost(id: number) {
  try {
    const { data } = await axios.get<Post>(`/api/posts/${id}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Это ошибка от Axios (HTTP или сетевая)
      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError.response) {
        // Сервер вернул ответ с кодом ошибки
        const status = axiosError.response.status;
        const message = axiosError.response.data?.message || 'Ошибка сервера';

        console.error(`HTTP ${status}: ${message}`);
        throw new Error(message);
      } else if (axiosError.request) {
        // Запрос был отправлен, но ответ не получен
        throw new Error('Сервер не отвечает. Проверьте подключение к интернету.');
      }
    }
    // Неизвестная ошибка
    throw new Error('Произошла неизвестная ошибка');
  }
}
```

### Axios Interceptors для централизованной обработки

Перехватчики (interceptors) Axios позволяют обрабатывать ошибки в одном месте для всего приложения:

```typescript
// lib/axios-instance.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехватчик запросов: добавляем токен авторизации
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Перехватчик ответов: централизованная обработка ошибок
apiClient.interceptors.response.use(
  // Успешный ответ — возвращаем как есть
  (response) => response,

  // Ошибка — обрабатываем централизованно
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response) {
      const { status } = error.response;

      switch (status) {
        case 401:
          // Токен истёк — пробуем обновить
          if (!originalRequest._retry) {
            originalRequest._retry = true;
            try {
              const { data } = await apiClient.post('/auth/refresh');
              localStorage.setItem('auth_token', data.token);
              // Повторяем оригинальный запрос с новым токеном
              originalRequest.headers.Authorization = `Bearer ${data.token}`;
              return apiClient(originalRequest);
            } catch {
              // Не удалось обновить токен — разлогиниваем
              localStorage.removeItem('auth_token');
              window.location.href = '/login';
            }
          }
          break;

        case 403:
          console.error('Доступ запрещён');
          break;

        case 429:
          // Too Many Requests — информируем пользователя
          console.warn('Слишком много запросов. Подождите немного.');
          break;

        case 500:
        case 502:
        case 503:
          console.error('Ошибка сервера. Попробуйте позже.');
          break;
      }
    } else if (error.request) {
      console.error('Нет ответа от сервера');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

Теперь в компонентах вы используете `apiClient` вместо `axios` напрямую:

```typescript
// В компоненте
import apiClient from '@/lib/axios-instance';

async function createPost(postData: CreatePostDto) {
  const { data } = await apiClient.post<Post>('/posts', postData);
  return data;
}
```

### Типизация ошибок Axios с TypeScript

Создайте тип для стандартного формата ошибок вашего API:

```typescript
// types/api.ts

// Структура ошибки от сервера
interface ServerError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// Хелпер для извлечения сообщения из ошибки Axios
function getAxiosErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const serverError = error.response?.data as ServerError | undefined;
    if (serverError?.message) {
      return serverError.message;
    }
    if (error.response?.status === 404) {
      return 'Ресурс не найден';
    }
    if (!error.response) {
      return 'Нет подключения к интернету';
    }
    return `Ошибка ${error.response.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Произошла неизвестная ошибка';
}

// Хелпер для получения ошибок валидации
function getValidationErrors(error: unknown): Record<string, string[]> | null {
  if (axios.isAxiosError(error)) {
    const serverError = error.response?.data as ServerError | undefined;
    return serverError?.errors || null;
  }
  return null;
}

export { getAxiosErrorMessage, getValidationErrors };
export type { ServerError };
```

## Error Boundary в React

Error Boundary — это React-компонент, который перехватывает JavaScript-ошибки в дереве дочерних компонентов и отображает запасной UI вместо упавшего компонента.

### Создание Error Boundary

Error Boundary реализуется как классовый компонент (функциональные компоненты пока не поддерживают `componentDidCatch`):

```typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Обновляем state, чтобы при следующем рендере показать fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Логируем ошибку в систему мониторинга
    console.error('ErrorBoundary поймал ошибку:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Показываем пользовательский fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <h2>Что-то пошло не так</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={this.handleReset}>Попробовать снова</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Использование Error Boundary

Оберните компоненты, которые могут выбросить ошибку:

```typescript
// app/layout.tsx или любой компонент
import ErrorBoundary from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary
      fallback={
        <div>
          <h2>Произошла ошибка</h2>
          <a href="/">Вернуться на главную</a>
        </div>
      }
    >
      <UserDashboard />
    </ErrorBoundary>
  );
}
```

### Error Boundary с react-error-boundary

Библиотека `react-error-boundary` предоставляет готовые решения и функциональный API:

```bash
npm install react-error-boundary
```

```typescript
import { ErrorBoundary, useErrorBoundary } from 'react-error-boundary';

// Компонент fallback с доступом к ошибке и функции сброса
function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div role="alert" className="error-container">
      <h2>Произошла ошибка:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Попробовать снова</button>
    </div>
  );
}

// Использование
function Dashboard() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        // Отправляем ошибку в Sentry или другой сервис
        logErrorToService(error, info);
      }}
      onReset={() => {
        // Сбрасываем состояние приложения при необходимости
      }}
    >
      <UserProfile />
      <RecentPosts />
    </ErrorBoundary>
  );
}

// В функциональных компонентах можно бросать ошибки вручную
function DataLoader({ id }: { id: number }) {
  const { showBoundary } = useErrorBoundary();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData(id)
      .then(setData)
      .catch((error) => {
        // Передаём ошибку в ближайший Error Boundary
        showBoundary(error);
      });
  }, [id, showBoundary]);

  return data ? <DataView data={data} /> : <div>Загрузка...</div>;
}
```

## Централизованная обработка ошибок

### Контекст для управления ошибками

Создайте контекст для управления глобальными ошибками в приложении:

```typescript
// contexts/ErrorContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

interface AppError {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: Date;
}

interface ErrorContextValue {
  errors: AppError[];
  addError: (message: string, type?: AppError['type']) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<AppError[]>([]);

  const addError = useCallback(
    (message: string, type: AppError['type'] = 'error') => {
      const error: AppError = {
        id: crypto.randomUUID(),
        message,
        type,
        timestamp: new Date(),
      };
      setErrors((prev) => [...prev, error]);

      // Автоматически удаляем ошибку через 5 секунд
      setTimeout(() => {
        setErrors((prev) => prev.filter((e) => e.id !== error.id));
      }, 5000);
    },
    []
  );

  const removeError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearErrors = useCallback(() => setErrors([]), []);

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError должен использоваться внутри ErrorProvider');
  }
  return context;
}
```

### Хук useApi для унифицированной работы с запросами

```typescript
// hooks/useApi.ts
import { useState, useCallback } from 'react';
import { useError } from '@/contexts/ErrorContext';
import { getAxiosErrorMessage } from '@/types/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

function useApi<T>(
  apiFunction: (...args: unknown[]) => Promise<T>,
  options?: {
    showGlobalError?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  }
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { addError } = useError();

  const execute = useCallback(
    async (...args: unknown[]) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await apiFunction(...args);
        setState({ data, loading: false, error: null });
        options?.onSuccess?.(data);
        return data;
      } catch (error) {
        const message = getAxiosErrorMessage(error);
        setState({ data: null, loading: false, error: message });

        if (options?.showGlobalError !== false) {
          addError(message);
        }

        options?.onError?.(message);
        return null;
      }
    },
    [apiFunction, addError, options]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

export default useApi;
```

Использование хука в компоненте:

```typescript
// components/PostForm.tsx
import useApi from '@/hooks/useApi';
import apiClient from '@/lib/axios-instance';

interface CreatePostDto {
  title: string;
  content: string;
}

async function createPost(data: CreatePostDto) {
  const response = await apiClient.post<Post>('/posts', data);
  return response.data;
}

function PostForm() {
  const {
    loading,
    error,
    execute: submitPost,
  } = useApi(createPost, {
    onSuccess: (post) => {
      console.log('Пост создан:', post.id);
    },
    showGlobalError: false, // Показываем ошибку локально, не глобально
  });

  const handleSubmit = async (formData: CreatePostDto) => {
    await submitPost(formData);
  };

  return (
    <form onSubmit={/* ... */}>
      {error && (
        <div className="form-error">{error}</div>
      )}
      <button type="submit" disabled={loading}>
        {loading ? 'Сохранение...' : 'Опубликовать'}
      </button>
    </form>
  );
}
```

## Отображение ошибок пользователю

### Toast-уведомления

Toast-уведомления — ненавязчивый способ показывать ошибки. Используйте библиотеки вроде `react-hot-toast` или `sonner`:

```bash
npm install react-hot-toast
```

```typescript
// Глобальные настройки в корневом компоненте
import { Toaster } from 'react-hot-toast';

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
              color: 'white',
            },
          },
        }}
      />
    </>
  );
}
```

```typescript
// В компоненте
import toast from 'react-hot-toast';

async function deletePost(id: number) {
  try {
    await apiClient.delete(`/posts/${id}`);
    toast.success('Пост успешно удалён');
  } catch (error) {
    const message = getAxiosErrorMessage(error);
    toast.error(message);
  }
}
```

### Inline-сообщения об ошибках

Для форм и конкретных секций страницы лучше использовать inline-ошибки:

```typescript
// components/UserEditForm.tsx
import { useState } from 'react';
import axios, { AxiosError } from 'axios';

interface FormErrors {
  name?: string;
  email?: string;
  general?: string;
}

function UserEditForm({ userId }: { userId: number }) {
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: UpdateUserDto) => {
    setLoading(true);
    setFormErrors({});

    try {
      await apiClient.put(`/users/${userId}`, data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const response = error.response;

        if (response?.status === 422) {
          // Ошибки валидации от сервера
          const serverErrors = response.data?.errors as Record<string, string[]>;
          if (serverErrors) {
            setFormErrors({
              name: serverErrors.name?.[0],
              email: serverErrors.email?.[0],
            });
          }
        } else if (response?.status === 409) {
          // Конфликт — например, email уже занят
          setFormErrors({ email: 'Этот email уже используется' });
        } else {
          setFormErrors({ general: 'Не удалось сохранить изменения' });
        }
      } else {
        setFormErrors({ general: 'Ошибка подключения' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form>
      {formErrors.general && (
        <div className="alert alert-error">{formErrors.general}</div>
      )}

      <div className="field">
        <label>Имя</label>
        <input name="name" />
        {formErrors.name && (
          <span className="field-error">{formErrors.name}</span>
        )}
      </div>

      <div className="field">
        <label>Email</label>
        <input name="email" type="email" />
        {formErrors.email && (
          <span className="field-error">{formErrors.email}</span>
        )}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Сохранение...' : 'Сохранить'}
      </button>
    </form>
  );
}
```

### Компонент ErrorMessage

Создайте переиспользуемый компонент для отображения ошибок:

```typescript
// components/ui/ErrorMessage.tsx
interface ErrorMessageProps {
  error: string | null | undefined;
  className?: string;
  onRetry?: () => void;
}

function ErrorMessage({ error, className, onRetry }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className={`error-message ${className || ''}`} role="alert">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="icon"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <span>{error}</span>
      {onRetry && (
        <button onClick={onRetry} className="retry-button">
          Повторить
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
```

## Retry-логика при неудачных запросах

Не все ошибки постоянны — временные проблемы с сетью или перегрузка сервера (503) могут исчезнуть через секунду. Retry-логика позволяет автоматически повторить запрос.

### Простая retry-функция

```typescript
// lib/retry.ts

interface RetryOptions {
  retries: number;
  delay: number;
  backoff?: 'linear' | 'exponential';
  shouldRetry?: (error: unknown) => boolean;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { retries, delay, backoff = 'exponential', shouldRetry } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Проверяем, нужно ли вообще повторять
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }

      // Не повторяем на последней попытке
      if (attempt < retries) {
        const waitTime =
          backoff === 'exponential'
            ? delay * Math.pow(2, attempt) // Экспоненциальный backoff
            : delay * (attempt + 1); // Линейный backoff

        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

// Функция определения, стоит ли повторять запрос
function isRetryableError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    // Сетевые ошибки всегда повторяем
    if (!error.response) return true;

    // Серверные ошибки — повторяем
    const status = error.response.status;
    return status === 429 || status === 500 || status === 502 || status === 503;
  }
  return false;
}

export { withRetry, isRetryableError };
```

Использование:

```typescript
// В компоненте или сервисе
import { withRetry, isRetryableError } from '@/lib/retry';

async function fetchCriticalData() {
  return withRetry(
    () => apiClient.get('/critical-endpoint').then((r) => r.data),
    {
      retries: 3,
      delay: 1000, // 1 секунда
      backoff: 'exponential', // 1с → 2с → 4с
      shouldRetry: isRetryableError,
    }
  );
}
```

### Хук useRetry для компонентов

```typescript
// hooks/useRetry.ts
import { useState, useCallback, useRef } from 'react';

interface UseRetryOptions {
  maxRetries?: number;
  delay?: number;
  onMaxRetriesReached?: () => void;
}

function useRetry<T>(
  fn: () => Promise<T>,
  options: UseRetryOptions = {}
) {
  const { maxRetries = 3, delay = 1000, onMaxRetriesReached } = options;
  const [retryCount, setRetryCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fn();
      setData(result);
      setRetryCount(0);
    } catch (err) {
      const message = getAxiosErrorMessage(err);
      setError(message);

      if (retryCount < maxRetries && isRetryableError(err)) {
        setRetryCount((c) => c + 1);
        const wait = delay * Math.pow(2, retryCount);

        timerRef.current = setTimeout(() => {
          execute();
        }, wait);
      } else if (retryCount >= maxRetries) {
        onMaxRetriesReached?.();
      }
    } finally {
      setLoading(false);
    }
  }, [fn, retryCount, maxRetries, delay, onMaxRetriesReached]);

  const retry = useCallback(() => {
    clearTimeout(timerRef.current);
    setRetryCount(0);
    execute();
  }, [execute]);

  return { data, loading, error, retryCount, execute, retry };
}

export default useRetry;
```

### Автоматический retry в Axios с axios-retry

```bash
npm install axios-retry
```

```typescript
// lib/axios-instance.ts
import axios from 'axios';
import axiosRetry from 'axios-retry';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// Настраиваем автоматические повторы
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: (retryCount) => {
    // Экспоненциальный backoff: 1с, 2с, 4с
    return axiosRetry.exponentialDelay(retryCount);
  },
  retryCondition: (error) => {
    // Повторяем при сетевых ошибках и 5xx
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 503
    );
  },
  onRetry: (retryCount, error) => {
    console.log(`Попытка ${retryCount} после ошибки: ${error.message}`);
  },
});

export default apiClient;
```

## TypeScript типизация ошибок API

Хорошая типизация ошибок позволяет IDE подсказывать вам, с какими полями работать, и помогает избежать ошибок во время выполнения.

### Базовые типы для ошибок

```typescript
// types/api-errors.ts

// Базовый интерфейс ошибки API
interface BaseApiError {
  message: string;
  code?: string;
  timestamp?: string;
}

// Ошибка валидации с ошибками по полям
interface ValidationError extends BaseApiError {
  code: 'VALIDATION_FAILED';
  errors: Record<string, string[]>;
}

// Ошибка авторизации
interface AuthError extends BaseApiError {
  code: 'UNAUTHORIZED' | 'TOKEN_EXPIRED' | 'INVALID_TOKEN';
}

// Ошибка ресурса
interface NotFoundError extends BaseApiError {
  code: 'NOT_FOUND';
  resource?: string;
}

// Объединённый тип ошибок API
type ApiError = ValidationError | AuthError | NotFoundError | BaseApiError;

// Type guard для ValidationError
function isValidationError(error: ApiError): error is ValidationError {
  return error.code === 'VALIDATION_FAILED';
}

// Type guard для AuthError
function isAuthError(error: ApiError): error is AuthError {
  return ['UNAUTHORIZED', 'TOKEN_EXPIRED', 'INVALID_TOKEN'].includes(
    error.code || ''
  );
}

export { isValidationError, isAuthError };
export type { ApiError, ValidationError, AuthError, NotFoundError, BaseApiError };
```

### Типизированный класс ошибки

```typescript
// lib/errors.ts
import type { ApiError } from '@/types/api-errors';

class ApiRequestError extends Error {
  readonly status: number;
  readonly data: ApiError | null;
  readonly isNetworkError: boolean;

  constructor({
    message,
    status,
    data,
    isNetworkError = false,
  }: {
    message: string;
    status: number;
    data?: ApiError | null;
    isNetworkError?: boolean;
  }) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data ?? null;
    this.isNetworkError = isNetworkError;
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError() {
    return this.status >= 500;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }
}

// Фабричная функция для создания ApiRequestError из AxiosError
function fromAxiosError(error: AxiosError<ApiError>): ApiRequestError {
  if (error.response) {
    return new ApiRequestError({
      message: error.response.data?.message || `HTTP ${error.response.status}`,
      status: error.response.status,
      data: error.response.data,
    });
  }

  return new ApiRequestError({
    message: 'Нет подключения к интернету',
    status: 0,
    isNetworkError: true,
  });
}

export { ApiRequestError, fromAxiosError };
```

### Использование в компонентах с TypeScript

```typescript
// components/UserSettings.tsx
import { ApiRequestError, fromAxiosError } from '@/lib/errors';
import { isValidationError, isAuthError } from '@/types/api-errors';
import type { ApiError } from '@/types/api-errors';

interface UpdateSettingsDto {
  name: string;
  email: string;
  bio?: string;
}

function UserSettings() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSave = async (data: UpdateSettingsDto) => {
    try {
      await apiClient.put<User>('/users/me/settings', data);
    } catch (rawError) {
      if (axios.isAxiosError(rawError)) {
        const error = fromAxiosError(rawError as AxiosError<ApiError>);

        if (error.isUnauthorized) {
          // Точно знаем, что статус 401
          router.push('/login');
          return;
        }

        if (error.isClientError && isValidationError(error.data!)) {
          // TypeScript знает, что error.data — ValidationError
          // и у него есть поле errors: Record<string, string[]>
          const newErrors: Record<string, string> = {};
          for (const [field, messages] of Object.entries(error.data.errors)) {
            newErrors[field] = messages[0];
          }
          setFieldErrors(newErrors);
          return;
        }

        if (error.isNetworkError) {
          toast.error('Проверьте подключение к интернету');
          return;
        }
      }
      toast.error('Не удалось сохранить настройки');
    }
  };

  return (
    <form>
      {/* поля формы */}
    </form>
  );
}
```

## Полный пример: компонент с комплексной обработкой ошибок

Соберём всё вместе в один практический пример:

```typescript
// components/DataTable.tsx
import { useState, useEffect, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import toast from 'react-hot-toast';
import apiClient from '@/lib/axios-instance';
import { withRetry, isRetryableError } from '@/lib/retry';
import { getAxiosErrorMessage } from '@/types/api';
import ErrorMessage from '@/components/ui/ErrorMessage';

interface Post {
  id: number;
  title: string;
  author: string;
  createdAt: string;
}

function DataTable() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const fetchPosts = useCallback(async (showRetryIndicator = false) => {
    if (showRetryIndicator) setRetrying(true);
    setLoading(true);
    setError(null);

    try {
      const data = await withRetry(
        () => apiClient.get<Post[]>('/posts').then((r) => r.data),
        {
          retries: 3,
          delay: 500,
          shouldRetry: isRetryableError,
        }
      );

      setPosts(data);
    } catch (err) {
      const message = getAxiosErrorMessage(err);
      setError(message);
      if (showRetryIndicator) {
        toast.error(`Не удалось обновить данные: ${message}`);
      }
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleRetry = () => fetchPosts(true);

  if (loading && !retrying) {
    return <div className="loader">Загрузка данных...</div>;
  }

  return (
    <div>
      <ErrorMessage
        error={error}
        onRetry={handleRetry}
      />

      {retrying && (
        <div className="retry-indicator">Повторная попытка...</div>
      )}

      <table>
        <thead>
          <tr>
            <th>Заголовок</th>
            <th>Автор</th>
            <th>Дата</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id}>
              <td>{post.title}</td>
              <td>{post.author}</td>
              <td>{new Date(post.createdAt).toLocaleDateString('ru-RU')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Оборачиваем в ErrorBoundary для защиты от неожиданных ошибок
function DataTableWithBoundary() {
  return (
    <ErrorBoundary
      fallback={
        <div>
          <p>Компонент не смог загрузиться.</p>
          <button onClick={() => window.location.reload()}>
            Перезагрузить страницу
          </button>
        </div>
      }
    >
      <DataTable />
    </ErrorBoundary>
  );
}

export default DataTableWithBoundary;
```

## Лучшие практики

Вот несколько рекомендаций, которые сделают обработку ошибок в вашем приложении надёжной:

**Всегда обрабатывайте оба типа ошибок.** При использовании `fetch` не забывайте про `response.ok` — HTTP-ошибки не отклоняют промис. При использовании Axios используйте `axios.isAxiosError()` для точного определения типа ошибки.

**Различайте ошибки по типу.** Клиентские ошибки (4xx) обычно означают ошибку в данных или правах пользователя — покажите понятное сообщение. Серверные ошибки (5xx) и сетевые проблемы — повод для retry и уведомления о временной недоступности.

**Централизуйте обработку.** Используйте Axios interceptors или контекст для перехвата типичных ошибок (401, 503) в одном месте вместо дублирования кода в каждом компоненте.

**Используйте Error Boundary.** Добавьте Error Boundary на уровне страниц или крупных секций, чтобы изолировать падения и не показывать пустой экран всему приложению.

**Не злоупотребляйте retry.** Повторяйте только idempotent-запросы (GET) и только при временных ошибках (сеть, 503). POST-запросы нельзя повторять без проверки идемпотентности — вы рискуете создать дублирующие записи.

**Логируйте ошибки.** Отправляйте ошибки в Sentry, Datadog или аналогичный сервис — это поможет обнаруживать проблемы в продакшене раньше пользователей.

**Типизируйте ошибки.** Точная TypeScript-типизация форматов ошибок вашего API помогает избежать ошибок и упрощает работу с IDE.

## Заключение

Обработка ошибок API — это не опциональная функция, а обязательная часть любого production-приложения. Мы разобрали основные подходы:

- Использование `response.ok` и try-catch при работе с `fetch`
- Централизованную обработку через Axios interceptors
- Error Boundary для защиты UI от неожиданных ошибок
- Контекст и хуки для управления ошибками в приложении
- Toast и inline-сообщения для информирования пользователя
- Retry-логику с экспоненциальным backoff для временных проблем
- TypeScript-типизацию для надёжной работы с форматами ошибок

Каждый из этих инструментов решает свою задачу, и их правильная комбинация создаёт приложение, которое не просто работает в хороших условиях, но и достойно справляется с реальными проблемами сети и сервера.

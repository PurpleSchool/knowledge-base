---
metaTitle: "TypeScript: типизация ответов API с fetch и дженерики"
metaDescription: "Как типизировать ответы fetch-запросов в TypeScript с помощью дженериков, обработка ошибок и паттерны для работы с API."
author: "Антон Ларичев"
title: "Типизация ответов API с fetch и generic-функции"
preview: "Разбираем, как правильно типизировать ответы от API в TypeScript, строить generic-обёртки над fetch и безопасно обрабатывать ошибки."
---

## Проблема нетипизированных ответов API

Когда вы делаете запрос через `fetch`, TypeScript не знает, что именно вернёт сервер. Метод `response.json()` возвращает `Promise<any>` — это означает, что вы теряете все преимущества статической типизации сразу после получения данных.

```typescript
async function getUser() {
  const response = await fetch('/api/users/1');
  const data = await response.json(); // тип: any
  console.log(data.naem); // опечатка — TypeScript промолчит
}
```

Ошибки в именах свойств, обращение к несуществующим полям, неверные предположения о форме данных — всё это компилятор пропустит без единого предупреждения. Цель этой статьи — показать, как это исправить.

## Базовая типизация через явное приведение

Самый простой способ — явно указать тип через `as` после вызова `.json()`:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

async function getUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json() as User;
  return data;
}
```

Это работает, но имеет один существенный изъян: `as` — это приведение типов, а не проверка. TypeScript верит вам на слово. Если сервер вернёт объект другой формы, ошибка возникнет только в рантайме.

Тем не менее для большинства внутренних API, где вы контролируете и фронтенд, и бэкенд, такой подход вполне приемлем.

## Generic-функция для fetch-запросов

Чтобы не повторять приведение типов в каждом месте, создадим универсальную обёртку. Generic-параметр `T` позволяет указывать ожидаемый тип ответа в месте вызова.

```typescript
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

Теперь вызов выглядит так:

```typescript
interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

const post = await apiFetch<Post>('/api/posts/1');
console.log(post.title); // TypeScript знает, что это string
```

Компилятор выведет тип `post` как `Post` и будет проверять все обращения к его свойствам.

## Обработка ошибок с типизированными исключениями

В реальных проектах сервер может вернуть ошибку в структурированном виде. Опишем возможные варианты ответа:

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

class HttpError extends Error {
  constructor(
    public status: number,
    public error: ApiError
  ) {
    super(error.message);
    this.name = 'HttpError';
  }
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json() as ApiError;
    throw new HttpError(response.status, error);
  }

  return response.json() as Promise<T>;
}
```

Пример использования с обработкой ошибок:

```typescript
try {
  const user = await apiFetch<User>('/api/users/999');
} catch (err) {
  if (err instanceof HttpError) {
    console.error(`Ошибка ${err.status}: ${err.error.message}`);
    // err.error.details — типизированные детали валидации
  }
}
```

## Паттерн Result для избежания исключений

Вместо выбрасывания исключений можно использовать паттерн Result, популярный в функциональном программировании. Он заставляет явно обрабатывать оба пути выполнения.

```typescript
type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<Result<T, HttpError>> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json() as ApiError;
      return { ok: false, error: new HttpError(response.status, error) };
    }

    const data = await response.json() as T;
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return {
      ok: false,
      error: new HttpError(0, { code: 'NETWORK_ERROR', message })
    };
  }
}
```

Теперь TypeScript через discriminated union гарантирует, что вы проверите `ok` перед обращением к `data`:

```typescript
const result = await safeFetch<User>('/api/users/1');

if (result.ok) {
  console.log(result.data.name); // тип User
} else {
  console.error(result.error.message); // тип HttpError
}
```

Попытка обратиться к `result.data` без проверки `ok` вызовет ошибку компиляции — именно это нам и нужно.

## Типизация методов HTTP с перегрузками

Для полноценного API-клиента опишем функции для разных методов. Используем перегрузки, чтобы тело запроса было обязательным для POST/PUT и недоступным для GET:

```typescript
interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function get<T>(url: string, options?: RequestOptions): Promise<T> {
  return apiFetch<T>(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    signal: options?.signal,
  });
}

async function post<TBody, TResponse>(
  url: string,
  body: TBody,
  options?: RequestOptions
): Promise<TResponse> {
  return apiFetch<TResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(body),
    signal: options?.signal,
  });
}

async function put<TBody, TResponse>(
  url: string,
  body: TBody,
  options?: RequestOptions
): Promise<TResponse> {
  return apiFetch<TResponse>(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(body),
    signal: options?.signal,
  });
}
```

Пример использования:

```typescript
interface CreateUserDto {
  name: string;
  email: string;
}

const newUser = await post<CreateUserDto, User>('/api/users', {
  name: 'Иван',
  email: 'ivan@example.com',
});

console.log(newUser.id); // TypeScript знает, что это number
```

## Типизация пагинированных ответов

Многие API возвращают данные с метаинформацией о пагинации. Generic-типы отлично подходят для описания такой обёртки:

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
  };
}

async function getPaginated<T>(
  url: string,
  page: number = 1,
  perPage: number = 20
): Promise<PaginatedResponse<T>> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  return apiFetch<PaginatedResponse<T>>(`${url}?${params}`);
}
```

Использование:

```typescript
const response = await getPaginated<Post>('/api/posts');

response.data.forEach((post) => {
  console.log(post.title); // TypeScript знает тип Post
});

console.log(`Страница ${response.meta.page} из ${response.meta.lastPage}`);
```

Тот же тип `PaginatedResponse<T>` переиспользуется для любой сущности: пользователей, постов, заказов — достаточно подставить нужный тип.

## Runtime-валидация с Zod

Когда вы не контролируете источник данных — внешние API, вебхуки, пользовательский ввод — простого приведения типов недостаточно. Здесь помогает библиотека Zod, которая одновременно описывает схему и проверяет данные в рантайме:

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;

async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const raw = await response.json();
  return UserSchema.parse(raw); // бросает ZodError если данные не соответствуют схеме
}
```

Преимущество подхода: тип `User` автоматически выводится из схемы Zod через `z.infer`. Вам не нужно дважды описывать одну и ту же структуру — как интерфейс и как схему валидации.

Для некритичных случаев используйте `safeParse`, который не бросает исключение:

```typescript
async function safeFetchUser(id: number): Promise<User | null> {
  const response = await fetch(`/api/users/${id}`);
  const raw = await response.json();

  const result = UserSchema.safeParse(raw);

  if (!result.success) {
    console.warn('Неожиданная форма ответа:', result.error.issues);
    return null;
  }

  return result.data;
}
```

## Итоговый пример: API-клиент

Собираем всё воедино в минималистичный типизированный API-клиент:

```typescript
class ApiClient {
  constructor(private baseUrl: string) {}

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  post<TBody, TResponse>(path: string, body: TBody): Promise<TResponse> {
    return this.request<TResponse>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<TBody, TResponse>(path: string, body: TBody): Promise<TResponse> {
    return this.request<TResponse>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

const api = new ApiClient('https://api.example.com');

const user = await api.get<User>('/users/1');
const created = await api.post<CreateUserDto, User>('/users', {
  name: 'Мария',
  email: 'maria@example.com',
});
```

## Выбор подхода

Подведём итог: какой способ выбрать в зависимости от ситуации.

- **Явное приведение `as T`** — подходит для внутренних API, где вы полностью контролируете контракт.
- **Generic-обёртка над fetch** — убирает повторение и стандартизирует обработку ошибок в команде.
- **Паттерн Result** — хорош, когда ошибки — это ожидаемая часть бизнес-логики, а не исключительные ситуации.
- **Zod + `z.infer`** — необходим при работе с внешними API, вебхуками или любыми данными, которым нельзя доверять без проверки.

Начните с простого приведения типов, добавьте generic-обёртку по мере роста кодовой базы, а Zod подключайте там, где контракт API может быть нарушен.

Для глубокого погружения в TypeScript, включая generics, работу с типами и построение надёжных приложений, смотрите курс на PurpleSchool: https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typing-api-responses-fetch-generics
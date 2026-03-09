---
metaTitle: Мокирование API в тестах React - jest.mock и MSW
metaDescription: Как мокировать API запросы в тестах React с помощью jest.mock, jest.spyOn и Mock Service Worker (MSW)
author: Олег Марков
title: Мокирование API
preview: Узнайте как мокировать API запросы в React тестах. Сравнение jest.mock, axios-mock-adapter и Mock Service Worker (MSW)
---

## Введение

Тестирование React-компонентов, которые выполняют HTTP-запросы — одна из самых распространённых задач в современной фронтенд-разработке. Практически каждое реальное приложение загружает данные с сервера, отправляет формы, обрабатывает ошибки сети. Когда вы пишете тесты для таких компонентов, перед вами встаёт вопрос: как изолировать тест от реального сервера?

Здесь на помощь приходит мокирование (от английского «mock» — имитация). Мок — это объект или функция, которая заменяет реальную зависимость в тесте и ведёт себя так, как вам нужно: возвращает заранее заданные данные, выбрасывает ошибки, позволяет проверить, что функция была вызвана с нужными аргументами.

### Зачем мокировать API в тестах

Причин для мокирования API в тестах несколько:

**Скорость.** Реальные HTTP-запросы медленные. Запрос к серверу может занимать сотни миллисекунд, а при запуске сотен тестов это превращается в минуты ожидания. Моки отвечают мгновенно.

**Надёжность.** Реальный сервер может быть недоступен: упал бекенд, нет интернета, CI-сервер без доступа к внешним ресурсам. Тест, зависящий от реального API, становится «хрупким» — он падает по причинам, не связанным с кодом фронтенда.

**Изоляция.** Тест должен проверять конкретный компонент или функцию, а не всю систему целиком. Мокируя API, вы изолируете тестируемый код от внешних зависимостей.

**Контроль сценариев.** С реальным API сложно воспроизвести редкие ситуации: сервер вернул ошибку 500, соединение оборвалось, запрос занял слишком много времени. С моками вы легко эмулируете любой сценарий.

**Детерминированность.** Реальный сервер может вернуть разные данные в разных запусках. Тест должен давать одинаковый результат при каждом запуске — моки обеспечивают это.

### Инструменты мокирования

В экосистеме React-тестирования существует несколько подходов:

| Инструмент | Уровень мокирования | Когда использовать |
|---|---|---|
| `jest.fn()` | Функция | Простые функции и колбэки |
| `jest.spyOn()` | Метод объекта | Когда нужно сохранить оригинальную реализацию |
| `jest.mock()` | Модуль целиком | Мокирование axios, fetch и других модулей |
| MSW (Mock Service Worker) | Сетевой уровень | Реалистичное мокирование на уровне сети |

В этой статье мы рассмотрим все эти подходы подробно, с практическими примерами.

## jest.fn() и jest.spyOn() для мокирования функций

Прежде чем мокировать целые модули, важно понять базовые инструменты Jest для работы с функциями.

### jest.fn() — создание мок-функции

`jest.fn()` создаёт «умную» функцию, которая запоминает все вызовы, переданные аргументы и контексты. Вы можете задать её возвращаемое значение или реализацию.

```typescript
// Простая мок-функция
const mockCallback = jest.fn();

// Вызовем функцию
mockCallback('hello', 42);
mockCallback('world');

// Проверяем, что функция была вызвана
expect(mockCallback).toHaveBeenCalled();
expect(mockCallback).toHaveBeenCalledTimes(2);
expect(mockCallback).toHaveBeenCalledWith('hello', 42);
expect(mockCallback).toHaveBeenLastCalledWith('world');
```

Вы можете задать возвращаемое значение несколькими способами:

```typescript
// Всегда возвращает одно значение
const mockFn = jest.fn().mockReturnValue(42);
console.log(mockFn()); // 42
console.log(mockFn()); // 42

// Возвращает разные значения при последовательных вызовах
const mockSequence = jest.fn()
  .mockReturnValueOnce('first')
  .mockReturnValueOnce('second')
  .mockReturnValue('default');

console.log(mockSequence()); // 'first'
console.log(mockSequence()); // 'second'
console.log(mockSequence()); // 'default'
console.log(mockSequence()); // 'default'
```

Для асинхронных функций используйте `mockResolvedValue` и `mockRejectedValue`:

```typescript
// Мок асинхронной функции, которая успешно возвращает данные
const mockFetchUser = jest.fn().mockResolvedValue({
  id: 1,
  name: 'Иван',
  email: 'ivan@example.com',
});

// Мок, который имитирует ошибку
const mockFetchWithError = jest.fn().mockRejectedValue(
  new Error('Network error')
);

// Использование в тесте
test('загружает пользователя', async () => {
  const user = await mockFetchUser(1);
  expect(user.name).toBe('Иван');
});

test('обрабатывает ошибку сети', async () => {
  await expect(mockFetchWithError(1)).rejects.toThrow('Network error');
});
```

### Передача мок-функции в компонент через props

Рассмотрим практический пример. Допустим, у нас есть компонент кнопки, который при нажатии вызывает переданный колбэк:

```typescript
// components/SaveButton.tsx
interface SaveButtonProps {
  onSave: (data: { title: string }) => Promise<void>;
  title: string;
}

export function SaveButton({ onSave, title }: SaveButtonProps) {
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const handleClick = async () => {
    setSaving(true);
    try {
      await onSave({ title });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={saving}>
      {saving ? 'Сохранение...' : saved ? 'Сохранено!' : 'Сохранить'}
    </button>
  );
}
```

Тест с использованием `jest.fn()`:

```typescript
// components/SaveButton.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveButton } from './SaveButton';

test('вызывает onSave с правильными данными при нажатии', async () => {
  const mockOnSave = jest.fn().mockResolvedValue(undefined);
  const user = userEvent.setup();

  render(<SaveButton onSave={mockOnSave} title="Мой документ" />);

  const button = screen.getByRole('button', { name: 'Сохранить' });
  await user.click(button);

  expect(mockOnSave).toHaveBeenCalledTimes(1);
  expect(mockOnSave).toHaveBeenCalledWith({ title: 'Мой документ' });
});

test('показывает состояние загрузки во время сохранения', async () => {
  // Создаём промис, который мы можем контролировать вручную
  let resolvePromise!: () => void;
  const mockOnSave = jest.fn().mockImplementation(
    () => new Promise<void>((resolve) => { resolvePromise = resolve; })
  );
  const user = userEvent.setup();

  render(<SaveButton onSave={mockOnSave} title="Тест" />);

  await user.click(screen.getByRole('button', { name: 'Сохранить' }));

  // Пока промис не разрешён — кнопка в состоянии загрузки
  expect(screen.getByText('Сохранение...')).toBeInTheDocument();

  // Разрешаем промис
  resolvePromise();

  await waitFor(() => {
    expect(screen.getByText('Сохранено!')).toBeInTheDocument();
  });
});
```

### jest.spyOn() — слежка за методами объекта

`jest.spyOn()` отличается от `jest.fn()` тем, что «шпионит» за уже существующим методом объекта. По умолчанию он сохраняет оригинальную реализацию и просто записывает вызовы. Но вы можете переопределить поведение метода.

```typescript
// Базовый пример
const calculator = {
  add: (a: number, b: number) => a + b,
  multiply: (a: number, b: number) => a * b,
};

test('шпион за методом add', () => {
  const spy = jest.spyOn(calculator, 'add');

  const result = calculator.add(2, 3);

  expect(spy).toHaveBeenCalledWith(2, 3);
  expect(result).toBe(5); // Оригинальная реализация сохраняется

  // Важно: восстанавливаем оригинал после теста
  spy.mockRestore();
});
```

Переопределение реализации с помощью `mockImplementation`:

```typescript
test('переопределяем multiply', () => {
  const spy = jest.spyOn(calculator, 'multiply')
    .mockImplementation(() => 999);

  const result = calculator.multiply(5, 10);

  expect(result).toBe(999); // Возвращает наше значение, а не 50
  expect(spy).toHaveBeenCalledWith(5, 10);

  spy.mockRestore(); // Восстанавливаем оригинал
});
```

### Слежка за console и другими глобальными объектами

`jest.spyOn()` особенно полезен для слежки за глобальными объектами вроде `console` или `window`:

```typescript
test('компонент логирует ошибку при сбое', async () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  // Рендерим компонент, который может логировать ошибки
  render(<ComponentThatMightError />);

  // ... действия, которые приводят к ошибке

  expect(consoleSpy).toHaveBeenCalled();

  consoleSpy.mockRestore();
});
```

### Сброс и восстановление моков

Важная деталь: моки накапливают информацию о вызовах. Если не сбрасывать их между тестами, данные из одного теста могут «просочиться» в другой.

```typescript
// Вариант 1: сбрасывать вручную в каждом тесте
afterEach(() => {
  jest.clearAllMocks(); // Сбрасывает историю вызовов, но сохраняет реализацию
  // jest.resetAllMocks();  // Сбрасывает историю и реализацию
  // jest.restoreAllMocks(); // Восстанавливает все spyOn к оригиналам
});

// Вариант 2: настроить в jest.config.js
// jest.config.js
module.exports = {
  clearMocks: true,    // Автоматически вызывает jest.clearAllMocks() после каждого теста
  resetMocks: false,
  restoreMocks: true,  // Автоматически вызывает jest.restoreAllMocks() после каждого теста
};
```

## Мокирование модулей с jest.mock()

Когда компонент напрямую импортирует HTTP-клиент (например, axios) или использует глобальный `fetch`, `jest.fn()` уже недостаточно — нужно мокировать сам модуль.

`jest.mock()` позволяет полностью заменить модуль его мок-версией. Ключевая особенность: вызов `jest.mock()` автоматически поднимается в начало файла (hoisting), поэтому модуль мокируется ещё до импортов.

### Мокирование axios

Axios — один из самых популярных HTTP-клиентов для JavaScript. Рассмотрим, как его мокировать.

Предположим, у нас есть сервис для работы с пользователями:

```typescript
// services/userService.ts
import axios from 'axios';

export interface User {
  id: number;
  name: string;
  email: string;
}

export async function fetchUser(id: number): Promise<User> {
  const response = await axios.get<User>(`/api/users/${id}`);
  return response.data;
}

export async function createUser(data: Omit<User, 'id'>): Promise<User> {
  const response = await axios.post<User>('/api/users', data);
  return response.data;
}

export async function updateUser(id: number, data: Partial<User>): Promise<User> {
  const response = await axios.put<User>(`/api/users/${id}`, data);
  return response.data;
}

export async function deleteUser(id: number): Promise<void> {
  await axios.delete(`/api/users/${id}`);
}
```

И компонент, использующий этот сервис:

```typescript
// components/UserProfile.tsx
import React, { useEffect, useState } from 'react';
import { fetchUser, User } from '../services/userService';

interface UserProfileProps {
  userId: number;
}

export function UserProfile({ userId }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;
  if (!user) return null;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

Теперь напишем тесты, мокируя axios:

```typescript
// components/UserProfile.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { UserProfile } from './UserProfile';

// Мокируем модуль axios целиком
jest.mock('axios');

// TypeScript не знает о методах jest.fn() у замоканного axios,
// поэтому приводим к нужному типу
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('UserProfile', () => {
  test('показывает загрузку, затем данные пользователя', async () => {
    // Настраиваем мок: GET-запрос вернёт наши данные
    mockedAxios.get.mockResolvedValue({
      data: { id: 1, name: 'Иван Петров', email: 'ivan@example.com' },
    });

    render(<UserProfile userId={1} />);

    // Сначала показывается спиннер загрузки
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();

    // Затем — данные пользователя
    await waitFor(() => {
      expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    });

    expect(screen.getByText('ivan@example.com')).toBeInTheDocument();

    // Проверяем, что запрос был сделан правильно
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/users/1');
  });

  test('показывает ошибку при сбое запроса', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Сервер недоступен'));

    render(<UserProfile userId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Ошибка: Сервер недоступен')).toBeInTheDocument();
    });
  });

  test('перезагружает данные при изменении userId', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { id: 1, name: 'Иван', email: 'ivan@test.com' } })
      .mockResolvedValueOnce({ data: { id: 2, name: 'Мария', email: 'maria@test.com' } });

    const { rerender } = render(<UserProfile userId={1} />);

    await waitFor(() => expect(screen.getByText('Иван')).toBeInTheDocument());

    rerender(<UserProfile userId={2} />);

    await waitFor(() => expect(screen.getByText('Мария')).toBeInTheDocument());

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(mockedAxios.get).toHaveBeenNthCalledWith(1, '/api/users/1');
    expect(mockedAxios.get).toHaveBeenNthCalledWith(2, '/api/users/2');
  });
});
```

Мокирование сервисного слоя целиком (вместо axios напрямую) — ещё один распространённый подход:

```typescript
// components/UserProfile.test.tsx (альтернативный подход)
import { render, screen, waitFor } from '@testing-library/react';
import * as userService from '../services/userService';
import { UserProfile } from './UserProfile';

// Мокируем весь модуль сервиса
jest.mock('../services/userService');

const mockedUserService = userService as jest.Mocked<typeof userService>;

test('загружает и отображает пользователя', async () => {
  mockedUserService.fetchUser.mockResolvedValue({
    id: 1,
    name: 'Алексей',
    email: 'alex@example.com',
  });

  render(<UserProfile userId={1} />);

  await waitFor(() => {
    expect(screen.getByText('Алексей')).toBeInTheDocument();
  });

  expect(mockedUserService.fetchUser).toHaveBeenCalledWith(1);
});
```

### Частичное мокирование модуля

Иногда нужно замокировать только часть модуля, сохранив оригинальные реализации остальных функций:

```typescript
// Частичное мокирование: только fetchUser замокирован
jest.mock('../services/userService', () => ({
  ...jest.requireActual('../services/userService'), // Сохраняем остальные функции
  fetchUser: jest.fn(),
}));
```

### Мокирование модуля с фабричной функцией

Когда мокируемый модуль экспортирует класс или имеет сложную структуру, используют фабричную функцию:

```typescript
// Мокируем axios с кастомной реализацией
jest.mock('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    create: jest.fn().mockReturnThis(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
}));
```

### Мокирование fetch

Если ваш проект использует нативный `fetch` вместо axios, подход немного отличается. Функция `fetch` — это глобальный объект браузера.

```typescript
// services/api.ts
export interface Post {
  id: number;
  title: string;
  body: string;
}

export async function fetchPosts(): Promise<Post[]> {
  const response = await fetch('/api/posts');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function createPost(data: Omit<Post, 'id'>): Promise<Post> {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
```

Для мокирования `fetch` в Jest есть несколько способов:

**Способ 1: Прямое присвоение через jest.fn()**

```typescript
// services/api.test.ts
import { fetchPosts, createPost } from './api';

// Вспомогательная функция для создания мок-ответа fetch
function createFetchResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response;
}

describe('API сервис', () => {
  beforeEach(() => {
    // Мокируем глобальный fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('fetchPosts возвращает список постов', async () => {
    const mockPosts = [
      { id: 1, title: 'Пост 1', body: 'Содержимое 1' },
      { id: 2, title: 'Пост 2', body: 'Содержимое 2' },
    ];

    (global.fetch as jest.Mock).mockResolvedValue(
      createFetchResponse(mockPosts)
    );

    const posts = await fetchPosts();

    expect(posts).toEqual(mockPosts);
    expect(global.fetch).toHaveBeenCalledWith('/api/posts');
  });

  test('fetchPosts выбрасывает ошибку при HTTP 500', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createFetchResponse({}, false, 500)
    );

    await expect(fetchPosts()).rejects.toThrow('HTTP error! status: 500');
  });

  test('createPost отправляет данные и возвращает созданный пост', async () => {
    const newPost = { title: 'Новый пост', body: 'Текст поста' };
    const createdPost = { id: 3, ...newPost };

    (global.fetch as jest.Mock).mockResolvedValue(
      createFetchResponse(createdPost, true, 201)
    );

    const result = await createPost(newPost);

    expect(result).toEqual(createdPost);
    expect(global.fetch).toHaveBeenCalledWith('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost),
    });
  });
});
```

**Способ 2: Использование библиотеки jest-fetch-mock**

Для более удобного мокирования fetch существует специальная библиотека:

```bash
npm install --save-dev jest-fetch-mock
```

```typescript
// setupTests.ts
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

// В тесте:
import fetchMock from 'jest-fetch-mock';

test('загружает данные через fetch', async () => {
  fetchMock.mockResponseOnce(
    JSON.stringify({ id: 1, name: 'Тест' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );

  const result = await fetchPosts();
  expect(result).toBeDefined();
});

test('обрабатывает сетевую ошибку', async () => {
  fetchMock.mockRejectOnce(new Error('Network error'));

  await expect(fetchPosts()).rejects.toThrow('Network error');
});
```

### Мокирование с помощью jest.spyOn для fetch

Альтернатива — использовать `jest.spyOn` непосредственно на глобальном объекте:

```typescript
test('компонент делает запрос с правильными заголовками', async () => {
  const mockResponse = {
    ok: true,
    json: jest.fn().mockResolvedValue({ data: 'test' }),
  } as unknown as Response;

  const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

  render(<MyComponent />);

  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/data',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Bearer /),
        }),
      })
    );
  });

  fetchSpy.mockRestore();
});
```

## Mock Service Worker (MSW) — современный подход

Mock Service Worker — это библиотека, которая перехватывает HTTP-запросы на уровне Service Worker (в браузере) или Node.js-перехватчиков (в тестах). Это делает её принципиально отличной от `jest.mock()`: вместо мокирования конкретного HTTP-клиента, MSW перехватывает реальные сетевые запросы независимо от того, что их делает.

### Преимущества MSW

**Технологическая независимость.** MSW не знает и не заботится, используете ли вы axios, fetch, ky или любой другой HTTP-клиент. Он работает на уровне сети.

**Реалистичность.** Компонент делает настоящий HTTP-запрос, а MSW перехватывает его и возвращает мок-ответ. Это максимально близко к реальному поведению.

**Совместное использование в тестах и разработке.** Одни и те же обработчики (handlers) можно использовать и в юнит-тестах, и при локальной разработке с мок-сервером.

**Поддержка REST и GraphQL.** MSW поддерживает оба протокола «из коробки».

### Установка и настройка

```bash
npm install --save-dev msw
```

Для MSW 2.x (актуальная версия) настройка немного изменилась по сравнению с 1.x. Убедитесь, что устанавливаете актуальную версию.

```bash
# Проверить версию
npm show msw version
```

Структура файлов для MSW обычно выглядит так:

```
src/
└── mocks/
    ├── handlers.ts      # Определения обработчиков запросов
    ├── server.ts        # Конфигурация для Node.js (тесты)
    └── browser.ts       # Конфигурация для браузера (dev-режим)
```

### Создание handlers

Обработчики (handlers) описывают, какой URL перехватить и что вернуть. В MSW 2.x используется синтаксис с `http` и `HttpResponse`:

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

// Типы данных
interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

// Хранилище для тестовых данных
const users: User[] = [
  { id: 1, name: 'Иван Петров', email: 'ivan@example.com' },
  { id: 2, name: 'Мария Сидорова', email: 'maria@example.com' },
];

const posts: Post[] = [
  { id: 1, userId: 1, title: 'Первый пост', body: 'Содержимое первого поста' },
  { id: 2, userId: 1, title: 'Второй пост', body: 'Содержимое второго поста' },
  { id: 3, userId: 2, title: 'Пост Марии', body: 'Содержимое поста Марии' },
];

export const handlers = [
  // GET /api/users — список пользователей
  http.get('/api/users', () => {
    return HttpResponse.json(users);
  }),

  // GET /api/users/:id — конкретный пользователь
  http.get('/api/users/:id', ({ params }) => {
    const userId = Number(params.id);
    const user = users.find((u) => u.id === userId);

    if (!user) {
      return HttpResponse.json(
        { message: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return HttpResponse.json(user);
  }),

  // POST /api/users — создание пользователя
  http.post('/api/users', async ({ request }) => {
    const body = await request.json() as Omit<User, 'id'>;

    const newUser: User = {
      id: users.length + 1,
      ...body,
    };

    users.push(newUser);

    return HttpResponse.json(newUser, { status: 201 });
  }),

  // PUT /api/users/:id — обновление пользователя
  http.put('/api/users/:id', async ({ params, request }) => {
    const userId = Number(params.id);
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return HttpResponse.json(
        { message: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const updates = await request.json() as Partial<User>;
    users[userIndex] = { ...users[userIndex], ...updates };

    return HttpResponse.json(users[userIndex]);
  }),

  // DELETE /api/users/:id — удаление пользователя
  http.delete('/api/users/:id', ({ params }) => {
    const userId = Number(params.id);
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return HttpResponse.json(
        { message: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    users.splice(userIndex, 1);

    return new HttpResponse(null, { status: 204 });
  }),

  // GET /api/posts — список постов
  http.get('/api/posts', ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (userId) {
      const filteredPosts = posts.filter((p) => p.userId === Number(userId));
      return HttpResponse.json(filteredPosts);
    }

    return HttpResponse.json(posts);
  }),
];
```

### setupServer для Node.js тестов

Для использования MSW в Jest (Node.js окружение) создайте серверную конфигурацию:

```typescript
// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Создаём сервер с нашими обработчиками
export const server = setupServer(...handlers);
```

Затем подключите сервер в глобальной настройке тестов:

```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Запускаем сервер перед всеми тестами
beforeAll(() => server.listen({
  onUnhandledRequest: 'error', // Вызывает ошибку при незамоканных запросах
}));

// Сбрасываем обработчики после каждого теста
// (убирает переопределения, добавленные в конкретных тестах)
afterEach(() => server.resetHandlers());

// Останавливаем сервер после всех тестов
afterAll(() => server.close());
```

Зарегистрируйте файл настройки в `jest.config.js`:

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/src/setupTests.ts'],
};
```

Или в `package.json`:

```json
{
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterFramework": ["<rootDir>/src/setupTests.ts"]
  }
}
```

Теперь используем MSW в тестах:

```typescript
// components/UserList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import { UserList } from './UserList';

// UserList — компонент, который загружает и отображает список пользователей
describe('UserList с MSW', () => {
  test('отображает список пользователей', async () => {
    render(<UserList />);

    // Ждём появления данных
    await waitFor(() => {
      expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    });

    expect(screen.getByText('Мария Сидорова')).toBeInTheDocument();
  });

  test('показывает ошибку при сбое сервера', async () => {
    // Переопределяем обработчик для этого конкретного теста
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.json(
          { message: 'Внутренняя ошибка сервера' },
          { status: 500 }
        );
      })
    );

    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText(/ошибка/i)).toBeInTheDocument();
    });
  });

  test('показывает пустой список когда пользователей нет', async () => {
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.json([]);
      })
    );

    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('Список пользователей пуст')).toBeInTheDocument();
    });
  });
});
```

### setupWorker для браузера

В браузерном окружении MSW работает через Service Worker, который реально перехватывает сетевые запросы:

```typescript
// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

Инициализация в точке входа приложения (только в режиме разработки):

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

async function prepare() {
  // Включаем MSW только в development режиме
  if (process.env.NODE_ENV === 'development') {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass', // В dev-режиме пропускаем незамоканные запросы
    });
  }
}

prepare().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
```

Для работы Service Worker нужно сгенерировать файл `mockServiceWorker.js`:

```bash
npx msw init public/ --save
```

Это создаст файл `/public/mockServiceWorker.js`, который должен быть закоммичен в репозиторий.

### Дополнительные возможности MSW

**Задержка ответа** — полезна для тестирования состояний загрузки:

```typescript
import { http, HttpResponse, delay } from 'msw';

export const handlers = [
  http.get('/api/users', async () => {
    // Симулируем задержку сети в 1 секунду
    await delay(1000);
    return HttpResponse.json(users);
  }),

  // Или используем предопределённые режимы задержки
  http.get('/api/slow', async () => {
    await delay('real'); // Реалистичная случайная задержка
    return HttpResponse.json({ data: 'slow response' });
  }),
];
```

**Passthrough** — пропуск запроса без перехвата:

```typescript
import { http, passthrough } from 'msw';

export const handlers = [
  http.get('/api/public/*', () => {
    // Не мокируем публичные запросы — пропускаем дальше
    return passthrough();
  }),
];
```

**Работа с cookies и заголовками**:

```typescript
http.get('/api/protected', ({ request }) => {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return HttpResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }

  return HttpResponse.json({ data: 'secret' });
}),
```

## Примеры мокирования REST API

Рассмотрим комплексные примеры для типичных сценариев.

### Компонент UserDashboard

Создадим компонент-пример, который демонстрирует типичное взаимодействие с API:

```typescript
// components/UserDashboard.tsx
import React, { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface DashboardState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function UserDashboard({ userId }: { userId: number }) {
  const [state, setState] = useState<DashboardState>({
    user: null,
    loading: true,
    error: null,
  });

  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'deleted'>('idle');

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((user) => setState({ user, loading: false, error: null }))
      .catch((err) => setState({ user: null, loading: false, error: err.message }));
  }, [userId]);

  const handleDelete = async () => {
    if (!state.user) return;
    setDeleteStatus('deleting');

    try {
      const res = await fetch(`/api/users/${state.user.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Не удалось удалить пользователя');
      setDeleteStatus('deleted');
    } catch {
      setDeleteStatus('idle');
      alert('Ошибка удаления');
    }
  };

  if (state.loading) return <div role="status">Загрузка профиля...</div>;
  if (state.error) return <div role="alert">Ошибка: {state.error}</div>;
  if (deleteStatus === 'deleted') return <div>Пользователь удалён</div>;
  if (!state.user) return null;

  return (
    <div>
      <h1>{state.user.name}</h1>
      <p>{state.user.email}</p>
      <button
        onClick={handleDelete}
        disabled={deleteStatus === 'deleting'}
      >
        {deleteStatus === 'deleting' ? 'Удаление...' : 'Удалить аккаунт'}
      </button>
    </div>
  );
}
```

### Тесты GET-запросов

```typescript
// components/UserDashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import { UserDashboard } from './UserDashboard';

describe('UserDashboard — GET запросы', () => {
  test('успешно загружает и отображает профиль пользователя', async () => {
    render(<UserDashboard userId={1} />);

    // Показывается индикатор загрузки
    expect(screen.getByRole('status')).toHaveTextContent('Загрузка профиля...');

    // После загрузки — данные пользователя
    await waitFor(() => {
      expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    });

    expect(screen.getByText('ivan@example.com')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('показывает ошибку 404 когда пользователь не найден', async () => {
    render(<UserDashboard userId={999} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Ошибка: Пользователь не найден'
      );
    });
  });

  test('обрабатывает ошибку 500 от сервера', async () => {
    server.use(
      http.get('/api/users/:id', () => {
        return HttpResponse.json(
          { message: 'Внутренняя ошибка сервера' },
          { status: 500 }
        );
      })
    );

    render(<UserDashboard userId={1} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('обрабатывает сетевую ошибку (нет соединения)', async () => {
    server.use(
      http.get('/api/users/:id', () => {
        // Симулируем сетевую ошибку
        return HttpResponse.error();
      })
    );

    render(<UserDashboard userId={1} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
```

### Тесты POST-запросов

Рассмотрим компонент формы создания пользователя:

```typescript
// components/CreateUserForm.tsx
import React, { useState } from 'react';

interface CreateUserFormProps {
  onSuccess: (userId: number) => void;
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Ошибка создания пользователя');
      }

      const newUser = await response.json();
      onSuccess(newUser.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div role="alert">{error}</div>}

      <label htmlFor="name">Имя</label>
      <input
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <button type="submit" disabled={submitting}>
        {submitting ? 'Создание...' : 'Создать пользователя'}
      </button>
    </form>
  );
}
```

Тесты для POST-формы:

```typescript
// components/CreateUserForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import { CreateUserForm } from './CreateUserForm';

describe('CreateUserForm — POST запросы', () => {
  test('успешно создаёт пользователя и вызывает onSuccess', async () => {
    const mockOnSuccess = jest.fn();
    const user = userEvent.setup();

    render(<CreateUserForm onSuccess={mockOnSuccess} />);

    // Заполняем форму
    await user.type(screen.getByLabelText('Имя'), 'Новый Пользователь');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');

    // Отправляем форму
    await user.click(screen.getByRole('button', { name: 'Создать пользователя' }));

    // Ждём завершения запроса
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(3); // ID нового пользователя
    });

    // Проверяем, что кнопка снова активна
    expect(screen.getByRole('button', { name: 'Создать пользователя' })).not.toBeDisabled();
  });

  test('показывает состояние загрузки во время отправки', async () => {
    const user = userEvent.setup();

    // Добавляем задержку к обработчику
    server.use(
      http.post('/api/users', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ id: 3, name: 'Test', email: 'test@test.com' }, { status: 201 });
      })
    );

    render(<CreateUserForm onSuccess={jest.fn()} />);

    await user.type(screen.getByLabelText('Имя'), 'Тест');
    await user.type(screen.getByLabelText('Email'), 'test@test.com');
    await user.click(screen.getByRole('button', { name: 'Создать пользователя' }));

    // Во время отправки — кнопка показывает статус
    expect(screen.getByRole('button', { name: 'Создание...' })).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Создать пользователя' })).not.toBeDisabled();
    });
  });

  test('показывает ошибку валидации от сервера', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('/api/users', () => {
        return HttpResponse.json(
          { message: 'Email уже используется' },
          { status: 422 }
        );
      })
    );

    render(<CreateUserForm onSuccess={jest.fn()} />);

    await user.type(screen.getByLabelText('Имя'), 'Дублирующий');
    await user.type(screen.getByLabelText('Email'), 'existing@example.com');
    await user.click(screen.getByRole('button', { name: 'Создать пользователя' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Email уже используется');
    });
  });
});
```

### Тесты обработки ошибок

Корректная обработка ошибок — важная часть тестирования. Рассмотрим различные сценарии:

```typescript
// hooks/useApi.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import { useApi } from './useApi';

// useApi — кастомный хук для работы с API
describe('useApi — обработка ошибок', () => {
  test('обрабатывает 401 Unauthorized', async () => {
    server.use(
      http.get('/api/protected', () => {
        return HttpResponse.json(
          { message: 'Не авторизован' },
          { status: 401 }
        );
      })
    );

    const { result } = renderHook(() => useApi('/api/protected'));

    await waitFor(() => {
      expect(result.current.error).toBe('Не авторизован');
      expect(result.current.status).toBe(401);
    });
  });

  test('обрабатывает 403 Forbidden', async () => {
    server.use(
      http.get('/api/admin', () => {
        return HttpResponse.json(
          { message: 'Доступ запрещён' },
          { status: 403 }
        );
      })
    );

    const { result } = renderHook(() => useApi('/api/admin'));

    await waitFor(() => {
      expect(result.current.error).toBe('Доступ запрещён');
    });
  });

  test('обрабатывает таймаут запроса', async () => {
    server.use(
      http.get('/api/slow-endpoint', async () => {
        // MSW 2.x позволяет симулировать зависший запрос
        await new Promise(() => {}); // Никогда не resolve
        return HttpResponse.json({});
      })
    );

    // Хук с таймаутом
    const { result } = renderHook(() => useApi('/api/slow-endpoint', { timeout: 100 }));

    await waitFor(() => {
      expect(result.current.error).toMatch(/таймаут|timeout/i);
    }, { timeout: 500 });
  });

  test('повторяет запрос при временной ошибке', async () => {
    let requestCount = 0;

    server.use(
      http.get('/api/flaky', () => {
        requestCount++;
        if (requestCount < 3) {
          return HttpResponse.json({ message: 'Сервис временно недоступен' }, { status: 503 });
        }
        return HttpResponse.json({ data: 'success' });
      })
    );

    const { result } = renderHook(() => useApi('/api/flaky', { retry: 3 }));

    await waitFor(() => {
      expect(result.current.data).toEqual({ data: 'success' });
    });

    expect(requestCount).toBe(3);
  });
});
```

### Мокирование запросов с параметрами и заголовками

```typescript
// Тест на корректную передачу заголовков авторизации
test('передаёт токен авторизации в заголовках', async () => {
  let capturedHeaders: Headers | null = null;

  server.use(
    http.get('/api/profile', ({ request }) => {
      capturedHeaders = request.headers;
      return HttpResponse.json({ id: 1, name: 'Тест' });
    })
  );

  // Предполагаем, что компонент берёт токен из localStorage
  localStorage.setItem('token', 'my-secret-token');

  render(<UserProfile />);

  await waitFor(() => {
    expect(capturedHeaders?.get('Authorization')).toBe('Bearer my-secret-token');
  });

  localStorage.clear();
});

// Тест на корректную передачу query-параметров
test('передаёт параметры поиска в URL', async () => {
  let capturedUrl: URL | null = null;

  server.use(
    http.get('/api/users', ({ request }) => {
      capturedUrl = new URL(request.url);
      return HttpResponse.json([]);
    })
  );

  render(<UserSearch query="Иван" page={2} limit={10} />);

  await waitFor(() => {
    expect(capturedUrl?.searchParams.get('q')).toBe('Иван');
    expect(capturedUrl?.searchParams.get('page')).toBe('2');
    expect(capturedUrl?.searchParams.get('limit')).toBe('10');
  });
});
```

## Best practices при мокировании

Мокирование — мощный инструмент, но им легко злоупотребить. Здесь собраны рекомендации, которые помогут поддерживать качество тестов.

### 1. Мокируйте на правильном уровне абстракции

Чем ближе к реальному поведению ваш мок — тем ценнее тест. Иерархия предпочтений:

```
MSW (уровень сети)  ←  Наиболее предпочтительно
    ↓
jest.mock('./services')  ←  Мокирование сервисного слоя
    ↓
jest.mock('axios')  ←  Мокирование HTTP-клиента
    ↓
jest.fn() для пропсов  ←  Минимальное мокирование
```

Рекомендация: используйте MSW для интеграционных тестов компонентов. Используйте `jest.fn()` для юнит-тестов утилитных функций.

### 2. Не мокируйте то, что не тестируете

Частая ошибка — замокировать слишком многое:

```typescript
// ❌ Плохо: мокируем всё подряд, тест ничего не проверяет
jest.mock('../utils/format');
jest.mock('../utils/validate');
jest.mock('../utils/logger');

test('форматирует дату', () => {
  const { formatDate } = require('../utils/format');
  formatDate.mockReturnValue('01.01.2024');
  // ...тест не проверяет реальную логику форматирования
});

// ✅ Хорошо: мокируем только внешние зависимости
test('форматирует дату в формате dd.MM.yyyy', () => {
  const result = formatDate(new Date(2024, 0, 1));
  expect(result).toBe('01.01.2024');
  // Проверяем реальную реализацию
});
```

### 3. Сбрасывайте состояние моков между тестами

```typescript
// jest.config.js — автоматический сброс
module.exports = {
  clearMocks: true,      // Сбрасывает вызовы и экземпляры
  restoreMocks: true,    // Восстанавливает spyOn моки
};

// setupTests.ts — для MSW
afterEach(() => server.resetHandlers());
```

### 4. Избегайте хрупких утверждений о деталях реализации

```typescript
// ❌ Хрупкий тест: зависит от конкретной реализации
test('делает запрос с правильными параметрами', async () => {
  render(<UserList />);
  await waitFor(() => {
    // Это слишком детально — если внутренняя реализация изменится, тест упадёт
    expect(axios.get).toHaveBeenCalledWith('/api/users', {
      params: { page: 1, limit: 20, sort: 'id', order: 'asc' },
      headers: { 'X-Client-Version': '1.0.0' },
      timeout: 5000,
    });
  });
});

// ✅ Лучше: проверяем поведение, а не реализацию
test('загружает и отображает пользователей', async () => {
  render(<UserList />);
  await waitFor(() => {
    expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    expect(screen.getByText('Мария Сидорова')).toBeInTheDocument();
  });
});
```

### 5. Тестируйте граничные случаи и ошибки

Мокирование позволяет легко воспроизвести сценарии, которые сложно протестировать с реальным API:

```typescript
describe('обработка граничных случаев', () => {
  test('пустой список', async () => {
    server.use(http.get('/api/items', () => HttpResponse.json([])));
    render(<ItemList />);
    await waitFor(() => {
      expect(screen.getByText('Элементы не найдены')).toBeInTheDocument();
    });
  });

  test('очень большой список (пагинация)', async () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
    server.use(http.get('/api/items', () => HttpResponse.json(items.slice(0, 20))));
    // ...
  });

  test('элемент с отсутствующими необязательными полями', async () => {
    server.use(
      http.get('/api/users/1', () =>
        HttpResponse.json({ id: 1, name: 'Только имя' }) // email отсутствует
      )
    );
    render(<UserProfile userId={1} />);
    await waitFor(() => {
      expect(screen.getByText('Только имя')).toBeInTheDocument();
      // Проверяем, что отсутствующее поле обрабатывается корректно
      expect(screen.queryByRole('link', { name: /email/i })).not.toBeInTheDocument();
    });
  });
});
```

### 6. Переиспользуйте обработчики через фабрики

Когда схожие сценарии нужны в нескольких тестах, вынесите их в вспомогательные функции:

```typescript
// src/mocks/factories.ts
import { http, HttpResponse } from 'msw';

export function createUserHandler(user: Partial<User> = {}) {
  const defaultUser = {
    id: 1,
    name: 'Тестовый Пользователь',
    email: 'test@example.com',
    ...user,
  };

  return http.get('/api/users/:id', ({ params }) => {
    if (Number(params.id) === defaultUser.id) {
      return HttpResponse.json(defaultUser);
    }
    return HttpResponse.json({ message: 'Не найден' }, { status: 404 });
  });
}

export function createErrorHandler(url: string, status: number, message: string) {
  return http.get(url, () =>
    HttpResponse.json({ message }, { status })
  );
}

// В тестах:
test('отображает имя администратора', async () => {
  server.use(createUserHandler({ name: 'Администратор', role: 'admin' }));
  // ...
});
```

### 7. Используйте типизацию TypeScript для моков

TypeScript помогает избежать ошибок при настройке моков:

```typescript
// Правильная типизация мока axios
import axios from 'axios';

jest.mock('axios');
const mockedAxios = jest.mocked(axios); // Jest 27+, или:
// const mockedAxios = axios as jest.Mocked<typeof axios>;

// Теперь TypeScript знает о методах моков
mockedAxios.get.mockResolvedValue({ data: {} }); // Автодополнение работает

// Типизированные фабрики для тестовых данных
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'Тест',
    email: 'test@example.com',
    ...overrides,
  };
}

test('обновляет имя пользователя', async () => {
  const mockUser = createMockUser({ name: 'Новое Имя' });
  server.use(http.get('/api/users/1', () => HttpResponse.json(mockUser)));
  // ...
});
```

### 8. Отделяйте тесты с разным уровнем мокирования

Хорошая практика — разделять юнит-тесты и интеграционные тесты:

```
src/
├── components/
│   ├── UserList.tsx
│   ├── UserList.test.tsx          # Интеграционные тесты с MSW
│   └── UserList.unit.test.tsx     # Юнит-тесты с jest.fn()
└── services/
    ├── userService.ts
    └── userService.test.ts        # Юнит-тесты сервиса
```

```typescript
// UserList.unit.test.tsx — тестируем только логику компонента
import { render, screen } from '@testing-library/react';
import { UserList } from './UserList';

test('рендерит список пользователей из пропсов', () => {
  const users = [
    { id: 1, name: 'Иван' },
    { id: 2, name: 'Мария' },
  ];

  render(<UserList users={users} loading={false} error={null} />);

  expect(screen.getByText('Иван')).toBeInTheDocument();
  expect(screen.getByText('Мария')).toBeInTheDocument();
});
```

### 9. Документируйте нестандартные моки

Если мок имитирует сложное или неочевидное поведение, оставляйте комментарий:

```typescript
test('повторно загружает данные после ошибки сети', async () => {
  let callCount = 0;

  server.use(
    http.get('/api/data', () => {
      callCount++;
      // Первые два запроса — с ошибкой, третий — успешный
      // Имитируем нестабильное сетевое соединение
      if (callCount <= 2) {
        return HttpResponse.error();
      }
      return HttpResponse.json({ value: 42 });
    })
  );

  render(<ComponentWithRetry />);

  await waitFor(() => {
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  expect(callCount).toBe(3); // Убеждаемся, что был retry
});
```

### 10. Запускайте тесты в изоляции

Убедитесь, что тесты не зависят от порядка выполнения:

```typescript
// ❌ Плохо: тест зависит от глобального состояния
let storedUser: User;

test('создаёт пользователя', async () => {
  storedUser = await createUser({ name: 'Тест' });
  expect(storedUser.id).toBeDefined();
});

test('обновляет созданного пользователя', async () => {
  // Зависит от предыдущего теста!
  await updateUser(storedUser.id, { name: 'Обновлён' });
});

// ✅ Хорошо: каждый тест самодостаточен
test('создаёт и обновляет пользователя', async () => {
  const created = await createUser({ name: 'Тест' });
  expect(created.id).toBeDefined();

  const updated = await updateUser(created.id, { name: 'Обновлён' });
  expect(updated.name).toBe('Обновлён');
});
```

## Заключение

Мокирование API в тестах React — это широкая тема с несколькими уровнями инструментов. Давайте подведём итог.

**jest.fn()** — базовый инструмент для создания мок-функций. Идеален для тестирования пропсов-колбэков и изолированных утилитных функций. Прост в использовании, но ограничен одной функцией.

**jest.spyOn()** — позволяет «подслушивать» вызовы существующих методов. Полезен когда нужно сохранить оригинальную реализацию или следить за методами глобальных объектов.

**jest.mock()** — мощный инструмент для замены целых модулей. Подходит для мокирования axios, fetch и других библиотек. Требует осторожности: слишком активное мокирование снижает ценность тестов.

**Mock Service Worker (MSW)** — современный стандарт для мокирования HTTP-запросов. Работает на уровне сети, независим от используемого HTTP-клиента, позволяет переиспользовать обработчики в тестах и при разработке. Рекомендуется для интеграционных тестов компонентов.

### Когда что использовать

| Сценарий | Рекомендуемый инструмент |
|---|---|
| Тестирование пропса-колбэка | `jest.fn()` |
| Слежка за методом объекта | `jest.spyOn()` |
| Юнит-тест утилиты, использующей axios | `jest.mock('axios')` |
| Интеграционный тест компонента | MSW |
| Локальная разработка без бекенда | MSW (с Service Worker) |
| Тест обработки HTTP-ошибок | MSW (переопределение обработчика) |

### Дальнейшее изучение

Для углублённого изучения темы рекомендуем обратиться к официальной документации:

- [Jest — Mock Functions](https://jestjs.io/docs/mock-functions)
- [MSW — Getting Started](https://mswjs.io/docs/getting-started)
- [Testing Library — Async Utilities](https://testing-library.com/docs/dom-testing-library/api-async)

Хорошее покрытие тестами с разумным мокированием — это инвестиция в надёжность вашего приложения и уверенность при внесении изменений. Начните с MSW для компонентных тестов и `jest.fn()` для юнит-тестов — это покроет большинство реальных задач.

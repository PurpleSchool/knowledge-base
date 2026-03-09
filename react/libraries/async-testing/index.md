---
metaTitle: Тестирование асинхронных компонентов React
metaDescription: Как тестировать асинхронные React компоненты с waitFor, findBy и msw. Работа с loading состояниями и мокирование API
author: Олег Марков
title: Тестирование асинхронных компонентов
preview: Руководство по тестированию асинхронных React компонентов с использованием waitFor, findBy и Mock Service Worker
---

## Введение

Современные React-приложения активно работают с асинхронным кодом: загружают данные с сервера, выполняют мутации, показывают состояния загрузки и ошибок. Тестирование такого кода требует особого подхода — стандартные синхронные проверки просто не успеют дождаться результата асинхронной операции.

В этой статье вы узнаете, почему асинхронные компоненты сложнее тестировать, как использовать специальные методы React Testing Library (`waitFor`, `findBy*`), как мокировать API-запросы через `jest.mock` и Mock Service Worker (MSW), а также как правильно тестировать состояния загрузки и ошибок.

## Проблемы при тестировании асинхронного кода

### Почему обычные тесты не работают

Рассмотрим простой компонент, который загружает список пользователей:

```tsx
// UserList.tsx
import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Не удалось загрузить пользователей');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

Если написать наивный тест без учёта асинхронности, он упадёт:

```tsx
// ❌ Неправильно — тест не ждёт завершения загрузки
test('показывает список пользователей', () => {
  render(<UserList />);
  // В этот момент данные ещё не загружены!
  expect(screen.getByText('Иван')).toBeInTheDocument(); // FAIL
});
```

### Типичные ошибки

При тестировании асинхронного кода разработчики сталкиваются с несколькими проблемами:

**«Act» предупреждения.** React выводит предупреждение `Warning: An update to Component inside a test was not wrapped in act(...)`, когда обновление состояния происходит вне контролируемой среды теста.

**Преждевременные проверки.** Тест проверяет DOM до того, как данные загрузились, и видит только состояние загрузки.

**Утечки между тестами.** Незавершённые промисы из одного теста могут влиять на следующий, вызывая трудноотлаживаемые ошибки.

**Нестабильные тесты (flaky tests).** Тесты, которые иногда проходят, а иногда нет, из-за гонки условий (race conditions).

## Методы waitFor и findBy

React Testing Library предоставляет специальные инструменты для работы с асинхронным кодом.

### Метод waitFor

`waitFor` ожидает, пока переданный колбэк перестанет бросать исключения. Он периодически повторяет проверку, пока та не пройдёт или не истечёт таймаут (по умолчанию 1000 мс).

```tsx
import { render, screen, waitFor } from '@testing-library/react';

test('показывает список пользователей после загрузки', async () => {
  render(<UserList />);

  // Ждём, пока элемент не появится в DOM
  await waitFor(() => {
    expect(screen.getByText('Иван')).toBeInTheDocument();
  });
});
```

`waitFor` принимает опции для тонкой настройки:

```tsx
await waitFor(
  () => {
    expect(screen.getByText('Иван')).toBeInTheDocument();
  },
  {
    timeout: 3000,      // максимальное время ожидания в мс
    interval: 100,      // интервал между повторными проверками
    onTimeout: (error) => {
      // вызывается при истечении таймаута
      console.log('Таймаут:', error);
      return error;
    }
  }
);
```

### Методы findBy

`findBy*` — это асинхронные версии `getBy*`. Они возвращают промис, который разрешается, когда элемент появляется в DOM. Это более удобная альтернатива комбинации `waitFor` + `getBy`.

```tsx
// Вместо:
await waitFor(() => {
  expect(screen.getByText('Иван')).toBeInTheDocument();
});

// Можно использовать:
const item = await screen.findByText('Иван');
expect(item).toBeInTheDocument();
```

**Все варианты `findBy` запросов:**

```tsx
// По тексту
await screen.findByText('Иван');

// По роли (ARIA role)
await screen.findByRole('button', { name: 'Отправить' });

// По placeholder
await screen.findByPlaceholderText('Введите имя');

// По label
await screen.findByLabelText('Email');

// По test-id
await screen.findByTestId('user-list');

// По alt тексту изображения
await screen.findByAltText('Аватар пользователя');

// По title
await screen.findByTitle('Закрыть');
```

**Разница между `getBy`, `queryBy` и `findBy`:**

| Метод | Синхронный | Бросает ошибку | Когда использовать |
|-------|-----------|---------------|-------------------|
| `getBy` | ✅ | Если не найден | Элемент должен быть в DOM сейчас |
| `queryBy` | ✅ | Нет (возвращает null) | Проверить отсутствие элемента |
| `findBy` | ❌ (async) | Если не появился за таймаут | Элемент появится позже |

### waitForElementToDisappear

Когда нужно дождаться, пока элемент исчезнет из DOM:

```tsx
import { render, screen, waitForElementToDisappear } from '@testing-library/react';

test('скрывает спиннер после загрузки', async () => {
  render(<UserList />);

  // Убеждаемся, что спиннер есть
  expect(screen.getByText('Загрузка...')).toBeInTheDocument();

  // Ждём его исчезновения
  await waitForElementToDisappear(() => screen.queryByText('Загрузка...'));

  // Теперь должны быть данные
  expect(screen.getByRole('list')).toBeInTheDocument();
});
```

## Тестирование с async/await

### Основной паттерн

Правильный подход к написанию асинхронных тестов с `async/await`:

```tsx
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserList } from './UserList';

// Мокируем fetch
global.fetch = jest.fn();

beforeEach(() => {
  (global.fetch as jest.Mock).mockResolvedValue({
    json: () => Promise.resolve([
      { id: 1, name: 'Иван' },
      { id: 2, name: 'Мария' },
    ]),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('загружает и отображает пользователей', async () => {
  render(<UserList />);

  // Сначала показывается состояние загрузки
  expect(screen.getByText('Загрузка...')).toBeInTheDocument();

  // Ждём появления данных
  expect(await screen.findByText('Иван')).toBeInTheDocument();
  expect(screen.getByText('Мария')).toBeInTheDocument();

  // Спиннер больше не виден
  expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
});
```

### Тестирование с действиями пользователя

Когда асинхронное действие запускается пользователем:

```tsx
// SearchUsers.tsx
import { useState } from 'react';

interface User {
  id: number;
  name: string;
}

export function SearchUsers() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users?q=${query}`);
      const data = await res.json();
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Поиск пользователей"
      />
      <button onClick={handleSearch}>Найти</button>
      {loading && <div>Поиск...</div>}
      <ul>
        {results.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

```tsx
// SearchUsers.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchUsers } from './SearchUsers';

global.fetch = jest.fn();

test('выполняет поиск при нажатии кнопки', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    json: () => Promise.resolve([{ id: 1, name: 'Иван Петров' }]),
  });

  const user = userEvent.setup();
  render(<SearchUsers />);

  // Вводим запрос
  await user.type(screen.getByPlaceholderText('Поиск пользователей'), 'Иван');

  // Нажимаем кнопку поиска
  await user.click(screen.getByRole('button', { name: 'Найти' }));

  // Ждём результатов
  expect(await screen.findByText('Иван Петров')).toBeInTheDocument();
});
```

### Использование act()

Иногда нужно явно обернуть обновления состояния в `act()`:

```tsx
import { act } from '@testing-library/react';

test('обновляет данные через интервал', async () => {
  jest.useFakeTimers();

  render(<AutoRefreshList />);

  // Имитируем прохождение времени
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });

  expect(await screen.findByText('Обновлённые данные')).toBeInTheDocument();

  jest.useRealTimers();
});
```

> **Важно:** `waitFor` и `findBy*` автоматически оборачивают проверки в `act()`, поэтому в большинстве случаев явное использование `act()` не нужно.

## Мокирование API-запросов

### Мокирование с jest.mock

Простой способ — замокировать глобальный `fetch` или конкретный модуль:

```tsx
// Мокирование fetch
global.fetch = jest.fn();

// Успешный ответ
(global.fetch as jest.Mock).mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: [1, 2, 3] }),
});

// Ответ с ошибкой
(global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

// Разные ответы для последовательных вызовов
(global.fetch as jest.Mock)
  .mockResolvedValueOnce({ json: () => Promise.resolve([]) }) // первый вызов
  .mockResolvedValueOnce({ json: () => Promise.resolve([{ id: 1 }]) }); // второй
```

### Мокирование модуля axios

```tsx
// api/users.ts
import axios from 'axios';

export const fetchUsers = () => axios.get('/api/users');
export const createUser = (data: { name: string }) => axios.post('/api/users', data);
```

```tsx
// UserList.test.tsx
import { render, screen } from '@testing-library/react';
import axios from 'axios';
import { UserList } from './UserList';

// Мокируем весь модуль axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

test('загружает пользователей через axios', async () => {
  mockedAxios.get.mockResolvedValue({
    data: [
      { id: 1, name: 'Иван' },
      { id: 2, name: 'Мария' },
    ],
  });

  render(<UserList />);

  expect(await screen.findByText('Иван')).toBeInTheDocument();
  expect(screen.getByText('Мария')).toBeInTheDocument();

  // Проверяем, что запрос был сделан с правильными параметрами
  expect(mockedAxios.get).toHaveBeenCalledWith('/api/users');
  expect(mockedAxios.get).toHaveBeenCalledTimes(1);
});
```

### Мокирование кастомного хука API

```tsx
// hooks/useUsers.ts
export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  // ...
  return { users, loading, error };
}
```

```tsx
// UserList.test.tsx
jest.mock('./hooks/useUsers');
import { useUsers } from './hooks/useUsers';

const mockedUseUsers = useUsers as jest.MockedFunction<typeof useUsers>;

test('отображает пользователей из хука', () => {
  mockedUseUsers.mockReturnValue({
    users: [{ id: 1, name: 'Иван' }],
    loading: false,
    error: null,
  });

  render(<UserList />);
  expect(screen.getByText('Иван')).toBeInTheDocument();
});
```

### Mock Service Worker (MSW)

MSW — наиболее мощный и реалистичный способ мокирования API. Он перехватывает реальные HTTP-запросы на уровне сети, не требуя изменений в коде компонентов.

**Установка:**

```bash
npm install --save-dev msw
```

**Настройка обработчиков:**

```tsx
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // GET запрос
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Иван' },
      { id: 2, name: 'Мария' },
    ]);
  }),

  // GET с параметром
  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ id: Number(id), name: 'Иван' });
  }),

  // POST запрос
  http.post('/api/users', async ({ request }) => {
    const body = await request.json() as { name: string };
    return HttpResponse.json({ id: 3, name: body.name }, { status: 201 });
  }),

  // Имитация ошибки сервера
  http.get('/api/broken', () => {
    return HttpResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }),
];
```

**Настройка сервера для тестов:**

```tsx
// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

**Подключение в Jest:**

```tsx
// src/setupTests.ts
import { server } from './mocks/server';

// Запускаем сервер перед всеми тестами
beforeAll(() => server.listen());

// Сбрасываем переопределения после каждого теста
afterEach(() => server.resetHandlers());

// Останавливаем сервер после всех тестов
afterAll(() => server.close());
```

**Использование в тестах:**

```tsx
import { render, screen } from '@testing-library/react';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import { UserList } from './UserList';

test('отображает список пользователей', async () => {
  render(<UserList />);

  // MSW автоматически перехватывает GET /api/users
  expect(await screen.findByText('Иван')).toBeInTheDocument();
  expect(screen.getByText('Мария')).toBeInTheDocument();
});

test('переопределяет обработчик для конкретного теста', async () => {
  // Временно меняем ответ только для этого теста
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json([{ id: 99, name: 'Тестовый пользователь' }]);
    })
  );

  render(<UserList />);

  expect(await screen.findByText('Тестовый пользователь')).toBeInTheDocument();
  // Иван здесь не должен появиться
  expect(screen.queryByText('Иван')).not.toBeInTheDocument();
});
```

## Тестирование loading и error состояний

### Тестирование состояния загрузки

```tsx
test('показывает индикатор загрузки', async () => {
  // Задерживаем ответ, чтобы поймать состояние загрузки
  server.use(
    http.get('/api/users', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return HttpResponse.json([]);
    })
  );

  render(<UserList />);

  // Спиннер сразу видим
  expect(screen.getByText('Загрузка...')).toBeInTheDocument();

  // После загрузки спиннер исчезает
  await waitForElementToDisappear(() => screen.queryByText('Загрузка...'));

  expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
});
```

### Тестирование состояния ошибки

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

test('показывает сообщение об ошибке при сбое сети', async () => {
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.error(); // имитирует сетевую ошибку
    })
  );

  render(<UserList />);

  expect(
    await screen.findByText('Не удалось загрузить пользователей')
  ).toBeInTheDocument();
});

test('показывает ошибку при ответе 404', async () => {
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json(
        { message: 'Ресурс не найден' },
        { status: 404 }
      );
    })
  );

  render(<UserList />);

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent('Ресурс не найден');
  });
});

test('показывает ошибку при ответе 500', async () => {
  server.use(
    http.get('/api/users', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  render(<UserList />);

  expect(
    await screen.findByText(/ошибка сервера/i)
  ).toBeInTheDocument();
});
```

### Тестирование повторной загрузки (retry)

```tsx
// RetryButton.tsx — компонент с кнопкой повтора при ошибке
export function UserListWithRetry() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Ошибка загрузки');
      setUsers(await res.json());
    } catch {
      setError('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  if (loading) return <div>Загрузка...</div>;
  if (error) return (
    <div>
      <p>{error}</p>
      <button onClick={loadUsers}>Повторить</button>
    </div>
  );

  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

```tsx
test('позволяет повторить запрос после ошибки', async () => {
  // Первый запрос — ошибка
  server.use(
    http.get('/api/users', () => HttpResponse.error())
  );

  const user = userEvent.setup();
  render(<UserListWithRetry />);

  // Ждём ошибки
  await screen.findByText('Не удалось загрузить данные');

  // Устанавливаем успешный ответ для следующего запроса
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.json([{ id: 1, name: 'Иван' }]);
    })
  );

  // Нажимаем "Повторить"
  await user.click(screen.getByRole('button', { name: 'Повторить' }));

  // Теперь данные загружены
  expect(await screen.findByText('Иван')).toBeInTheDocument();
  expect(screen.queryByText('Не удалось загрузить данные')).not.toBeInTheDocument();
});
```

## Примеры с fetch и axios

### Полный пример с fetch

```tsx
// PostList.tsx
import { useState, useEffect } from 'react';

interface Post {
  id: number;
  title: string;
  body: string;
}

export function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/posts', { signal: controller.signal })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setPosts)
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  if (loading) return <div role="status">Загрузка постов...</div>;
  if (error) return <div role="alert">Ошибка: {error}</div>;
  if (!posts.length) return <div>Постов пока нет</div>;

  return (
    <section>
      <h1>Посты</h1>
      <ul>
        {posts.map(post => (
          <li key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

```tsx
// PostList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import { PostList } from './PostList';

const mockPosts = [
  { id: 1, title: 'Первый пост', body: 'Содержание первого поста' },
  { id: 2, title: 'Второй пост', body: 'Содержание второго поста' },
];

describe('PostList', () => {
  test('показывает состояние загрузки', () => {
    server.use(
      http.get('/api/posts', async () => {
        await new Promise(r => setTimeout(r, 50));
        return HttpResponse.json(mockPosts);
      })
    );

    render(<PostList />);
    expect(screen.getByRole('status')).toHaveTextContent('Загрузка постов...');
  });

  test('отображает посты после загрузки', async () => {
    server.use(
      http.get('/api/posts', () => HttpResponse.json(mockPosts))
    );

    render(<PostList />);

    expect(await screen.findByText('Первый пост')).toBeInTheDocument();
    expect(screen.getByText('Второй пост')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('показывает ошибку при неудачном запросе', async () => {
    server.use(
      http.get('/api/posts', () => new HttpResponse(null, { status: 500 }))
    );

    render(<PostList />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Ошибка: HTTP 500');
  });

  test('показывает сообщение при пустом списке', async () => {
    server.use(
      http.get('/api/posts', () => HttpResponse.json([]))
    );

    render(<PostList />);

    expect(await screen.findByText('Постов пока нет')).toBeInTheDocument();
  });
});
```

### Полный пример с axios

```tsx
// api/postsApi.ts
import axios from 'axios';

export interface Post {
  id: number;
  title: string;
  userId: number;
}

const api = axios.create({ baseURL: '/api' });

export const postsApi = {
  getAll: () => api.get<Post[]>('/posts'),
  getById: (id: number) => api.get<Post>(`/posts/${id}`),
  create: (post: Omit<Post, 'id'>) => api.post<Post>('/posts', post),
  delete: (id: number) => api.delete(`/posts/${id}`),
};
```

```tsx
// PostManager.tsx
import { useState, useEffect } from 'react';
import { postsApi, Post } from './api/postsApi';

export function PostManager() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    postsApi.getAll()
      .then(res => setPosts(res.data))
      .catch(() => setError('Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await postsApi.create({ title: 'Новый пост', userId: 1 });
      setPosts(prev => [...prev, res.data]);
    } catch {
      setError('Ошибка создания поста');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    await postsApi.delete(id);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      {error && <div role="alert">{error}</div>}
      <button onClick={handleCreate} disabled={creating}>
        {creating ? 'Создаётся...' : 'Создать пост'}
      </button>
      <ul>
        {posts.map(post => (
          <li key={post.id}>
            {post.title}
            <button onClick={() => handleDelete(post.id)}>Удалить</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

```tsx
// PostManager.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { PostManager } from './PostManager';

jest.mock('./api/postsApi');
import { postsApi } from './api/postsApi';

const mockedPostsApi = postsApi as jest.Mocked<typeof postsApi>;

const mockPosts = [
  { id: 1, title: 'Пост 1', userId: 1 },
  { id: 2, title: 'Пост 2', userId: 1 },
];

beforeEach(() => {
  mockedPostsApi.getAll.mockResolvedValue({ data: mockPosts } as any);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('PostManager', () => {
  test('загружает и показывает посты', async () => {
    render(<PostManager />);

    expect(await screen.findByText('Пост 1')).toBeInTheDocument();
    expect(screen.getByText('Пост 2')).toBeInTheDocument();
  });

  test('создаёт новый пост', async () => {
    mockedPostsApi.create.mockResolvedValue({
      data: { id: 3, title: 'Новый пост', userId: 1 }
    } as any);

    const user = userEvent.setup();
    render(<PostManager />);

    await screen.findByText('Пост 1'); // дожидаемся загрузки

    await user.click(screen.getByRole('button', { name: 'Создать пост' }));

    // Кнопка должна показывать состояние создания
    expect(screen.getByRole('button', { name: 'Создаётся...' })).toBeDisabled();

    // Новый пост появляется в списке
    expect(await screen.findByText('Новый пост')).toBeInTheDocument();
  });

  test('удаляет пост', async () => {
    mockedPostsApi.delete.mockResolvedValue({} as any);

    const user = userEvent.setup();
    render(<PostManager />);

    await screen.findByText('Пост 1');

    // Удаляем первый пост
    const deleteButtons = screen.getAllByRole('button', { name: 'Удалить' });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('Пост 1')).not.toBeInTheDocument();
    });

    expect(mockedPostsApi.delete).toHaveBeenCalledWith(1);
  });

  test('показывает ошибку при сбое создания', async () => {
    mockedPostsApi.create.mockRejectedValue(new Error('Network Error'));

    const user = userEvent.setup();
    render(<PostManager />);

    await screen.findByText('Пост 1');
    await user.click(screen.getByRole('button', { name: 'Создать пост' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ошибка создания поста');
  });
});
```

## Советы и лучшие практики

### Не используйте слишком большие таймауты

Большой таймаут может скрыть реальные проблемы производительности. Если тест требует слишком долгого ожидания — это сигнал к рефакторингу:

```tsx
// ❌ Плохо — таймаут в 10 секунд может скрывать проблемы
await waitFor(() => {
  expect(screen.getByText('Данные')).toBeInTheDocument();
}, { timeout: 10000 });

// ✅ Хорошо — используйте разумный таймаут или мокируйте задержки
await screen.findByText('Данные'); // дефолтный таймаут 1000мс обычно достаточен
```

### Всегда проверяйте состояние загрузки

```tsx
test('полный цикл жизни компонента', async () => {
  render(<DataComponent />);

  // 1. Проверяем начальное состояние загрузки
  expect(screen.getByTestId('skeleton')).toBeInTheDocument();

  // 2. Ждём данных
  const data = await screen.findByTestId('content');
  expect(data).toBeInTheDocument();

  // 3. Подтверждаем, что скелетон убран
  expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
});
```

### Используйте MSW для интеграционных тестов

MSW позволяет тестировать реальное взаимодействие компонентов с API без изменений в коде:

```tsx
// Тест проверяет полный сценарий без мокирования на уровне кода
test('полный сценарий входа пользователя', async () => {
  // MSW перехватывает /api/login и возвращает токен
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.type(screen.getByLabelText('Email'), 'user@example.com');
  await user.type(screen.getByLabelText('Пароль'), 'secret');
  await user.click(screen.getByRole('button', { name: 'Войти' }));

  // Компонент делает реальный fetch, MSW его перехватывает
  expect(await screen.findByText('Добро пожаловать!')).toBeInTheDocument();
});
```

### Изолируйте тесты между собой

```tsx
// setupTests.ts
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers()); // сброс переопределений
afterAll(() => server.close());
```

Параметр `onUnhandledRequest: 'error'` заставит тест упасть, если компонент делает запрос, который не описан в обработчиках MSW — это помогает отловить неожиданные запросы.

## Заключение

Тестирование асинхронных React-компонентов требует понимания нескольких ключевых инструментов:

- **`waitFor`** — ожидает, пока условие станет истинным, периодически повторяя проверку
- **`findBy*`** — асинхронные версии `getBy*` запросов, возвращают промис
- **`waitForElementToDisappear`** — ожидает исчезновения элемента из DOM
- **`jest.mock`** — быстрое мокирование модулей и функций
- **MSW** — перехват HTTP-запросов на уровне сети для реалистичного тестирования

Рекомендованный подход: используйте MSW для интеграционных тестов, где важно проверить взаимодействие компонента с API. Для юнит-тестов отдельных функций или хуков подойдёт `jest.mock`. Всегда проверяйте все состояния компонента: загрузку, успех и ошибку — это обеспечит надёжное покрытие реальных сценариев использования.

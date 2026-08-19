---
metaTitle: "React тестирование с Vitest — полный гайд"
metaDescription: "Как писать тесты для React-компонентов с помощью Vitest и Testing Library. Настройка, примеры, моки, хуки и покрытие кода."
author: "Антон Ларичев"
title: "React тестирование с Vitest"
preview: "Настройка Vitest в React-проекте, написание тестов для компонентов, хуков, форм и асинхронного кода с Testing Library."
---

## Что такое Vitest и зачем он нужен

Vitest — это современный фреймворк для тестирования JavaScript и TypeScript, построенный поверх Vite. Он совместим с API Jest, работает значительно быстрее за счёт нативной поддержки ESM и не требует отдельной трансформации исходников — проект уже использует Vite, и Vitest переиспользует ту же конфигурацию.

Для React-проектов на Vite Vitest — очевидный выбор: единая цепочка инструментов, мгновенный cold-start, встроенный watch-режим с HMR-подобным поведением.

## Установка и настройка

Установите зависимости:

```bash
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Добавьте конфигурацию в `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
```

Создайте файл `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom';
```

Добавьте типы в `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

Добавьте скрипты в `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Первый тест компонента

Рассмотрим простой компонент:

```typescript
// src/components/Greeting.tsx
interface GreetingProps {
  name: string;
  isLoggedIn?: boolean;
}

export function Greeting({ name, isLoggedIn = false }: GreetingProps) {
  return (
    <div>
      <h1>Привет, {name}!</h1>
      {isLoggedIn && <p>Вы вошли в систему</p>}
    </div>
  );
}
```

Тест для него:

```typescript
// src/components/Greeting.test.tsx
import { render, screen } from '@testing-library/react';
import { Greeting } from './Greeting';

describe('Greeting', () => {
  it('отображает имя пользователя', () => {
    render(<Greeting name="Иван" />);
    expect(screen.getByText('Привет, Иван!')).toBeInTheDocument();
  });

  it('скрывает статус, когда пользователь не вошёл', () => {
    render(<Greeting name="Иван" />);
    expect(screen.queryByText('Вы вошли в систему')).not.toBeInTheDocument();
  });

  it('показывает статус авторизации', () => {
    render(<Greeting name="Иван" isLoggedIn />);
    expect(screen.getByText('Вы вошли в систему')).toBeInTheDocument();
  });
});
```

Ключевые утилиты `@testing-library/react`:
- `render` — монтирует компонент в виртуальный DOM
- `screen.getByText` — ищет элемент по тексту, бросает ошибку если не найден
- `screen.queryByText` — возвращает `null` если элемент не найден (используйте для проверки отсутствия)
- `screen.findByText` — асинхронный вариант, ждёт появления элемента

## Тестирование пользовательских взаимодействий

Для имитации действий пользователя используйте `@testing-library/user-event` — он точнее воспроизводит реальные события браузера, чем `fireEvent`.

```typescript
// src/components/Counter.tsx
import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={() => setCount(c => c + 1)}>Увеличить</button>
      <button onClick={() => setCount(c => c - 1)} disabled={count === 0}>
        Уменьшить
      </button>
    </div>
  );
}
```

```typescript
// src/components/Counter.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('увеличивает счётчик при клике', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    await user.click(screen.getByText('Увеличить'));
    await user.click(screen.getByText('Увеличить'));

    expect(screen.getByTestId('count')).toHaveTextContent('2');
  });

  it('кнопка уменьшения недоступна при нулевом значении', () => {
    render(<Counter />);
    expect(screen.getByText('Уменьшить')).toBeDisabled();
  });
});
```

Обратите внимание: `userEvent.setup()` создаёт изолированный экземпляр с собственным состоянием. Все вызовы методов — `async/await`.

## Тестирование форм

```typescript
// src/components/LoginForm.tsx
import { useState } from 'react';

interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => void;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Заполните все поля');
      return;
    }
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p role="alert">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button type="submit">Войти</button>
    </form>
  );
}
```

```typescript
// src/components/LoginForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('вызывает onSubmit с данными формы', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Пароль'), 'secret123');
    await user.click(screen.getByText('Войти'));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'secret123',
    });
  });

  it('показывает ошибку при пустых полях', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByText('Войти'));

    expect(screen.getByRole('alert')).toHaveTextContent('Заполните все поля');
  });
});
```

## Тестирование кастомных хуков

Для тестирования хуков используйте `renderHook` из `@testing-library/react`:

```typescript
// src/hooks/useLocalStorage.ts
import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  const setStored = (newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, setStored] as const;
}
```

```typescript
// src/hooks/useLocalStorage.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('возвращает начальное значение', () => {
    const { result } = renderHook(() => useLocalStorage('key', 42));
    expect(result.current[0]).toBe(42);
  });

  it('сохраняет значение в localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('theme', 'light'));

    act(() => {
      result.current[1]('dark');
    });

    expect(result.current[0]).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('"dark"');
  });

  it('читает существующее значение из localStorage', () => {
    localStorage.setItem('count', '"10"');
    const { result } = renderHook(() => useLocalStorage('count', 0));
    expect(result.current[0]).toBe('10');
  });
});
```

Важно: все изменения состояния хука оборачивайте в `act()` — это гарантирует, что React обработает все обновления до проверки результата.

## Моки и подмена модулей

### Мок функции

```typescript
const mockFn = vi.fn();
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue({ data: [] }); // для промисов
```

### Мок модуля

```typescript
// src/services/api.ts
export async function fetchUser(id: number) {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}
```

```typescript
// src/components/UserCard.test.tsx
import { render, screen } from '@testing-library/react';
import * as api from '../services/api';
import { UserCard } from './UserCard';

vi.mock('../services/api');

test('отображает данные пользователя', async () => {
  vi.mocked(api.fetchUser).mockResolvedValue({
    id: 1,
    name: 'Иван Петров',
  });

  render(<UserCard userId={1} />);

  expect(await screen.findByText('Иван Петров')).toBeInTheDocument();
});
```

### Мок глобальных объектов

```typescript
// мок fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ id: 1, name: 'Тест' }),
});
```

## Тестирование асинхронного кода

Компонент с асинхронной загрузкой данных:

```typescript
// src/components/PostList.tsx
import { useEffect, useState } from 'react';

interface Post {
  id: number;
  title: string;
}

export function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/posts')
      .then(r => r.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Загрузка...</p>;

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

```typescript
// src/components/PostList.test.tsx
import { render, screen } from '@testing-library/react';
import { PostList } from './PostList';

beforeEach(() => {
  global.fetch = vi.fn();
});

test('показывает состояние загрузки', () => {
  vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
  render(<PostList />);
  expect(screen.getByText('Загрузка...')).toBeInTheDocument();
});

test('отображает список постов', async () => {
  vi.mocked(fetch).mockResolvedValue({
    json: () =>
      Promise.resolve([
        { id: 1, title: 'Первый пост' },
        { id: 2, title: 'Второй пост' },
      ]),
  } as Response);

  render(<PostList />);

  expect(await screen.findByText('Первый пост')).toBeInTheDocument();
  expect(screen.getByText('Второй пост')).toBeInTheDocument();
});
```

`screen.findBy*` — асинхронные запросы, которые ждут появления элемента до 1000 мс. Используйте их вместо `getBy*` когда элемент появляется после асинхронных операций.

## Тестирование с провайдерами контекста

Если компонент требует провайдеры (Router, Redux, Theme), создайте вспомогательную обёртку:

```typescript
// src/test/utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <ThemeProvider>{children}</ThemeProvider>
    </BrowserRouter>
  );
}

const customRender = (ui: ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

Теперь в тестах импортируйте `render` из `../test/utils` вместо `@testing-library/react`:

```typescript
import { render, screen } from '../test/utils';
import { NavLink } from './NavLink';

test('рендерит ссылку навигации', () => {
  render(<NavLink to="/about">О нас</NavLink>);
  expect(screen.getByText('О нас')).toBeInTheDocument();
});
```

## Запуск тестов и покрытие кода

```bash
# watch-режим (запускает только изменённые тесты)
npm test

# однократный запуск всех тестов
npm run test:run

# отчёт о покрытии
npm run test:coverage
```

Отчёт о покрытии появится в папке `coverage/`. Откройте `coverage/index.html` в браузере для наглядного отображения непокрытых строк.

Для настройки порогов покрытия в `vite.config.ts`:

```typescript
test: {
  coverage: {
    provider: 'v8',
    thresholds: {
      lines: 80,
      functions: 80,
      branches: 70,
    },
  },
}
```

## Организация тестов

Рекомендуемые практики:
- Располагайте тесты рядом с компонентами (`Button.test.tsx` рядом с `Button.tsx`)
- Называйте тест с точки зрения пользователя: «показывает ошибку при...», «вызывает колбэк когда...»
- Один тест — одна проверка поведения
- Используйте `describe` для группировки сценариев одного компонента
- Очищайте моки в `beforeEach`/`afterEach`, чтобы тесты не влияли друг на друга

```typescript
describe('Button', () => {
  describe('в состоянии загрузки', () => {
    it('показывает спиннер', () => { ... });
    it('недоступна для клика', () => { ... });
  });

  describe('при ошибке', () => {
    it('отображает сообщение об ошибке', () => { ... });
  });
});
```

## Заключение

Vitest в связке с Testing Library даёт быструю и удобную среду тестирования React-компонентов. Ключевые принципы: тестируйте поведение, а не реализацию; запрашивайте элементы так, как это делает пользователь (по тексту, роли, плейсхолдеру); изолируйте внешние зависимости через моки.

Полный курс по React с тестированием и другими практиками разработки — на PurpleSchool:
https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-testing-vitest
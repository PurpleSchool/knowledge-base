---
metaTitle: Тестирование хуков в React - полное руководство
metaDescription: Как тестировать React хуки с помощью renderHook и @testing-library/react. Тестирование useState, useEffect и кастомных хуков
author: Олег Марков
title: Тестирование хуков
preview: Научитесь тестировать React хуки с помощью renderHook. Примеры тестирования useState, useEffect и кастомных хуков
---

## Введение

Хуки — фундаментальная часть современного React. С их помощью компоненты управляют состоянием, обращаются к побочным эффектам, работают с контекстом и оптимизируют производительность. Когда хуки становятся достаточно сложными — особенно кастомные — возникает вопрос: как их тестировать изолированно, не разворачивая целый компонент?

В этой статье вы узнаете, зачем тестировать хуки отдельно, как работает `renderHook` из `@testing-library/react`, и как писать надёжные тесты для `useState`, `useEffect`, `useCallback` и кастомных хуков. Разберём мокирование зависимостей и правильное использование `act()`.

## Зачем тестировать хуки отдельно

### Разделение ответственности

Хуки инкапсулируют логику, которая живёт независимо от конкретного компонента. Кастомный хук `useAuth`, `useFetchData` или `useFormValidation` может использоваться во многих компонентах. Тестировать такую логику через компонент означает:

- **Зависимость от рендеринга** — тест проверяет не только хук, но и то, как компонент его отображает
- **Сложность изоляции** — нужно подготовить все пропсы и обёртки компонента
- **Нечёткость ошибок** — если тест падает, не всегда ясно, в хуке проблема или в компоненте

Тестирование хука напрямую через `renderHook` позволяет:

- Проверять логику изолированно, без лишнего HTML
- Получать прямой доступ к возвращаемым значениям и функциям хука
- Легко проверять реакцию на изменение входных данных
- Писать более короткие и понятные тесты

### Когда стоит тестировать хук отдельно

Изолированные тесты хуков особенно полезны, когда:

- Хук содержит нетривиальную логику (сложные условия, вычисления, побочные эффекты)
- Кастомный хук переиспользуется в нескольких компонентах
- Хук взаимодействует с внешними API или сервисами
- Логика хука потенциально легко может содержать ошибки (управление таймерами, асинхронные операции)

## Установка и настройка

### @testing-library/react v13+

Начиная с версии 13, `renderHook` встроен непосредственно в `@testing-library/react`. Отдельный пакет `@testing-library/react-hooks` больше не нужен для React 18+.

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

Если вы используете TypeScript, добавьте типы:

```bash
npm install --save-dev @types/jest
```

### Настройка Jest (jest.config.js)

```js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['@testing-library/jest-dom'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
};
```

Или через `package.json`:

```json
{
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterFramework": ["@testing-library/jest-dom"]
  }
}
```

### Импорт renderHook и act

```js
// React 18+ и @testing-library/react v13+
import { renderHook, act } from '@testing-library/react';
```

> **Для более старых проектов** (React < 18 или @testing-library/react < 13) используйте отдельный пакет:
> ```bash
> npm install --save-dev @testing-library/react-hooks
> ```
> ```js
> import { renderHook, act } from '@testing-library/react-hooks';
> ```

## Основы: как работает renderHook

`renderHook` принимает функцию, которая вызывает хук, и возвращает объект с полем `result`. Через `result.current` вы получаете актуальное значение, возвращённое хуком.

```js
const { result } = renderHook(() => useMyHook());
console.log(result.current); // текущее значение хука
```

Если хук принимает аргументы, передавайте их напрямую в колбэк:

```js
const { result } = renderHook(() => useCounter(10));
```

Чтобы переrender хук с новыми параметрами, используйте `rerender`:

```js
const { result, rerender } = renderHook(({ initialValue }) => useCounter(initialValue), {
  initialProps: { initialValue: 0 },
});

rerender({ initialValue: 5 });
```

## Тестирование useState

Рассмотрим простой хук счётчика:

```js
// useCounter.js
import { useState } from 'react';

export function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = () => setCount((prev) => prev + 1);
  const decrement = () => setCount((prev) => prev - 1);
  const reset = () => setCount(initialValue);

  return { count, increment, decrement, reset };
}
```

Тесты для него:

```js
// useCounter.test.js
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('инициализируется с нулём по умолчанию', () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);
  });

  it('инициализируется с переданным значением', () => {
    const { result } = renderHook(() => useCounter(10));

    expect(result.current.count).toBe(10);
  });

  it('увеличивает счётчик на 1', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('уменьшает счётчик на 1', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it('сбрасывает счётчик к начальному значению', () => {
    const { result } = renderHook(() => useCounter(3));

    act(() => {
      result.current.increment();
      result.current.increment();
    });

    expect(result.current.count).toBe(5);

    act(() => {
      result.current.reset();
    });

    expect(result.current.count).toBe(3);
  });
});
```

### Почему нужен act()

`act()` — это утилита, которая гарантирует, что все обновления состояния и эффекты выполнены до того, как вы проверяете результат. Без `act()` React может не успеть применить обновления, и вы получите устаревшее значение.

Правило простое: **любой вызов функции, обновляющей состояние хука, оборачивайте в `act()`**.

## Тестирование useEffect

`useEffect` запускает побочные эффекты: подписки, запросы к API, работу с DOM. Вот хук, который подписывается на событие:

```js
// useWindowWidth.js
import { useState, useEffect } from 'react';

export function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return width;
}
```

Тестирование:

```js
// useWindowWidth.test.js
import { renderHook, act } from '@testing-library/react';
import { useWindowWidth } from './useWindowWidth';

describe('useWindowWidth', () => {
  it('возвращает текущую ширину окна', () => {
    // jsdom задаёт window.innerWidth = 1024 по умолчанию
    const { result } = renderHook(() => useWindowWidth());

    expect(result.current).toBe(1024);
  });

  it('обновляет ширину при изменении размера окна', () => {
    const { result } = renderHook(() => useWindowWidth());

    act(() => {
      // Имитируем изменение размера окна
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 800 });
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(800);
  });

  it('отписывается от события при размонтировании', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useWindowWidth());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
```

### Тестирование хуков с таймерами

Если `useEffect` использует `setTimeout` или `setInterval`, применяйте поддельные таймеры Jest:

```js
// useDebounce.js
import { useState, useEffect } from 'react';

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

```js
// useDebounce.test.js
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('возвращает начальное значение сразу', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));

    expect(result.current).toBe('hello');
  });

  it('не обновляет значение до истечения задержки', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'updated', delay: 500 });

    // Прошло только 200ms — значение ещё не обновилось
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(result.current).toBe('initial');
  });

  it('обновляет значение после истечения задержки', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'updated', delay: 500 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });
});
```

## Тестирование useCallback

`useCallback` мемоизирует функцию. Ключевой момент в тестировании — проверить, что функция не пересоздаётся при перерендере без изменения зависимостей, и пересоздаётся при их изменении.

```js
// useSearch.js
import { useState, useCallback } from 'react';

export function useSearch(items) {
  const [query, setQuery] = useState('');

  const search = useCallback(
    (searchQuery) => {
      return items.filter((item) =>
        item.toLowerCase().includes(searchQuery.toLowerCase())
      );
    },
    [items]
  );

  return { query, setQuery, search };
}
```

```js
// useSearch.test.js
import { renderHook, act } from '@testing-library/react';
import { useSearch } from './useSearch';

describe('useSearch', () => {
  const items = ['Apple', 'Banana', 'Cherry', 'Avocado'];

  it('возвращает все элементы при пустом запросе', () => {
    const { result } = renderHook(() => useSearch(items));

    expect(result.current.search('')).toEqual(items);
  });

  it('фильтрует элементы по запросу (без учёта регистра)', () => {
    const { result } = renderHook(() => useSearch(items));

    expect(result.current.search('a')).toEqual(['Apple', 'Banana', 'Avocado']);
    expect(result.current.search('APPLE')).toEqual(['Apple']);
  });

  it('функция search не пересоздаётся при ре-рендере с теми же items', () => {
    const { result, rerender } = renderHook(() => useSearch(items));

    const firstSearch = result.current.search;

    rerender();

    expect(result.current.search).toBe(firstSearch); // та же ссылка
  });

  it('функция search пересоздаётся при изменении items', () => {
    const { result, rerender } = renderHook(
      ({ items }) => useSearch(items),
      { initialProps: { items } }
    );

    const firstSearch = result.current.search;

    rerender({ items: ['Mango', 'Pear'] });

    expect(result.current.search).not.toBe(firstSearch); // новая ссылка
  });
});
```

## Тестирование кастомных хуков

Кастомные хуки — главный кандидат для изолированного тестирования. Рассмотрим более реалистичный пример хука для работы с формой:

```js
// useForm.js
import { useState, useCallback } from 'react';

export function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleBlur = useCallback((name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));

    if (validate) {
      const validationErrors = validate({ ...values, [name]: values[name] });
      setErrors(validationErrors);
    }
  }, [values, validate]);

  const handleSubmit = useCallback((onSubmit) => {
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }

    onSubmit(values);
  }, [values, validate]);

  const isValid = Object.keys(errors).length === 0;

  return { values, errors, touched, handleChange, handleBlur, handleSubmit, isValid };
}
```

```js
// useForm.test.js
import { renderHook, act } from '@testing-library/react';
import { useForm } from './useForm';

const initialValues = { email: '', password: '' };

const validate = (values) => {
  const errors = {};

  if (!values.email) {
    errors.email = 'Email обязателен';
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Некорректный email';
  }

  if (!values.password || values.password.length < 6) {
    errors.password = 'Пароль должен содержать не менее 6 символов';
  }

  return errors;
};

describe('useForm', () => {
  it('инициализируется с начальными значениями', () => {
    const { result } = renderHook(() => useForm(initialValues, validate));

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it('обновляет значение поля при handleChange', () => {
    const { result } = renderHook(() => useForm(initialValues, validate));

    act(() => {
      result.current.handleChange('email', 'test@example.com');
    });

    expect(result.current.values.email).toBe('test@example.com');
  });

  it('валидирует поле при handleBlur', () => {
    const { result } = renderHook(() => useForm(initialValues, validate));

    act(() => {
      result.current.handleBlur('email');
    });

    expect(result.current.touched.email).toBe(true);
    expect(result.current.errors.email).toBe('Email обязателен');
  });

  it('не вызывает onSubmit при наличии ошибок', () => {
    const { result } = renderHook(() => useForm(initialValues, validate));
    const onSubmit = jest.fn();

    act(() => {
      result.current.handleSubmit(onSubmit);
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.errors.email).toBeTruthy();
  });

  it('вызывает onSubmit с корректными данными при успешной валидации', () => {
    const { result } = renderHook(() => useForm(initialValues, validate));
    const onSubmit = jest.fn();

    act(() => {
      result.current.handleChange('email', 'user@example.com');
      result.current.handleChange('password', 'secret123');
    });

    act(() => {
      result.current.handleSubmit(onSubmit);
    });

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret123',
    });
  });
});
```

## Мокирование зависимостей в хуках

Кастомные хуки нередко зависят от внешних сервисов, API или других хуков. Правильное мокирование позволяет тестировать логику хука изолированно.

### Мокирование модулей через jest.mock

```js
// useUserData.js
import { useState, useEffect } from 'react';
import { fetchUser } from './api';

export function useUserData(userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchUser(userId)
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [userId]);

  return { user, loading, error };
}
```

```js
// useUserData.test.js
import { renderHook, waitFor } from '@testing-library/react';
import { useUserData } from './useUserData';
import { fetchUser } from './api';

// Мокируем модуль api целиком
jest.mock('./api');

describe('useUserData', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('возвращает loading: true в начале загрузки', () => {
    fetchUser.mockReturnValue(new Promise(() => {})); // промис который никогда не резолвится

    const { result } = renderHook(() => useUserData(1));

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('загружает пользователя успешно', async () => {
    const mockUser = { id: 1, name: 'Иван', email: 'ivan@example.com' };
    fetchUser.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useUserData(1));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  it('обрабатывает ошибку загрузки', async () => {
    fetchUser.mockRejectedValue(new Error('Пользователь не найден'));

    const { result } = renderHook(() => useUserData(1));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Пользователь не найден');
    expect(result.current.user).toBeNull();
  });

  it('перезагружает данные при изменении userId', async () => {
    const mockUser1 = { id: 1, name: 'Иван' };
    const mockUser2 = { id: 2, name: 'Мария' };

    fetchUser.mockResolvedValueOnce(mockUser1).mockResolvedValueOnce(mockUser2);

    const { result, rerender } = renderHook(
      ({ userId }) => useUserData(userId),
      { initialProps: { userId: 1 } }
    );

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser1);
    });

    rerender({ userId: 2 });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser2);
    });

    expect(fetchUser).toHaveBeenCalledTimes(2);
    expect(fetchUser).toHaveBeenNthCalledWith(1, 1);
    expect(fetchUser).toHaveBeenNthCalledWith(2, 2);
  });
});
```

### Мокирование хуков-зависимостей

Иногда хук зависит от другого хука. Например, хук авторизации использует хук маршрутизации:

```js
// useProtectedAction.js
import { useRouter } from 'next/router';
import { useAuth } from './useAuth';

export function useProtectedAction(action) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    action();
  };
}
```

```js
// useProtectedAction.test.js
import { renderHook } from '@testing-library/react';
import { useProtectedAction } from './useProtectedAction';

// Мокируем зависимые хуки
jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('./useAuth');

import { useAuth } from './useAuth';
import { useRouter } from 'next/router';

describe('useProtectedAction', () => {
  it('вызывает action если пользователь авторизован', () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    const mockRouter = { push: jest.fn() };
    useRouter.mockReturnValue(mockRouter);

    const action = jest.fn();
    const { result } = renderHook(() => useProtectedAction(action));

    result.current();

    expect(action).toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('редиректит на /login если пользователь не авторизован', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });
    const mockRouter = { push: jest.fn() };
    useRouter.mockReturnValue(mockRouter);

    const action = jest.fn();
    const { result } = renderHook(() => useProtectedAction(action));

    result.current();

    expect(action).not.toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });
});
```

## Работа с act()

`act()` обеспечивает корректное применение всех обновлений React перед проверкой. Разберём тонкости его использования.

### Синхронный act

Используется для синхронных обновлений состояния:

```js
act(() => {
  result.current.increment();
  result.current.increment();
});

expect(result.current.count).toBe(2);
```

Несколько вызовов внутри одного `act()` батчуются — это соответствует тому, как React обрабатывает события в браузере.

### Асинхронный act

Для асинхронных операций используйте `await act()`:

```js
it('загружает данные асинхронно', async () => {
  fetchUser.mockResolvedValue({ id: 1, name: 'Иван' });

  const { result } = renderHook(() => useUserData(1));

  // Ждём завершения всех асинхронных операций
  await act(async () => {
    await Promise.resolve(); // даём промисам выполниться
  });

  expect(result.current.user).toEqual({ id: 1, name: 'Иван' });
});
```

### waitFor как альтернатива

В современном `@testing-library/react` `waitFor` часто удобнее для ожидания асинхронных изменений:

```js
import { renderHook, waitFor } from '@testing-library/react';

it('загружает данные асинхронно', async () => {
  fetchUser.mockResolvedValue({ id: 1, name: 'Иван' });

  const { result } = renderHook(() => useUserData(1));

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.user).toEqual({ id: 1, name: 'Иван' });
});
```

`waitFor` повторяет проверку до тех пор, пока она не пройдёт успешно или не истечёт таймаут (по умолчанию 1000ms). Это удобнее явного управления промисами.

### act с таймерами

При использовании поддельных таймеров (`jest.useFakeTimers()`), продвигайте время внутри `act()`:

```js
it('обновляет значение через 500ms', () => {
  jest.useFakeTimers();

  const { result } = renderHook(() => useDebounce('initial', 500));

  act(() => {
    jest.advanceTimersByTime(500);
  });

  expect(result.current).toBe('initial');

  jest.useRealTimers();
});
```

## Тестирование хуков с провайдерами

Некоторые хуки зависят от контекста React (например, хук, использующий `useContext`). В этом случае нужно обернуть хук в провайдер:

```js
// useTheme.js
import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

export function useTheme() {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error('useTheme должен использоваться внутри ThemeProvider');
  }

  return theme;
}
```

```js
// useTheme.test.js
import { renderHook } from '@testing-library/react';
import { ThemeContext } from './ThemeContext';
import { useTheme } from './useTheme';

// Создаём обёртку-провайдер
const wrapper = ({ children }) => (
  <ThemeContext.Provider value={{ mode: 'dark', primaryColor: '#6200EE' }}>
    {children}
  </ThemeContext.Provider>
);

describe('useTheme', () => {
  it('возвращает значение из контекста', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.mode).toBe('dark');
    expect(result.current.primaryColor).toBe('#6200EE');
  });

  it('выбрасывает ошибку без провайдера', () => {
    // Подавляем вывод ошибки в консоль
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useTheme())).toThrow(
      'useTheme должен использоваться внутри ThemeProvider'
    );

    consoleSpy.mockRestore();
  });
});
```

## Полный пример: тестирование хука пагинации

Завершим разбором комплексного примера — хука для пагинации с мокируемым API:

```js
// usePagination.js
import { useState, useEffect, useCallback } from 'react';

export function usePagination(fetchFn, pageSize = 10) {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPage = useCallback(async (page) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchFn(page, pageSize);
      setData(response.items);
      setTotalPages(Math.ceil(response.total / pageSize));
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, pageSize]);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      loadPage(page);
    }
  }, [loadPage, totalPages]);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [goToPage, currentPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [goToPage, currentPage]);

  return {
    data,
    currentPage,
    totalPages,
    loading,
    error,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}
```

```js
// usePagination.test.js
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePagination } from './usePagination';

const mockFetchFn = jest.fn();

const createMockResponse = (page, total = 25, pageSize = 10) => ({
  items: Array.from({ length: Math.min(pageSize, total - (page - 1) * pageSize) }, (_, i) => ({
    id: (page - 1) * pageSize + i + 1,
    name: `Item ${(page - 1) * pageSize + i + 1}`,
  })),
  total,
});

describe('usePagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('загружает первую страницу при инициализации', async () => {
    mockFetchFn.mockResolvedValue(createMockResponse(1));

    const { result } = renderHook(() => usePagination(mockFetchFn, 10));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(10);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(3);
    expect(mockFetchFn).toHaveBeenCalledWith(1, 10);
  });

  it('переходит на следующую страницу', async () => {
    mockFetchFn
      .mockResolvedValueOnce(createMockResponse(1))
      .mockResolvedValueOnce(createMockResponse(2));

    const { result } = renderHook(() => usePagination(mockFetchFn, 10));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.nextPage();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.currentPage).toBe(2);
    expect(result.current.hasPrevPage).toBe(true);
  });

  it('не переходит за пределы последней страницы', async () => {
    mockFetchFn.mockResolvedValue(createMockResponse(3));

    const { result } = renderHook(() => usePagination(mockFetchFn, 10));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Принудительно устанавливаем третью страницу для теста
    act(() => {
      result.current.goToPage(3);
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.nextPage();
    });

    // Функция загрузки не должна вызываться снова
    expect(mockFetchFn).toHaveBeenCalledTimes(2); // init + goToPage(3)
  });

  it('обрабатывает ошибку загрузки', async () => {
    mockFetchFn.mockRejectedValue(new Error('Ошибка сети'));

    const { result } = renderHook(() => usePagination(mockFetchFn, 10));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Ошибка сети');
    expect(result.current.data).toEqual([]);
  });
});
```

## Лучшие практики

### Структура тестовых файлов

Размещайте тесты хуков рядом с файлом хука:

```
src/
├── hooks/
│   ├── useCounter.js
│   ├── useCounter.test.js
│   ├── useForm.js
│   ├── useForm.test.js
│   └── usePagination.js
│       usePagination.test.js
```

### Именование тестов

Называйте тесты так, чтобы они читались как спецификация:

```js
describe('useCounter', () => {
  it('начинается с 0 по умолчанию');
  it('принимает начальное значение');
  it('увеличивает счётчик при вызове increment');
  it('не уходит ниже нуля при decrement если минимум установлен');
});
```

### Изолируйте тесты

Каждый тест должен быть независимым. Используйте `beforeEach` для сброса моков и состояния:

```js
beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});
```

### Не тестируйте детали реализации

Тестируйте поведение хука через его публичный интерфейс (возвращаемые значения и функции), а не внутреннее устройство:

```js
// ✅ Правильно — тестируем поведение
expect(result.current.count).toBe(1);

// ❌ Неправильно — пытаемся залезть во внутренности
expect(result.current._internalState).toBeDefined();
```

## Заключение

Тестирование хуков через `renderHook` из `@testing-library/react` — мощный инструмент для обеспечения качества вашего кода. Ключевые выводы:

- Используйте `renderHook` для изолированного тестирования хуков без создания компонентов-обёрток
- Оборачивайте обновления состояния в `act()` для корректного применения изменений
- Используйте `waitFor` для асинхронных операций — это читаемее и надёжнее, чем ручное управление промисами
- Мокируйте внешние зависимости через `jest.mock()`, а контекст передавайте через параметр `wrapper`
- Тестируйте поведение, а не детали реализации — это делает тесты устойчивыми к рефакторингу
- Проверяйте очистку эффектов через `unmount()`, чтобы убедиться в отсутствии утечек

Хорошо протестированные хуки — основа надёжного и поддерживаемого React-приложения.

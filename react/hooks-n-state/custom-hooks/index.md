---
metaTitle: Кастомные хуки в React — создание собственных хуков
metaDescription: Полное руководство по созданию кастомных хуков в React: что такое custom hooks, как их писать, примеры переиспользуемых хуков, правила именования и лучшие практики
author: Олег Марков
title: Кастомные хуки в React — создание собственных хуков
preview: Научитесь создавать собственные кастомные хуки в React — выносить повторяющуюся логику в переиспользуемые функции, писать хуки для работы с API, формами, localStorage и не только
---

## Введение

По мере роста React-приложений вы всё чаще будете замечать один и тот же паттерн: одна и та же логика копируется из компонента в компонент. Запросы к API, работа с формами, подписка на события, управление таймерами — всё это начинает дублироваться. Копирование кода нарушает принцип DRY и усложняет поддержку проекта.

Именно для решения этой проблемы в React существуют **кастомные хуки** (custom hooks). Это обычные JavaScript-функции, которые используют встроенные хуки React и позволяют вынести повторяющуюся логику в одно место.

В этой статье вы узнаете, что такое кастомные хуки, как их создавать, какие есть правила и лучшие практики. Если вы хотите освоить React на профессиональном уровне — приходите на наш курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=custom-hooks). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Что такое кастомный хук

Кастомный хук — это функция, название которой начинается с `use` и которая может вызывать другие хуки React. По сути, это способ **извлечь логику компонента в переиспользуемую функцию**.

Важно понимать: кастомный хук — это не особый механизм React. Это просто соглашение, которое позволяет React понять, что функция следует правилам хуков и может содержать вызовы `useState`, `useEffect` и других хуков.

```tsx
// Обычная функция — НЕ хук
function getWindowSize() {
  // Нельзя вызывать useState здесь!
  return { width: window.innerWidth, height: window.innerHeight };
}

// Кастомный хук — МОЖНО использовать хуки
function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return size;
}
```

## Правила именования кастомных хуков

Название кастомного хука **обязательно должно начинаться с `use`**. Это не просто соглашение — React и его инструменты используют этот префикс, чтобы:

- Применять правила хуков (Rules of Hooks) при статическом анализе
- Правильно отображать хук в React DevTools
- Давать линтеру понять, что функция подчиняется правилам хуков

```tsx
// ✅ Правильно
function useAuth() { ... }
function useFetch() { ... }
function useLocalStorage() { ... }
function useDebounce() { ... }

// ❌ Неправильно — React не будет применять правила хуков
function authHook() { ... }
function fetchData() { ... }
function getLocalStorage() { ... }
```

## Зачем нужны кастомные хуки

Рассмотрим практический пример. Предположим, вам нужно в нескольких компонентах загружать данные с API:

```tsx
// Компонент UserProfile
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  return <div>{user?.name}</div>;
}

// Компонент ProductList — та же логика дублируется!
function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  // ...
}
```

Логика загрузки данных дублируется. Вынесем её в кастомный хук:

```tsx
// hooks/useFetch.ts
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!cancelled) {
          setData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}
```

Теперь компоненты становятся значительно чище:

```tsx
function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error } = useFetch<User>(`/api/users/${userId}`);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  return <div>{user?.name}</div>;
}

function ProductList() {
  const { data: products, loading, error } = useFetch<Product[]>('/api/products');

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  return <ul>{products?.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

## Создание кастомного хука: пошаговый разбор

### Шаг 1: Определите повторяющуюся логику

Прежде чем создавать хук, убедитесь, что логика действительно используется в нескольких местах или достаточно сложна, чтобы её стоило выносить.

### Шаг 2: Создайте функцию с префиксом `use`

```tsx
function useCounter(initialValue = 0) {
  // ...
}
```

### Шаг 3: Перенесите логику и хуки

```tsx
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);

  return { count, increment, decrement, reset };
}
```

### Шаг 4: Определите, что возвращать

Кастомный хук может возвращать что угодно: объект, массив, примитив или функцию.

```tsx
// Возвращаем объект — удобно для именованного доступа
const { count, increment } = useCounter(0);

// Возвращаем массив — удобно для переименования (как useState)
const [count, { increment, decrement }] = useCounter(0);
```

### Шаг 5: Используйте в компонентах

```tsx
function CounterComponent() {
  const { count, increment, decrement, reset } = useCounter(10);

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Сбросить</button>
    </div>
  );
}
```

## Практические примеры кастомных хуков

### useLocalStorage — работа с локальным хранилищем

```tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Ошибка чтения localStorage ключа "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Ошибка записи localStorage ключа "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// Использование
function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      Текущая тема: {theme}
    </button>
  );
}
```

### useDebounce — отложенное обновление значения

```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Использование
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  // Запрос отправляется только через 500мс после остановки печати
  const { data } = useFetch(`/api/search?q=${debouncedQuery}`);

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск..." />
      {data?.map(item => <div key={item.id}>{item.title}</div>)}
    </div>
  );
}
```

### useToggle — переключатель булевого значения

```tsx
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return { value, toggle, setTrue, setFalse };
}

// Использование
function Modal() {
  const { value: isOpen, toggle, setFalse: close } = useToggle(false);

  return (
    <>
      <button onClick={toggle}>Открыть модальное окно</button>
      {isOpen && (
        <div className="modal">
          <p>Содержимое модального окна</p>
          <button onClick={close}>Закрыть</button>
        </div>
      )}
    </>
  );
}
```

### usePrevious — отслеживание предыдущего значения

```tsx
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// Использование
function PriceDisplay({ price }: { price: number }) {
  const prevPrice = usePrevious(price);

  return (
    <div>
      <span>Текущая цена: {price}</span>
      {prevPrice !== undefined && (
        <span style={{ color: price > prevPrice ? 'green' : 'red' }}>
          {price > prevPrice ? '▲' : '▼'} Было: {prevPrice}
        </span>
      )}
    </div>
  );
}
```

### useForm — управление состоянием формы

```tsx
type FormValues = Record<string, string>;

function useForm(initialValues: FormValues) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormValues>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return { values, errors, touched, handleChange, handleBlur, reset, setErrors };
}

// Использование
function LoginForm() {
  const { values, handleChange, handleBlur, reset } = useForm({
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Отправка формы:', values);
    reset();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Email"
      />
      <input
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Пароль"
      />
      <button type="submit">Войти</button>
    </form>
  );
}
```

## Когда создавать кастомный хук

Кастомный хук стоит создавать в следующих случаях:

**1. Дублирование логики в нескольких компонентах**

Если одни и те же `useState` и `useEffect` встречаются в двух и более компонентах — это явный сигнал для создания хука.

**2. Компонент становится слишком большим**

Если логика занимает более 30-50 строк и её можно выделить в самостоятельную единицу — выносите в хук для читаемости.

**3. Логика сложная и требует отдельного тестирования**

Кастомные хуки можно тестировать отдельно с помощью `@testing-library/react-hooks`, не требуя рендеринга компонентов.

**4. Логика не связана с отображением**

Если код работает с данными, но не определяет, как они рендерятся — это хороший кандидат для хука.

## Когда НЕ нужен кастомный хук

- Логика используется только в одном месте и проста
- Можно обойтись обычной функцией без хуков
- Хук только обёртывает один существующий хук без добавления логики

```tsx
// Избыточно — не стоит создавать хук ради одного useState
function useCount() {
  return useState(0); // Просто используйте useState напрямую
}
```

## Структура файлов для кастомных хуков

Существует несколько подходов к организации файлов:

```
// Подход 1: Один файл на хук
src/
  hooks/
    useFetch.ts
    useLocalStorage.ts
    useDebounce.ts
    useForm.ts

// Подход 2: Индексный файл для экспорта
src/
  hooks/
    index.ts          // export { useFetch, useLocalStorage, ... }
    useFetch.ts
    useLocalStorage.ts

// Подход 3: Хуки рядом с компонентами (если специфичны для компонента)
src/
  components/
    UserProfile/
      UserProfile.tsx
      useUserProfile.ts  // Специфичный для компонента хук
```

## Тестирование кастомных хуков

Для тестирования кастомных хуков используется `renderHook` из `@testing-library/react`:

```tsx
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('инициализируется с начальным значением', () => {
    const { result } = renderHook(() => useCounter(5));
    expect(result.current.count).toBe(5);
  });

  it('инкрементирует значение', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('сбрасывает значение', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(10);
  });
});
```

## Использование TypeScript с кастомными хуками

TypeScript значительно улучшает опыт работы с кастомными хуками — добавляет типизацию входных параметров и возвращаемых значений:

```tsx
// Типизированный хук для работы с API
interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useFetch<T>(url: string): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  const refetch = useCallback(() => setRefetchIndex(i => i + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(url)
      .then(res => res.json())
      .then((data: T) => {
        if (!cancelled) {
          setData(data);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [url, refetchIndex]);

  return { data, loading, error, refetch };
}

// Использование с автодополнением TypeScript
interface User {
  id: number;
  name: string;
  email: string;
}

function UserCard({ id }: { id: number }) {
  const { data, loading, error, refetch } = useFetch<User>(`/api/users/${id}`);
  // data имеет тип User | null — TypeScript подскажет доступные поля
  return <div>{data?.name}</div>;
}
```

## Лучшие практики

**1. Чёткое разделение ответственности**

Каждый хук должен решать одну задачу. Не создавайте «монструозные» хуки, которые делают всё сразу.

```tsx
// ❌ Плохо — слишком много ответственности
function useUserDashboard() {
  // Авторизация + данные пользователя + уведомления + настройки
}

// ✅ Хорошо — каждый хук отвечает за своё
function useAuth() { ... }
function useUserData(userId: string) { ... }
function useNotifications() { ... }
```

**2. Документируйте хуки**

```tsx
/**
 * Хук для работы с дебаунсом значения.
 * Возвращает значение, которое обновляется только спустя указанную задержку.
 *
 * @param value - Исходное значение
 * @param delay - Задержка в миллисекундах
 * @returns Дебаунсированное значение
 *
 * @example
 * const debouncedSearch = useDebounce(searchQuery, 500);
 */
function useDebounce<T>(value: T, delay: number): T { ... }
```

**3. Обрабатывайте очистку в useEffect**

Всегда возвращайте функцию очистки в `useEffect`, чтобы избежать утечек памяти:

```tsx
function useEventListener(event: string, handler: (e: Event) => void) {
  useEffect(() => {
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler); // ✅ Очистка
  }, [event, handler]);
}
```

**4. Мемоизируйте возвращаемые функции**

Оборачивайте функции в `useCallback`, чтобы предотвратить лишние рендеры в компонентах:

```tsx
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);

  // ✅ Мемоизированные функции — не будут пересоздаваться при каждом рендере
  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);

  return { count, increment, decrement };
}
```

## Заключение

Кастомные хуки — один из самых мощных инструментов React для создания переиспользуемой логики. Они позволяют:

- **Избежать дублирования кода** — одна логика, много мест использования
- **Улучшить читаемость** — компоненты остаются чистыми и сфокусированными на рендеринге
- **Упростить тестирование** — логику можно тестировать отдельно от UI
- **Сделать код более поддерживаемым** — изменения в одном месте применяются везде

Главное правило: имя хука должно начинаться с `use`, и он должен следовать правилам хуков React. Всё остальное — дело практики и хорошего дизайна API.

Если вы хотите детально изучить хуки React, научиться создавать сложные кастомные хуки и применять их в реальных проектах — приходите на наш курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=custom-hooks). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

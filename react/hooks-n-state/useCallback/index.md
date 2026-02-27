---
metaTitle: useCallback в React — мемоизация функций
metaDescription: Полное руководство по useCallback в React: синтаксис, принципы работы, практические примеры, отличия от useMemo, TypeScript и лучшие практики применения
author: Олег Марков
title: useCallback в React — мемоизация функций
preview: Разберитесь, что такое useCallback в React, зачем мемоизировать функции, как правильно использовать хук с зависимостями, когда он реально помогает, а когда только усложняет код
---

## Введение

Когда вы работаете с React, вы наверняка замечали, что при каждом рендере компонента все функции, объявленные внутри него, создаются заново. В большинстве случаев это нормально — функции легковесны. Но когда такие функции передаются дочерним компонентам или используются в зависимостях других хуков, это может приводить к лишним рендерам и проблемам с производительностью.

Именно для этого в React появился хук `useCallback` — он позволяет мемоизировать функции, то есть сохранять одну и ту же ссылку между рендерами, если зависимости не изменились.

В этой статье вы узнаете, что такое `useCallback`, как его использовать, когда он реально нужен, а когда лучше обойтись без него. Если вы хотите глубже освоить React и научиться писать производительные компоненты — приходите на наш курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=use-callback). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Проблема: функции создаются заново при каждом рендере

Рассмотрим простой пример:

```tsx
function ParentComponent() {
  const [count, setCount] = useState(0);

  // Эта функция создаётся заново при каждом рендере ParentComponent
  const handleClick = () => {
    console.log('Кнопка нажата');
  };

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <ChildComponent onClick={handleClick} />
    </div>
  );
}
```

При каждом нажатии кнопки `ParentComponent` рендерится заново. При этом `handleClick` — это **новая функция** с новой ссылкой в памяти. Если `ChildComponent` обёрнут в `React.memo`, он всё равно перерендерится, потому что получает новый `onClick` при каждом рендере родителя.

Это и есть проблема, которую решает `useCallback`.

## Что такое useCallback

`useCallback` — это хук React, который мемоизирует функцию: возвращает одну и ту же ссылку на функцию между рендерами до тех пор, пока не изменятся её зависимости.

**Принцип работы:**
- При первом рендере React создаёт функцию и сохраняет её в памяти
- При последующих рендерах React проверяет список зависимостей
- Если зависимости не изменились — возвращает ту же функцию (ту же ссылку)
- Если зависимости изменились — создаёт новую функцию и сохраняет её

## Синтаксис useCallback

```tsx
import { useCallback } from 'react';

const memoizedCallback = useCallback(
  () => {
    // тело функции
  },
  [dependencies] // массив зависимостей
);
```

**Параметры:**
- **Функция** — функция, которую нужно мемоизировать
- **Массив зависимостей** — переменные, при изменении которых функция будет создана заново

**Возвращаемое значение:** Мемоизированная версия переданной функции.

## Базовый пример использования

Исправим пример из начала статьи с помощью `useCallback`:

```tsx
import { useState, useCallback } from 'react';

const ChildComponent = React.memo(({ onClick }: { onClick: () => void }) => {
  console.log('ChildComponent рендерится');
  return <button onClick={onClick}>Дочерняя кнопка</button>;
});

function ParentComponent() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');

  // Функция мемоизирована — ссылка не меняется при изменении count или text
  const handleClick = useCallback(() => {
    console.log('Кнопка нажата');
  }, []); // Пустой массив — функция создаётся один раз

  return (
    <div>
      <p>Счётчик: {count}</p>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      <ChildComponent onClick={handleClick} />
    </div>
  );
}
```

Теперь `ChildComponent` не будет перерендериваться при изменении `count` или `text`, потому что ссылка на `handleClick` остаётся стабильной.

## Пример с зависимостями

Если функция использует переменные из области видимости компонента, их нужно указать в массиве зависимостей:

```tsx
function SearchComponent({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ category: 'all', sortBy: 'date' });

  // Функция зависит от query и filters
  const handleSearch = useCallback(() => {
    onSearch(`${query}&category=${filters.category}&sort=${filters.sortBy}`);
  }, [query, filters, onSearch]); // Перечисляем все зависимости

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Введите запрос..."
      />
      <button onClick={handleSearch}>Поиск</button>
    </div>
  );
}
```

Функция `handleSearch` будет пересоздаваться только при изменении `query`, `filters` или `onSearch`.

## Использование с useEffect

`useCallback` часто используется вместе с `useEffect`, когда функция передаётся как зависимость:

```tsx
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);

  // Без useCallback эта функция создавалась бы заново при каждом рендере,
  // вызывая бесконечный цикл в useEffect ниже
  const fetchUser = useCallback(async () => {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    setUser(data);
  }, [userId]); // Пересоздаётся только при изменении userId

  useEffect(() => {
    fetchUser();
  }, [fetchUser]); // Безопасно использовать как зависимость

  if (!user) return <p>Загрузка...</p>;
  return <p>Привет, {user.name}!</p>;
}
```

Без `useCallback` функция `fetchUser` создавалась бы заново при каждом рендере, что вызвало бы бесконечный цикл: `useEffect` → обновление состояния → рендер → новая функция → `useEffect` → ...

## Использование с TypeScript

TypeScript автоматически выводит тип мемоизированной функции:

```tsx
import { useCallback } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
}

function ProductList({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<Product[]>([]);

  // TypeScript выводит тип: (product: Product) => void
  const addToCart = useCallback((product: Product) => {
    setCart(prev => [...prev, product]);
  }, []);

  // Явное указание типа при необходимости
  const removeFromCart = useCallback<(id: number) => void>((id) => {
    setCart(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <ul>
      {products.map(product => (
        <ProductItem
          key={product.id}
          product={product}
          onAdd={addToCart}
          onRemove={removeFromCart}
        />
      ))}
    </ul>
  );
}
```

## useCallback vs useMemo

Оба хука выполняют мемоизацию, но для разных вещей:

| Хук | Что мемоизирует | Когда использовать |
|-----|----------------|-------------------|
| `useCallback(fn, deps)` | Функцию (ссылку на неё) | Передача функций в дочерние компоненты, зависимости useEffect |
| `useMemo(() => fn(), deps)` | Результат вызова функции | Тяжёлые вычисления, создание объектов/массивов |

По сути, `useCallback(fn, deps)` эквивалентно `useMemo(() => fn, deps)`:

```tsx
// Эти два варианта эквивалентны:
const memoizedFn = useCallback(() => doSomething(a, b), [a, b]);
const memoizedFn = useMemo(() => () => doSomething(a, b), [a, b]);
```

## Когда использовать useCallback

### ✅ Используйте useCallback, когда:

**1. Передаёте функцию в мемоизированный дочерний компонент**
```tsx
const MemoChild = React.memo(({ onAction }: { onAction: () => void }) => (
  <button onClick={onAction}>Действие</button>
));

function Parent() {
  const handleAction = useCallback(() => {
    // логика
  }, []);

  return <MemoChild onAction={handleAction} />;
}
```

**2. Функция используется как зависимость в useEffect/useCallback/useMemo**
```tsx
const loadData = useCallback(async () => {
  const data = await fetchData();
  setData(data);
}, [fetchData]);

useEffect(() => {
  loadData();
}, [loadData]); // Стабильная зависимость
```

**3. Функция передаётся в кастомный хук**
```tsx
const { data } = useDataFetcher(useCallback(() => fetchUsers(), []));
```

### ❌ Не используйте useCallback, когда:

**1. Функция не передаётся никуда** — обычный обработчик событий:
```tsx
// Нет смысла — handleClick не передаётся в дочерние компоненты
const handleClick = useCallback(() => {
  setCount(c => c + 1);
}, []);
```

**2. Дочерний компонент не обёрнут в React.memo** — мемоизация бесполезна:
```tsx
// ChildComponent рендерится при каждом рендере родителя в любом случае
const handleAction = useCallback(() => {}, []);
return <ChildComponent onAction={handleAction} />;
```

**3. Зависимости часто меняются** — функция будет создаваться заново, что сведёт оптимизацию к нулю.

## Распространённые ошибки

### Ошибка 1: Забыть указать зависимость

```tsx
// ❌ Ошибка — userId не указан в зависимостях
const fetchUser = useCallback(async () => {
  const response = await fetch(`/api/users/${userId}`);
  // ...
}, []); // userId изменится, но функция не обновится!

// ✅ Правильно
const fetchUser = useCallback(async () => {
  const response = await fetch(`/api/users/${userId}`);
  // ...
}, [userId]);
```

### Ошибка 2: Использовать useCallback для всего подряд

```tsx
// ❌ Избыточно — добавляет сложность без пользы
const getValue = useCallback(() => someValue, [someValue]);
const handleSimpleClick = useCallback(() => setOpen(true), []);

// ✅ Для простых случаев — обычная функция
const getValue = () => someValue;
const handleSimpleClick = () => setOpen(true);
```

### Ошибка 3: Создавать новые объекты внутри useCallback

```tsx
// ❌ options — новый объект при каждом вызове
const fetchData = useCallback(() => {
  const options = { method: 'GET', headers: { 'Content-Type': 'application/json' } };
  return fetch(url, options);
}, [url]);

// ✅ Выносите объекты за пределы или используйте useMemo
const options = useMemo(() => ({
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
}), []);

const fetchData = useCallback(() => {
  return fetch(url, options);
}, [url, options]);
```

## Практический пример: форма с валидацией

```tsx
import { useState, useCallback } from 'react';

interface FormData {
  name: string;
  email: string;
  phone: string;
}

const FormField = React.memo(({
  name,
  value,
  onChange,
  error
}: {
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
}) => {
  console.log(`${name} field re-rendered`);
  return (
    <div>
      <input
        value={value}
        onChange={e => onChange(name, e.target.value)}
        placeholder={name}
      />
      {error && <span style={{ color: 'red' }}>{error}</span>}
    </div>
  );
});

function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Стабильная функция для обновления полей
  const handleChange = useCallback((fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setErrors(prev => ({ ...prev, [fieldName]: undefined }));
  }, []);

  // Стабильная функция валидации
  const validate = useCallback((): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.name.trim()) newErrors.name = 'Введите имя';
    if (!formData.email.includes('@')) newErrors.email = 'Введите корректный email';
    if (formData.phone.length < 10) newErrors.phone = 'Введите корректный телефон';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      console.log('Отправляем данные:', formData);
    }
  }, [validate, formData]);

  return (
    <form onSubmit={handleSubmit}>
      <FormField name="name" value={formData.name} onChange={handleChange} error={errors.name} />
      <FormField name="email" value={formData.email} onChange={handleChange} error={errors.email} />
      <FormField name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} />
      <button type="submit">Зарегистрироваться</button>
    </form>
  );
}
```

Здесь `handleChange` стабилен — поля не рендерятся заново при изменении соседних полей.

## Заключение

`useCallback` — мощный инструмент оптимизации в React, но его нужно применять осознанно:

- **Используйте**, когда передаёте функцию в `React.memo`-компоненты или как зависимость в другие хуки
- **Не используйте** для простых обработчиков событий или функций, которые никуда не передаются
- Всегда указывайте **все используемые переменные** в массиве зависимостей
- Помните, что `useCallback` сам по себе имеет стоимость — лишняя мемоизация замедляет код

Правило простое: сначала напишите код без мемоизации, а потом добавьте `useCallback` там, где это реально решает проблему производительности.

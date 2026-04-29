---
metaTitle: useCallback в React — мемоизация функций и оптимизация
metaDescription: Хук useCallback в React — синтаксис, массив зависимостей, когда использовать, отличие от useMemo, примеры оптимизации ре-рендеров компонентов на TypeScript
author: Антон Ларичев
title: useCallback в React — мемоизация функций и оптимизация ре-рендеров
preview: Разбираем хук useCallback — как он работает, зачем нужен массив зависимостей, в чём отличие от useMemo, и как правильно использовать его для предотвращения лишних ре-рендеров в React-приложениях
---

## Введение

React пересоздаёт все функции внутри компонента при каждом рендере. В большинстве случаев это не проблема — функции занимают мало памяти и создаются быстро. Но когда функция передаётся дочернему компоненту или указывается как зависимость в `useEffect` или `useMemo`, пересоздание функции приводит к лишним ре-рендерам и бесконечным циклам.

Хук `useCallback` решает эту задачу — он мемоизирует функцию и возвращает ту же ссылку между рендерами, пока список зависимостей не изменился.

Если вы хотите глубоко разобраться с оптимизацией React-компонентов и другими хуками — приходите на курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=use-callback). На курсе 177 уроков, AI-тренажёры для практики, живое ревью наставника и еженедельные встречи с менторами.

## Синтаксис useCallback

```tsx
import { useCallback } from 'react';

const memoizedFn = useCallback(
  () => {
    // тело функции
  },
  [dependency1, dependency2] // массив зависимостей
);
```

Хук принимает два аргумента:

- **Функцию** — то, что нужно мемоизировать.
- **Массив зависимостей** — список значений, при изменении которых функция пересоздаётся.

`useCallback` возвращает мемоизированную версию переданной функции.

## Как работают зависимости

React сравнивает элементы массива зависимостей с помощью алгоритма `Object.is` (поверхностное сравнение). Если все элементы совпадают с предыдущим рендером — возвращается та же ссылка. Если хотя бы один изменился — функция создаётся заново.

```tsx
import { useState, useCallback } from 'react';

function SearchBox() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  // Функция пересоздаётся только при изменении query или page
  const handleSearch = useCallback(() => {
    console.log(`Поиск: ${query}, страница: ${page}`);
    fetchResults(query, page);
  }, [query, page]); // зависимости явно перечислены

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <button onClick={handleSearch}>Найти</button>
    </div>
  );
}
```

Если передать пустой массив `[]`, функция создаётся один раз при монтировании компонента и больше не обновляется. Это подходит для функций, которые не используют значения из области видимости компонента.

## Когда использовать useCallback

### Передача функции в React.memo-компонент

Главный сценарий применения `useCallback` — передача коллбэка в дочерний компонент, обёрнутый в `React.memo`. Без мемоизации дочерний компонент будет ре-рендериться при каждом рендере родителя, потому что ссылка на функцию каждый раз новая.

```tsx
import { useState, useCallback, memo } from 'react';

// Дочерний компонент обёрнут в memo
const Button = memo(({ onClick, label }: { onClick: () => void; label: string }) => {
  console.log(`Button "${label}" re-rendered`);
  return <button onClick={onClick}>{label}</button>;
});

function Counter() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');

  // Без useCallback — Button ре-рендерится при изменении text
  // С useCallback — Button рендерится только один раз
  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []); // не зависит от count благодаря функциональному обновлению

  return (
    <div>
      <p>Счётчик: {count}</p>
      <input value={text} onChange={e => setText(e.target.value)} />
      <Button onClick={increment} label="Увеличить" />
    </div>
  );
}
```

### Функция как зависимость useEffect

Если функция передаётся как зависимость в `useEffect`, без `useCallback` это создаёт бесконечный цикл: `useEffect` срабатывает → состояние обновляется → рендер → новая функция → `useEffect` снова.

```tsx
import { useState, useEffect, useCallback } from 'react';

function UserCard({ userId }: { userId: string }) {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Мемоизируем функцию — зависимость useEffect стабильна
  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`);
      const data = await res.json();
      setUser(data);
    } finally {
      setLoading(false);
    }
  }, [userId]); // пересоздаётся только при смене userId

  useEffect(() => {
    loadUser();
  }, [loadUser]); // безопасная зависимость

  if (loading) return <p>Загрузка...</p>;
  if (!user) return null;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button onClick={loadUser}>Обновить</button>
    </div>
  );
}
```

### Передача функции в кастомный хук

Если кастомный хук принимает коллбэк и использует его внутри `useEffect`, передаваемую функцию стоит мемоизировать.

```tsx
import { useEffect, useCallback } from 'react';

// Кастомный хук с коллбэком
function useInterval(callback: () => void, delay: number) {
  useEffect(() => {
    const id = setInterval(callback, delay);
    return () => clearInterval(id);
  }, [callback, delay]);
}

function Timer() {
  const [seconds, setSeconds] = useState(0);

  // Мемоизируем — иначе useInterval пересоздаёт интервал при каждом рендере
  const tick = useCallback(() => {
    setSeconds(s => s + 1);
  }, []); // пустые зависимости — используем функциональное обновление

  useInterval(tick, 1000);

  return <p>Прошло секунд: {seconds}</p>;
}
```

## Отличие useCallback от useMemo

Оба хука мемоизируют значения, но разного характера:

| Хук | Что мемоизирует | Пример |
|-----|-----------------|--------|
| `useCallback(fn, deps)` | Функцию (саму функцию как значение) | Обработчики событий, коллбэки |
| `useMemo(() => value, deps)` | Результат вызова функции | Отфильтрованные массивы, объекты, вычисления |

По сути `useCallback(fn, deps)` — это сокращение для `useMemo(() => fn, deps)`:

```tsx
// Эти два варианта делают одно и то же:
const memoFn = useCallback(() => doWork(a, b), [a, b]);
const memoFn = useMemo(() => () => doWork(a, b), [a, b]);

// useMemo для мемоизации результата вычисления:
const sortedItems = useMemo(() => [...items].sort(), [items]);

// useCallback для мемоизации функции:
const handleSort = useCallback(() => {
  setSorted(prev => !prev);
}, []);
```

Если нужно мемоизировать функцию — используйте `useCallback`. Если нужно мемоизировать результат вычисления — используйте `useMemo`.

Если вы хотите разобраться, как грамотно сочетать `useCallback`, `useMemo` и `React.memo` в реальных проектах — на курсе [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=use-callback) мы разбираем эти темы на практических примерах с код-ревью.

## Пример оптимизации списка

Рассмотрим типичную задачу: список товаров с обработчиками на каждом элементе.

```tsx
import { useState, useCallback, memo } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  inCart: boolean;
}

// Мемоизированный элемент списка
const ProductItem = memo(({
  product,
  onAdd,
  onRemove,
}: {
  product: Product;
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
}) => {
  console.log(`ProductItem ${product.id} re-rendered`);
  return (
    <li>
      <span>{product.name} — {product.price} ₽</span>
      {product.inCart ? (
        <button onClick={() => onRemove(product.id)}>Убрать из корзины</button>
      ) : (
        <button onClick={() => onAdd(product.id)}>В корзину</button>
      )}
    </li>
  );
});

function ProductList({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<Set<number>>(new Set());

  // Стабильные ссылки — ProductItem не ре-рендерится при изменении cart
  const handleAdd = useCallback((id: number) => {
    setCart(prev => new Set([...prev, id]));
  }, []);

  const handleRemove = useCallback((id: number) => {
    setCart(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const enriched = products.map(p => ({ ...p, inCart: cart.has(p.id) }));

  return (
    <ul>
      {enriched.map(product => (
        <ProductItem
          key={product.id}
          product={product}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      ))}
    </ul>
  );
}
```

Без `useCallback` при изменении корзины (добавлении/удалении товара) ре-рендерились бы все элементы списка. С `useCallback` ре-рендерится только тот `ProductItem`, чьё свойство `inCart` изменилось.

## Когда не нужен useCallback

`useCallback` добавляет накладные расходы: React должен создать замыкание, сохранить зависимости и сравнить их при каждом рендере. Для простых случаев это может быть дороже, чем просто пересоздать функцию.

Не используйте `useCallback`:

- Для обычных обработчиков событий, которые не передаются никуда дальше.
- Если дочерний компонент не обёрнут в `React.memo` — мемоизация бесполезна.
- Если зависимости меняются при каждом рендере — функция будет пересоздаваться в любом случае.

```tsx
// Нет смысла — handleClick нигде не используется как зависимость
// и не передаётся в memo-компонент
const handleClick = useCallback(() => {
  setOpen(true);
}, []);

// Лучше так — просто и читаемо
const handleClick = () => setOpen(true);
```

## Частые ошибки

### Ошибка 1: Пропущенная зависимость

Самая распространённая ошибка — использование переменной из области видимости без добавления её в массив зависимостей. Функция будет использовать устаревшее значение.

```tsx
// НЕПРАВИЛЬНО: userId используется, но не указан в зависимостях
const fetchData = useCallback(async () => {
  const res = await fetch(`/api/users/${userId}`);
  // userId никогда не обновится в этой функции!
}, []);

// ПРАВИЛЬНО: добавляем все используемые значения
const fetchData = useCallback(async () => {
  const res = await fetch(`/api/users/${userId}`);
  const data = await res.json();
  setUser(data);
}, [userId]);
```

Используйте правило ESLint `exhaustive-deps` из пакета `eslint-plugin-react-hooks` — оно автоматически предупреждает о пропущенных зависимостях.

### Ошибка 2: Объект или массив в зависимостях

Объекты и массивы создаются заново при каждом рендере, поэтому их не стоит включать в зависимости напрямую — функция будет пересоздаваться всегда.

```tsx
// НЕПРАВИЛЬНО: filters — новый объект при каждом рендере
const search = useCallback(() => {
  fetchResults(query, filters);
}, [query, filters]); // filters всегда "новый" объект

// ПРАВИЛЬНО: мемоизируем объект через useMemo
const memoFilters = useMemo(() => ({ category, minPrice, maxPrice }), [category, minPrice, maxPrice]);

const search = useCallback(() => {
  fetchResults(query, memoFilters);
}, [query, memoFilters]);
```

### Ошибка 3: useCallback для всего подряд

Мемоизация везде не делает приложение быстрее — она добавляет лишний код и усложняет читаемость.

```tsx
// Избыточно
const getTitle = useCallback(() => `Привет, ${name}`, [name]);
const isValid = useCallback(() => email.includes('@'), [email]);

// Правильно — простые вычисления не требуют мемоизации
const getTitle = () => `Привет, ${name}`;
const isValid = () => email.includes('@');
```

### Ошибка 4: Отсутствие функционального обновления state

Если функция внутри `useCallback` читает актуальное значение состояния, но состояние не указано в зависимостях, используйте функциональное обновление.

```tsx
// НЕПРАВИЛЬНО: count не указан в deps, но читается напрямую
const increment = useCallback(() => {
  setCount(count + 1); // устаревшее значение count!
}, []);

// ПРАВИЛЬНО: функциональное обновление не требует зависимости
const increment = useCallback(() => {
  setCount(prev => prev + 1); // всегда актуально
}, []);
```

## Заключение

`useCallback` — инструмент оптимизации для конкретных случаев, а не универсальное решение:

- Применяйте его, когда функция передаётся в `React.memo`-компоненты или используется как зависимость в `useEffect`, `useMemo`, `useCallback`.
- Всегда указывайте все используемые значения из области видимости компонента в массиве зависимостей.
- Используйте функциональное обновление состояния (`setCount(prev => prev + 1)`), чтобы не добавлять состояние в зависимости.
- Не применяйте `useCallback` для простых обработчиков событий, которые никуда не передаются.

Главное правило: сначала пишите простой код, затем измеряйте производительность с помощью React DevTools Profiler и добавляйте `useCallback` только там, где это реально устраняет проблему.

---
metaTitle: "Оптимизация рендеринга в React — полное руководство"
metaDescription: "Оптимизация рендеринга React: React.memo, useMemo, useCallback, lazy loading, Suspense, профилирование. Когда и как применять инструменты для ускорения компонентов."
author: "Олег Марков"
title: "Оптимизация рендеринга в React: от теории к глубокой практике"
preview: "Узнайте, как сделать ваши React-приложения быстрее. Разбираем мемоизацию, ленивую загрузку, новые хуки конкурентного режима (useTransition, useDeferredValue) и учимся находить узкие места с помощью Profiler."
---

# Оптимизация рендеринга в React

React рендерит компоненты повторно при изменении состояния или пропсов. В большинстве случаев это быстро, но некоторые компоненты требуют оптимизации. Рассмотрим полный арсенал инструментов.

## Когда нужна оптимизация

**Не оптимизируйте преждевременно!** Сначала измерьте производительность с помощью React DevTools Profiler, затем устраняйте конкретные проблемы.

Признаки проблем с рендерингом:
- Лаги при взаимодействии пользователя (> 16ms на кадр)
- Медленные большие списки (> 100 элементов)
- Тяжёлые вычисления в теле компонента
- Частые ненужные ре-рендеры дочерних компонентов

## React.memo — мемоизация компонента

`React.memo` — HOC, который пропускает ре-рендер компонента, если его пропсы не изменились (поверхностное сравнение):

```tsx
import { memo } from 'react';

interface ListItemProps {
  id: number;
  name: string;
  onClick: (id: number) => void;
}

// Без memo: рендерится при каждом ре-рендере родителя
// С memo: рендерится только при изменении name или onClick
const ListItem = memo(function ListItem({ id, name, onClick }: ListItemProps) {
  console.log('Рендер:', name);
  return <li onClick={() => onClick(id)}>{name}</li>;
});
```

```tsx
// Кастомная функция сравнения для сложных объектов
const ComplexItem = memo(
  function ComplexItem({ data }: { data: ComplexData }) {
    return <div>{data.value}</div>;
  },
  // Кастомное сравнение — рендерим только если value изменился
  (prevProps, nextProps) => prevProps.data.value === nextProps.data.value
);
```

## useMemo — мемоизация вычислений

`useMemo` кэширует результат дорогостоящих вычислений:

```tsx
import { useMemo } from 'react';

function ProductList({ products, filter, sortOrder }: Props) {
  // Без useMemo: фильтрация/сортировка при каждом рендере
  // С useMemo: пересчёт только при изменении зависимостей
  const processedProducts = useMemo(() => {
    return products
      .filter(p => p.category === filter)
      .sort((a, b) =>
        sortOrder === 'asc' ? a.price - b.price : b.price - a.price
      );
  }, [products, filter, sortOrder]);

  return (
    <ul>
      {processedProducts.map(p => (
        <li key={p.id}>{p.name} — {p.price}₽</li>
      ))}
    </ul>
  );
}
```

```tsx
// useMemo для стабилизации объекта-пропса
function Parent() {
  const [theme, setTheme] = useState('light');
  const [count, setCount] = useState(0);

  // Без useMemo: новый объект при каждом рендере → Child всегда ре-рендерится
  // С useMemo: тот же объект пока theme не изменится
  const themeConfig = useMemo(
    () => ({ color: theme === 'light' ? '#000' : '#fff', bg: theme }),
    [theme]
  );

  return (
    <>
      <Child config={themeConfig} />
      <button onClick={() => setCount(c => c + 1)}>Счёт: {count}</button>
    </>
  );
}
```

## useCallback — мемоизация функций

`useCallback` возвращает стабильную ссылку на функцию:

```tsx
import { useCallback, memo } from 'react';

// Child мемоизирован — ре-рендерится только при изменении пропсов
const Button = memo(function Button({ onClick, label }: ButtonProps) {
  console.log('Button рендер:', label);
  return <button onClick={onClick}>{label}</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // Без useCallback: новая функция при каждом рендере → Button всегда ре-рендерится
  // С useCallback: та же функция → Button пропускает ре-рендер
  const handleIncrement = useCallback(() => {
    setCount(c => c + 1);
  }, []); // Пустой массив — функция создаётся один раз

  return (
    <>
      <p>Счёт: {count}</p>
      <Button onClick={handleIncrement} label="+" />
    </>
  );
}
```

## Code Splitting с React.lazy и Suspense

Разбивайте бандл на части — загружайте компоненты только когда они нужны:

```tsx
import { lazy, Suspense } from 'react';

// Компонент загружается асинхронно при первом использовании
const HeavyChart = lazy(() => import('./HeavyChart'));
const AdminPanel = lazy(() => import('./AdminPanel'));

function Dashboard({ user }: { user: User }) {
  return (
    <div>
      <h1>Дашборд</h1>

      {/* Suspense показывает fallback пока компонент загружается */}
      <Suspense fallback={<div>Загрузка графика...</div>}>
        <HeavyChart data={user.stats} />
      </Suspense>

      {user.isAdmin && (
        <Suspense fallback={<div>Загрузка панели...</div>}>
          <AdminPanel userId={user.id} />
        </Suspense>
      )}
    </div>
  );
}
```

```tsx
// Роутинг с lazy loading
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const HomePage = lazy(() => import('@/pages/HomePage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  );
}
```

## useTransition — низкоприоритетные обновления

`useTransition` помечает обновления состояния как некритичные, не блокируя UI:

```tsx
import { useState, useTransition } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    setQuery(value); // Критичное обновление — сразу

    // Некритичное обновление — можно отложить
    startTransition(() => {
      setResults(searchDatabase(value)); // Тяжёлая операция
    });
  };

  return (
    <>
      <input value={query} onChange={e => handleSearch(e.target.value)} />
      {isPending ? (
        <div>Поиск...</div>
      ) : (
        <ResultsList results={results} />
      )}
    </>
  );
}
```

## useDeferredValue — отложенное значение

`useDeferredValue` откладывает обновление значения, позволяя UI оставаться отзывчивым:

```tsx
import { useState, useDeferredValue, memo } from 'react';

const ExpensiveList = memo(function ExpensiveList({ filter }: { filter: string }) {
  // Тяжёлая фильтрация большого списка
  const items = heavyFilter(ALL_ITEMS, filter);
  return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
});

function SearchInput() {
  const [filter, setFilter] = useState('');
  // deferredFilter обновляется после того как браузер обработал критичные обновления
  const deferredFilter = useDeferredValue(filter);

  const isStale = filter !== deferredFilter; // true пока не обновился deferredFilter

  return (
    <>
      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="Поиск..."
      />
      <div style={{ opacity: isStale ? 0.5 : 1 }}>
        <ExpensiveList filter={deferredFilter} />
      </div>
    </>
  );
}
```

## Профилирование с React DevTools

### React Profiler API

```tsx
import { Profiler } from 'react';

function onRenderCallback(
  id: string,           // Идентификатор дерева компонентов
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number, // Время рендера
  baseDuration: number,   // Ожидаемое время без мемоизации
  startTime: number,
  commitTime: number
) {
  if (actualDuration > 16) {
    console.warn(`Медленный рендер: ${id} — ${actualDuration.toFixed(2)}ms`);
  }
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <MainContent />
    </Profiler>
  );
}
```

### Инструменты измерения

```tsx
// Простое измерение времени рендера
function measureRender(ComponentToMeasure: React.ComponentType) {
  return function MeasuredComponent(props: any) {
    const start = performance.now();
    const result = <ComponentToMeasure {...props} />;
    const end = performance.now();
    console.log(`${ComponentToMeasure.name}: ${(end - start).toFixed(2)}ms`);
    return result;
  };
}
```

## Когда применять что

| Инструмент | Когда применять | Когда НЕ нужен |
|-----------|----------------|----------------|
| `React.memo` | Компонент часто ре-рендерится с теми же пропсами | Дешёвые компоненты, редкие ре-рендеры |
| `useMemo` | Тяжёлые вычисления (> 1ms), нужна стабильная ссылка | Простые операции, примитивные значения |
| `useCallback` | Функция передаётся в мемоизированный дочерний компонент | Функция не передаётся дочерним компонентам |
| `React.lazy` | Большие компоненты, редко используемые страницы | Маленькие компоненты, всегда нужные |
| `useTransition` | Тяжёлые обновления состояния, фильтрация данных | Лёгкие обновления UI |
| `useDeferredValue` | Производный тяжёлый рендер от быстро меняющегося значения | Критичные обновления |

## Антипаттерны оптимизации

```tsx
// ❌ useMemo для простых операций — накладные расходы мемоизации > выгоды
const doubled = useMemo(() => count * 2, [count]); // Избыточно!

// ✅ Просто вычислите значение
const doubled = count * 2;

// ❌ useCallback без мемоизированных дочерних компонентов — бесполезно
function Parent() {
  const handleClick = useCallback(() => {}, []); // Бесполезно если Child не memo
  return <Child onClick={handleClick} />; // Child не мемоизирован
}

// ❌ Преждевременная оптимизация без измерений
// Сначала измерьте! Оптимизация без данных — антипаттерн.
```

## Краткое резюме

| Концепция | Инструмент | Эффект |
|-----------|-----------|--------|
| Пропуск ре-рендера | `React.memo` | Не рендерить если пропсы не изменились |
| Кэш вычислений | `useMemo` | Не пересчитывать если зависимости не изменились |
| Стабильные функции | `useCallback` | Стабильная ссылка для передачи в дочерние |
| Отложенная загрузка | `React.lazy` | Уменьшение начального бандла |
| Некритичные обновления | `useTransition` | Неблокирующий UI при тяжёлых обновлениях |
| Откладывание значений | `useDeferredValue` | UI отзывчив пока обновляется тяжёлый список |

## Дополнительные материалы

- [React Docs — Rendering Performance](https://react.dev/learn/render-and-commit)
- [React Docs — useMemo](https://react.dev/reference/react/useMemo)
- [React Docs — useCallback](https://react.dev/reference/react/useCallback)
- [React Docs — memo](https://react.dev/reference/react/memo)
- [React Docs — useTransition](https://react.dev/reference/react/useTransition)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)

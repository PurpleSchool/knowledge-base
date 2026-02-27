---
metaTitle: "useMemo в React — мемоизация вычислений"
metaDescription: "Полное руководство по useMemo в React: синтаксис, принципы работы, практические примеры, сравнение с useCallback, TypeScript, оптимизация производительности и лучшие практики."
---

# useMemo — мемоизация вычислений в React

`useMemo` — это хук React, который позволяет мемоизировать результат вычислений, пересчитывая его только при изменении зависимостей. Это один из ключевых инструментов оптимизации производительности в React-приложениях.

## Проблема: лишние вычисления при рендеринге

Каждый раз, когда React перерисовывает компонент, весь код внутри него выполняется заново. В большинстве случаев это быстро и не вызывает проблем. Но если компонент содержит **тяжёлые вычисления**, они будут выполняться при каждом рендере — даже если входные данные не изменились.

```tsx
function ProductList({ products, filter, sortOrder }: Props) {
  // Эта функция вызывается при КАЖДОМ рендере компонента!
  const filteredAndSorted = products
    .filter(p => p.category === filter)
    .sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price);

  return <ul>{filteredAndSorted.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

Если `products` содержит тысячи элементов, а компонент ре-рендерится из-за несвязанного обновления состояния (например, изменения цвета темы), фильтрация и сортировка будут выполнены заново без всякой необходимости.

## Решение: useMemo

`useMemo` кэширует результат вычислений и возвращает его повторно, пока зависимости не изменились.

```tsx
import { useMemo } from 'react';

function ProductList({ products, filter, sortOrder }: Props) {
  const filteredAndSorted = useMemo(() => {
    return products
      .filter(p => p.category === filter)
      .sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price);
  }, [products, filter, sortOrder]); // Пересчёт только при изменении этих значений

  return <ul>{filteredAndSorted.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

Теперь фильтрация и сортировка выполняются только тогда, когда меняются `products`, `filter` или `sortOrder`.

## Синтаксис

```tsx
const memoizedValue = useMemo(
  () => computeExpensiveValue(a, b), // Функция-фабрика
  [a, b]                             // Массив зависимостей
);
```

- **Первый аргумент** — функция, возвращающая вычисляемое значение (не вызывается сразу, а передаётся как фабрика)
- **Второй аргумент** — массив зависимостей; при изменении любой из них функция вызывается заново
- **Возвращаемое значение** — мемоизированный результат

> ⚠️ Важно: `useMemo` выполняет функцию **во время рендеринга**. Не помещайте туда побочные эффекты — для этого используйте `useEffect`.

## Принцип работы

```
Первый рендер:
  useMemo(() => compute(a, b), [a, b])
  ↓ вычисляет compute(a, b) → результат кэшируется

Второй рендер (a и b не изменились):
  useMemo(() => compute(a, b), [a, b])
  ↓ зависимости совпадают → возвращает кэш (вычисление не происходит)

Третий рендер (a изменился):
  useMemo(() => compute(a, b), [a, b])
  ↓ зависимость изменилась → вычисляет заново, обновляет кэш
```

React сравнивает зависимости с помощью [`Object.is`](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Object/is) — того же алгоритма, что используется в `useState`.

## Практические примеры

### Пример 1: Тяжёлые математические вычисления

```tsx
import { useState, useMemo } from 'react';

function PrimeCalculator() {
  const [max, setMax] = useState(1000);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Вычисляется только при изменении max
  const primes = useMemo(() => {
    console.log('Вычисляю простые числа...');
    const result: number[] = [];
    for (let i = 2; i <= max; i++) {
      if (isPrime(i)) result.push(i);
    }
    return result;
  }, [max]);

  return (
    <div style={{ background: theme === 'dark' ? '#333' : '#fff' }}>
      <p>Простых чисел до {max}: {primes.length}</p>
      <input
        type="range"
        min={100}
        max={100000}
        value={max}
        onChange={e => setMax(Number(e.target.value))}
      />
      {/* Смена темы не вызывает пересчёт простых чисел */}
      <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
        Сменить тему
      </button>
      <p>Первые 10: {primes.slice(0, 10).join(', ')}</p>
    </div>
  );
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}
```

### Пример 2: Фильтрация и поиск по большому списку

```tsx
import { useState, useMemo } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  salary: number;
}

interface Props {
  users: User[];
}

function UserDirectory({ users }: Props) {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'salary'>('name');
  const [page, setPage] = useState(1);

  const departments = useMemo(() => {
    const unique = [...new Set(users.map(u => u.department))];
    return ['all', ...unique.sort()];
  }, [users]);

  const filteredUsers = useMemo(() => {
    let result = users;

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    if (department !== 'all') {
      result = result.filter(u => u.department === department);
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.salary - a.salary;
    });
  }, [users, search, department, sortBy]);

  const PAGE_SIZE = 20;

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);

  return (
    <div>
      <div className="controls">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Поиск по имени или email..."
        />
        <select
          value={department}
          onChange={e => { setDepartment(e.target.value); setPage(1); }}
        >
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'name' | 'salary')}>
          <option value="name">По имени</option>
          <option value="salary">По зарплате</option>
        </select>
      </div>

      <p>Найдено: {filteredUsers.length} пользователей</p>

      <ul>
        {paginatedUsers.map(user => (
          <li key={user.id}>
            <strong>{user.name}</strong> — {user.department} — {user.salary.toLocaleString()} ₽
          </li>
        ))}
      </ul>

      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => setPage(p)} disabled={p === page}>{p}</button>
        ))}
      </div>
    </div>
  );
}
```

### Пример 3: Стабильная ссылка на объект

Одно из неочевидных применений `useMemo` — создание **стабильных объектов** для передачи в дочерние компоненты или в массив зависимостей других хуков.

```tsx
import { useState, useMemo, useEffect } from 'react';

interface Config {
  endpoint: string;
  timeout: number;
  retries: number;
}

function DataFetcher({ userId }: { userId: number }) {
  const [retries, setRetries] = useState(3);

  // БЕЗ useMemo: новый объект config при каждом рендере
  // → useEffect срабатывает бесконечно!
  // const config = { endpoint: `/api/users/${userId}`, timeout: 5000, retries };

  // С useMemo: объект создаётся только при изменении userId или retries
  const config = useMemo<Config>(() => ({
    endpoint: `/api/users/${userId}`,
    timeout: 5000,
    retries,
  }), [userId, retries]);

  useEffect(() => {
    console.log('Загружаю данные с конфигом:', config);
    const controller = new AbortController();
    fetchWithConfig(config, controller.signal);
    return () => controller.abort();
  }, [config]); // Безопасно: config меняется только при реальных изменениях

  return (
    <div>
      <p>User ID: {userId}</p>
      <button onClick={() => setRetries(r => r + 1)}>
        Увеличить кол-во попыток ({retries})
      </button>
    </div>
  );
}

async function fetchWithConfig(config: Config, signal: AbortSignal) {
  // Логика загрузки данных...
}
```

### Пример 4: Вычисление статистики

```tsx
import { useMemo } from 'react';

interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

interface Props {
  transactions: Transaction[];
}

interface Stats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Record<string, number>;
  avgTransaction: number;
  maxExpense: number;
}

function FinanceDashboard({ transactions }: Props) {
  const stats = useMemo<Stats>(() => {
    if (transactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        byCategory: {},
        avgTransaction: 0,
        maxExpense: 0,
      };
    }

    let totalIncome = 0;
    let totalExpense = 0;
    const byCategory: Record<string, number> = {};
    let maxExpense = 0;

    for (const t of transactions) {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
        if (t.amount > maxExpense) maxExpense = t.amount;
      }

      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      byCategory,
      avgTransaction: (totalIncome + totalExpense) / transactions.length,
      maxExpense,
    };
  }, [transactions]);

  return (
    <div className="dashboard">
      <div className="summary">
        <div className="card income">
          <h3>Доходы</h3>
          <p>{stats.totalIncome.toLocaleString()} ₽</p>
        </div>
        <div className="card expense">
          <h3>Расходы</h3>
          <p>{stats.totalExpense.toLocaleString()} ₽</p>
        </div>
        <div className="card balance">
          <h3>Баланс</h3>
          <p style={{ color: stats.balance >= 0 ? 'green' : 'red' }}>
            {stats.balance.toLocaleString()} ₽
          </p>
        </div>
      </div>

      <div className="details">
        <p>Средняя транзакция: {stats.avgTransaction.toFixed(2)} ₽</p>
        <p>Максимальный расход: {stats.maxExpense.toLocaleString()} ₽</p>
      </div>

      <div className="by-category">
        <h3>По категориям</h3>
        {Object.entries(stats.byCategory)
          .sort(([, a], [, b]) => b - a)
          .map(([cat, sum]) => (
            <div key={cat}>
              <span>{cat}</span>
              <span>{sum.toLocaleString()} ₽</span>
            </div>
          ))}
      </div>
    </div>
  );
}
```

### Пример 5: Мемоизация с React.memo

`useMemo` особенно полезен в паре с `React.memo` — HOC, который предотвращает рендер дочернего компонента при неизменённых пропсах.

```tsx
import { useState, useMemo, memo } from 'react';

// Компонент обёрнут в memo — рендерится только при изменении пропсов
const ExpensiveChart = memo(function ExpensiveChart({
  data,
  title,
}: {
  data: number[];
  title: string;
}) {
  console.log('Рендер ExpensiveChart');
  // Представим, что здесь сложная визуализация
  return (
    <div>
      <h2>{title}</h2>
      <div className="chart">
        {data.map((v, i) => (
          <div key={i} className="bar" style={{ height: v }} />
        ))}
      </div>
    </div>
  );
});

function Dashboard() {
  const [count, setCount] = useState(0);
  const [multiplier, setMultiplier] = useState(1);

  // БЕЗ useMemo: новый массив при каждом рендере → memo бесполезен
  // const chartData = [10, 20, 30, 40, 50].map(v => v * multiplier);

  // С useMemo: массив стабилен → ExpensiveChart не ре-рендерится лишний раз
  const chartData = useMemo(
    () => [10, 20, 30, 40, 50].map(v => v * multiplier),
    [multiplier]
  );

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Счётчик: {count}
      </button>
      <input
        type="number"
        value={multiplier}
        onChange={e => setMultiplier(Number(e.target.value))}
      />
      {/* Не ре-рендерится при изменении count */}
      <ExpensiveChart data={chartData} title="Продажи" />
    </div>
  );
}
```

## useMemo vs useCallback

Это два похожих хука, которые часто путают:

| | `useMemo` | `useCallback` |
|---|---|---|
| **Мемоизирует** | Результат вычисления | Функцию |
| **Возвращает** | Любое значение | Функцию |
| **Когда использовать** | Дорогие вычисления, стабильные объекты | Коллбэки для дочерних компонентов |

```tsx
// useMemo — мемоизирует РЕЗУЛЬТАТ
const sortedList = useMemo(
  () => [...items].sort(compareFn),
  [items]
);

// useCallback — мемоизирует ФУНКЦИЮ
const handleSort = useCallback(
  (a: Item, b: Item) => a.name.localeCompare(b.name),
  []
);

// useCallback эквивалентен useMemo с функцией:
const handleSortWithMemo = useMemo(
  () => (a: Item, b: Item) => a.name.localeCompare(b.name),
  []
);
```

## TypeScript с useMemo

### Явная типизация

TypeScript обычно выводит тип автоматически, но явное указание помогает при сложных типах:

```tsx
interface ProcessedData {
  items: string[];
  total: number;
  metadata: Record<string, unknown>;
}

// Явный дженерик
const processed = useMemo<ProcessedData>(() => ({
  items: rawData.map(d => d.name),
  total: rawData.reduce((sum, d) => sum + d.value, 0),
  metadata: { processedAt: Date.now() },
}), [rawData]);

// TypeScript ругается, если тип не совпадает
const wrong = useMemo<ProcessedData>(() => ({
  items: [1, 2, 3], // ❌ Ошибка: number[] не соответствует string[]
  total: 0,
  metadata: {},
}), []);
```

### useMemo с дженериками

```tsx
function useFilteredData<T>(
  data: T[],
  predicate: (item: T) => boolean,
  deps: React.DependencyList
): T[] {
  return useMemo(() => data.filter(predicate), deps);
}

// Использование
const activeUsers = useFilteredData(
  users,
  user => user.isActive,
  [users]
);

const expensiveProducts = useFilteredData(
  products,
  product => product.price > 10000,
  [products]
);
```

### Строгая типизация зависимостей

```tsx
interface SearchOptions {
  query: string;
  filters: string[];
  limit: number;
}

function SearchResults({ options }: { options: SearchOptions }) {
  const results = useMemo(() => {
    return performSearch(options.query, options.filters, options.limit);
  }, [options.query, options.filters, options.limit]);
  // Не используйте просто [options] — объект создаётся заново при каждом рендере!

  return <ResultList items={results} />;
}
```

## Кастомные хуки с useMemo

### useSortedList

```tsx
import { useMemo } from 'react';

type SortDirection = 'asc' | 'desc';

function useSortedList<T>(
  list: T[],
  key: keyof T,
  direction: SortDirection = 'asc'
): T[] {
  return useMemo(() => {
    return [...list].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [list, key, direction]);
}

// Использование
function EmployeeList({ employees }: { employees: Employee[] }) {
  const [sortKey, setSortKey] = useState<keyof Employee>('name');
  const [direction, setDirection] = useState<SortDirection>('asc');

  const sorted = useSortedList(employees, sortKey, direction);

  return (
    <table>
      <thead>
        <tr>
          <th onClick={() => setSortKey('name')}>Имя</th>
          <th onClick={() => setSortKey('salary')}>Зарплата</th>
          <th onClick={() => setSortKey('department')}>Отдел</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map(e => (
          <tr key={e.id}>
            <td>{e.name}</td>
            <td>{e.salary}</td>
            <td>{e.department}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### useSearchFilter

```tsx
import { useState, useMemo } from 'react';

function useSearchFilter<T>(
  items: T[],
  searchKeys: (keyof T)[],
  initialQuery = ''
) {
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;

    const lower = query.toLowerCase();
    return items.filter(item =>
      searchKeys.some(key => {
        const value = item[key];
        return String(value).toLowerCase().includes(lower);
      })
    );
  }, [items, searchKeys, query]);

  return { query, setQuery, filtered, count: filtered.length };
}

// Использование
function ProductSearch({ products }: { products: Product[] }) {
  const { query, setQuery, filtered, count } = useSearchFilter(
    products,
    ['name', 'description', 'brand'],
  );

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Поиск товаров..."
      />
      <p>Найдено: {count}</p>
      <ProductGrid products={filtered} />
    </div>
  );
}
```

### useGroupBy

```tsx
import { useMemo } from 'react';

function useGroupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return useMemo(() => {
    return items.reduce((groups, item) => {
      const groupKey = String(item[key]);
      return {
        ...groups,
        [groupKey]: [...(groups[groupKey] ?? []), item],
      };
    }, {} as Record<string, T[]>);
  }, [items, key]);
}

// Использование
function OrdersView({ orders }: { orders: Order[] }) {
  const byStatus = useGroupBy(orders, 'status');

  return (
    <div>
      {Object.entries(byStatus).map(([status, group]) => (
        <section key={status}>
          <h2>{status} ({group.length})</h2>
          {group.map(order => <OrderCard key={order.id} order={order} />)}
        </section>
      ))}
    </div>
  );
}
```

## Распространённые ошибки

### 1. Мемоизация дешёвых вычислений

```tsx
// ❌ Избыточно — сложение двух чисел не нуждается в мемоизации
const sum = useMemo(() => a + b, [a, b]);

// ✅ Просто вычисляйте напрямую
const sum = a + b;
```

Накладные расходы на `useMemo` (создание замыкания, сравнение зависимостей) могут превысить экономию для простых вычислений.

### 2. Пустой массив зависимостей при использовании пропсов/состояния

```tsx
// ❌ Будет использовать начальные значения props.items навсегда!
const sorted = useMemo(
  () => [...props.items].sort(),
  [] // Пропущена зависимость!
);

// ✅ Правильно
const sorted = useMemo(
  () => [...props.items].sort(),
  [props.items]
);
```

Используйте плагин `eslint-plugin-react-hooks` — он предупредит о пропущенных зависимостях.

### 3. Объект в зависимостях

```tsx
// ❌ config — это новый объект при каждом рендере!
function Component({ config }: { config: Config }) {
  const result = useMemo(
    () => processData(config),
    [config] // Новый объект → useMemo пересчитывает каждый раз
  );
}

// ✅ Используйте примитивные значения
function Component({ config }: { config: Config }) {
  const result = useMemo(
    () => processData(config),
    [config.endpoint, config.timeout, config.retries] // Примитивы — сравниваются корректно
  );
}
```

### 4. Побочные эффекты внутри useMemo

```tsx
// ❌ useMemo не предназначен для побочных эффектов!
const data = useMemo(() => {
  fetch('/api/data').then(/* ... */); // ❌ Не делайте так
  localStorage.setItem('key', value); // ❌ И так тоже
  return computeSomething();
}, [value]);

// ✅ Для побочных эффектов используйте useEffect
useEffect(() => {
  fetch('/api/data').then(/* ... */);
}, [value]);

const data = useMemo(() => computeSomething(), [value]);
```

### 5. Ожидание, что React всегда сохраняет кэш

```tsx
// React может сбросить кэш useMemo по своему усмотрению
// (например, при Concurrent Mode или Offscreen API)
// Не полагайтесь на useMemo как на единственный источник истины

// ❌ Неправильно
const userId = useMemo(() => generateUniqueId(), []); // Может сброситься!

// ✅ Для значений, которые должны быть стабильны, используйте useRef или useState
const [userId] = useState(() => generateUniqueId());
```

## Когда использовать useMemo?

### ✅ Используйте useMemo

1. **Тяжёлые вычисления**: обход больших массивов, сложные алгоритмы, математические операции
2. **Стабильные объекты для дочерних компонентов**: чтобы `React.memo` работал корректно
3. **Стабильные объекты как зависимости**: чтобы избежать бесконечных циклов в `useEffect`/`useMemo`/`useCallback`
4. **Производные данные**: отфильтрованные списки, агрегированная статистика, вычисляемые свойства

### ❌ Не используйте useMemo

1. **Простые вычисления**: сложение, конкатенация строк, простые сравнения
2. **Значения-примитивы**: числа, строки, булевы значения — они сравниваются по значению
3. **Компоненты без `React.memo`**: мемоизация объектов для пропсов не поможет, если дочерний компонент не обёрнут
4. **Преждевременная оптимизация**: сначала измерьте, потом оптимизируйте

## Профилирование производительности

Прежде чем добавлять `useMemo`, убедитесь, что есть реальная проблема с производительностью:

```tsx
// Простой способ измерить время вычисления
const result = useMemo(() => {
  const start = performance.now();
  const computed = expensiveComputation(data);
  const end = performance.now();
  console.log(`Вычисление заняло: ${end - start}ms`);
  return computed;
}, [data]);
```

**Правило большого пальца**: если вычисление занимает меньше 1-2ms, `useMemo` скорее всего не нужен.

### React DevTools Profiler

1. Откройте React DevTools → вкладка "Profiler"
2. Запишите сессию взаимодействия
3. Найдите компоненты с долгим временем рендеринга
4. Проверьте, какие вычисления выполняются при каждом рендере

```tsx
// Добавьте displayName для удобства в DevTools
const MemoizedComponent = memo(function ExpensiveComponent(props: Props) {
  // ...
});
MemoizedComponent.displayName = 'ExpensiveComponent';
```

## useMemo в React 19

В React 19 появился **React Compiler** (бывший React Forget), который автоматически добавляет мемоизацию там, где это нужно. Если вы используете React 19 с включённым компилятором, необходимость ручного `useMemo` значительно снижается.

```tsx
// С React Compiler этот код оптимизируется автоматически
function ProductList({ products, filter }: Props) {
  // Компилятор сам решит, нужна ли мемоизация
  const filtered = products.filter(p => p.category === filter);
  return <ul>{filtered.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

Тем не менее понимание `useMemo` остаётся важным для работы со старыми кодовыми базами и для случаев, когда компилятор не может автоматически оптимизировать код.

## Сравнение с другими подходами к оптимизации

| Подход | Что делает | Когда использовать |
|--------|-----------|-------------------|
| `useMemo` | Мемоизирует результат вычислений | Дорогие вычисления в компоненте |
| `useCallback` | Мемоизирует функцию | Коллбэки для дочерних компонентов |
| `React.memo` | Пропускает рендер дочернего компонента | Когда пропсы редко меняются |
| `React.lazy` | Ленивая загрузка компонентов | Разделение бандла |
| `Virtualization` | Рендерит только видимые элементы | Очень большие списки |

## Часто задаваемые вопросы

**Можно ли использовать useMemo внутри условий или циклов?**

Нет. Как и все хуки, `useMemo` должен вызываться только на верхнем уровне компонента или кастомного хука — не внутри `if`, `for`, вложенных функций.

**useMemo гарантирует, что вычисление выполнится ровно один раз?**

Нет. React может сбросить кэш в режиме Strict Mode (в разработке), при Offscreen рендеринге или по другим внутренним причинам. `useMemo` — оптимизация, а не гарантия.

**Нужно ли мемоизировать все объекты, передаваемые в дочерние компоненты?**

Только если дочерний компонент обёрнут в `React.memo` и создание объекта происходит при каждом рендере. В остальных случаях это избыточно.

**В чём разница между useMemo и вынесением вычислений за пределы компонента?**

Если вычисление не зависит от пропсов/состояния, лучше вынести его за пределы компонента — оно выполнится один раз при загрузке модуля. `useMemo` нужен, когда результат зависит от данных компонента.

```tsx
// Если не зависит от компонента — выносим наружу
const CONSTANT_DATA = heavyComputation(staticInput);

function Component({ dynamicInput }: Props) {
  // Если зависит — используем useMemo
  const result = useMemo(() => heavyComputation(dynamicInput), [dynamicInput]);
  return <div>{result}</div>;
}
```

**Как правильно тестировать компоненты с useMemo?**

В тестах `useMemo` работает как обычно — мемоизирует при первом вызове, пересчитывает при изменении зависимостей. Никаких специальных настроек не нужно.

```tsx
// Тест компонента с useMemo
import { render } from '@testing-library/react';

test('пересчитывает только при изменении filter', () => {
  const computeFn = jest.fn(() => []);
  
  // Здесь useMemo работает как в реальном приложении
  const { rerender } = render(<FilteredList items={[]} filter="a" computeFn={computeFn} />);
  expect(computeFn).toHaveBeenCalledTimes(1);

  rerender(<FilteredList items={[]} filter="a" computeFn={computeFn} />);
  expect(computeFn).toHaveBeenCalledTimes(1); // Не пересчитывается

  rerender(<FilteredList items={[]} filter="b" computeFn={computeFn} />);
  expect(computeFn).toHaveBeenCalledTimes(2); // Пересчитывается
});
```

## Итог

`useMemo` — мощный инструмент оптимизации React-приложений, который помогает избежать лишних вычислений и создаёт стабильные ссылки на объекты. Ключевые моменты:

- **Мемоизирует результат**: функция пересчитывается только при изменении зависимостей
- **Не для побочных эффектов**: используйте `useEffect` для запросов, подписок, обновления DOM
- **Измеряйте перед оптимизацией**: добавляйте `useMemo` только там, где есть реальная проблема с производительностью
- **Работает с React.memo**: вместе они дают полный контроль над ре-рендерингом
- **React Compiler**: в React 19+ часть мемоизации выполняется автоматически

Используйте `useMemo` осознанно — избыточная мемоизация усложняет код без реальной пользы.

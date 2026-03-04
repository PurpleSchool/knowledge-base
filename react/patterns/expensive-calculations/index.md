---
metaTitle: "useMemo в React — мемоизация дорогих вычислений и оптимизация"
metaDescription: "Полное руководство по использованию хука useMemo для кэширования тяжелых операций: фильтрация больших списков, агрегация данных и сложные математические алгоритмы."
author: "Олег Марков"
title: "useMemo: как спасти производительность от тяжелых вычислений"
preview: "Разбираемся, когда вычисление становится действительно «дорогим» и как предотвратить лаги интерфейса при ре-рендерах. Узнайте, как использовать useMemo для подготовки данных графиков, фильтрации каталогов и обеспечения стабильных ссылок для React.memo."
---

# useMemo для дорогих вычислений в React

**Мемоизация дорогих вычислений** — паттерн оптимизации производительности React-компонентов, при котором результат тяжёлой операции кэшируется и пересчитывается только при реальном изменении входных данных. Реализуется через хук `useMemo` и позволяет избежать повторного выполнения затратных вычислений при каждом ре-рендере.

```tsx
import { useMemo } from 'react';

function AnalyticsDashboard({ orders }: { orders: Order[] }) {
  // Без useMemo: вычисляется при каждом рендере
  // const stats = computeStats(orders); // может занимать 50-200ms

  // С useMemo: пересчитывается только при изменении orders
  const stats = useMemo(() => computeStats(orders), [orders]);

  return <StatsView stats={stats} />;
}
```

## Проблема: тяжёлые вычисления в рендере

React пересчитывает компонент при каждом изменении состояния или пропсов — и это нормально. Проблема возникает, когда компонент выполняет **тяжёлые вычисления**, несвязанные с причиной ре-рендера.

```tsx
function ReportPage({ data, theme }: Props) {
  // ❌ Пересчитывается при каждом рендере — даже при смене темы!
  const report = data
    .flatMap(item => item.records)
    .filter(record => record.status === 'active')
    .reduce<Record<string, number>>((acc, record) => {
      acc[record.category] = (acc[record.category] ?? 0) + record.value;
      return acc;
    }, {});

  return (
    <div className={theme}>
      <ReportTable data={report} />
      <ThemeSwitcher />  {/* Смена темы не должна пересчитывать report */}
    </div>
  );
}
```

При 10 000 записях операция `flatMap + filter + reduce` может занимать **50–150 мс**. Пользователь почувствует «зависание» при каждом взаимодействии с интерфейсом — даже при смене темы или открытии модального окна.

## Решение: useMemo

`useMemo` кэширует результат и возвращает его повторно, пока зависимости не изменились:

```tsx
import { useMemo } from 'react';

function ReportPage({ data, theme }: Props) {
  // ✅ Пересчитывается только при изменении data
  const report = useMemo(() => {
    return data
      .flatMap(item => item.records)
      .filter(record => record.status === 'active')
      .reduce<Record<string, number>>((acc, record) => {
        acc[record.category] = (acc[record.category] ?? 0) + record.value;
        return acc;
      }, {});
  }, [data]); // Зависимость: только data

  return (
    <div className={theme}>
      <ReportTable data={report} />
      <ThemeSwitcher />  {/* Теперь не влияет на report */}
    </div>
  );
}
```

Теперь тяжёлое вычисление выполняется только при изменении `data`. Смена `theme` не затрагивает кэшированный результат.

## Как определить «дорогое» вычисление

Не каждое вычисление стоит мемоизировать. Используйте измерение:

```tsx
const result = useMemo(() => {
  const start = performance.now();
  const computed = heavyComputation(input);
  const elapsed = performance.now() - start;

  if (elapsed > 1) {
    console.warn(`[useMemo] Вычисление заняло ${elapsed.toFixed(2)}ms`);
  }

  return computed;
}, [input]);
```

**Практическое правило**: если вычисление занимает **более 1–2 мс** и компонент часто ре-рендерится, `useMemo` оправдан. Для простых операций (сложение, строковая конкатенация) накладные расходы хука превысят пользу.

| Время вычисления | Рекомендация |
|-----------------|--------------|
| < 0.1 мс | `useMemo` не нужен |
| 0.1–1 мс | Зависит от частоты ре-рендеров |
| > 1 мс | `useMemo` рекомендуется |
| > 10 мс | `useMemo` необходим, возможно вынести в Web Worker |

## Практические примеры

### Агрегация и статистика

```tsx
import { useMemo } from 'react';

interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

interface Stats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Record<string, number>;
  avgTransaction: number;
  maxExpense: number;
  topCategories: Array<{ name: string; total: number }>;
}

function FinanceDashboard({ transactions }: { transactions: Transaction[] }) {
  const stats = useMemo<Stats>(() => {
    if (transactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        byCategory: {},
        avgTransaction: 0,
        maxExpense: 0,
        topCategories: [],
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

    const topCategories = Object.entries(byCategory)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      byCategory,
      avgTransaction: (totalIncome + totalExpense) / transactions.length,
      maxExpense,
      topCategories,
    };
  }, [transactions]);

  return (
    <div className="dashboard">
      <div className="summary">
        <MetricCard label="Доходы" value={stats.totalIncome} color="green" />
        <MetricCard label="Расходы" value={stats.totalExpense} color="red" />
        <MetricCard
          label="Баланс"
          value={stats.balance}
          color={stats.balance >= 0 ? 'green' : 'red'}
        />
      </div>
      <TopCategoriesChart data={stats.topCategories} />
    </div>
  );
}
```

### Фильтрация и сортировка больших списков

```tsx
import { useState, useMemo } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  rating: number;
  inStock: boolean;
}

function ProductCatalog({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'name'>('name');

  // Список категорий — пересчитывается только при смене products
  const categories = useMemo(() => {
    const unique = [...new Set(products.map(p => p.category))];
    return ['all', ...unique.sort()];
  }, [products]);

  // Фильтрация — пересчитывается при изменении любого фильтра
  const filtered = useMemo(() => {
    let result = products;

    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lower));
    }

    if (category !== 'all') {
      result = result.filter(p => p.category === category);
    }

    if (minRating > 0) {
      result = result.filter(p => p.rating >= minRating);
    }

    if (onlyInStock) {
      result = result.filter(p => p.inStock);
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });
  }, [products, search, category, minRating, onlyInStock, sortBy]);

  return (
    <div>
      <div className="filters">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск..."
        />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <label>
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={e => setOnlyInStock(e.target.checked)}
          />
          Только в наличии
        </label>
      </div>
      <p>Найдено товаров: {filtered.length}</p>
      <ProductGrid products={filtered} />
    </div>
  );
}
```

### Математические и алгоритмические вычисления

```tsx
import { useState, useMemo } from 'react';

// Нахождение простых чисел (алгоритм «Решето Эратосфена»)
function sieve(limit: number): number[] {
  const isPrime = new Uint8Array(limit + 1).fill(1);
  isPrime[0] = isPrime[1] = 0;

  for (let i = 2; i * i <= limit; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j <= limit; j += i) {
        isPrime[j] = 0;
      }
    }
  }

  const primes: number[] = [];
  for (let i = 2; i <= limit; i++) {
    if (isPrime[i]) primes.push(i);
  }
  return primes;
}

function PrimeExplorer() {
  const [limit, setLimit] = useState(100_000);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Решето Эратосфена до 100 000 — ~5ms
  // Без useMemo: пересчитывалось бы при каждой смене темы
  const primes = useMemo(() => sieve(limit), [limit]);

  return (
    <div className={theme}>
      <div className="controls">
        <label>
          Предел:
          <input
            type="range"
            min={1000}
            max={1_000_000}
            step={1000}
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
          />
          {limit.toLocaleString()}
        </label>
        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
          Сменить тему {/* Не вызывает пересчёт! */}
        </button>
      </div>

      <div className="stats">
        <p>Простых чисел: <strong>{primes.length.toLocaleString()}</strong></p>
        <p>Первые 5: {primes.slice(0, 5).join(', ')}</p>
        <p>Последние 5: {primes.slice(-5).join(', ')}</p>
      </div>
    </div>
  );
}
```

### Трансформация данных для графиков

```tsx
import { useMemo } from 'react';

interface SalesRecord {
  date: string;  // 'YYYY-MM-DD'
  product: string;
  revenue: number;
  units: number;
  region: string;
}

interface ChartPoint {
  month: string;
  revenue: number;
  units: number;
}

function SalesChart({
  records,
  selectedRegion,
}: {
  records: SalesRecord[];
  selectedRegion: string;
}) {
  // Подготовка данных для графика — дорогая трансформация
  const chartData = useMemo((): ChartPoint[] => {
    const filtered = selectedRegion === 'all'
      ? records
      : records.filter(r => r.region === selectedRegion);

    const byMonth = filtered.reduce<Record<string, ChartPoint>>(
      (acc, record) => {
        const month = record.date.slice(0, 7); // 'YYYY-MM'

        if (!acc[month]) {
          acc[month] = { month, revenue: 0, units: 0 };
        }

        acc[month].revenue += record.revenue;
        acc[month].units += record.units;
        return acc;
      },
      {}
    );

    return Object.values(byMonth).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  }, [records, selectedRegion]);

  const totalRevenue = useMemo(
    () => chartData.reduce((sum, p) => sum + p.revenue, 0),
    [chartData]
  );

  return (
    <div>
      <p>Суммарная выручка: {totalRevenue.toLocaleString()} ₽</p>
      <LineChart data={chartData} xKey="month" yKey="revenue" />
    </div>
  );
}
```

## Цепочки зависимых вычислений

Когда одно мемоизированное значение зависит от другого, можно строить цепочки `useMemo`. React корректно отслеживает такие зависимости:

```tsx
import { useState, useMemo } from 'react';

function DataPipeline({ rawData }: { rawData: RawRecord[] }) {
  const [filter, setFilter] = useState('');
  const [groupBy, setGroupBy] = useState<'category' | 'region'>('category');
  const [top, setTop] = useState(10);

  // Шаг 1: парсинг и нормализация (зависит от rawData)
  const normalized = useMemo(
    () => rawData.map(normalizeRecord),
    [rawData]
  );

  // Шаг 2: фильтрация (зависит от normalized и filter)
  const filtered = useMemo(() => {
    if (!filter) return normalized;
    const lower = filter.toLowerCase();
    return normalized.filter(r => r.label.toLowerCase().includes(lower));
  }, [normalized, filter]);

  // Шаг 3: группировка (зависит от filtered и groupBy)
  const grouped = useMemo(
    () => groupRecords(filtered, groupBy),
    [filtered, groupBy]
  );

  // Шаг 4: топ-N (зависит от grouped и top)
  const topGroups = useMemo(
    () => grouped.slice(0, top),
    [grouped, top]
  );

  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Фильтр..." />
      <select value={groupBy} onChange={e => setGroupBy(e.target.value as typeof groupBy)}>
        <option value="category">По категории</option>
        <option value="region">По региону</option>
      </select>
      <GroupedTable data={topGroups} />
    </div>
  );
}
```

При изменении `filter` пересчитываются только шаги 2, 3 и 4. Шаг 1 (нормализация) остаётся кэшированным.

## Кастомные хуки для переиспользования

Паттерн мемоизации дорогих вычислений хорошо выносится в кастомные хуки:

### useExpensiveComputation

```tsx
import { useMemo, useRef } from 'react';

interface UseExpensiveComputationOptions<T, R> {
  data: T;
  compute: (data: T) => R;
  deps: React.DependencyList;
  /** Минимальное время (мс) для логирования в dev */
  warnThresholdMs?: number;
}

function useExpensiveComputation<T, R>({
  data,
  compute,
  deps,
  warnThresholdMs = 5,
}: UseExpensiveComputationOptions<T, R>): R {
  const computeRef = useRef(compute);
  computeRef.current = compute;

  return useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now();
      const result = computeRef.current(data);
      const elapsed = performance.now() - start;

      if (elapsed > warnThresholdMs) {
        console.warn(
          `[useExpensiveComputation] Вычисление заняло ${elapsed.toFixed(2)}ms`
        );
      }

      return result;
    }

    return computeRef.current(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Использование
function ReportWidget({ records }: { records: Record[] }) {
  const report = useExpensiveComputation({
    data: records,
    compute: buildReport,
    deps: [records],
    warnThresholdMs: 10,
  });

  return <ReportView report={report} />;
}
```

### useFilteredAndSorted

```tsx
import { useMemo } from 'react';

interface UseFilteredAndSortedOptions<T> {
  items: T[];
  filter?: (item: T) => boolean;
  sort?: (a: T, b: T) => number;
}

function useFilteredAndSorted<T>({
  items,
  filter,
  sort,
}: UseFilteredAndSortedOptions<T>): T[] {
  return useMemo(() => {
    let result = items;

    if (filter) {
      result = result.filter(filter);
    }

    if (sort) {
      result = [...result].sort(sort);
    }

    return result;
  }, [items, filter, sort]);
}

// Использование
function EmployeeTable({ employees }: { employees: Employee[] }) {
  const [showActive, setShowActive] = useState(true);
  const [sortAsc, setSortAsc] = useState(true);

  const activeFilter = useMemo(
    () => showActive ? (e: Employee) => e.isActive : undefined,
    [showActive]
  );

  const nameSort = useMemo(
    () => (a: Employee, b: Employee) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    [sortAsc]
  );

  const displayed = useFilteredAndSorted({
    items: employees,
    filter: activeFilter,
    sort: nameSort,
  });

  return <Table rows={displayed} />;
}
```

## Интеграция с React.memo

`useMemo` и `React.memo` — взаимодополняющий дуэт. `React.memo` предотвращает рендер дочернего компонента при неизменённых пропсах, а `useMemo` обеспечивает стабильность объектов и массивов в этих пропсах:

```tsx
import { useState, useMemo, memo } from 'react';

interface ChartProps {
  data: number[];
  labels: string[];
}

// React.memo: рендерится только при изменении data или labels
const ExpensiveChart = memo(function ExpensiveChart({ data, labels }: ChartProps) {
  console.log('Chart render');
  return (
    <svg>
      {data.map((value, i) => (
        <rect key={i} height={value} x={i * 30} y={0} width={20} />
      ))}
    </svg>
  );
});

function Dashboard({ rawSales }: { rawSales: SaleRecord[] }) {
  const [activeTab, setActiveTab] = useState('overview');

  // БЕЗ useMemo: новые массивы при каждом рендере → React.memo бесполезен
  // const chartData = rawSales.map(s => s.amount);
  // const chartLabels = rawSales.map(s => s.month);

  // С useMemo: стабильные ссылки → React.memo работает корректно
  const chartData = useMemo(
    () => rawSales.map(s => s.amount),
    [rawSales]
  );

  const chartLabels = useMemo(
    () => rawSales.map(s => s.month),
    [rawSales]
  );

  return (
    <div>
      {/* Смена вкладки не ре-рендерит ExpensiveChart */}
      <TabBar active={activeTab} onChange={setActiveTab} />
      <ExpensiveChart data={chartData} labels={chartLabels} />
    </div>
  );
}
```

## Когда вычисления слишком тяжёлые: Web Workers

Если вычисление занимает более **50–100 мс**, оно блокирует основной поток и делает интерфейс неотзывчивым. В таких случаях стоит вынести его в **Web Worker**:

```tsx
import { useState, useEffect, useRef } from 'react';

function useWorkerComputation<T, R>(
  workerFactory: () => Worker,
  input: T
): { result: R | null; loading: boolean } {
  const [result, setResult] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = workerFactory();

    workerRef.current.onmessage = (e: MessageEvent<R>) => {
      setResult(e.data);
      setLoading(false);
    };

    return () => workerRef.current?.terminate();
  }, [workerFactory]);

  useEffect(() => {
    if (!workerRef.current) return;
    setLoading(true);
    workerRef.current.postMessage(input);
  }, [input]);

  return { result, loading };
}

// heavy-computation.worker.ts
self.onmessage = (e) => {
  const result = runHeavyAlgorithm(e.data);
  self.postMessage(result);
};

// Использование
function BigDataProcessor({ dataset }: { dataset: DataPoint[] }) {
  const workerFactory = useCallback(
    () => new Worker(new URL('./heavy-computation.worker.ts', import.meta.url)),
    []
  );

  const { result, loading } = useWorkerComputation(workerFactory, dataset);

  if (loading) return <Spinner />;
  return <ResultView data={result} />;
}
```

`useMemo` идеален для вычислений **до ~50 мс**. Для более тяжёлых операций используйте Web Workers, чтобы не блокировать UI.

## Типичные ошибки

### Мемоизация простых операций

```tsx
// ❌ Избыточно: создание замыкания и сравнение зависимостей медленнее самого вычисления
const doubled = useMemo(() => count * 2, [count]);

// ✅ Вычисляйте напрямую
const doubled = count * 2;
```

### Пропущенные зависимости

```tsx
// ❌ Будет использовать устаревшие данные!
const filtered = useMemo(
  () => items.filter(i => i.type === selectedType),
  [items]  // Забыли selectedType!
);

// ✅ Правильно: все использованные переменные — в зависимостях
const filtered = useMemo(
  () => items.filter(i => i.type === selectedType),
  [items, selectedType]
);
```

Используйте ESLint-правило `react-hooks/exhaustive-deps` — оно автоматически выявляет пропущенные зависимости.

### Объект в зависимостях

```tsx
interface Config {
  pageSize: number;
  sortField: string;
}

// ❌ config — новый объект при каждом рендере, useMemo всегда пересчитывает
function Component({ config }: { config: Config }) {
  const result = useMemo(
    () => processData(config),
    [config]  // ← Новая ссылка каждый рендер!
  );
}

// ✅ Используйте примитивные поля объекта
function Component({ config }: { config: Config }) {
  const result = useMemo(
    () => processData(config),
    [config.pageSize, config.sortField]  // ← Сравниваются по значению
  );
}
```

### Побочные эффекты внутри useMemo

```tsx
// ❌ useMemo выполняется во время рендера — нельзя использовать для побочных эффектов
const data = useMemo(() => {
  fetch('/api/data').then(r => r.json()).then(setData);  // ❌
  localStorage.setItem('cache', JSON.stringify(result)); // ❌
  return computeSomething(input);
}, [input]);

// ✅ Побочные эффекты — только в useEffect
useEffect(() => {
  fetch('/api/data').then(r => r.json()).then(setData);
}, []);

const data = useMemo(() => computeSomething(input), [input]);
```

## React Compiler и будущее мемоизации

В React 19 появился **React Compiler** (ранее «React Forget»), который автоматически оптимизирует компоненты без ручных хуков:

```tsx
// До React Compiler — ручная мемоизация
function ProductList({ products, filter }: Props) {
  const filtered = useMemo(
    () => products.filter(p => p.category === filter),
    [products, filter]
  );
  return <ul>{filtered.map(p => <ProductItem key={p.id} product={p} />)}</ul>;
}

// С React Compiler — компилятор добавляет мемоизацию автоматически
function ProductList({ products, filter }: Props) {
  const filtered = products.filter(p => p.category === filter);
  return <ul>{filtered.map(p => <ProductItem key={p.id} product={p} />)}</ul>;
}
```

Тем не менее понимание паттерна мемоизации дорогих вычислений остаётся важным:
- Для работы с кодовыми базами на React 16–18
- Для случаев, которые компилятор не может автоматически оптимизировать
- Для понимания, **почему** компилятор делает именно такие оптимизации

## Сравнение с альтернативами

| Подход | Когда использовать |
|--------|-------------------|
| `useMemo` | Вычисления 1–50 мс, зависят от состояния/пропсов |
| Вынести за компонент | Вычисления без зависимости от состояния/пропсов |
| `useRef` | Вычислить один раз при монтировании, не вызывать ре-рендер |
| Web Worker | Вычисления > 50 мс, не должны блокировать UI |
| Серверная обработка | Огромные объёмы данных, чувствительные данные |

```tsx
// Вариант 1: useMemo — зависит от пропсов
function Component({ data }: Props) {
  const result = useMemo(() => processData(data), [data]);
}

// Вариант 2: за пределами компонента — не зависит от пропсов
const STATIC_RESULT = processData(STATIC_DATA);
function Component() {
  return <div>{STATIC_RESULT}</div>;
}

// Вариант 3: useRef — вычислить один раз при монтировании
function Component({ initialData }: Props) {
  const resultRef = useRef<ProcessedData | null>(null);
  if (resultRef.current === null) {
    resultRef.current = processData(initialData);
  }
  return <div>{resultRef.current}</div>;
}
```

## Итог

Мемоизация дорогих вычислений через `useMemo` — один из ключевых паттернов оптимизации React-приложений:

- **Кэширует результат**: функция пересчитывается только при изменении зависимостей
- **Изолирует тяжёлые операции**: фильтрация, сортировка, агрегация, математические алгоритмы
- **Работает в связке с React.memo**: обеспечивает стабильность ссылок для дочерних компонентов
- **Измеряйте перед применением**: `useMemo` оправдан при вычислениях > 1 мс
- **Следите за зависимостями**: используйте `eslint-plugin-react-hooks` для выявления пропущенных зависимостей
- **Для сверхтяжёлых операций**: рассмотрите Web Workers вместо `useMemo`

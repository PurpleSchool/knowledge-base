# Профилирование производительности в React

**Профилирование (Profiling)** — процесс измерения и анализа производительности приложения с целью выявления узких мест: медленных рендеров, лишних перерисовок, тяжёлых вычислений и утечек памяти. Без профилирования оптимизация превращается в угадывание — с профилированием вы точно знаете, **что** нужно ускорить и **насколько** это поможет.

```tsx
import { Profiler } from 'react';

function onRenderCallback(
  id: string,             // Имя компонента внутри <Profiler>
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number, // Время рендера (мс) с мемоизацией
  baseDuration: number,   // Время без мемоизации (эталон)
  startTime: number,      // Момент начала рендера
  commitTime: number,     // Момент применения изменений
) {
  console.log(`${id} [${phase}]: ${actualDuration.toFixed(2)}ms`);
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <HeavyComponent />
    </Profiler>
  );
}
```

## Зачем профилировать

Производительность React-приложения деградирует постепенно — один медленный компонент не заметен, но когда их накапливается десяток, пользователь начинает чувствовать «тормоза». Профилирование позволяет:

- **Найти конкретные компоненты**, которые рендерятся дольше 16 мс (порог 60 FPS)
- **Понять причину**: лишние ре-рендеры, тяжёлые вычисления в рендере, медленные эффекты
- **Измерить эффект оптимизации** — сравнить «до» и «после» применения `memo`, `useMemo`, `useCallback`
- **Предотвратить регрессии** — поймать замедление до попадания в продакшн

### Правило Парето в оптимизации

В большинстве приложений 20% компонентов создают 80% проблем с производительностью. Профилирование помогает найти эти 20% и не тратить время на остальные.

## React DevTools Profiler

React DevTools — основной инструмент профилирования React-приложений. Вкладка **Profiler** позволяет записать сессию взаимодействия и детально изучить каждый рендер.

### Установка

```bash
# Chrome: расширение React Developer Tools
# https://chrome.google.com/webstore/detail/react-developer-tools/

# Firefox: аналогичное расширение
# https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

# Standalone (для React Native, Electron и других сред)
npm install -g react-devtools
react-devtools
```

### Как пользоваться Profiler

1. Открыть DevTools → вкладка **Profiler**
2. Нажать кнопку **Record** (кружок)
3. Выполнить действие, которое кажется медленным (клик, ввод, переход)
4. Нажать **Stop**
5. Изучить результаты

### Режимы просмотра

**Flamegraph** — граф пламени показывает иерархию компонентов. Ширина блока — время рендера. Серые блоки — компоненты, которые не перерендеривались.

```
App (12ms)
├── Header (0.5ms) — серый, не менялся
├── Sidebar (0.3ms) — серый, не менялся
└── MainContent (11ms) ← УЗКОЕ МЕСТО
    ├── DataTable (8ms)
    │   ├── TableRow × 100 (7ms total)
    │   └── Pagination (0.4ms)
    └── FilterPanel (3ms)
```

**Ranked** — компоненты отсортированы по времени рендера. Удобно сразу увидеть самый медленный.

**Timeline** — хронологический вид всех коммитов в записанной сессии.

### Что означают цвета

| Цвет | Значение |
|------|----------|
| Серый | Компонент не рендерился в этот коммит |
| Зелёный | Быстрый рендер (< 2ms) |
| Жёлтый | Умеренный рендер (2–16ms) |
| Красный | Медленный рендер (> 16ms) — приоритет оптимизации |

### Причины ре-рендера

DevTools показывает, **почему** компонент перерендерился:

```
- Props changed: { value: 1 → 2 }
- State changed: count
- Parent re-rendered
- Hooks changed: useContext
```

Если видите "Parent re-rendered" у дочерних компонентов — кандидат для `React.memo`.

## React Profiler API

Встроенный компонент `<Profiler>` позволяет собирать метрики программно — полезно для логирования в продакшне или аналитики.

### Базовое использование

```tsx
import { Profiler, ProfilerOnRenderCallback } from 'react';

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime,
) => {
  // Логируем только медленные рендеры
  if (actualDuration > 16) {
    console.warn(`Медленный рендер: ${id} (${phase}) — ${actualDuration.toFixed(1)}ms`);

    // Или отправляем в систему мониторинга
    analytics.track('slow_render', {
      component: id,
      phase,
      duration: actualDuration,
      timestamp: commitTime,
    });
  }
};

function Dashboard() {
  return (
    <Profiler id="Dashboard" onRender={onRender}>
      <DashboardContent />
    </Profiler>
  );
}
```

### Вложенные Profiler

```tsx
function App() {
  return (
    <Profiler id="App" onRender={onRender}>
      <Header />
      <Profiler id="DataSection" onRender={onRender}>
        <DataTable rows={rows} />
        <Profiler id="Charts" onRender={onRender}>
          <SalesChart />
          <RevenueChart />
        </Profiler>
      </Profiler>
    </Profiler>
  );
}
```

### Мониторинг в продакшне

```tsx
// profiling.ts
interface RenderMetric {
  id: string;
  phase: string;
  actualDuration: number;
  baseDuration: number;
  timestamp: number;
}

const metricsBuffer: RenderMetric[] = [];

export const onRender: ProfilerOnRenderCallback = (
  id, phase, actualDuration, baseDuration, _startTime, commitTime
) => {
  metricsBuffer.push({ id, phase, actualDuration, baseDuration, timestamp: commitTime });

  // Отправляем батчами каждые 10 секунд
  if (metricsBuffer.length >= 50) {
    flushMetrics();
  }
};

async function flushMetrics() {
  const batch = metricsBuffer.splice(0);
  await fetch('/api/metrics/render', {
    method: 'POST',
    body: JSON.stringify({ metrics: batch }),
    headers: { 'Content-Type': 'application/json' },
  });
}

// Периодическая отправка
setInterval(flushMetrics, 10_000);
```

### Включение продакшн-профилирования

По умолчанию `<Profiler>` работает только в development-режиме. Для продакшна нужна специальная сборка:

```bash
# Create React App
REACT_APP_PROFILE=true react-scripts build

# Vite
npm run build -- --mode profiling

# vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: mode === 'profiling' ? {
      'react-dom/client': 'react-dom/profiling',
      'scheduler/tracing': 'scheduler/tracing-profiling',
    } : {},
  },
}));
```

## Выявление лишних ре-рендеров

Лишние ре-рендеры — самая частая причина торможения React-приложений. Компонент рендерится заново при каждом изменении пропсов или состояния родителя, даже если его собственные данные не изменились.

### Визуализация ре-рендеров

```tsx
// Простой хук для подсвечивания ре-рендеров в DEV-режиме
import { useRef, useEffect } from 'react';

function useRenderHighlight(componentName: string) {
  const renderCount = useRef(0);

  if (process.env.NODE_ENV === 'development') {
    renderCount.current += 1;
    console.log(`${componentName} renders: ${renderCount.current}`);
  }

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const el = document.querySelector(`[data-component="${componentName}"]`);
    if (!el) return;

    el.classList.add('dev-highlight');
    const timer = setTimeout(() => el.classList.remove('dev-highlight'), 300);
    return () => clearTimeout(timer);
  });
}

// CSS
// .dev-highlight { outline: 2px solid red !important; }

// Использование
function MyComponent({ value }: { value: number }) {
  useRenderHighlight('MyComponent');
  return <div data-component="MyComponent">{value}</div>;
}
```

### Пакет why-did-you-render

```bash
npm install @welldone-software/why-did-you-render --save-dev
```

```tsx
// wdyr.ts — подключается ДО React в index.tsx
import React from 'react';

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    // Только конкретные компоненты
    include: [/^DataTable/, /^Chart/],
    // Подробный лог изменений
    logOwnerReasons: true,
    collapseGroups: true,
  });
}
```

```tsx
// Маркировка компонента для отслеживания
function ExpensiveComponent({ data }: { data: DataType[] }) {
  return <div>{data.map(renderItem)}</div>;
}

// Статическое свойство активирует отслеживание
ExpensiveComponent.whyDidYouRender = true;

// Теперь в консоли будет:
// ExpensiveComponent re-rendered because props changed:
// { data: [Array(10)] !== [Array(10)] } ← разные ссылки, одинаковые данные
```

### Диагностика через React DevTools

В React DevTools включите **"Highlight updates when components render"** — компоненты будут подсвечиваться при каждом рендере. Компонент, мигающий при каждом нажатии клавиши в другом поле — лишний ре-рендер.

## Инструменты браузера

### Chrome DevTools Performance

Performance tab позволяет записать полную трассировку выполнения JavaScript.

**Как использовать:**
1. Открыть DevTools → Performance
2. Нажать Record
3. Выполнить медленное действие
4. Stop → изучить трассировку

**Что искать:**
- **Long Tasks** (красные блоки > 50ms) — блокируют главный поток
- **Layout Thrashing** — чередование read/write DOM-операций
- **Scripting** — время выполнения JS
- **Rendering** — время Style/Layout/Paint

```
Пример трассировки:
┌─────────────────────────────────────────────────────────┐
│ Task (245ms) ← Long Task! Блокирует браузер             │
│ ├── React (click handler) (12ms)                        │
│ ├── setState + re-render (180ms) ← ПРОБЛЕМА             │
│ │   ├── DataTable.render (120ms)                        │
│ │   │   └── 1000 × TableRow.render (0.12ms each)        │
│ │   └── commit DOM (60ms)                               │
│ └── Layout/Paint (53ms)                                 │
└─────────────────────────────────────────────────────────┘
```

### Flame Chart в Performance

Flame Chart показывает стек вызовов во времени. Длинные синие блоки — функции, занимающие много CPU.

```
// Типичный паттерн медленного рендера:
renderWithHooks           [──────────────────────] 150ms
  Component               [────────────────] 130ms
    expensiveCalculation  [──────────────] 120ms ← вынести в useMemo!
    createElement         [─] 10ms
```

### Lighthouse

```bash
# CLI
npm install -g lighthouse
lighthouse https://your-app.com --view

# Или через Chrome DevTools → Lighthouse tab
```

Ключевые метрики React-приложений:
- **FCP (First Contentful Paint)** — когда пользователь видит первый контент
- **LCP (Largest Contentful Paint)** — когда загружен главный контент (< 2.5s — хорошо)
- **TTI (Time to Interactive)** — когда приложение готово к взаимодействию
- **TBT (Total Blocking Time)** — суммарное время блокировки главного потока (< 300ms)

### Web Vitals в коде

```tsx
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

function sendToAnalytics({ name, value, id }: Metric) {
  fetch('/api/vitals', {
    method: 'POST',
    body: JSON.stringify({ name, value, id }),
    headers: { 'Content-Type': 'application/json' },
  });
}

// Измеряем все Core Web Vitals
onCLS(sendToAnalytics);    // Cumulative Layout Shift
onFCP(sendToAnalytics);    // First Contentful Paint
onLCP(sendToAnalytics);    // Largest Contentful Paint
onTTFB(sendToAnalytics);   // Time to First Byte
onINP(sendToAnalytics);    // Interaction to Next Paint (новая метрика)
```

## Профилирование рендера больших списков

Рендер сотен и тысяч элементов — распространённая причина торможения.

### Измерение времени рендера списка

```tsx
import { Profiler, memo } from 'react';

// Оборачиваем список в Profiler
function VirtualizedListDemo({ items }: { items: Item[] }) {
  return (
    <Profiler
      id="ItemList"
      onRender={(id, phase, duration) => {
        console.log(`List render (${items.length} items): ${duration.toFixed(2)}ms`);
      }}
    >
      <ItemList items={items} />
    </Profiler>
  );
}

// Мемоизация строки списка
const ItemRow = memo(function ItemRow({ item }: { item: Item }) {
  return (
    <div className="item-row">
      <span>{item.name}</span>
      <span>{item.value}</span>
    </div>
  );
});
```

### Виртуализация как решение

После профилирования и подтверждения проблемы — применяем виртуализацию:

```tsx
import { FixedSizeList } from 'react-window';

// Вместо рендера 10 000 строк — рендерим только видимые (~20)
function VirtualList({ items }: { items: Item[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <ItemRow item={items[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

## Профилирование хуков и контекста

### Измерение времени хука

```tsx
function useExpensiveData(input: string) {
  const startTime = performance.now();

  const result = useMemo(() => {
    return processData(input); // Тяжёлая операция
  }, [input]);

  const duration = performance.now() - startTime;
  if (duration > 5) {
    console.warn(`useExpensiveData: ${duration.toFixed(2)}ms для "${input}"`);
  }

  return result;
}
```

### Проблема переизбытка контекста

```tsx
// ❌ Антипаттерн: один большой контекст вызывает ре-рендер всех потребителей
const AppContext = createContext({
  user: null,
  theme: 'dark',
  cart: [],
  notifications: [],
  settings: {},
});

// При изменении cart — перерендерятся компоненты, которые читают только user

// ✅ Разделение контекстов по частоте изменений
const UserContext = createContext<User | null>(null);        // редко меняется
const ThemeContext = createContext<'dark' | 'light'>('dark'); // редко меняется
const CartContext = createContext<Cart>({ items: [] });       // часто меняется

// Теперь при добавлении в корзину — только CartContext потребители ре-рендерятся
```

### Измерение влияния контекста

```tsx
// Хук для измерения времени от изменения контекста до завершения рендера
function useContextPerformance<T>(context: React.Context<T>, name: string): T {
  const value = useContext(context);
  const renderStart = useRef(performance.now());

  useEffect(() => {
    const duration = performance.now() - renderStart.current;
    if (duration > 10) {
      console.log(`Context "${name}" update took: ${duration.toFixed(2)}ms`);
    }
  });

  renderStart.current = performance.now();
  return value;
}
```

## Performance API

`performance` — нативный браузерный API для точных измерений.

### Базовые измерения

```tsx
// Измерение времени функции
function measureTime<T>(name: string, fn: () => T): T {
  performance.mark(`${name}-start`);
  const result = fn();
  performance.mark(`${name}-end`);
  performance.measure(name, `${name}-start`, `${name}-end`);

  const measure = performance.getEntriesByName(name)[0];
  console.log(`${name}: ${measure.duration.toFixed(2)}ms`);

  return result;
}

// Использование
const result = measureTime('processLargeDataset', () => {
  return largeArray.filter(filterFn).map(transformFn).reduce(reduceFn, {});
});
```

### Custom Performance Marks в DevTools

```tsx
function handleSearch(query: string) {
  // Метки видны в Chrome DevTools Performance → Timings
  performance.mark('search-start');

  const filtered = filterData(query);
  performance.mark('filter-complete');
  performance.measure('filter-duration', 'search-start', 'filter-complete');

  setResults(filtered);
  performance.mark('state-updated');
  performance.measure('search-total', 'search-start', 'state-updated');
}
```

### React useTransition + профилирование

```tsx
import { useState, useTransition, startTransition } from 'react';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value); // Срочное обновление — мгновенно

    performance.mark('search-start');
    startTransition(() => {
      // Несрочное обновление — можно прерывать
      const filtered = heavyFilter(value);
      setResults(filtered);
      performance.mark('search-end');
      performance.measure('search', 'search-start', 'search-end');
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} placeholder="Поиск..." />
      {isPending && <span>Обновление...</span>}
      <ResultsList results={results} />
    </div>
  );
}
```

## Типичные паттерны оптимизации и их измерение

### React.memo — предотвращение лишних ре-рендеров

```tsx
// Перед оптимизацией: измеряем
const TableRow = ({ row }: { row: Row }) => {
  // Этот компонент рендерится при любом изменении родителя
  console.count('TableRow render');
  return <tr><td>{row.name}</td><td>{row.value}</td></tr>;
};

// После применения memo: сравниваем
const TableRowOptimized = memo(({ row }: { row: Row }) => {
  console.count('TableRowOptimized render');
  return <tr><td>{row.name}</td><td>{row.value}</td></tr>;
}, (prevProps, nextProps) => {
  // Кастомное сравнение — только если нужна не shallow-проверка
  return prevProps.row.id === nextProps.row.id &&
         prevProps.row.updatedAt === nextProps.row.updatedAt;
});
```

### useMemo — мемоизация тяжёлых вычислений

```tsx
function DataAnalysis({ rawData }: { rawData: DataPoint[] }) {
  // Измеряем исходное время вычисления
  const computeStart = performance.now();

  const processedData = useMemo(() => {
    const start = performance.now();

    const result = rawData
      .filter(point => point.value > 0)
      .map(point => ({ ...point, normalized: point.value / maxValue }))
      .sort((a, b) => b.normalized - a.normalized);

    console.log(`Data processing: ${(performance.now() - start).toFixed(2)}ms`);
    return result;
  }, [rawData]); // Пересчёт только при изменении rawData

  return <Chart data={processedData} />;
}
```

### useCallback — стабильные ссылки на функции

```tsx
function ParentList({ items }: { items: Item[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ❌ Новая ссылка при каждом рендере → дочерние с memo ре-рендерятся
  // const handleSelect = (id: string) => setSelectedId(id);

  // ✅ Стабильная ссылка → дочерние с memo НЕ ре-рендерятся
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []); // Пустой массив зависимостей — функция никогда не меняется

  return (
    <ul>
      {items.map(item => (
        <ListItem
          key={item.id}
          item={item}
          onSelect={handleSelect}
          isSelected={item.id === selectedId}
        />
      ))}
    </ul>
  );
}

const ListItem = memo(({ item, onSelect, isSelected }: ListItemProps) => {
  console.count(`ListItem ${item.id} render`);
  return (
    <li
      onClick={() => onSelect(item.id)}
      className={isSelected ? 'selected' : ''}
    >
      {item.name}
    </li>
  );
});
```

## Интерпретация результатов профилирования

### Как читать метрики

| Метрика | Значение | Что делать |
|---------|----------|------------|
| `actualDuration` > 16ms | Рендер медленнее 60 FPS | Оптимизировать компонент |
| `actualDuration` << `baseDuration` | Мемоизация работает | Всё хорошо |
| `actualDuration` ≈ `baseDuration` | Мемоизация не помогает | Проверить зависимости |
| Много коммитов за короткое время | Водопад обновлений | Батчинг или дебаунс |

### Практический чеклист

**Шаг 1: Установить базовую метрику**
```tsx
// Записать в DevTools Profiler и зафиксировать:
// - Самый медленный компонент (Ranked view)
// - Количество ре-рендеров при действии пользователя
// - Время до TTI в Lighthouse
```

**Шаг 2: Найти причину**
```tsx
// DevTools: кликнуть на медленный компонент → "Why did this render?"
// why-did-you-render: включить для подозрительных компонентов
// Console: добавить счётчики рендеров console.count()
```

**Шаг 3: Применить оптимизацию**
```tsx
// Лишние ре-рендеры → React.memo + useCallback
// Тяжёлые вычисления → useMemo
// Тяжёлые компоненты → lazy loading + Suspense
// Большие списки → react-window или react-virtualized
// Медленные эффекты → дебаунс или разбивка на startTransition
```

**Шаг 4: Измерить улучшение**
```tsx
// Повторить профилирование и сравнить:
const improvement = ((before - after) / before * 100).toFixed(0);
console.log(`Улучшение: ${improvement}% (${before}ms → ${after}ms)`);
```

### Антипаттерны оптимизации

```tsx
// ❌ Преждевременная оптимизация: memo для каждого компонента
// memo добавляет накладные расходы на сравнение пропсов
const SimpleParagraph = memo(({ text }: { text: string }) => (
  <p>{text}</p> // Рендерится < 0.1ms — memo не нужен
));

// ❌ useMemo для дешёвых вычислений
const sum = useMemo(() => a + b, [a, b]); // Накладные расходы > выигрыш

// ❌ Оптимизация без измерений
// "Кажется, этот компонент медленный" — всегда профилируй сначала

// ✅ Оптимизируй только то, что показало профилирование
```

## Инструменты для Node.js и SSR

### Node.js Profiler

```bash
# Встроенный профайлер Node.js
node --prof server.js

# Генерация читаемого отчёта
node --prof-process isolate-*.log > profile.txt

# Clinic.js — удобный инструмент с визуализацией
npm install -g clinic
clinic doctor -- node server.js
clinic flame -- node server.js   # Flame chart
clinic bubbleprof -- node server.js
```

### Профилирование Next.js SSR

```tsx
// middleware.ts или pages/api/*.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const start = Date.now();
  const response = NextResponse.next();

  response.headers.set('X-Response-Time', `${Date.now() - start}ms`);
  return response;
}

// Или в Server Component:
export default async function Page() {
  const mark = performance.mark('page-data-start');
  const data = await fetchData();

  performance.measure('page-data', 'page-data-start');
  const measure = performance.getEntriesByName('page-data')[0];
  console.log(`Data fetch: ${measure.duration.toFixed(0)}ms`);

  return <PageContent data={data} />;
}
```

## Связанные темы

- [Code Splitting в React](../code-splitting/index.md) — разбиение бандла на части
- [Ленивая загрузка компонентов](../lazy-loading/index.md) — React.lazy и Suspense
- [useMemo для дорогих вычислений](../expensive-calculations/index.md) — мемоизация вычислений

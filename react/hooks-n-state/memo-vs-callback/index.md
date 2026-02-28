# useMemo vs useCallback — полное сравнение

React предоставляет два хука для мемоизации: `useMemo` и `useCallback`. На первый взгляд они похожи, но решают разные задачи. В этой статье разберём ключевые отличия, типичные сценарии применения и антипаттерны.

## Что такое мемоизация

**Мемоизация** — техника оптимизации, при которой результат вычисления кэшируется и возвращается при повторном вызове с теми же аргументами, без повторного выполнения.

В React мемоизация помогает:
- Избежать дорогостоящих повторных вычислений
- Сохранять стабильные ссылки на функции и объекты
- Предотвращать лишние ре-рендеры дочерних компонентов

## useMemo

### Синтаксис

```tsx
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

### Что делает

`useMemo` **кэширует результат выполнения функции** (значение). При каждом рендере React проверяет зависимости: если они не изменились — возвращает закэшированное значение; если изменились — вызывает функцию заново.

### Пример: дорогостоящее вычисление

```tsx
import { useMemo, useState } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

function ProductList({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Без useMemo — пересчитывается при каждом рендере
  // const filteredProducts = products
  //   .filter(p => p.name.includes(filter))
  //   .sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price);

  // С useMemo — пересчитывается только при изменении products, filter или sortOrder
  const filteredProducts = useMemo(() => {
    console.log('Пересчёт фильтрованных продуктов...');
    return products
      .filter(p => p.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => sortOrder === 'asc' ? a.price - b.price : b.price - a.price);
  }, [products, filter, sortOrder]);

  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Поиск..." />
      <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
        Сортировка: {sortOrder}
      </button>
      <ul>
        {filteredProducts.map(p => (
          <li key={p.id}>{p.name} — {p.price} ₽</li>
        ))}
      </ul>
    </div>
  );
}
```

### Пример: стабильная ссылка на объект

```tsx
import { useMemo, useState } from 'react';

interface Config {
  theme: string;
  language: string;
}

function App() {
  const [theme, setTheme] = useState('dark');
  const [count, setCount] = useState(0);

  // Без useMemo — новый объект при каждом рендере (даже при изменении count)
  // const config = { theme, language: 'ru' };

  // С useMemo — стабильная ссылка, объект создаётся только при изменении theme
  const config = useMemo<Config>(() => ({ theme, language: 'ru' }), [theme]);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <ChildComponent config={config} />
    </div>
  );
}

// Если ChildComponent обёрнут в React.memo — он не будет ре-рендериться
// при изменении count, только при изменении config
const ChildComponent = React.memo(({ config }: { config: Config }) => {
  console.log('ChildComponent рендер');
  return <div>Тема: {config.theme}</div>;
});
```

## useCallback

### Синтаксис

```tsx
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

### Что делает

`useCallback` **кэширует саму функцию** (ссылку на неё). При рендере возвращает ту же функцию, пока зависимости не изменились. По сути, это синтаксический сахар над `useMemo`:

```tsx
// Эти две записи эквивалентны:
const memoizedCallback = useCallback(fn, deps);
const memoizedCallback = useMemo(() => fn, deps);
```

### Пример: передача колбэка в дочерний компонент

```tsx
import { useCallback, useState, memo } from 'react';

interface ButtonProps {
  onClick: () => void;
  label: string;
}

const ExpensiveButton = memo(({ onClick, label }: ButtonProps) => {
  console.log(`ExpensiveButton "${label}" рендер`);
  return <button onClick={onClick}>{label}</button>;
});

function TodoList() {
  const [todos, setTodos] = useState<string[]>([]);
  const [input, setInput] = useState('');

  // Без useCallback — новая функция при каждом рендере
  // ExpensiveButton будет ре-рендериться даже при изменении input
  // const handleAdd = () => setTodos(prev => [...prev, input]);

  // С useCallback — стабильная ссылка, ExpensiveButton не ре-рендерится при изменении input
  const handleAdd = useCallback(() => {
    setTodos(prev => [...prev, input]);
    setInput('');
  }, [input]); // input нужен в зависимостях

  const handleClear = useCallback(() => {
    setTodos([]);
  }, []); // Нет зависимостей — функция создаётся один раз

  return (
    <div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <ExpensiveButton onClick={handleAdd} label="Добавить" />
      <ExpensiveButton onClick={handleClear} label="Очистить" />
      <ul>
        {todos.map((todo, i) => <li key={i}>{todo}</li>)}
      </ul>
    </div>
  );
}
```

### Пример: useCallback в хуках

```tsx
import { useCallback, useEffect, useState } from 'react';

function useUserData(userId: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Стабильная ссылка на fetchUser — предотвращает лишние срабатывания useEffect
  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`);
      const json = await response.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [userId]); // Пересоздаётся только при смене userId

  useEffect(() => {
    fetchUser();
  }, [fetchUser]); // fetchUser стабилен — эффект не будет запускаться лишний раз

  return { data, loading, refetch: fetchUser };
}
```

## Ключевые отличия

| Характеристика | `useMemo` | `useCallback` |
|---|---|---|
| **Что кэширует** | Результат вычисления (значение) | Саму функцию (ссылку) |
| **Когда использовать** | Дорогие вычисления, стабильные объекты | Передача функций в `memo`-компоненты, зависимости хуков |
| **Возвращает** | Любое значение (число, строка, объект, массив) | Функцию |
| **Аналог** | — | `useMemo(() => fn, deps)` |

### Мнемоническое правило

- `useMemo` → **"вычисли и запомни результат"**
- `useCallback` → **"запомни саму функцию"**

## Когда применять

### useMemo стоит использовать когда:

1. **Вычисление действительно дорогостоящее** — фильтрация/сортировка больших массивов, сложные математические операции
2. **Нужна стабильная ссылка на объект/массив** — для передачи в `React.memo` компоненты или зависимости `useEffect`
3. **Результат используется как зависимость** в других хуках

```tsx
// ✅ Оправдано — дорогая обработка данных
const processedData = useMemo(() => {
  return rawData
    .filter(item => item.active)
    .map(item => transform(item))
    .reduce((acc, item) => ({ ...acc, [item.id]: item }), {});
}, [rawData]);

// ✅ Оправдано — стабильный объект для дочернего компонента
const contextValue = useMemo(() => ({
  user,
  permissions,
  logout
}), [user, permissions, logout]);
```

### useCallback стоит использовать когда:

1. **Функция передаётся в `React.memo` компонент** — иначе мемоизация бессмысленна
2. **Функция используется как зависимость** в `useEffect`, `useMemo`, другом `useCallback`
3. **Функция передаётся дочернему компоненту**, который сам использует её как зависимость

```tsx
// ✅ Оправдано — передача в memo-компонент
const handleSubmit = useCallback((data: FormData) => {
  onSubmit(data);
}, [onSubmit]);

// ✅ Оправдано — зависимость useEffect
const loadData = useCallback(async () => {
  const data = await api.fetch(id);
  setData(data);
}, [id]);

useEffect(() => { loadData(); }, [loadData]);
```

## Антипаттерны

### 1. Преждевременная оптимизация

```tsx
// ❌ Бессмысленно — простое вычисление, нет смысла мемоизировать
const doubled = useMemo(() => value * 2, [value]);

// ✅ Просто напишите:
const doubled = value * 2;
```

```tsx
// ❌ Бессмысленно — функция без зависимостей, которая нигде не передаётся в memo
const handleClick = useCallback(() => {
  console.log('click');
}, []);

// ✅ Просто:
const handleClick = () => console.log('click');
```

### 2. useCallback без React.memo на получателе

```tsx
// ❌ useCallback бесполезен, если Child не обёрнут в React.memo
const handleClick = useCallback(() => doSomething(), []);

function Child({ onClick }: { onClick: () => void }) {
  // Child ре-рендерится при каждом рендере родителя,
  // независимо от стабильности onClick
  return <button onClick={onClick}>Click</button>;
}
```

```tsx
// ✅ Сочетание useCallback + React.memo имеет смысл
const handleClick = useCallback(() => doSomething(), []);

const Child = React.memo(({ onClick }: { onClick: () => void }) => {
  return <button onClick={onClick}>Click</button>;
});
```

### 3. Упущенные зависимости

```tsx
// ❌ Пропущена зависимость — функция работает со "старым" userId
const fetchData = useCallback(async () => {
  const data = await api.get(userId); // userId используется, но не в deps!
  setData(data);
}, []); // Баг!

// ✅ Все зависимости указаны
const fetchData = useCallback(async () => {
  const data = await api.get(userId);
  setData(data);
}, [userId]);
```

### 4. Избыточные зависимости — используйте функциональное обновление

```tsx
// ❌ count в зависимостях — функция пересоздаётся при каждом изменении count
const increment = useCallback(() => {
  setCount(count + 1);
}, [count]);

// ✅ Функциональное обновление — нет зависимости от count
const increment = useCallback(() => {
  setCount(prev => prev + 1);
}, []); // Пустые deps — функция создаётся один раз
```

### 5. useMemo для всего подряд

```tsx
// ❌ Оверинжиниринг — useMemo само по себе стоит памяти и вычислений
const name = useMemo(() => user.firstName + ' ' + user.lastName, [user]);

// ✅ Это не нужно мемоизировать
const name = `${user.firstName} ${user.lastName}`;
```

## Практические примеры

### Пример 1: Оптимизация таблицы с большими данными

```tsx
import { useMemo, useCallback, useState, memo } from 'react';

interface Row {
  id: number;
  name: string;
  value: number;
  category: string;
}

interface TableRowProps {
  row: Row;
  onSelect: (id: number) => void;
  isSelected: boolean;
}

const TableRow = memo(({ row, onSelect, isSelected }: TableRowProps) => {
  console.log(`Row ${row.id} render`);
  return (
    <tr
      style={{ background: isSelected ? '#e0f0ff' : 'transparent' }}
      onClick={() => onSelect(row.id)}
    >
      <td>{row.name}</td>
      <td>{row.value}</td>
      <td>{row.category}</td>
    </tr>
  );
});

function DataTable({ rows }: { rows: Row[] }) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [category, setCategory] = useState('all');

  // useMemo: дорогая фильтрация и сортировка
  const filteredRows = useMemo(() => {
    return rows
      .filter(row => {
        const matchesSearch = row.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === 'all' || row.category === category;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.value - b.value);
  }, [rows, search, category]);

  // useMemo: список уникальных категорий
  const categories = useMemo(() => {
    return ['all', ...new Set(rows.map(r => r.category))];
  }, [rows]);

  // useCallback: стабильная функция для memo-компонента
  const handleSelect = useCallback((id: number) => {
    setSelectedId(prev => prev === id ? null : id);
  }, []);

  return (
    <div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..." />
      <select value={category} onChange={e => setCategory(e.target.value)}>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <table>
        <tbody>
          {filteredRows.map(row => (
            <TableRow
              key={row.id}
              row={row}
              onSelect={handleSelect}
              isSelected={row.id === selectedId}
            />
          ))}
        </tbody>
      </table>
      <p>Найдено: {filteredRows.length} строк</p>
    </div>
  );
}
```

### Пример 2: Кастомный хук с useCallback

```tsx
import { useState, useCallback } from 'react';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

function useApi<T>(url: string, options: UseApiOptions<T> = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { onSuccess, onError } = options;

  const execute = useCallback(async (body?: unknown) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result: T = await response.json();
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [url, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, execute, reset };
}

// Использование
function UserForm() {
  const { execute, loading, error } = useApi<{ id: number }>('/api/users');

  // useCallback здесь стабилизирует обработчик формы
  const handleSubmit = useCallback(async (formData: FormData) => {
    try {
      await execute({ name: formData.get('name') });
    } catch {
      // Ошибка уже в error из хука
    }
  }, [execute]);

  return (
    <form onSubmit={e => { e.preventDefault(); handleSubmit(new FormData(e.currentTarget)); }}>
      <input name="name" placeholder="Имя" />
      <button disabled={loading}>
        {loading ? 'Сохранение...' : 'Сохранить'}
      </button>
      {error && <p>{error.message}</p>}
    </form>
  );
}
```

### Пример 3: useMemo для сложных вычислений в аналитике

```tsx
import { useMemo } from 'react';

interface Transaction {
  date: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
}

function FinanceDashboard({ transactions }: { transactions: Transaction[] }) {
  // Агрегация по категориям
  const categoryStats = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (!acc[tx.category]) {
        acc[tx.category] = { income: 0, expense: 0 };
      }
      if (tx.type === 'income') {
        acc[tx.category].income += tx.amount;
      } else {
        acc[tx.category].expense += tx.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expense: number }>);
  }, [transactions]);

  // Вычисление баланса
  const balance = useMemo(() => {
    return transactions.reduce((sum, tx) => {
      return tx.type === 'income' ? sum + tx.amount : sum - tx.amount;
    }, 0);
  }, [transactions]);

  // Топ-5 категорий по расходам
  const topExpenseCategories = useMemo(() => {
    return Object.entries(categoryStats)
      .sort(([, a], [, b]) => b.expense - a.expense)
      .slice(0, 5)
      .map(([category, stats]) => ({ category, ...stats }));
  }, [categoryStats]);

  return (
    <div>
      <h2>Баланс: {balance} ₽</h2>
      <h3>Топ расходов по категориям:</h3>
      <ul>
        {topExpenseCategories.map(({ category, expense }) => (
          <li key={category}>{category}: {expense} ₽</li>
        ))}
      </ul>
    </div>
  );
}
```

## React Compiler (React 19+)

С выходом **React Compiler** в React 19 необходимость вручную расставлять `useMemo` и `useCallback` значительно снижается. Компилятор автоматически анализирует код и добавляет мемоизацию там, где это необходимо.

```tsx
// До React Compiler — нужно вручную
function Component({ items, onSelect }: Props) {
  const filtered = useMemo(() => items.filter(i => i.active), [items]);
  const handleSelect = useCallback((id: number) => onSelect(id), [onSelect]);
  return <List items={filtered} onSelect={handleSelect} />;
}

// С React Compiler — компилятор сам добавит мемоизацию
function Component({ items, onSelect }: Props) {
  const filtered = items.filter(i => i.active);
  const handleSelect = (id: number) => onSelect(id);
  return <List items={filtered} onSelect={handleSelect} />;
}
```

### Когда всё ещё нужна ручная мемоизация в React 19:

1. Проект **ещё не обновлён** до React 19 / Compiler не включён
2. Работа с **внешними библиотеками**, которые React Compiler не анализирует
3. Явный **контроль над зависимостями** при сложной логике
4. Код в **хуках** с нестандартными паттернами

## Профилирование и измерение

Прежде чем мемоизировать — **измеряйте**. `useMemo` и `useCallback` сами стоят ресурсов (память для хранения кэша, время на сравнение зависимостей).

### React DevTools Profiler

```tsx
// Оберните приложение в Profiler для измерения
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
) {
  console.log(`${id} [${phase}]: actual=${actualDuration}ms base=${baseDuration}ms`);
}

function App() {
  return (
    <Profiler id="ProductList" onRender={onRenderCallback}>
      <ProductList products={products} />
    </Profiler>
  );
}
```

### Ручное измерение

```tsx
const memoizedValue = useMemo(() => {
  const start = performance.now();
  const result = expensiveComputation(data);
  console.log(`Вычисление заняло: ${performance.now() - start}ms`);
  return result;
}, [data]);
```

### Практическое правило

Мемоизация оправдана, если:
- Вычисление занимает **> 1ms** (измеряйте!)
- Функция передаётся в компонент с **`React.memo`**
- Функция используется как **зависимость хука**

## Итоги

| Сценарий | Решение |
|---|---|
| Тяжёлые вычисления (фильтрация, сортировка большого массива) | `useMemo` |
| Стабильный объект/массив для дочернего компонента | `useMemo` |
| Стабильный объект как зависимость хука | `useMemo` |
| Функция передаётся в `React.memo` компонент | `useCallback` |
| Функция является зависимостью `useEffect` / `useMemo` | `useCallback` |
| Простые inline-функции и вычисления | Ничего не нужно |
| React 19 + Compiler | Обычно ничего не нужно |

**Главный принцип**: мемоизируйте только то, что реально требует оптимизации. Измеряйте с помощью React DevTools Profiler, применяйте `useMemo` и `useCallback` прицельно — и ваш код останется читаемым и производительным.

## Дополнительные материалы

- [React документация: useMemo](https://react.dev/reference/react/useMemo)
- [React документация: useCallback](https://react.dev/reference/react/useCallback)
- [React Compiler](https://react.dev/learn/react-compiler)
- [When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback) — Kent C. Dodds

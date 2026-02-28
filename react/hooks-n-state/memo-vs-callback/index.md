# useMemo vs useCallback в React

`useMemo` и `useCallback` — хуки оптимизации в React, которые предотвращают лишние вычисления и рендеры через мемоизацию. Они похожи, но служат разным целям.

## Основная разница

```
useMemo    → мемоизирует РЕЗУЛЬТАТ вычисления (значение)
useCallback → мемоизирует ФУНКЦИЮ (ссылку на функцию)
```

По сути, `useCallback(fn, deps)` — это сокращение для `useMemo(() => fn, deps)`.

## useMemo

`useMemo` кэширует результат вызова функции и пересчитывает его только при изменении зависимостей.

```jsx
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

### Когда использовать useMemo

#### 1. Дорогостоящие вычисления

```jsx
function DataAnalytics({ transactions }) {
  // ✅ Пересчитывается только при изменении transactions
  const statistics = useMemo(() => {
    console.log('Calculating statistics...');

    return {
      total: transactions.reduce((sum, t) => sum + t.amount, 0),
      average: transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length,
      max: Math.max(...transactions.map(t => t.amount)),
      min: Math.min(...transactions.map(t => t.amount)),
      byCategory: transactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [transactions]);

  return (
    <div>
      <p>Итого: {statistics.total}</p>
      <p>Среднее: {statistics.average.toFixed(2)}</p>
    </div>
  );
}
```

#### 2. Стабильная ссылка на объект для дочернего компонента

```jsx
function ParentComponent({ userId, theme }) {
  // ❌ Без useMemo: новый объект при каждом рендере Parent
  const config = { userId, theme, timestamp: Date.now() };

  // ✅ С useMemo: тот же объект, если userId и theme не изменились
  const config = useMemo(
    () => ({ userId, theme, timestamp: Date.now() }),
    [userId, theme]
  );

  return <ExpensiveChild config={config} />;
}

const ExpensiveChild = React.memo(({ config }) => {
  // Перерендерится только если config изменился по ссылке
  console.log('ExpensiveChild render');
  return <div>{config.userId}</div>;
});
```

#### 3. Фильтрация и сортировка списков

```jsx
function ProductCatalog({ products, searchQuery, sortBy, filterCategory }) {
  const processedProducts = useMemo(() => {
    let result = [...products];

    // Фильтрация
    if (filterCategory !== 'all') {
      result = result.filter(p => p.category === filterCategory);
    }

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    // Сортировка
    result.sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [products, searchQuery, sortBy, filterCategory]);

  return <ProductList products={processedProducts} />;
}
```

## useCallback

`useCallback` кэширует **ссылку на функцию** и создаёт новую функцию только при изменении зависимостей.

```jsx
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

### Когда использовать useCallback

#### 1. Передача функций в мемоизированные дочерние компоненты

```jsx
function TodoList({ todos }) {
  const [filter, setFilter] = useState('all');

  // ❌ Без useCallback: новая функция при каждом рендере TodoList
  const handleToggle = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  // ✅ С useCallback: та же функция, если зависимости не изменились
  const handleToggle = useCallback((id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }, []); // Нет зависимостей — функциональное обновление setState

  return todos.map(todo => (
    <TodoItem
      key={todo.id}
      todo={todo}
      onToggle={handleToggle}
    />
  ));
}

const TodoItem = React.memo(({ todo, onToggle }) => {
  console.log('TodoItem render:', todo.id);
  return (
    <li onClick={() => onToggle(todo.id)}>
      {todo.text}
    </li>
  );
});
```

#### 2. Зависимость в useEffect

```jsx
function SearchComponent({ query }) {
  const [results, setResults] = useState([]);

  // ✅ useCallback: стабильная ссылка для useEffect
  const performSearch = useCallback(async (searchQuery) => {
    const data = await api.search(searchQuery);
    setResults(data);
  }, []); // Функция не зависит от внешних переменных

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]); // performSearch стабильна — нет лишних вызовов

  return <ResultsList results={results} />;
}
```

#### 3. Event handlers с зависимостями

```jsx
function Form({ onSubmit, userId }) {
  const [data, setData] = useState({ name: '', email: '' });

  // ✅ useCallback: пересоздаётся только при изменении onSubmit или userId
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({ ...data, userId });
    },
    [data, onSubmit, userId]
  );

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

## Сравнительная таблица

| | useMemo | useCallback |
|--|---------|-------------|
| Мемоизирует | Результат вычисления | Ссылку на функцию |
| Возвращает | Любое значение | Функцию |
| Синтаксис | `useMemo(() => value, deps)` | `useCallback(fn, deps)` |
| Типичное применение | Дорогие вычисления, объекты | Обработчики событий, колбэки |
| Эквивалент | — | `useMemo(() => fn, deps)` |

## Когда НЕ использовать мемоизацию

Мемоизация имеет стоимость: память для хранения кэша и сравнение зависимостей. Не стоит её применять везде.

```jsx
// ❌ Избыточная мемоизация — примитивное значение
const doubledCount = useMemo(() => count * 2, [count]);
// Проще написать: const doubledCount = count * 2;

// ❌ Избыточная мемоизация — дешёвая операция
const greeting = useMemo(() => `Hello, ${name}!`, [name]);
// Проще написать: const greeting = `Hello, ${name}!`;

// ❌ Избыточная мемоизация — компонент всё равно рендерится
function Component() {
  // Если Parent рендерится, Child тоже рендерится
  // useCallback не поможет без React.memo на дочернем компоненте
  const handleClick = useCallback(() => console.log('click'), []);
  return <SimpleChild onClick={handleClick} />; // Без React.memo — бесполезно
}

// ✅ Когда useCallback полезен — с React.memo
const MemoizedChild = React.memo(SimpleChild);
function Component() {
  const handleClick = useCallback(() => console.log('click'), []);
  return <MemoizedChild onClick={handleClick} />; // Теперь работает!
}
```

## Практический пример: поисковый компонент

```typescript
interface SearchProps {
  items: Product[];
  onSelect: (product: Product) => void;
}

function ProductSearch({ items, onSelect }: SearchProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  // useMemo: фильтрация и поиск — потенциально дорогая операция
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesQuery = query
        ? item.name.toLowerCase().includes(query.toLowerCase())
        : true;
      const matchesCategory =
        category === 'all' || item.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [items, query, category]);

  // useCallback: стабильный обработчик для мемоизированного дочернего компонента
  const handleSelect = useCallback(
    (product: Product) => {
      onSelect(product);
    },
    [onSelect]
  );

  // useCallback: обработчик изменения запроса
  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    []
  );

  return (
    <div>
      <input
        value={query}
        onChange={handleQueryChange}
        placeholder="Поиск..."
      />
      <CategoryFilter value={category} onChange={setCategory} />
      <ProductGrid items={filteredItems} onSelect={handleSelect} />
    </div>
  );
}
```

## React Compiler и будущее мемоизации

React 19 представил **React Compiler** (ранее React Forget), который автоматически добавляет мемоизацию там, где это нужно. С его использованием ручное применение `useMemo` и `useCallback` становится менее необходимым.

```jsx
// С React Compiler: можно писать простой код
// Компилятор сам добавит useMemo/useCallback где нужно
function Component({ data, onUpdate }) {
  const processed = processData(data); // Компилятор мемоизирует если нужно
  const handleClick = () => onUpdate(processed); // Компилятор мемоизирует если нужно
  return <Child data={processed} onClick={handleClick} />;
}
```

## Правило выбора

```
Мемоизирую вычисление (число, объект, массив)?
  └── useMemo

Мемоизирую функцию (обработчик событий, колбэк)?
  └── useCallback

Простое значение или операция — нужна ли мемоизация?
  └── Скорее всего НЕТ. Начни без неё и профилируй.
```

## Профилирование с React DevTools

Перед оптимизацией убедись, что проблема действительно есть:

```jsx
// Оберни в Profiler для измерения
import { Profiler } from 'react';

function App() {
  const onRender = (id, phase, actualDuration) => {
    console.log(`${id} (${phase}): ${actualDuration}ms`);
  };

  return (
    <Profiler id="ProductCatalog" onRender={onRender}>
      <ProductCatalog {...props} />
    </Profiler>
  );
}
```

## Резюме

- **`useMemo`** — для мемоизации значений: дорогих вычислений, объектов с стабильной ссылкой
- **`useCallback`** — для мемоизации функций: передаваемых в `React.memo`-компоненты или используемых в зависимостях `useEffect`
- Не мемоизируй всё подряд — сначала профилируй, потом оптимизируй
- React Compiler в React 19 автоматизирует большую часть этой работы

## Дополнительные ресурсы

- [useMemo — React Docs](https://react.dev/reference/react/useMemo)
- [useCallback — React Docs](https://react.dev/reference/react/useCallback)
- [When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
- [React Compiler](https://react.dev/learn/react-compiler)

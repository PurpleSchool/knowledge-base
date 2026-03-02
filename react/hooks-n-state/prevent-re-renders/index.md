---
metaTitle: "Предотвращение лишних ре-рендеров в React"
metaDescription: "Как избежать лишних ре-рендеров в React: React.memo, useCallback, useMemo, стабилизация пропсов, правильная структура состояния и антипаттерны."
---

# Предотвращение лишних ре-рендеров

React автоматически ре-рендерит компонент при изменении его state или пропсов, а также при ре-рендере родителя. Понимание когда и почему происходят ре-рендеры — ключ к оптимизации.

## Почему происходят ре-рендеры

```
Причины ре-рендера:
1. Изменилось состояние компонента (setState)
2. Изменились пропсы компонента
3. Ре-рендерился родительский компонент
4. Изменился контекст (useContext)
```

```tsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>+{count}</button>
      {/* Child ре-рендерится при КАЖДОМ нажатии, хотя его пропсы не меняются */}
      <Child name="Алиса" />
    </div>
  );
}

function Child({ name }: { name: string }) {
  console.log('Child ре-рендер'); // Выводится каждый раз!
  return <div>Привет, {name}</div>;
}
```

## React.memo — остановить ре-рендер от родителя

`React.memo` запоминает результат рендера и пропускает повторный рендер если пропсы не изменились:

```tsx
import { memo, useState } from 'react';

// ✅ Child ре-рендерится только при изменении name
const Child = memo(function Child({ name }: { name: string }) {
  console.log('Child ре-рендер');
  return <div>Привет, {name}</div>;
});

function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>+{count}</button>
      <Child name="Алиса" /> {/* Не ре-рендерится при изменении count */}
    </div>
  );
}
```

### Почему React.memo не всегда помогает

Проблема возникает когда пропс — это объект или функция, создающиеся заново при каждом рендере родителя:

```tsx
function Parent() {
  const [count, setCount] = useState(0);

  // ❌ Новый объект при каждом рендере — Child всегда ре-рендерится!
  const config = { theme: 'dark', size: 'lg' };

  // ❌ Новая функция при каждом рендере — Child всегда ре-рендерится!
  const handleClick = () => console.log('click');

  return <MemoizedChild config={config} onClick={handleClick} />;
}
```

## useCallback — стабилизация функций

```tsx
import { useCallback, memo, useState } from 'react';

const Button = memo(function Button({
  onClick,
  label
}: {
  onClick: () => void;
  label: string;
}) {
  console.log('Button ре-рендер:', label);
  return <button onClick={onClick}>{label}</button>;
});

function TodoList() {
  const [todos, setTodos] = useState<string[]>([]);
  const [input, setInput] = useState('');

  // ✅ Стабильная функция — Button не ре-рендерится без нужды
  const handleAdd = useCallback(() => {
    setTodos(prev => [...prev, input]);
    setInput('');
  }, [input]); // Обновляется только при изменении input

  // ✅ Функция с updater — без зависимостей
  const handleClear = useCallback(() => {
    setTodos([]);
  }, []); // Создаётся один раз

  return (
    <>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <Button onClick={handleAdd} label="Добавить" />
      <Button onClick={handleClear} label="Очистить" />
      <ul>{todos.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </>
  );
}
```

## useMemo — стабилизация объектов и значений

```tsx
import { useMemo, memo } from 'react';

interface ChartProps {
  config: { theme: string; showGrid: boolean };
  data: number[];
}

const Chart = memo(function Chart({ config, data }: ChartProps) {
  console.log('Chart ре-рендер');
  return <div>График: {JSON.stringify(config)}</div>;
});

function Dashboard() {
  const [theme, setTheme] = useState('dark');
  const [count, setCount] = useState(0);

  // ✅ Стабильный объект — Chart не ре-рендерится при изменении count
  const chartConfig = useMemo(
    () => ({ theme, showGrid: true }),
    [theme] // Пересоздаётся только при изменении theme
  );

  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>Счётчик: {count}</button>
      <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
        Тема: {theme}
      </button>
      <Chart config={chartConfig} data={[1, 2, 3]} />
    </>
  );
}
```

## Структура состояния для предотвращения ре-рендеров

### Разнесение состояния (State Splitting)

```tsx
// ❌ Плохо — всё в одном компоненте, любое изменение ре-рендерит весь список
function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <>
      <FilterInput value={filter} onChange={setFilter} />
      {/* Весь список ре-рендерится при изменении selectedId */}
      <ItemList items={items} filter={filter} selectedId={selectedId} onSelect={setSelectedId} />
    </>
  );
}

// ✅ Хорошо — состояние выбора изолировано в отдельном компоненте
function ItemList({ items, filter }: { items: Item[]; filter: string }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const filtered = useMemo(
    () => items.filter(i => i.name.includes(filter)),
    [items, filter]
  );

  return (
    <ul>
      {filtered.map(item => (
        <Item
          key={item.id}
          item={item}
          isSelected={item.id === selectedId}
          onSelect={setSelectedId}
        />
      ))}
    </ul>
  );
}
```

### Вынесение состояния вниз (State Down)

```tsx
// ❌ Плохо — состояние формы в родителе вызывает ре-рендер всего дерева
function Page() {
  const [inputValue, setInputValue] = useState(''); // Меняется при каждом нажатии клавиши

  return (
    <div>
      <ExpensiveComponent />   {/* Ре-рендерится при каждом нажатии клавиши! */}
      <AnotherExpensiveComponent />
      <input value={inputValue} onChange={e => setInputValue(e.target.value)} />
    </div>
  );
}

// ✅ Хорошо — состояние формы вынесено в отдельный компонент
function SearchInput() {
  const [inputValue, setInputValue] = useState(''); // Изолированное состояние
  return (
    <input value={inputValue} onChange={e => setInputValue(e.target.value)} />
  );
}

function Page() {
  return (
    <div>
      <ExpensiveComponent />  {/* Не ре-рендерится при вводе в поле */}
      <AnotherExpensiveComponent />
      <SearchInput />         {/* Только этот компонент обновляется */}
    </div>
  );
}
```

### Паттерн: children для изоляции

```tsx
// ✅ Хорошо — children не ре-рендерится при изменении состояния родителя
function ColorPicker({ children }: { children: React.ReactNode }) {
  const [color, setColor] = useState('blue');

  return (
    <div style={{ background: color }}>
      <button onClick={() => setColor('red')}>Красный</button>
      <button onClick={() => setColor('blue')}>Синий</button>
      {/* children не ре-рендерится при изменении color! */}
      {children}
    </div>
  );
}

function App() {
  return (
    <ColorPicker>
      <ExpensiveComponent />  {/* Не ре-рендерится при смене цвета */}
    </ColorPicker>
  );
}
```

## Контекст и ре-рендеры

Каждый компонент, использующий `useContext`, ре-рендерится при изменении значения контекста:

```tsx
// ❌ Плохо — любое изменение темы ре-рендерит всё приложение через один контекст
const AppContext = createContext({ theme: 'light', user: null, count: 0 });

// ✅ Хорошо — разделить контексты по частоте изменений
const ThemeContext = createContext<'light' | 'dark'>('light');
const UserContext = createContext<User | null>(null);
const CountContext = createContext(0);

// ✅ Хорошо — использовать контекст-селектор паттерн
// Компонент ре-рендерится только если нужное значение изменилось
function ThemeButton() {
  const theme = useContext(ThemeContext); // Только тема, не весь контекст
  return <button className={`btn-${theme}`}>Кнопка</button>;
}
```

## Отладка ненужных ре-рендеров

```tsx
// Хук для визуализации ре-рендеров в development
function useRenderCount(componentName: string) {
  const renderCount = useRef(0);
  renderCount.current++;

  if (process.env.NODE_ENV === 'development') {
    console.log(`${componentName} ре-рендер #${renderCount.current}`);
  }
}

function MyComponent() {
  useRenderCount('MyComponent');
  return <div>Контент</div>;
}
```

```tsx
// Проверка что изменило пропсы (для отладки)
function useWhyDidYouUpdate(name: string, props: Record<string, unknown>) {
  const prevProps = useRef<Record<string, unknown>>({});

  useEffect(() => {
    const changedProps = Object.entries(props).reduce((acc, [key, value]) => {
      if (prevProps.current[key] !== value) {
        acc[key] = { before: prevProps.current[key], after: value };
      }
      return acc;
    }, {} as Record<string, unknown>);

    if (Object.keys(changedProps).length > 0) {
      console.log('[why-did-you-update]', name, changedProps);
    }

    prevProps.current = props;
  });
}
```

## Чеклист для предотвращения лишних ре-рендеров

| Проблема | Решение |
|----------|---------|
| Дочерний компонент ре-рендерится с родителем | `React.memo` |
| Функция-пропс создаётся заново | `useCallback` |
| Объект/массив-пропс создаётся заново | `useMemo` |
| Состояние не влияет на часть дерева | Вынести состояние вниз (State Down) |
| Все дочерние ре-рендерятся при изменении | Использовать `children` паттерн |
| Контекст вызывает массовые ре-рендеры | Разделить контексты, изолировать |
| Тяжёлые вычисления в рендере | `useMemo` для кэширования |

## Краткое резюме

| Инструмент | Что предотвращает |
|-----------|------------------|
| `React.memo` | Ре-рендер от родителя при неизменных пропсах |
| `useCallback` | Создание новой функции при каждом рендере |
| `useMemo` | Создание нового объекта/вычисление при каждом рендере |
| State splitting | Ре-рендер несвязанных частей UI |
| `children` паттерн | Ре-рендер children при изменении состояния родителя |
| Разделение контекста | Массовые ре-рендеры от одного контекста |

## Дополнительные материалы

- [React Docs — Skipping re-renders with memo](https://react.dev/reference/react/memo)
- [React Docs — useCallback](https://react.dev/reference/react/useCallback)
- [React Docs — useMemo](https://react.dev/reference/react/useMemo)
- [Блог: Before you memo()](https://overreacted.io/before-you-memo/)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)

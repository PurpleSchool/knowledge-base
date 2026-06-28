---
metaTitle: "React Compiler: автоматическая мемоизация компонентов"
metaDescription: "Как React Compiler автоматически мемоизирует компоненты и хуки, заменяя useMemo и useCallback. Установка, настройка и практические примеры."
author: "Антон Ларичев"
title: "React Compiler: автоматическая мемоизация"
preview: "React Compiler автоматически оптимизирует компоненты на этапе сборки, избавляя от ручного использования useMemo, useCallback и memo."
---

## Что такое React Compiler

React Compiler — инструмент от команды Meta, который оптимизирует React-приложения на этапе сборки без изменения исходного кода. Он статически анализирует JSX и JavaScript, строит граф зависимостей и автоматически добавляет мемоизацию там, где она нужна.

До появления компилятора разработчики вручную оборачивали значения в `useMemo`, функции в `useCallback`, а компоненты в `memo`. Это требовало постоянного внимания к массивам зависимостей и легко приводило к ошибкам. React Compiler берёт эту задачу на себя.

Компилятор стал стабильным в React 19, однако экспериментальную версию можно подключить к проектам на React 17 и 18 через отдельный пакет `react-compiler-runtime`.

## Проблема ручной мемоизации

Рассмотрим компонент без компилятора. Чтобы избежать лишних перерисовок, нужно три слоя защиты:

```tsx
import { useMemo, useCallback, memo } from 'react';

interface User {
  id: number;
  name: string;
  age: number;
}

interface UserProfileProps {
  user: User;
  onUpdate: (id: number) => void;
}

const UserProfile = memo(({ user, onUpdate }: UserProfileProps) => {
  const formattedName = useMemo(() => {
    return user.name.toUpperCase();
  }, [user.name]);

  const handleClick = useCallback(() => {
    onUpdate(user.id);
  }, [onUpdate, user.id]);

  return (
    <div>
      <p>{formattedName}</p>
      <button onClick={handleClick}>Обновить</button>
    </div>
  );
});
```

Если забыть обновить массив зависимостей при изменении логики — появятся баги. Если добавить лишние зависимости — оптимизация перестаёт работать.

С React Compiler тот же результат достигается чистым кодом:

```tsx
interface User {
  id: number;
  name: string;
  age: number;
}

interface UserProfileProps {
  user: User;
  onUpdate: (id: number) => void;
}

function UserProfile({ user, onUpdate }: UserProfileProps) {
  const formattedName = user.name.toUpperCase();

  const handleClick = () => {
    onUpdate(user.id);
  };

  return (
    <div>
      <p>{formattedName}</p>
      <button onClick={handleClick}>Обновить</button>
    </div>
  );
}
```

Компилятор сам определит зависимости и сгенерирует оптимизированный код.

## Установка и настройка

### Установка пакетов

Для React 19:

```bash
npm install -D babel-plugin-react-compiler
```

Для React 17/18 дополнительно нужен runtime:

```bash
npm install -D babel-plugin-react-compiler@beta
npm install react-compiler-runtime@beta
```

### Настройка с Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
});
```

### Настройка с Next.js

В Next.js 15+ компилятор встроен:

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    reactCompiler: true,
  },
};

module.exports = nextConfig;
```

### Настройка с Webpack

```javascript
// babel.config.js
module.exports = {
  plugins: ['babel-plugin-react-compiler'],
};
```

## Как работает компилятор

React Compiler анализирует код на уровне AST и для каждого выражения строит граф зависимостей. Затем генерирует оптимизированный вариант с внутренним кешированием.

### Анализ зависимостей

```typescript
function ProductCard({ product, discount }) {
  // finalPrice зависит от product.price и discount
  const finalPrice = product.price * (1 - discount);

  // label зависит только от product.name
  const label = `Товар: ${product.name}`;

  return (
    <div>
      <span>{label}</span>
      <span>{finalPrice}₽</span>
    </div>
  );
}
```

### Генерация кода с кешированием

Компилятор не использует обычные `useMemo` и `useCallback` — вместо них он генерирует вызовы внутреннего хука `useMemoCache`, который работает эффективнее с памятью. В упрощённом виде скомпилированный код выглядит так:

```javascript
// Псевдокод того, что генерирует компилятор
function ProductCard({ product, discount }) {
  const $ = useMemoCache(4);

  let finalPrice;
  if ($[0] !== product.price || $[1] !== discount) {
    finalPrice = product.price * (1 - discount);
    $[0] = product.price;
    $[1] = discount;
    $[2] = finalPrice;
  } else {
    finalPrice = $[2];
  }

  let label;
  if ($[3] !== product.name) {
    label = `Товар: ${product.name}`;
    $[3] = product.name;
  }

  return (
    <div>
      <span>{label}</span>
      <span>{finalPrice}₽</span>
    </div>
  );
}
```

Каждая ячейка кеша хранит предыдущее значение зависимости. При рендере компилятор сравнивает текущие значения с кешированными и пересчитывает результат только при изменении.

## Правила React как основа компилятора

Компилятор работает только с кодом, который соблюдает правила React. Главное из них — чистота компонентов и хуков: никаких побочных эффектов при рендере.

### Чистые компоненты

```typescript
// Хорошо — компилятор оптимизирует
function Counter({ count }: { count: number }) {
  return <div>Счётчик: {count}</div>;
}

// Плохо — мутация внешней переменной при рендере
let renderCount = 0;
function BadCounter({ count }: { count: number }) {
  renderCount++; // побочный эффект, компилятор пропустит этот компонент
  return <div>Счётчик: {count}</div>;
}
```

### Иммутабельность данных

```typescript
// Хорошо — создаём новый массив
function TodoList({ todos }: { todos: string[] }) {
  const sorted = [...todos].sort();
  return <ul>{sorted.map(todo => <li key={todo}>{todo}</li>)}</ul>;
}

// Плохо — мутация входного массива
function BadTodoList({ todos }: { todos: string[] }) {
  todos.sort(); // компилятор не будет оптимизировать
  return <ul>{todos.map(todo => <li key={todo}>{todo}</li>)}</ul>;
}
```

## Директива "use no memo"

Если нужно отключить оптимизацию для конкретного компонента, используется директива `"use no memo"`:

```typescript
function DebugComponent({ value }: { value: number }) {
  "use no memo";

  console.log('Рендер с value:', value);
  return <div>{value}</div>;
}
```

Это полезно при отладке, когда нужно убедиться, что компонент рендерится на каждое изменение без вмешательства компилятора.

## Практические примеры

### Списки с фильтрацией и сортировкой

Один из самых частых кандидатов на мемоизацию — фильтрация и сортировка массивов:

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface ProductListProps {
  products: Product[];
  category: string;
  sortBy: 'name' | 'price';
}

function ProductList({ products, category, sortBy }: ProductListProps) {
  const filtered = products
    .filter(p => p.category === category)
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.price - b.price;
    });

  return (
    <ul>
      {filtered.map(product => (
        <ProductItem key={product.id} product={product} />
      ))}
    </ul>
  );
}
```

Компилятор определит, что `filtered` зависит от `products`, `category` и `sortBy`, и будет пересчитывать его только при их изменении.

### Обработчики событий в списках

```typescript
interface TaskListProps {
  tasks: Array<{ id: number; title: string; done: boolean }>;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

function TaskList({ tasks, onToggle, onDelete }: TaskListProps) {
  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>
          <span style={{ textDecoration: task.done ? 'line-through' : 'none' }}>
            {task.title}
          </span>
          <button onClick={() => onToggle(task.id)}>
            {task.done ? 'Отменить' : 'Выполнить'}
          </button>
          <button onClick={() => onDelete(task.id)}>Удалить</button>
        </li>
      ))}
    </ul>
  );
}
```

Компилятор мемоизирует стрелочные функции внутри `map` с учётом `task.id`, `onToggle` и `onDelete` как зависимостей.

### Компонент с цепочкой вычислений

```typescript
interface SalesData {
  month: string;
  revenue: number;
  expenses: number;
}

interface SalesDashboardProps {
  data: SalesData[];
  taxRate: number;
}

function SalesDashboard({ data, taxRate }: SalesDashboardProps) {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
  const profit = totalRevenue - totalExpenses;
  const taxAmount = profit * taxRate;
  const netProfit = profit - taxAmount;

  const bestMonth = data.reduce(
    (best, item) => (item.revenue > best.revenue ? item : best),
    data[0]
  );

  return (
    <div>
      <p>Выручка: {totalRevenue.toLocaleString('ru-RU')}₽</p>
      <p>Расходы: {totalExpenses.toLocaleString('ru-RU')}₽</p>
      <p>Прибыль до налогов: {profit.toLocaleString('ru-RU')}₽</p>
      <p>Налог ({(taxRate * 100).toFixed(0)}%): {taxAmount.toLocaleString('ru-RU')}₽</p>
      <p>Чистая прибыль: {netProfit.toLocaleString('ru-RU')}₽</p>
      <p>Лучший месяц: {bestMonth?.month}</p>
    </div>
  );
}
```

Вся цепочка вычислений будет пересчитана только при изменении `data` или `taxRate`.

## Совместимость с существующим кодом

### Что делать с имеющимися useMemo и useCallback

Компилятор не ломает существующую мемоизацию. `useMemo` и `useCallback` продолжат работать, компилятор учтёт их. Однако постепенно стоит убирать ручную мемоизацию там, где компилятор справляется сам — это упрощает код.

Плагин `eslint-plugin-react-compiler` подскажет, где правила React нарушены:

```bash
npm install -D eslint-plugin-react-compiler
```

```javascript
// eslint.config.js
import reactCompiler from 'eslint-plugin-react-compiler';

export default [
  {
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },
];
```

### Режим постепенного внедрения

Если не весь код проекта соответствует правилам React, можно включить компилятор только для аннотированных компонентов:

```javascript
// next.config.js
const nextConfig = {
  experimental: {
    reactCompiler: {
      compilationMode: 'annotation',
    },
  },
};
```

В этом режиме компилятор обрабатывает только компоненты с явной директивой `"use memo"`:

```typescript
function OptimizedComponent({ value }: { value: number }) {
  "use memo";

  const computed = value * 2;
  return <div>{computed}</div>;
}
```

Это позволяет внедрять компилятор постепенно, не требуя одновременного исправления всего кода.

## Ограничения компилятора

Существуют ситуации, когда компилятор не может оптимизировать код.

**Прямые мутации состояния:**

```typescript
// Компилятор пропустит этот компонент
function BadComponent() {
  const [items, setItems] = useState<string[]>([]);

  const addItem = (item: string) => {
    items.push(item); // нарушение: прямая мутация state
    setItems(items);
  };

  return <div>{items.join(', ')}</div>;
}
```

**Условные вызовы хуков:**

```typescript
// Нарушение правил хуков — компилятор пропустит
function ConditionalHook({ flag }: { flag: boolean }) {
  if (flag) {
    const [value] = useState(0); // хук внутри условия
    return <div>{value}</div>;
  }
  return null;
}
```

**Сложные динамические паттерны:**

```typescript
// Динамические ключи объектов сложно анализировать статически
function DynamicKeys({ key, value }: { key: string; value: string }) {
  const obj = { [key]: value };
  return <div>{obj[key]}</div>;
}
```

## Проверка работы компилятора

React DevTools поддерживает визуализацию оптимизаций компилятора. Компоненты, обработанные компилятором, отображаются со значком "Memo" в дереве компонентов.

Для предварительной оценки проекта используется инструмент `react-compiler-healthcheck`:

```bash
npx react-compiler-healthcheck@beta
```

Он выводит процент компонентов, готовых к оптимизации, и список мест, требующих исправления. Типичный вывод для здорового кода:

```
Found 87 components
  Successfully compiled: 79 (91%)
  Failed to compile: 8 (9%)
    - src/legacy/OldList.tsx: mutation of props
    - src/utils/BadHook.ts: conditional hook call
```

По мере исправления нарушений процент успешно компилируемых компонентов растёт, и приложение становится быстрее без каких-либо изменений в бизнес-логике.

---

Полное понимание оптимизации React — от ручной мемоизации до работы с компилятором — разбирается на курсе [React на PurpleSchool](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=react-compiler-memoization).
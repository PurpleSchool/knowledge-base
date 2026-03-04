---
metaTitle: Jotai - атомарное управление состоянием в React
metaDescription: Полное руководство по Jotai — атомарной библиотеке управления состоянием для React. Атомы, производные атомы, async-атомы, TypeScript, сравнение с Recoil и Zustand
author: Олег Марков
title: Jotai - атомарное состояние
preview: Узнайте, как использовать Jotai для управления состоянием в React-приложениях через концепцию атомов — от базовых примеров до продвинутых паттернов с async-атомами, семействами и DevTools
---

## Введение

Управление состоянием в React-приложениях — одна из тех задач, которая кажется простой на старте и усложняется по мере роста проекта. Context API работает хорошо для небольших случаев, Redux требует значительного количества шаблонного кода, а Zustand предлагает баланс простоты и мощности.

**Jotai** — это атомарная библиотека управления состоянием для React, вдохновлённая Recoil от Facebook, но с более минималистичным и прагматичным API. Название происходит от японского слова «状態» (jōtai) — «состояние». Библиотека создана командой Poimandres — теми же разработчиками, что написали Zustand и Valtio.

Ключевая идея Jotai — **атомы**. Атом — это минимальная единица состояния, которую компонент может читать и обновлять. Вместо одного большого глобального стора вы работаете с множеством маленьких, независимых кусочков состояния, которые можно комбинировать.

В этой статье вы познакомитесь с основами Jotai, научитесь создавать атомы разных типов, использовать производные атомы и async-атомы, а также рассмотрим интеграцию с TypeScript и DevTools.

## Почему Jotai

Перед тем как переходить к коду, давайте разберёмся, чем Jotai отличается от других популярных решений.

### Атомарный подход

Главное отличие Jotai от Redux и Zustand — гранулярность состояния. В Redux и Zustand вы создаёте единый стор (или несколько больших сторов), а компоненты подписываются на его части через селекторы. В Jotai каждый кусочек состояния — это отдельный атом.

```jsx
// Zustand: один стор с несколькими полями
const useStore = create((set) => ({
  count: 0,
  user: null,
  theme: 'light',
  setCount: (n) => set({ count: n }),
  setUser: (u) => set({ user: u }),
}));

// Jotai: отдельный атом для каждого состояния
const countAtom = atom(0);
const userAtom = atom(null);
const themeAtom = atom('light');
```

Такой подход обеспечивает более точечные обновления: компонент, подписанный на `countAtom`, перерендерится только при изменении счётчика, а не при обновлении пользователя.

### Минимальный API

API Jotai намеренно сделан маленьким. Основа — всего три концепции: `atom`, `useAtom` и `Provider`. Этого достаточно для большинства задач.

```jsx
import { atom, useAtom } from 'jotai';

const greetingAtom = atom('Hello, World!');

function Greeting() {
  const [greeting, setGreeting] = useAtom(greetingAtom);
  return <p>{greeting}</p>;
}
```

### Bottom-up модель

В отличие от Redux с его top-down архитектурой, Jotai использует bottom-up подход. Вы не определяете структуру всего глобального состояния заранее — атомы создаются по мере необходимости и автоматически регистрируются в хранилище при первом использовании.

## Установка

Установите Jotai через npm или yarn:

```bash
npm install jotai
# или
yarn add jotai
# или
pnpm add jotai
```

Jotai поддерживает React 18+ и React Native. Для React 17 и ниже используйте Jotai версии 1.x.

## Базовые концепции

### Создание атома

Атом создаётся с помощью функции `atom()`, которой передаётся начальное значение:

```jsx
import { atom } from 'jotai';

// Примитивные значения
const countAtom = atom(0);
const nameAtom = atom('');
const isOpenAtom = atom(false);

// Объекты и массивы
const userAtom = atom({ name: '', age: 0 });
const todosAtom = atom([]);

// null и undefined
const selectedAtom = atom(null);
```

Атомы создаются **вне компонентов** — как правило, в отдельных модулях. Это позволяет повторно использовать их в любом месте приложения.

### Чтение и запись атома

Для работы с атомом в компоненте используется хук `useAtom`:

```jsx
import { atom, useAtom } from 'jotai';

const countAtom = atom(0);

function Counter() {
  const [count, setCount] = useAtom(countAtom);

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
      <button onClick={() => setCount(0)}>Сбросить</button>
    </div>
  );
}
```

Интерфейс `useAtom` намеренно похож на `useState` — это снижает порог входа. Разница в том, что состояние разделяется между всеми компонентами, использующими один и тот же атом.

### Разделение чтения и записи

Jotai предоставляет два отдельных хука, если вам нужно только читать или только обновлять атом:

```jsx
import { useAtomValue, useSetAtom } from 'jotai';

function CounterDisplay() {
  // Только чтение — компонент перерендерится при изменении count
  const count = useAtomValue(countAtom);
  return <p>Текущее значение: {count}</p>;
}

function CounterButtons() {
  // Только запись — компонент НЕ перерендерится при изменении count
  const setCount = useSetAtom(countAtom);

  return (
    <div>
      <button onClick={() => setCount((prev) => prev + 1)}>+</button>
      <button onClick={() => setCount((prev) => prev - 1)}>-</button>
    </div>
  );
}
```

Это важная оптимизация: `useSetAtom` не вызывает ре-рендер компонента при изменении значения атома — компонент подписывается только на функцию записи.

## Производные атомы

Одна из мощнейших возможностей Jotai — **производные атомы** (derived atoms). Это атомы, значение которых вычисляется на основе других атомов.

### Read-only производные атомы

Производный атом создаётся передачей функции-геттера в `atom()`:

```jsx
import { atom } from 'jotai';

const priceAtom = atom(100);
const quantityAtom = atom(3);
const discountAtom = atom(0.1); // 10% скидка

// Производный атом — вычисляется автоматически
const totalAtom = atom((get) => {
  const price = get(priceAtom);
  const quantity = get(quantityAtom);
  const discount = get(discountAtom);
  return price * quantity * (1 - discount);
});

function OrderSummary() {
  const price = useAtomValue(priceAtom);
  const quantity = useAtomValue(quantityAtom);
  const total = useAtomValue(totalAtom);

  return (
    <div>
      <p>Цена: {price} ₽</p>
      <p>Количество: {quantity}</p>
      <p>Итого: {total} ₽</p>
    </div>
  );
}
```

Производный атом автоматически пересчитывается при изменении любого из атомов, от которых он зависит. Пересчёт происходит лениво — только при чтении значения.

### Read-write производные атомы

Производный атом может быть доступен и для записи. Для этого в `atom()` передаётся объект с геттером и сеттером:

```jsx
const temperatureCAtom = atom(20); // температура в Цельсии

// Двунаправленная конвертация Цельсий ↔ Фаренгейт
const temperatureFAtom = atom(
  (get) => get(temperatureCAtom) * (9 / 5) + 32, // геттер
  (get, set, newValueF) => {
    // сеттер
    const newValueC = ((newValueF - 32) * 5) / 9;
    set(temperatureCAtom, newValueC);
  }
);

function TemperatureConverter() {
  const [celsius, setCelsius] = useAtom(temperatureCAtom);
  const [fahrenheit, setFahrenheit] = useAtom(temperatureFAtom);

  return (
    <div>
      <input
        type="number"
        value={celsius}
        onChange={(e) => setCelsius(Number(e.target.value))}
        placeholder="Цельсий"
      />
      <input
        type="number"
        value={fahrenheit}
        onChange={(e) => setFahrenheit(Number(e.target.value))}
        placeholder="Фаренгейт"
      />
    </div>
  );
}
```

Здесь `temperatureFAtom` синхронизирован с `temperatureCAtom`. Запись в любой из них автоматически обновляет оба.

## Async-атомы

Jotai нативно поддерживает асинхронные операции. Вы можете создавать атомы, которые возвращают Promise.

### Асинхронный геттер

```jsx
import { atom, useAtom } from 'jotai';
import { Suspense } from 'react';

const userIdAtom = atom(1);

// Атом, загружающий данные пользователя по ID
const userAtom = atom(async (get) => {
  const userId = get(userIdAtom);
  const response = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
  if (!response.ok) throw new Error('Ошибка загрузки');
  return response.json();
});

function UserProfile() {
  // Компонент приостановится (Suspense), пока данные загружаются
  const [user] = useAtom(userAtom);

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<p>Загрузка...</p>}>
      <UserProfile />
    </Suspense>
  );
}
```

Async-атомы работают через React Suspense — компонент «приостанавливается» до разрешения промиса. Это чистый подход без явной обработки состояний `loading`/`error` внутри компонента.

### Обработка ошибок

Для обработки ошибок в async-атомах используйте `ErrorBoundary`:

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<p>Что-то пошло не так</p>}>
      <Suspense fallback={<p>Загрузка...</p>}>
        <UserProfile />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Атом с ручным обновлением

Если нужно управлять моментом загрузки вручную, используйте атом-триггер:

```jsx
const refreshCountAtom = atom(0);

const dataAtom = atom(async (get) => {
  get(refreshCountAtom); // подписываемся на триггер
  const response = await fetch('/api/data');
  return response.json();
});

function DataView() {
  const [data] = useAtom(dataAtom);
  const setRefreshCount = useSetAtom(refreshCountAtom);

  const refresh = () => setRefreshCount((c) => c + 1);

  return (
    <div>
      <button onClick={refresh}>Обновить</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

## Атом-семейства (atomFamily)

Часто нужно создавать похожие атомы для разных сущностей, например, для каждого элемента списка. Для этого в Jotai есть утилита `atomFamily` из пакета `jotai/utils`:

```jsx
import { atomFamily } from 'jotai/utils';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// Фабрика атомов — создаёт отдельный атом для каждого ID
const todoAtomFamily = atomFamily(
  (id: number) =>
    atom<Todo>({
      id,
      text: '',
      completed: false,
    })
);

function TodoItem({ id }: { id: number }) {
  const [todo, setTodo] = useAtom(todoAtomFamily(id));

  const toggle = () => setTodo((prev) => ({ ...prev, completed: !prev.completed }));

  return (
    <li
      style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
      onClick={toggle}
    >
      {todo.text}
    </li>
  );
}
```

`atomFamily` кэширует созданные атомы — при повторном вызове с тем же аргументом возвращается существующий атом.

## Полезные утилиты из jotai/utils

Jotai поставляется с набором готовых утилит для распространённых задач.

### atomWithStorage — персистентное состояние

```jsx
import { atomWithStorage } from 'jotai/utils';

// Состояние автоматически сохраняется в localStorage
const themeAtom = atomWithStorage('theme', 'light');
const languageAtom = atomWithStorage('language', 'ru');

function Settings() {
  const [theme, setTheme] = useAtom(themeAtom);

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Светлая</option>
      <option value="dark">Тёмная</option>
    </select>
  );
}
```

При перезагрузке страницы значение восстанавливается из localStorage. Работает также с sessionStorage.

### atomWithReducer — Redux-стиль

```jsx
import { atomWithReducer } from 'jotai/utils';

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' }
  | { type: 'setAmount'; payload: number };

function counterReducer(state: number, action: Action): number {
  switch (action.type) {
    case 'increment':
      return state + 1;
    case 'decrement':
      return state - 1;
    case 'reset':
      return 0;
    case 'setAmount':
      return action.payload;
    default:
      return state;
  }
}

const counterAtom = atomWithReducer(0, counterReducer);

function Counter() {
  const [count, dispatch] = useAtom(counterAtom);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Сброс</button>
    </div>
  );
}
```

### atomWithDefault — сбрасываемые атомы

```jsx
import { atomWithDefault, useResetAtom } from 'jotai/utils';

// Атом с поддержкой сброса к начальному значению
const countAtom = atomWithDefault(() => 0);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  const resetCount = useResetAtom(countAtom);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
      <button onClick={resetCount}>Сбросить</button>
    </div>
  );
}
```

## Интеграция с TypeScript

Jotai написан на TypeScript и предоставляет отличный тайп-инференс.

### Типизация атомов

```typescript
import { atom } from 'jotai';

// Тип выводится автоматически
const countAtom = atom(0); // Atom<number>
const nameAtom = atom(''); // Atom<string>

// Явная типизация для null/undefined или сложных типов
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

const userAtom = atom<User | null>(null);

// Массивы
const todosAtom = atom<Todo[]>([]);
```

### Типизация производных атомов

```typescript
// Write-only атом — принимает действие, возвращает void
const addTodoAtom = atom(null, (get, set, newTodo: Todo) => {
  const todos = get(todosAtom);
  set(todosAtom, [...todos, newTodo]);
});

// Async атом с явным типом
const userDataAtom = atom<Promise<User>>(async (get) => {
  const id = get(userIdAtom);
  const response = await fetch(`/api/users/${id}`);
  return response.json() as Promise<User>;
});
```

### Типизация atomFamily

```typescript
import { atomFamily } from 'jotai/utils';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const todoFamily = atomFamily((id: string) =>
  atom<TodoItem>({
    id,
    text: '',
    completed: false,
    createdAt: new Date(),
  })
);
```

## Provider и scoped-состояние

По умолчанию Jotai использует глобальное хранилище. Но с помощью `Provider` можно создавать изолированные области состояния:

```jsx
import { Provider } from 'jotai';

const countAtom = atom(0);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  );
}

function App() {
  return (
    <div>
      {/* Каждый Provider — отдельная область состояния */}
      <Provider>
        <Counter /> {/* Свой счётчик */}
      </Provider>
      <Provider>
        <Counter /> {/* Независимый счётчик */}
      </Provider>
    </div>
  );
}
```

Оба счётчика работают независимо, несмотря на то что используют один `countAtom`. Это делает компоненты с Jotai изолированными и легко тестируемыми.

### Инициализация значений через Provider

```jsx
import { createStore } from 'jotai';

const myStore = createStore();
myStore.set(countAtom, 42); // задаём начальное значение

function App() {
  return (
    <Provider store={myStore}>
      <Counter />
    </Provider>
  );
}
```

## Jotai DevTools

Jotai поддерживает интеграцию с Redux DevTools Extension для отладки.

### Подключение DevTools

```bash
npm install jotai-devtools
```

```jsx
import { DevTools } from 'jotai-devtools';
import 'jotai-devtools/styles.css';

function App() {
  return (
    <>
      <DevTools /> {/* Панель отладки в браузере */}
      <MainApp />
    </>
  );
}
```

### Именование атомов для отладки

```jsx
// Добавьте отладочное имя к атому
const countAtom = atom(0);
countAtom.debugLabel = 'counter/count';

const userAtom = atom(null);
userAtom.debugLabel = 'auth/user';
```

Именованные атомы отображаются с понятными именами в DevTools.

## Практический пример: список задач

Соберём полноценный пример — приложение для управления задачами:

```tsx
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// --- Типы ---
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

type Filter = 'all' | 'active' | 'completed';

// --- Атомы ---
const todosAtom = atomWithStorage<Todo[]>('todos', []);
const filterAtom = atom<Filter>('all');

// Производный атом — фильтрованный список
const filteredTodosAtom = atom((get) => {
  const todos = get(todosAtom);
  const filter = get(filterAtom);

  switch (filter) {
    case 'active':
      return todos.filter((t) => !t.completed);
    case 'completed':
      return todos.filter((t) => t.completed);
    default:
      return todos;
  }
});

// Производный атом — статистика
const statsAtom = atom((get) => {
  const todos = get(todosAtom);
  return {
    total: todos.length,
    completed: todos.filter((t) => t.completed).length,
    active: todos.filter((t) => !t.completed).length,
  };
});

// --- Действия ---
const addTodoAtom = atom(null, (get, set, text: string) => {
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    text,
    completed: false,
    createdAt: Date.now(),
  };
  set(todosAtom, (prev) => [...prev, newTodo]);
});

const toggleTodoAtom = atom(null, (get, set, id: string) => {
  set(todosAtom, (prev) =>
    prev.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  );
});

const deleteTodoAtom = atom(null, (get, set, id: string) => {
  set(todosAtom, (prev) => prev.filter((todo) => todo.id !== id));
});

const clearCompletedAtom = atom(null, (get, set) => {
  set(todosAtom, (prev) => prev.filter((todo) => !todo.completed));
});

// --- Компоненты ---
function AddTodoForm() {
  const addTodo = useSetAtom(addTodoAtom);
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      addTodo(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Новая задача..."
      />
      <button type="submit">Добавить</button>
    </form>
  );
}

function TodoItem({ todo }: { todo: Todo }) {
  const toggleTodo = useSetAtom(toggleTodoAtom);
  const deleteTodo = useSetAtom(deleteTodoAtom);

  return (
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo(todo.id)}
      />
      <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
        {todo.text}
      </span>
      <button onClick={() => deleteTodo(todo.id)}>✕</button>
    </li>
  );
}

function TodoList() {
  const todos = useAtomValue(filteredTodosAtom);

  if (todos.length === 0) {
    return <p>Нет задач</p>;
  }

  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

function FilterButtons() {
  const [filter, setFilter] = useAtom(filterAtom);

  return (
    <div>
      {(['all', 'active', 'completed'] as Filter[]).map((f) => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          style={{ fontWeight: filter === f ? 'bold' : 'normal' }}
        >
          {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : 'Выполненные'}
        </button>
      ))}
    </div>
  );
}

function Stats() {
  const stats = useAtomValue(statsAtom);
  const clearCompleted = useSetAtom(clearCompletedAtom);

  return (
    <div>
      <span>Активных: {stats.active}</span>
      <FilterButtons />
      {stats.completed > 0 && (
        <button onClick={clearCompleted}>
          Удалить выполненные ({stats.completed})
        </button>
      )}
    </div>
  );
}

export function TodoApp() {
  return (
    <div>
      <h1>Список задач</h1>
      <AddTodoForm />
      <TodoList />
      <Stats />
    </div>
  );
}
```

## Сравнение Jotai с Recoil и Zustand

Все три библиотеки решают схожие задачи, но с разных сторон.

### Jotai vs Recoil

Jotai вдохновлён Recoil, но значительно проще:

| Аспект | Jotai | Recoil |
|--------|-------|--------|
| Размер | ~3 КБ | ~20 КБ |
| Provider | Опциональный | Обязательный RecoilRoot |
| API | `atom()`, `useAtom()` | `atom()`, `selector()`, `useRecoilState()` |
| Async | Нативно через Promise | `selector` с async функцией |
| Поддержка | Активная (Poimandres) | Устаревает (Meta) |
| Стабильность | Стабильная v2 | Всё ещё экспериментальная |

Recoil разграничивает атомы (изменяемое состояние) и селекторы (вычисляемые значения), тогда как в Jotai и то и другое — просто атомы с разной сигнатурой.

### Jotai vs Zustand

| Аспект | Jotai | Zustand |
|--------|-------|---------|
| Подход | Bottom-up (атомы) | Top-down (стор) |
| Гранулярность | Высокая (каждый атом — отдельная подписка) | Средняя (селекторы из стора) |
| API | Похож на useState | Хук с объектом стора |
| Async | Нативно (Suspense) | Вручную (loading/error) |
| DevTools | jotai-devtools | Redux DevTools |
| Использование вне React | Ограниченное | Да (getState, setState) |

Zustand лучше подходит для сложного связанного состояния с действиями и middleware. Jotai — для гранулярного состояния, когда важна точная оптимизация ре-рендеров.

## Когда использовать Jotai

Jotai хорошо подходит, когда:

- **Много независимых кусочков состояния** — атомарная модель обеспечивает чистое разделение
- **Нужна точная оптимизация ре-рендеров** — каждый компонент подписывается только на нужные атомы
- **Используете React Suspense** — async-атомы работают с ним нативно
- **Хотите минимальный шаблонный код** — API проще Redux и даже Zustand
- **Работаете с компонентными библиотеками** — `Provider` изолирует состояние

Возможно, стоит выбрать другое решение, если:

- У вас сложная бизнес-логика с множеством взаимосвязанных действий — Zustand или Redux Toolkit лучше справятся
- Нужна работа с состоянием вне React (в сервисах, утилитах) — Zustand удобнее
- Команда лучше знакома с Redux-паттернами — Redux Toolkit снизит порог входа

## Заключение

Jotai — элегантная библиотека для управления состоянием, которая следует принципу «сделай одно, но хорошо». Атомарный подход обеспечивает прекрасную масштабируемость: вы начинаете с простых атомов и наращиваете сложность только там, где это необходимо.

Ключевые преимущества Jotai:
- **Минимальный API** — `atom` и `useAtom` покрывают 80% случаев
- **Нативная поддержка async** через Suspense без лишнего кода
- **Производные атомы** — мощный механизм вычисляемых значений
- **Изоляция через Provider** — удобно для тестирования и компонентных библиотек
- **Отличный TypeScript** — тайп-инференс работает из коробки

Попробуйте Jotai в следующем проекте — возможно, вы обнаружите, что атомарный подход лучше соответствует тому, как вы мыслите о состоянии вашего приложения.

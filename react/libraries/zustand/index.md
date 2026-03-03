---
metaTitle: Zustand — управление состоянием в React
metaDescription: Полное руководство по Zustand — минималистичной библиотеке управления состоянием для React. Установка, создание стора, middleware, TypeScript, сравнение с Redux и Context API
author: Олег Марков
title: Zustand — управление состоянием в React
preview: Узнайте, как использовать Zustand для управления глобальным состоянием в React-приложениях — от базового стора до продвинутых паттернов с middleware, persist и Immer
---

## Введение

Управление состоянием — одна из ключевых задач при разработке React-приложений. Когда приложение растёт, простой `useState` перестаёт справляться, а Context API начинает ограничивать возможности оптимизации. Redux решает эти проблемы, но вносит значительную сложность: action creators, reducers, middleware — всё это требует немалого количества шаблонного кода.

**Zustand** — это небольшая, быстрая и масштабируемая библиотека управления состоянием, которая предлагает лаконичный API без лишнего церемониала. Название происходит от немецкого слова «состояние» (Zustand). Библиотека создана командой, разработавшей Jotai и Valtio (Poimandres), и сочетает в себе простоту хуков и мощь глобального стора.

В этой статье вы узнаете, как работает Zustand, научитесь создавать сторы, подключать middleware и применять продвинутые паттерны в TypeScript-проектах.

## Почему Zustand, а не Redux или Context API

Прежде чем переходить к коду, давайте разберёмся, чем Zustand отличается от популярных альтернатив.

### Сравнение с Context API

React Context подходит для простых сценариев — передачи темы, локали или авторизационных данных. Но у него есть серьёзное ограничение: при изменении значения контекста перерендериваются **все** компоненты-подписчики, даже если они используют только часть данных.

```jsx
// Context: каждый Consumer перерендерится при любом изменении в стейте
const AppContext = createContext(null);

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [cart, setCart] = useState([]);

  // При изменении cart перерендерится UserProfile, хотя ему cart не нужен
  return (
    <AppContext.Provider value={{ user, setUser, theme, setTheme, cart, setCart }}>
      {children}
    </AppContext.Provider>
  );
}
```

Zustand решает это через **селекторы** — компонент подписывается только на нужную часть стора и перерендерится только при её изменении.

### Сравнение с Redux

Redux — мощное решение с предсказуемыми обновлениями через reducer и богатой экосистемой. Но минимальная конфигурация требует объёмного кода:

```javascript
// Redux Toolkit: необходимо определить slice, reducer, actions, настроить store
import { createSlice, configureStore } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1; },
    decrement: (state) => { state.value -= 1; },
  },
});

export const { increment, decrement } = counterSlice.actions;
export const store = configureStore({ reducer: { counter: counterSlice.reducer } });
```

Тот же счётчик на Zustand занимает в разы меньше кода и не требует провайдеров:

```javascript
// Zustand: один файл, один вызов create
import { create } from 'zustand';

const useCounterStore = create((set) => ({
  value: 0,
  increment: () => set((state) => ({ value: state.value + 1 })),
  decrement: () => set((state) => ({ value: state.value - 1 })),
}));
```

### Сравнение ключевых характеристик

| Характеристика | Zustand | Redux Toolkit | Context API |
|---|---|---|---|
| Размер бандла | ~1 КБ | ~10 КБ | встроен в React |
| Шаблонный код | минимальный | умеренный | минимальный |
| Провайдер | не нужен | нужен | нужен |
| DevTools | да | да | ограниченно |
| Middleware | да | да | нет |
| Серверный рендеринг | да | да | да |
| TypeScript | отличная поддержка | отличная поддержка | хорошая поддержка |
| Производительность | высокая | высокая | средняя |

## Установка

Zustand устанавливается через npm или yarn:

```bash
# npm
npm install zustand

# yarn
yarn add zustand

# pnpm
pnpm add zustand
```

Требования: React 18+, Node.js 12+. Zustand также работает без React — для vanilla JS есть отдельное API.

## Создание первого стора

Сердце Zustand — функция `create`, которая принимает коллбэк и возвращает хук для использования в компонентах.

```javascript
import { create } from 'zustand';

// Создаём стор
const useBearStore = create((set) => ({
  // Начальное состояние
  bears: 0,

  // Действия — обычные функции
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
}));
```

Функция `create` принимает **инициализатор** (функцию), которая получает `set`, `get` и `api`:
- `set` — обновляет состояние стора
- `get` — читает текущее состояние внутри действия
- `api` — объект стора с полным API

### Использование стора в компонентах

Стор возвращает хук, который можно использовать в любом компоненте без провайдеров:

```jsx
function BearCounter() {
  // Подписываемся на значение bears через селектор
  const bears = useBearStore((state) => state.bears);
  return <h1>{bears} медведей вокруг</h1>;
}

function Controls() {
  // Получаем только действие — компонент не перерендерится при изменении bears
  const increasePopulation = useBearStore((state) => state.increasePopulation);
  return <button onClick={increasePopulation}>Добавить медведя</button>;
}

function App() {
  // Никаких Provider не нужно — стор доступен везде
  return (
    <>
      <BearCounter />
      <Controls />
    </>
  );
}
```

Обратите внимание: `BearCounter` подписан на `bears`, а `Controls` — только на `increasePopulation`. При нажатии кнопки перерендерится только `BearCounter`.

## Функция set — обновление состояния

Функция `set` — основной способ обновить состояние в Zustand. Она работает аналогично `setState` из React, но с важными отличиями.

### Базовое использование

```javascript
const useStore = create((set) => ({
  count: 0,
  name: 'Иван',

  // Частичное обновление — объединяется с текущим состоянием (shallow merge)
  setCount: (n) => set({ count: n }),

  // Обновление через функцию — для доступа к предыдущему состоянию
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

По умолчанию `set` делает **неглубокое слияние** (shallow merge) — вы передаёте только изменившиеся поля, а остальные сохраняются.

### Полная замена состояния

Если нужно заменить состояние целиком, передайте второй аргумент `true`:

```javascript
const useStore = create((set) => ({
  items: [],
  filter: 'all',

  // Полная замена состояния (replace mode)
  reset: () => set({ items: [], filter: 'all' }, true),
}));
```

### Асинхронные действия

Zustand не требует специального синтаксиса для асинхронных операций — просто используйте `async/await`:

```javascript
const useUserStore = create((set) => ({
  user: null,
  loading: false,
  error: null,

  fetchUser: async (userId) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`/api/users/${userId}`);
      const user = await response.json();
      set({ user, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));
```

Использование в компоненте:

```jsx
function UserProfile({ userId }) {
  const { user, loading, error, fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser(userId);
  }, [userId, fetchUser]);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;
  if (!user) return null;

  return <div>{user.name}</div>;
}
```

## Функция get — чтение состояния в действиях

Функция `get` позволяет читать текущее состояние внутри действий, не используя замыкания:

```javascript
const useCartStore = create((set, get) => ({
  items: [],

  addItem: (item) => {
    const { items } = get(); // Читаем текущее состояние

    // Проверяем, есть ли уже такой товар
    const existingItem = items.find((i) => i.id === item.id);

    if (existingItem) {
      set({
        items: items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ items: [...items, { ...item, quantity: 1 }] });
    }
  },

  getTotalPrice: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  removeItem: (itemId) => {
    const { items } = get();
    set({ items: items.filter((i) => i.id !== itemId) });
  },
}));
```

## Селекторы и оптимизация производительности

Селекторы — ключевой инструмент оптимизации в Zustand. Компонент перерендерится только если значение, возвращённое селектором, изменилось.

### Базовые селекторы

```jsx
// Компонент подписывается только на count — безопасен от изменений name
function Counter() {
  const count = useStore((state) => state.count);
  return <div>{count}</div>;
}

// Этот компонент перерендерится только при изменении name
function Greeting() {
  const name = useStore((state) => state.name);
  return <div>Привет, {name}!</div>;
}
```

### Получение нескольких значений

Когда нужно несколько значений из стора, есть несколько подходов:

```jsx
// Подход 1: несколько вызовов хука (рекомендуется для независимых значений)
function UserCard() {
  const name = useStore((state) => state.name);
  const email = useStore((state) => state.email);

  return <div>{name} — {email}</div>;
}

// Подход 2: объект с useShallow (для связанных значений)
import { useShallow } from 'zustand/react/shallow';

function UserCard() {
  const { name, email } = useStore(
    useShallow((state) => ({ name: state.name, email: state.email }))
  );

  return <div>{name} — {email}</div>;
}

// Подход 3: массив с useShallow
function UserCard() {
  const [name, email] = useStore(
    useShallow((state) => [state.name, state.email])
  );

  return <div>{name} — {email}</div>;
}
```

`useShallow` выполняет неглубокое сравнение результата — компонент перерендерится только если изменилось хотя бы одно из выбранных значений.

### Вычисляемые значения в селекторах

```jsx
// Вычисляемые данные прямо в селекторе
function CartSummary() {
  const totalItems = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );

  const totalPrice = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  return (
    <div>
      Товаров: {totalItems}, Итого: {totalPrice} ₽
    </div>
  );
}
```

## TypeScript

Zustand имеет отличную TypeScript-поддержку. Давайте рассмотрим правильные паттерны типизации.

### Типизация стора

```typescript
import { create } from 'zustand';

// Определяем интерфейс стора
interface BearState {
  bears: number;
  increasePopulation: () => void;
  removeAllBears: () => void;
  updateBears: (newBears: number) => void;
}

// Передаём тип в create
const useBearStore = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
}));
```

### Разделение типов на состояние и действия

Для больших сторов удобно разделять типы:

```typescript
import { create } from 'zustand';

// Тип состояния (данные)
interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
}

// Тип действий
interface CartActions {
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  fetchCart: () => Promise<void>;
}

// Комбинированный тип
type CartStore = CartState & CartActions;

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const useCartStore = create<CartStore>((set, get) => ({
  // Начальное состояние
  items: [],
  isLoading: false,
  error: null,

  // Действия
  addItem: (item) => {
    const { items } = get();
    const existing = items.find((i) => i.id === item.id);

    if (existing) {
      set({
        items: items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ items: [...items, { ...item, quantity: 1 }] });
    }
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
    }));
  },

  clearCart: () => set({ items: [] }),

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/cart');
      const items: CartItem[] = await response.json();
      set({ items, isLoading: false });
    } catch (err) {
      set({ error: 'Ошибка загрузки корзины', isLoading: false });
    }
  },
}));
```

### Типизированные селекторы

```typescript
// Тип-хелпер для экстракции типа стора из хука
type ExtractState<S> = S extends { getState: () => infer T } ? T : never;

// Или просто используем ReturnType
const selectItems = (state: CartStore) => state.items;
const selectTotalPrice = (state: CartStore) =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

// Использование в компоненте
function CartItems() {
  const items = useCartStore(selectItems);
  const totalPrice = useCartStore(selectTotalPrice);

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.name}: {item.price} ₽</div>
      ))}
      <div>Итого: {totalPrice} ₽</div>
    </div>
  );
}
```

## Middleware

Zustand поддерживает middleware — функции-обёртки, которые расширяют поведение стора. В комплекте идут популярные middleware.

### persist — сохранение в localStorage

```javascript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'light',
      language: 'ru',
      fontSize: 14,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setFontSize: (fontSize) => set({ fontSize }),
    }),
    {
      name: 'app-settings', // Ключ в localStorage
      storage: createJSONStorage(() => localStorage), // Хранилище (по умолчанию localStorage)
    }
  )
);
```

С TypeScript:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark';
  language: 'ru' | 'en';
  fontSize: number;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'ru' | 'en') => void;
  setFontSize: (size: number) => void;
}

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'ru',
      fontSize: 14,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setFontSize: (fontSize) => set({ fontSize }),
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => localStorage),
      // Сохранять только часть состояния
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);
```

Обратите внимание на двойной вызов `create<SettingsState>()()` — это необходимо при использовании TypeScript с middleware.

### Выборочное сохранение и миграции

```typescript
const useStore = create<MyState>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'my-store',
      // Сохранять только определённые поля
      partialize: (state) => ({
        user: state.user,
        preferences: state.preferences,
        // items не сохраняется
      }),
      // Версионирование для миграций
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        if (version === 1) {
          // Миграция с версии 1 на 2
          const state = persistedState as OldState;
          return {
            ...state,
            preferences: {
              theme: state.theme, // Поле переехало в preferences
              language: 'ru',
            },
          };
        }
        return persistedState as MyState;
      },
    }
  )
);
```

### devtools — интеграция с Redux DevTools

```javascript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set(
        (state) => ({ count: state.count + 1 }),
        false,           // replace mode
        'increment'      // имя действия в DevTools
      ),
    }),
    {
      name: 'CounterStore', // Имя в DevTools
      enabled: process.env.NODE_ENV === 'development', // Только в dev
    }
  )
);
```

### immer — иммутабельные обновления

Middleware Immer позволяет писать мутирующий код, который автоматически преобразуется в иммутабельные обновления:

```bash
npm install immer
```

```javascript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const useStore = create(
  immer((set) => ({
    todos: [],

    addTodo: (text) =>
      set((state) => {
        // Можно мутировать state напрямую — Immer сделает копию
        state.todos.push({ id: Date.now(), text, done: false });
      }),

    toggleTodo: (id) =>
      set((state) => {
        const todo = state.todos.find((t) => t.id === id);
        if (todo) todo.done = !todo.done;
      }),

    removeTodo: (id) =>
      set((state) => {
        state.todos = state.todos.filter((t) => t.id !== id);
      }),
  }))
);
```

### Комбинирование middleware

```typescript
import { create } from 'zustand';
import { devtools, persist, immer } from 'zustand/middleware';

// Комбинируем несколько middleware
const useStore = create<MyState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // состояние и действия
      })),
      { name: 'my-store' }
    ),
    { name: 'MyStore' }
  )
);
```

## Разделение стора на слайсы

Для больших приложений удобно разбивать стор на логические части — слайсы:

```typescript
// store/slices/userSlice.ts
import { StateCreator } from 'zustand';
import { RootStore } from '../rootStore';

export interface UserSlice {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

export const createUserSlice: StateCreator<
  RootStore,
  [],
  [],
  UserSlice
> = (set) => ({
  user: null,
  isAuthenticated: false,

  login: async (credentials) => {
    const user = await authService.login(credentials);
    set({ user, isAuthenticated: true });
  },

  logout: () => set({ user: null, isAuthenticated: false }),
});
```

```typescript
// store/slices/cartSlice.ts
import { StateCreator } from 'zustand';
import { RootStore } from '../rootStore';

export interface CartSlice {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
}

export const createCartSlice: StateCreator<
  RootStore,
  [],
  [],
  CartSlice
> = (set, get) => ({
  cartItems: [],

  addToCart: (item) => {
    set((state) => ({ cartItems: [...state.cartItems, item] }));
  },

  removeFromCart: (id) => {
    set((state) => ({
      cartItems: state.cartItems.filter((i) => i.id !== id),
    }));
  },
});
```

```typescript
// store/rootStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { UserSlice, createUserSlice } from './slices/userSlice';
import { CartSlice, createCartSlice } from './slices/cartSlice';

export type RootStore = UserSlice & CartSlice;

export const useStore = create<RootStore>()(
  devtools(
    (...args) => ({
      ...createUserSlice(...args),
      ...createCartSlice(...args),
    }),
    { name: 'AppStore' }
  )
);

// Хуки для каждого слайса
export const useUser = () => useStore((state) => state.user);
export const useCart = () => useStore((state) => state.cartItems);
```

## Использование вне компонентов

Один из плюсов Zustand — доступ к стору вне React-компонентов:

```typescript
// Доступ к состоянию напрямую
const currentCount = useCounterStore.getState().count;

// Обновление состояния из обычной функции
useCounterStore.setState({ count: 10 });

// Подписка на изменения (возвращает функцию отписки)
const unsubscribe = useCounterStore.subscribe(
  (state) => state.count,
  (count, previousCount) => {
    console.log(`Счётчик изменился: ${previousCount} → ${count}`);
  }
);

// Отписка
unsubscribe();
```

Это особенно полезно в сервисах, утилитах или при работе с WebSocket:

```typescript
// websocket.ts
import { useNotificationStore } from './store/notificationStore';

class WebSocketService {
  private ws: WebSocket;

  connect(url: string) {
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Обновляем стор прямо из сервиса — без React
      useNotificationStore.getState().addNotification({
        id: Date.now().toString(),
        type: message.type,
        text: message.text,
      });
    };
  }
}
```

## Работа с массивами и вложенными объектами

Давайте рассмотрим типичные паттерны работы с коллекциями данных:

```typescript
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface TodoStore {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  setFilter: (filter: TodoStore['filter']) => void;
  getFilteredTodos: () => Todo[];
}

const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  filter: 'all',

  addTodo: (text) =>
    set((state) => ({
      todos: [
        ...state.todos,
        {
          id: crypto.randomUUID(),
          text,
          completed: false,
          priority: 'medium',
        },
      ],
    })),

  toggleTodo: (id) =>
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ),
    })),

  deleteTodo: (id) =>
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    })),

  updateTodo: (id, updates) =>
    set((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, ...updates } : todo
      ),
    })),

  setFilter: (filter) => set({ filter }),

  // Вычисляемые данные через get
  getFilteredTodos: () => {
    const { todos, filter } = get();
    switch (filter) {
      case 'active':
        return todos.filter((t) => !t.completed);
      case 'completed':
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  },
}));
```

Использование в компоненте:

```jsx
function TodoList() {
  const { todos, filter, toggleTodo, deleteTodo, setFilter, getFilteredTodos } = useTodoStore(
    useShallow((state) => ({
      todos: state.todos,
      filter: state.filter,
      toggleTodo: state.toggleTodo,
      deleteTodo: state.deleteTodo,
      setFilter: state.setFilter,
      getFilteredTodos: state.getFilteredTodos,
    }))
  );

  const filteredTodos = getFilteredTodos();

  return (
    <div>
      <div>
        <button onClick={() => setFilter('all')} disabled={filter === 'all'}>Все</button>
        <button onClick={() => setFilter('active')} disabled={filter === 'active'}>Активные</button>
        <button onClick={() => setFilter('completed')} disabled={filter === 'completed'}>Завершённые</button>
      </div>

      {filteredTodos.map((todo) => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
            {todo.text}
          </span>
          <button onClick={() => deleteTodo(todo.id)}>Удалить</button>
        </div>
      ))}
    </div>
  );
}
```

## Серверный рендеринг (SSR) и Next.js

При использовании Zustand с Next.js App Router нужно учесть особенности серверного рендеринга.

### Паттерн для SSR

Проблема: сторы Zustand — синглтоны, что может вызвать утечку данных между запросами на сервере.

```typescript
// store/createStore.ts
import { createStore } from 'zustand';
import { useStore } from 'zustand';
import { createContext, useContext, useRef } from 'react';

interface CounterState {
  count: number;
  increment: () => void;
}

// Фабрика стора — создаёт новый инстанс для каждого запроса
const createCounterStore = (initCount = 0) =>
  createStore<CounterState>()((set) => ({
    count: initCount,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }));

type CounterStore = ReturnType<typeof createCounterStore>;

// Context для передачи стора
const CounterStoreContext = createContext<CounterStore | null>(null);

// Provider компонент
export function CounterStoreProvider({
  children,
  initCount,
}: {
  children: React.ReactNode;
  initCount?: number;
}) {
  // useRef гарантирует создание стора только один раз на клиенте
  const storeRef = useRef<CounterStore>();
  if (!storeRef.current) {
    storeRef.current = createCounterStore(initCount);
  }

  return (
    <CounterStoreContext.Provider value={storeRef.current}>
      {children}
    </CounterStoreContext.Provider>
  );
}

// Хук для использования стора
export function useCounterStore<T>(selector: (state: CounterState) => T): T {
  const store = useContext(CounterStoreContext);
  if (!store) throw new Error('useCounterStore must be used within CounterStoreProvider');
  return useStore(store, selector);
}
```

```tsx
// app/layout.tsx (Next.js App Router)
import { CounterStoreProvider } from '@/store/createStore';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <CounterStoreProvider initCount={0}>
          {children}
        </CounterStoreProvider>
      </body>
    </html>
  );
}
```

## Тестирование

Zustand удобно тестировать — стор можно сбрасывать между тестами:

```typescript
// counterStore.test.ts
import { act, renderHook } from '@testing-library/react';
import { useCounterStore } from './counterStore';

// Сброс стора перед каждым тестом
beforeEach(() => {
  useCounterStore.setState({ count: 0 });
});

describe('useCounterStore', () => {
  test('начальное состояние равно 0', () => {
    const { result } = renderHook(() => useCounterStore((state) => state.count));
    expect(result.current).toBe(0);
  });

  test('increment увеличивает счётчик', () => {
    const { result } = renderHook(() => useCounterStore());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  test('прямое изменение состояния', () => {
    // Для интеграционных тестов можно обновлять состояние напрямую
    act(() => {
      useCounterStore.setState({ count: 42 });
    });

    const { result } = renderHook(() => useCounterStore((state) => state.count));
    expect(result.current).toBe(42);
  });
});
```

### Мокирование асинхронных действий

```typescript
// userStore.test.ts
import { act, renderHook } from '@testing-library/react';
import { useUserStore } from './userStore';

// Мокируем fetch
global.fetch = jest.fn();

beforeEach(() => {
  useUserStore.setState({ user: null, loading: false, error: null });
  (global.fetch as jest.Mock).mockReset();
});

test('fetchUser загружает пользователя', async () => {
  const mockUser = { id: '1', name: 'Иван', email: 'ivan@example.com' };

  (global.fetch as jest.Mock).mockResolvedValueOnce({
    json: () => Promise.resolve(mockUser),
  });

  const { result } = renderHook(() => useUserStore());

  await act(async () => {
    await result.current.fetchUser('1');
  });

  expect(result.current.user).toEqual(mockUser);
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toBeNull();
});
```

## Лучшие практики

### 1. Разделяйте сторы по доменам

```typescript
// Хорошо: отдельные сторы для разных областей
const useUserStore = create<UserStore>(/* ... */);
const useCartStore = create<CartStore>(/* ... */);
const useUIStore = create<UIStore>(/* ... */);

// Плохо: один огромный стор для всего
const useAppStore = create<EverythingInOnePlace>(/* ... */);
```

### 2. Используйте действия внутри стора, а не снаружи

```typescript
// Хорошо: логика в сторе
const useStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
}));

// Плохо: обновление через setState напрямую из компонента
function Component() {
  const handleAdd = (item) => {
    useStore.setState((state) => ({ items: [...state.items, item] }));
  };
}
```

### 3. Выносите селекторы за пределы компонента

```typescript
// Хорошо: селекторы как константы вне компонента
const selectCompletedTodos = (state: TodoStore) =>
  state.todos.filter((t) => t.completed);

const selectTodoCount = (state: TodoStore) => state.todos.length;

function TodoStats() {
  const completed = useTodoStore(selectCompletedTodos);
  const total = useTodoStore(selectTodoCount);
  return <div>{completed.length}/{total}</div>;
}

// Плохо: инлайн-функции создают новый объект при каждом рендере
function TodoStats() {
  // Эта функция пересоздаётся на каждый рендер
  const completed = useTodoStore((state) => state.todos.filter((t) => t.completed));
}
```

### 4. Используйте subscribeWithSelector для сложных подписок

```typescript
import { subscribeWithSelector } from 'zustand/middleware';

const useStore = create(
  subscribeWithSelector((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }))
);

// Подписка с детальным контролем
const unsubscribe = useStore.subscribe(
  (state) => state.count,          // Селектор
  (count, previousCount) => {       // Обработчик
    if (count > 10) {
      console.log('Превысили лимит!');
    }
  },
  { equalityFn: (a, b) => a === b } // Функция сравнения
);
```

### 5. Не создавайте стор в компоненте

```typescript
// Плохо: новый стор создаётся на каждый рендер
function Component() {
  const useLocalStore = create((set) => ({ count: 0 })); // ❌
  const count = useLocalStore((s) => s.count);
}

// Хорошо: стор создаётся вне компонента
const useLocalStore = create((set) => ({ count: 0 }));

function Component() {
  const count = useLocalStore((s) => s.count); // ✅
}
```

## Типичные антипаттерны

### Излишняя нормализация

Zustand не требует нормализации данных как Redux:

```typescript
// Избыточно для Zustand — нормализованная форма нужна только при сложных связях
const useStore = create((set) => ({
  userIds: ['1', '2'],
  usersById: { '1': { id: '1', name: 'Иван' }, '2': { id: '2', name: 'Мария' } },
}));

// Проще — массив подходит для большинства случаев
const useStore = create((set) => ({
  users: [{ id: '1', name: 'Иван' }, { id: '2', name: 'Мария' }],
}));
```

### Подписка на весь стор

```typescript
// Плохо: перерендер при любом изменении стора
function Component() {
  const store = useStore(); // Подписывает на ВСЁ состояние
}

// Хорошо: только нужные данные
function Component() {
  const count = useStore((state) => state.count);
}
```

### Синхронная нагрузка в сторе

```typescript
// Плохо: синхронные тяжёлые вычисления при каждом изменении
const useStore = create((set, get) => ({
  items: [],

  // Этот метод вызывается при каждом рендере — дорого!
  getSortedItems: () => get().items.sort(/* сложная сортировка */),
}));

// Лучше: мемоизируйте в компоненте с useMemo
function Component() {
  const items = useStore((state) => state.items);
  const sortedItems = useMemo(() => [...items].sort(/* ... */), [items]);
}
```

## Итоги

Zustand — это элегантное решение для управления состоянием в React-приложениях. Его сильные стороны:

- **Минимальный API** — `create`, `set`, `get` и хуки. Нет лишней абстракции
- **Нет Provider** — стор работает как обычный модуль, доступен везде
- **Отличная производительность** — умные подписки через селекторы
- **Гибкость** — работает с TypeScript, SSR, вне React-компонентов
- **Богатая экосистема middleware** — `persist`, `devtools`, `immer` из коробки
- **Простое тестирование** — стор можно сбрасывать и обновлять напрямую

Zustand подходит для проектов любого масштаба: от небольших приложений, где Context API перестаёт справляться, до крупных систем с разделёнными слайсами и сложной бизнес-логикой.

Если вы хотите углубиться в управление состоянием React-приложений, изучить Zustand, Redux Toolkit и Context API в контексте реальных проектов — приходите на наш большой курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=zustand-upravlenie-sostoyaniem). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

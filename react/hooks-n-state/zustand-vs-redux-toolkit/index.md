---
metaTitle: "Zustand vs Redux Toolkit: сравнение и выбор библиотеки"
metaDescription: "Подробное сравнение Zustand и Redux Toolkit: архитектура, API, производительность и когда использовать каждую библиотеку."
author: "Антон Ларичев"
title: "Zustand против Redux Toolkit: что выбрать"
preview: "Разбираем ключевые различия между Zustand и Redux Toolkit, сравниваем подходы к управлению состоянием и помогаем выбрать инструмент под ваш проект."
---

## Введение

Управление состоянием — одна из центральных задач в разработке React-приложений. На протяжении многих лет Redux был стандартом де-факто, но с появлением Redux Toolkit (RTK) и лёгких альтернатив, таких как Zustand, у разработчиков появился реальный выбор.

В этой статье мы подробно разберём оба инструмента: архитектуру, API, производительность и сценарии применения. После прочтения вы сможете осознанно выбрать библиотеку под свой проект, а не следовать моде.

## Redux Toolkit: современный Redux

Redux Toolkit — официальный набор инструментов для работы с Redux. Он появился как ответ на главную критику оригинального Redux: слишком много шаблонного кода (boilerplate).

### Установка и базовая настройка

```bash
npm install @reduxjs/toolkit react-redux
```

Типичная структура стора с RTK выглядит так:

```typescript
// store/counterSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CounterState {
  value: number;
  status: 'idle' | 'loading' | 'failed';
}

const initialState: CounterState = {
  value: 0,
  status: 'idle',
};

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;
export default counterSlice.reducer;
```

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```typescript
// hooks/redux.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

```tsx
// App.tsx
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  return (
    <Provider store={store}>
      <Counter />
    </Provider>
  );
}
```

```tsx
// Counter.tsx
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { increment, decrement, incrementByAmount } from '../store/counterSlice';

function Counter() {
  const count = useAppSelector((state) => state.counter.value);
  const dispatch = useAppDispatch();

  return (
    <div>
      <span>{count}</span>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
      <button onClick={() => dispatch(incrementByAmount(5))}>+5</button>
    </div>
  );
}
```

### Асинхронные операции с createAsyncThunk

RTK предоставляет `createAsyncThunk` для работы с асинхронным кодом:

```typescript
// store/usersSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface User {
  id: number;
  name: string;
  email: string;
}

interface UsersState {
  list: User[];
  loading: boolean;
  error: string | null;
}

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Ошибка загрузки');
      return (await response.json()) as User[];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: { list: [], loading: false, error: null } as UsersState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default usersSlice.reducer;
```

### RTK Query — встроенный инструмент для работы с API

RTK Query — мощное дополнение, которое автоматически управляет кешированием, загрузкой и инвалидацией данных:

```typescript
// store/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    createUser: builder.mutation<User, Partial<User>>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const { useGetUsersQuery, useCreateUserMutation } = usersApi;
```

## Zustand: минималистичное управление состоянием

Zustand — небольшая (~1 КБ) библиотека, построенная на хуках. Она не требует провайдеров, редьюсеров или экшенов. Стор — это просто функция.

### Установка и базовая настройка

```bash
npm install zustand
```

Аналогичный счётчик на Zustand:

```typescript
// store/counterStore.ts
import { create } from 'zustand';

interface CounterState {
  value: number;
  increment: () => void;
  decrement: () => void;
  incrementByAmount: (amount: number) => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  value: 0,
  increment: () => set((state) => ({ value: state.value + 1 })),
  decrement: () => set((state) => ({ value: state.value - 1 })),
  incrementByAmount: (amount) =>
    set((state) => ({ value: state.value + amount })),
}));
```

Компонент использует стор напрямую без провайдеров:

```tsx
// Counter.tsx
import { useCounterStore } from '../store/counterStore';

function Counter() {
  const { value, increment, decrement, incrementByAmount } = useCounterStore();

  return (
    <div>
      <span>{value}</span>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={() => incrementByAmount(5)}>+5</button>
    </div>
  );
}
```

### Асинхронные операции в Zustand

Zustand не делает различий между синхронными и асинхронными операциями:

```typescript
// store/usersStore.ts
import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  email: string;
}

interface UsersStore {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
}

export const useUsersStore = create<UsersStore>((set) => ({
  users: [],
  loading: false,
  error: null,
  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Ошибка загрузки');
      const users: User[] = await response.json();
      set({ users, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));
```

### Оптимизация ре-рендеров через селекторы

Важная особенность Zustand: без селектора компонент перерисовывается при изменении любого поля стора.

```tsx
// Плохо — компонент ре-рендерится при изменении любого поля
function UserCount() {
  const store = useUsersStore();
  return <span>{store.users.length}</span>;
}

// Хорошо — компонент ре-рендерится только при изменении users
function UserCount() {
  const usersCount = useUsersStore((state) => state.users.length);
  return <span>{usersCount}</span>;
}
```

### Middleware: immer и devtools

Zustand поддерживает middleware для расширения функциональности:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface CartStore {
  items: Array<{ id: string; quantity: number }>;
  addItem: (id: string) => void;
}

export const useCartStore = create<CartStore>()(
  devtools(
    immer((set) => ({
      items: [],
      addItem: (id) =>
        set((state) => {
          const existing = state.items.find((item) => item.id === id);
          if (existing) {
            existing.quantity += 1;
          } else {
            state.items.push({ id, quantity: 1 });
          }
        }),
    }))
  )
);
```

## Сравнение по ключевым критериям

### Объём кода и сложность настройки

RTK требует больше начального кода: настройка стора, слайсы, типизация хуков, обёртка в `Provider`. Это оправдано для больших приложений, где структура важна.

Zustand запускается за 5 строк. Нет провайдеров, нет шаблонного кода. Это делает его идеальным для быстрого старта и небольших приложений.

### Принцип работы

RTK следует принципу однонаправленного потока данных: `action -> reducer -> store -> view`. Это предсказуемо и легко отлаживается, но требует понимания концепции.

Zustand — это просто объект с состоянием и методами для его изменения. Нет действий, нет редьюсеров. Если вы знаете ООП, принцип интуитивно понятен.

### Производительность

Оба инструмента производительны при правильном использовании. RTK использует `react-redux` с механизмом подписок — компонент обновляется только когда изменяется выбранный срез состояния. Zustand работает аналогично через селекторы.

Zustand имеет меньший размер бандла (~1 КБ против ~11 КБ для react-redux + RTK), что важно для производительности на мобильных устройствах.

### DevTools и отладка

RTK имеет встроенную поддержку Redux DevTools без дополнительной настройки. Вы видите каждый задиспатченный экшен, дерево состояния, можете перематывать время (time-travel debugging).

Zustand также поддерживает Redux DevTools через middleware `devtools`, но эта интеграция менее зрелая.

### Работа вне компонентов

Zustand позволяет обращаться к стору вне React-компонентов напрямую:

```typescript
// Доступ к состоянию вне компонентов
const state = useCounterStore.getState();
const unsubscribe = useCounterStore.subscribe(
  (state) => console.log('value changed:', state.value)
);

// Обновление состояния вне компонентов
useCounterStore.setState({ value: 100 });
```

В RTK для этого нужно импортировать `store` и вызывать `store.dispatch()` или `store.getState()` — это возможно, но менее элегантно.

### TypeScript

Оба инструмента хорошо поддерживают TypeScript. RTK генерирует типы автоматически для экшенов и стейта, но требует явного объявления `RootState` и `AppDispatch`. Zustand выводит типы прямо из определения стора с минимальным boilerplate.

## Когда выбирать Redux Toolkit

RTK — правильный выбор когда:

- **Команда уже знает Redux** — переход на RTK минимален, а накопленные знания сохраняются.
- **Нужна строгая предсказуемость** — однонаправленный поток и явные экшены делают код проще для ревью и аудита.
- **Сложная серверная синхронизация** — RTK Query предоставляет мощный механизм кеширования, дедупликации запросов и инвалидации.
- **Enterprise-приложение** — строгая архитектура помогает поддерживать большие кодовые базы и упрощает onboarding новых разработчиков.
- **Нужен time-travel debugging** — отладка с перемоткой времени незаменима при сложных сценариях воспроизведения багов.

## Когда выбирать Zustand

Zustand — правильный выбор когда:

- **Небольшое или среднее приложение** — не нужно платить сложностью RTK за простые задачи.
- **Быстрый прототип или MVP** — меньше кода, быстрее старт.
- **Несколько независимых сторов** — Zustand поощряет разбиение на отдельные маленькие сторы, что улучшает код-сплиттинг.
- **Нужен доступ к состоянию вне React** — встроенные методы `getState()` и `subscribe()` работают без контекста.
- **Смешивание с другими решениями** — Zustand хорошо уживается рядом с React Query, SWR или локальным состоянием.

## Комбинированный подход

В реальных проектах часто используют оба инструмента вместе:

```typescript
// Zustand для локального UI-состояния
export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  theme: 'light',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));

// RTK + RTK Query для серверных данных
export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => '/products',
    }),
  }),
});
```

Такой подход прагматичен: RTK Query управляет серверным кешем, Zustand — клиентским UI-состоянием.

## Итог

Оба инструмента зрелые, производительные и хорошо протестированные. Выбор зависит от масштаба проекта и потребностей команды:

- **Zustand** — когда нужна простота, скорость разработки и минимальный boilerplate.
- **Redux Toolkit** — когда нужна строгая архитектура, мощная работа с API (RTK Query) или когда команда уже в экосистеме Redux.

Нет универсального ответа. Если проект маленький — начните с Zustand. Если растёт и усложняется, или команда большая — RTK даст нужную предсказуемость.

Чтобы углубиться в управление состоянием, компоненты, хуки и современные паттерны React — изучите курс по React на PurpleSchool: https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=zustand-vs-redux-toolkit
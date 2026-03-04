---
metaTitle: Redux Toolkit - современный Redux для React-приложений
metaDescription: Полное руководство по Redux Toolkit — официальному набору инструментов для Redux. createSlice, createAsyncThunk, configureStore, RTK Query, TypeScript и лучшие практики
author: Олег Марков
title: Redux Toolkit - современный Redux
preview: Узнайте, как использовать Redux Toolkit для упрощения работы с Redux — от createSlice и createAsyncThunk до настройки стора с middleware и полноценной TypeScript-интеграции
---

## Введение

Redux — один из самых популярных инструментов управления состоянием в экосистеме React. Однако классический Redux долгое время критиковали за чрезмерное количество шаблонного кода: для каждого действия нужно было писать константу, action creator и обработчик в reducer. В больших приложениях это превращалось в сотни строк однотипного кода.

**Redux Toolkit** (сокращённо RTK) — это официальный, рекомендуемый командой Redux набор инструментов, который решает эти проблемы. RTK упрощает написание Redux-кода, устраняет распространённые ошибки и включает в себя всё необходимое для работы с Redux «из коробки».

В этой статье вы узнаете, как настроить стор с Redux Toolkit, создавать слайсы, обрабатывать асинхронные операции и использовать TypeScript с RTK.

## Почему Redux Toolkit

Прежде чем переходить к коду, давайте разберёмся, зачем вообще нужен RTK, если есть классический Redux.

### Проблемы классического Redux

```javascript
// Классический Redux: много шаблонного кода

// 1. Константы для типов действий
const INCREMENT = 'counter/INCREMENT';
const DECREMENT = 'counter/DECREMENT';
const RESET = 'counter/RESET';

// 2. Action creators
const increment = () => ({ type: INCREMENT });
const decrement = () => ({ type: DECREMENT });
const reset = () => ({ type: RESET });

// 3. Reducer с иммутабельными обновлениями вручную
function counterReducer(state = { value: 0 }, action) {
  switch (action.type) {
    case INCREMENT:
      return { ...state, value: state.value + 1 };
    case DECREMENT:
      return { ...state, value: state.value - 1 };
    case RESET:
      return { ...state, value: 0 };
    default:
      return state;
  }
}

// 4. Настройка стора с middleware
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
const store = createStore(counterReducer, applyMiddleware(thunk));
```

Это только для одного простого счётчика. В реальных приложениях с десятками сущностей такой код становится неуправляемым.

### Что даёт Redux Toolkit

```javascript
// Тот же счётчик с Redux Toolkit
import { createSlice, configureStore } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1; },
    decrement: (state) => { state.value -= 1; },
    reset: (state) => { state.value = 0; },
  },
});

export const { increment, decrement, reset } = counterSlice.actions;

const store = configureStore({
  reducer: { counter: counterSlice.reducer },
});
```

Код стал в 3 раза короче, не нужно писать константы и action creators вручную, а иммутабельность обеспечивается автоматически через Immer.

## Установка

```bash
npm install @reduxjs/toolkit react-redux
# или
yarn add @reduxjs/toolkit react-redux
# или
pnpm add @reduxjs/toolkit react-redux
```

RTK уже включает `redux`, `immer`, `redux-thunk` и `reselect` — устанавливать их отдельно не нужно.

## configureStore

`configureStore` — замена классическому `createStore`. Автоматически настраивает Redux DevTools Extension и добавляет `redux-thunk` middleware.

```typescript
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';
import userReducer from './userSlice';
import postsReducer from './postsSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
    posts: postsReducer,
  },
  // middleware по умолчанию уже включает thunk
  // можно расширить дополнительными middleware
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(myCustomMiddleware),
  // DevTools включены автоматически в development
  devTools: process.env.NODE_ENV !== 'production',
});

// Типы для TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Подключение стора к React

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
```

## createSlice

`createSlice` — основной инструмент RTK. Он объединяет в одном объекте начальное состояние, reducers и автоматически генерирует action creators.

### Базовый пример

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CounterState {
  value: number;
  step: number;
}

const initialState: CounterState = {
  value: 0,
  step: 1,
};

const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    // Мутирующий стиль благодаря Immer — внутри Jotai преобразуется в иммутабельное обновление
    increment(state) {
      state.value += state.step;
    },
    decrement(state) {
      state.value -= state.step;
    },
    // PayloadAction указывает тип payload
    incrementByAmount(state, action: PayloadAction<number>) {
      state.value += action.payload;
    },
    setStep(state, action: PayloadAction<number>) {
      state.step = action.payload;
    },
    reset() {
      // Возврат нового состояния вместо мутации
      return initialState;
    },
  },
});

// Экспортируем action creators
export const { increment, decrement, incrementByAmount, setStep, reset } =
  counterSlice.actions;

// Экспортируем reducer
export default counterSlice.reducer;
```

### Immer и мутирующий стиль

RTK использует Immer «под капотом», что позволяет писать мутирующий код в reducers:

```typescript
reducers: {
  // Это безопасно — Immer создаст новый объект
  addUser(state, action: PayloadAction<User>) {
    state.users.push(action.payload); // выглядит как мутация, но это не так
    state.total++;
  },
  updateUser(state, action: PayloadAction<{ id: string; changes: Partial<User> }>) {
    const user = state.users.find(u => u.id === action.payload.id);
    if (user) {
      Object.assign(user, action.payload.changes); // тоже безопасно
    }
  },
  removeUser(state, action: PayloadAction<string>) {
    const index = state.users.findIndex(u => u.id === action.payload);
    if (index !== -1) {
      state.users.splice(index, 1); // мутируем массив — OK!
    }
  },
}
```

## createAsyncThunk

Для асинхронных операций RTK предоставляет `createAsyncThunk`. Он автоматически создаёт action creators для трёх состояний: `pending`, `fulfilled`, `rejected`.

### Базовый пример

```typescript
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

interface User {
  id: number;
  name: string;
  email: string;
}

interface UsersState {
  users: User[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Создаём async thunk
export const fetchUsers = createAsyncThunk(
  'users/fetchAll', // уникальный тип действия
  async () => {
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    if (!response.ok) {
      throw new Error('Не удалось загрузить пользователей');
    }
    return response.json() as Promise<User[]>;
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    status: 'idle',
    error: null,
  } as UsersState,
  reducers: {},
  // extraReducers обрабатывает действия из другихслайсов или thunk'ов
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Неизвестная ошибка';
      });
  },
});

export default usersSlice.reducer;
```

### Использование в компоненте

```tsx
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers } from './usersSlice';
import type { RootState, AppDispatch } from './store';

function UsersList() {
  const dispatch = useDispatch<AppDispatch>();
  const { users, status, error } = useSelector(
    (state: RootState) => state.users
  );

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchUsers());
    }
  }, [status, dispatch]);

  if (status === 'loading') return <p>Загрузка...</p>;
  if (status === 'failed') return <p>Ошибка: {error}</p>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name} — {user.email}</li>
      ))}
    </ul>
  );
}
```

### Передача параметров и обработка ошибок

```typescript
// Параметры и обработка ошибок API
export const fetchUserById = createAsyncThunk(
  'users/fetchById',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.status === 404) {
        return rejectWithValue('Пользователь не найден');
      }
      if (!response.ok) {
        return rejectWithValue(`Ошибка сервера: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue('Сетевая ошибка');
    }
  }
);

// Обработка в extraReducers
.addCase(fetchUserById.rejected, (state, action) => {
  state.status = 'failed';
  // action.payload содержит значение из rejectWithValue
  state.error = action.payload as string;
})
```

### Отмена запросов

```typescript
export const fetchData = createAsyncThunk(
  'data/fetch',
  async (_, { signal }) => {
    const response = await fetch('/api/data', { signal });
    return response.json();
  }
);

// В компоненте
useEffect(() => {
  const promise = dispatch(fetchData());

  return () => {
    // Отменяем запрос при размонтировании компонента
    promise.abort();
  };
}, [dispatch]);
```

## Типизированные хуки

Для удобной работы с TypeScript рекомендуется создавать типизированные версии `useSelector` и `useDispatch`:

```typescript
// src/app/hooks.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Используйте эти хуки вместо стандартных во всём приложении
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

```tsx
// В компоненте
import { useAppDispatch, useAppSelector } from '../app/hooks';

function Counter() {
  const dispatch = useAppDispatch(); // типизированный dispatch
  const count = useAppSelector((state) => state.counter.value); // тип выводится автоматически

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => dispatch(increment())}>+</button>
    </div>
  );
}
```

## createSelector и мемоизация

RTK реэкспортирует `createSelector` из библиотеки Reselect для создания мемоизированных селекторов:

```typescript
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './store';

// Базовые селекторы
const selectAllTodos = (state: RootState) => state.todos.items;
const selectFilter = (state: RootState) => state.todos.filter;

// Мемоизированный производный селектор
// Пересчитывается только если изменились items или filter
export const selectFilteredTodos = createSelector(
  [selectAllTodos, selectFilter],
  (todos, filter) => {
    switch (filter) {
      case 'active':
        return todos.filter((t) => !t.completed);
      case 'completed':
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  }
);

// Селектор с параметром
export const selectTodoById = createSelector(
  [selectAllTodos, (_state: RootState, id: string) => id],
  (todos, id) => todos.find((t) => t.id === id)
);
```

## createEntityAdapter

Для работы со списками сущностей RTK предоставляет `createEntityAdapter` — набор готовых операций CRUD:

```typescript
import { createEntityAdapter, createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface Post {
  id: string;
  title: string;
  body: string;
  authorId: string;
}

// Создаём адаптер
const postsAdapter = createEntityAdapter<Post>({
  // Опциональная сортировка
  sortComparer: (a, b) => a.title.localeCompare(b.title),
});

// Адаптер генерирует начальное состояние { ids: [], entities: {} }
const initialState = postsAdapter.getInitialState({
  status: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
  error: null as string | null,
});

export const fetchPosts = createAsyncThunk('posts/fetchAll', async () => {
  const response = await fetch('/api/posts');
  return response.json() as Promise<Post[]>;
});

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    // Готовые CRUD-операции от адаптера
    postAdded: postsAdapter.addOne,
    postUpdated: postsAdapter.updateOne,
    postRemoved: postsAdapter.removeOne,
    postsCleared: postsAdapter.removeAll,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Устанавливаем все загруженные посты
        postsAdapter.setAll(state, action.payload);
      });
  },
});

// Адаптер генерирует селекторы
export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
  selectTotal: selectTotalPosts,
} = postsAdapter.getSelectors((state: RootState) => state.posts);

export const { postAdded, postUpdated, postRemoved } = postsSlice.actions;
export default postsSlice.reducer;
```

## Практический пример: корзина покупок

Соберём реальный пример — приложение с корзиной покупок:

```typescript
// features/cart/cartSlice.ts
import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  promoCode: string | null;
  discount: number;
}

const initialState: CartState = {
  items: [],
  isOpen: false,
  promoCode: null,
  discount: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<Omit<CartItem, 'quantity'>>) {
      const existingItem = state.items.find((i) => i.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity++;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    updateQuantity(
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter((i) => i.id !== action.payload.id);
        } else {
          item.quantity = action.payload.quantity;
        }
      }
    },
    clearCart(state) {
      state.items = [];
      state.promoCode = null;
      state.discount = 0;
    },
    toggleCart(state) {
      state.isOpen = !state.isOpen;
    },
    applyPromo(state, action: PayloadAction<string>) {
      const promoCodes: Record<string, number> = {
        SAVE10: 0.1,
        SAVE20: 0.2,
        HALFOFF: 0.5,
      };
      const discount = promoCodes[action.payload.toUpperCase()];
      if (discount) {
        state.promoCode = action.payload;
        state.discount = discount;
      }
    },
  },
});

// Селекторы
const selectCartItems = (state: RootState) => state.cart.items;
const selectDiscount = (state: RootState) => state.cart.discount;

export const selectCartTotal = createSelector(
  [selectCartItems, selectDiscount],
  (items, discount) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return subtotal * (1 - discount);
  }
);

export const selectCartItemCount = createSelector(
  [selectCartItems],
  (items) => items.reduce((sum, item) => sum + item.quantity, 0)
);

export const {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  toggleCart,
  applyPromo,
} = cartSlice.actions;

export default cartSlice.reducer;
```

```tsx
// features/cart/CartButton.tsx
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { toggleCart, selectCartItemCount } from './cartSlice';

function CartButton() {
  const dispatch = useAppDispatch();
  const itemCount = useAppSelector(selectCartItemCount);

  return (
    <button onClick={() => dispatch(toggleCart())}>
      Корзина {itemCount > 0 && <span>({itemCount})</span>}
    </button>
  );
}
```

## Middleware

RTK позволяет добавлять и настраивать middleware в `configureStore`:

```typescript
import { configureStore } from '@reduxjs/toolkit';

// Кастомный logger middleware
const loggerMiddleware = (storeAPI) => (next) => (action) => {
  console.group(action.type);
  console.log('Dispatched:', action);
  const result = next(action);
  console.log('Next state:', storeAPI.getState());
  console.groupEnd();
  return result;
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Настройка встроенной проверки сериализации
      serializableCheck: {
        ignoredActions: ['auth/setToken'],
        ignoredPaths: ['auth.expiresAt'],
      },
    }).concat(loggerMiddleware),
});
```

## Структура проекта с RTK

Redux Toolkit рекомендует **Feature-based структуру** (также называемую «ducks» или «slice» паттерном):

```
src/
├── app/
│   ├── store.ts          # configureStore
│   └── hooks.ts          # useAppDispatch, useAppSelector
├── features/
│   ├── counter/
│   │   ├── counterSlice.ts
│   │   ├── Counter.tsx
│   │   └── counterAPI.ts   # API-функции
│   ├── users/
│   │   ├── usersSlice.ts
│   │   ├── UsersList.tsx
│   │   └── usersAPI.ts
│   └── posts/
│       ├── postsSlice.ts
│       └── PostsList.tsx
└── App.tsx
```

Каждая «фича» (feature) содержит всё, что нужно для работы: слайс, компоненты и API-функции.

## Сравнение Redux Toolkit с другими подходами

| Аспект | Redux Toolkit | Zustand | Jotai |
|--------|--------------|---------|-------|
| Концепция | Централизованный стор | Сторы по необходимости | Атомы |
| Размер | ~40 КБ | ~3 КБ | ~3 КБ |
| Шаблонный код | Средний (меньше чем классический Redux) | Минимальный | Минимальный |
| DevTools | Полная поддержка | Ограниченная | jotai-devtools |
| Async | createAsyncThunk | Вручную или с middleware | Нативный Suspense |
| TypeScript | Отличный | Хороший | Отличный |
| SSR | Поддерживается | Поддерживается | Поддерживается |
| Кривая обучения | Средняя | Низкая | Низкая |

RTK лучше всего подходит для:
- Крупных приложений с командой разработчиков
- Когда важна предсказуемость и отладка
- Проектов, уже использующих Redux
- Случаев, когда нужна мощь Redux DevTools

## Заключение

Redux Toolkit — это правильный способ писать Redux-код в 2024 году. Он устраняет главные болевые точки классического Redux:

- **`createSlice`** автоматически создаёт action creators и типы действий
- **Immer** позволяет писать мутирующий код без потери иммутабельности
- **`createAsyncThunk`** стандартизирует обработку асинхронных операций
- **`createEntityAdapter`** упрощает работу со списками сущностей
- **`createSelector`** обеспечивает мемоизированные производные данные
- **`configureStore`** настраивает DevTools и middleware автоматически

Если вы использовали классический Redux и откладывали переход на RTK — сейчас самое время. Миграция не ломает существующий код, а новые возможности сразу же улучшат Developer Experience.

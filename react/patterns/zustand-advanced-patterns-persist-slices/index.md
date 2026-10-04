---
metaTitle: "Zustand: persist middleware и паттерн slices в React"
metaDescription: "Продвинутые паттерны Zustand: persist middleware для сохранения состояния, паттерн slices для масштабирования, devtools и оптимизация подписок."
author: "Антон Ларичев"
title: "Zustand: продвинутые паттерны, persist middleware и slices"
preview: "Продвинутые техники работы с Zustand: persist middleware, паттерн slices, devtools-интеграция и оптимизация ре-рендеров в React-приложениях."
---

Zustand — минималистичная библиотека для управления состоянием в React. Базовое использование освоить несложно, но в реальных проектах возникают задачи, которые требуют более глубокого понимания: сохранение состояния между перезагрузками, разбивка большого стора на независимые части, интеграция с DevTools и тонкая настройка подписок. Именно этим паттернам и посвящена данная статья.

## Persist middleware: сохранение состояния

Мiddleware `persist` из пакета `zustand/middleware` позволяет автоматически сохранять состояние в `localStorage`, `sessionStorage` или любом другом хранилище и восстанавливать его при загрузке страницы.

### Базовая настройка persist

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserSettings {
  theme: 'light' | 'dark';
  language: string;
  fontSize: number;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: string) => void;
  setFontSize: (size: number) => void;
}

export const useUserSettingsStore = create<UserSettings>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'ru',
      fontSize: 16,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setFontSize: (size) => set({ fontSize: size }),
    }),
    {
      name: 'user-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

При первом рендере Zustand проверит `localStorage` по ключу `user-settings`. Если данные есть — гидратирует стор. Если нет — использует начальные значения.

### Частичное сохранение через partialize

Нередко сохранять всё состояние нецелесообразно — например, временные флаги загрузки или вычисляемые данные не нужно персистить. Опция `partialize` позволяет выбрать только нужные поля:

```typescript
interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isLoading: false,
      error: null,
      addItem: (item) =>
        set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
```

Теперь в `localStorage` попадут только `items`. Флаги `isLoading` и `error` не сохраняются.

### Версионирование и миграция

При изменении структуры стора старые сохранённые данные могут быть несовместимы с новым кодом. `persist` поддерживает версионирование через опции `version` и `migrate`:

```typescript
interface SettingsV2 {
  theme: 'light' | 'dark' | 'system';
  locale: string;
  accessibility: {
    fontSize: number;
    highContrast: boolean;
  };
}

export const useSettingsStore = create<SettingsV2>()(
  persist(
    (set) => ({
      theme: 'system',
      locale: 'ru',
      accessibility: {
        fontSize: 16,
        highContrast: false,
      },
    }),
    {
      name: 'settings',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 1) {
          return {
            theme: persistedState.theme,
            locale: persistedState.language,
            accessibility: {
              fontSize: persistedState.fontSize ?? 16,
              highContrast: false,
            },
          };
        }
        return persistedState;
      },
    }
  )
);
```

Если в `localStorage` лежит стор версии `1`, функция `migrate` преобразует его в формат версии `2` перед гидратацией.

### Кастомное хранилище

Вместо `localStorage` можно использовать любое хранилище, реализующее интерфейс `StateStorage`:

```typescript
import { StateStorage } from 'zustand/middleware';

const asyncStorage: StateStorage = {
  getItem: async (name) => {
    const value = await someAsyncDB.get(name);
    return value ?? null;
  },
  setItem: async (name, value) => {
    await someAsyncDB.set(name, value);
  },
  removeItem: async (name) => {
    await someAsyncDB.delete(name);
  },
};

export const useStore = create<MyState>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'my-store',
      storage: createJSONStorage(() => asyncStorage),
    }
  )
);
```

## Паттерн Slices: масштабирование стора

Когда приложение растёт, единый большой стор становится трудно поддерживать. Паттерн **slices** позволяет разбить стор на логически независимые части и затем объединить их в один стор.

### Создание слайсов

Каждый слайс — это функция, которая принимает `set`, `get` и возвращает часть стора:

```typescript
import { StateCreator } from 'zustand';

// Слайс для авторизации
interface AuthSlice {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const createAuthSlice: StateCreator<
  AuthSlice & CartSlice & UISlice,
  [],
  [],
  AuthSlice
> = (set) => ({
  user: null,
  isAuthenticated: false,
  login: async (credentials) => {
    const user = await authService.login(credentials);
    set({ user, isAuthenticated: true });
  },
  logout: () => set({ user: null, isAuthenticated: false }),
});

// Слайс для корзины
interface CartSlice {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  getTotal: () => number;
}

const createCartSlice: StateCreator<
  AuthSlice & CartSlice & UISlice,
  [],
  [],
  CartSlice
> = (set, get) => ({
  cartItems: [],
  addToCart: (item) =>
    set((state) => ({ cartItems: [...state.cartItems, item] })),
  removeFromCart: (id) =>
    set((state) => ({
      cartItems: state.cartItems.filter((i) => i.id !== id),
    })),
  getTotal: () =>
    get().cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
});

// Слайс для UI
interface UISlice {
  isSidebarOpen: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  openModal: (name: string) => void;
  closeModal: () => void;
}

const createUISlice: StateCreator<
  AuthSlice & CartSlice & UISlice,
  [],
  [],
  UISlice
> = (set) => ({
  isSidebarOpen: false,
  activeModal: null,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),
});
```

### Объединение слайсов в единый стор

```typescript
import { create } from 'zustand';

type RootStore = AuthSlice & CartSlice & UISlice;

export const useRootStore = create<RootStore>()((...args) => ({
  ...createAuthSlice(...args),
  ...createCartSlice(...args),
  ...createUISlice(...args),
}));
```

Теперь можно использовать любой слайс из единого хука:

```typescript
const { user, login } = useRootStore((state) => ({
  user: state.user,
  login: state.login,
}));

const { cartItems, addToCart } = useRootStore((state) => ({
  cartItems: state.cartItems,
  addToCart: state.addToCart,
}));
```

### Persist с паттерном slices

Обернуть в `persist` можно весь объединённый стор, или применить `partialize` для выборочного сохранения:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useRootStore = create<RootStore>()(
  persist(
    (...args) => ({
      ...createAuthSlice(...args),
      ...createCartSlice(...args),
      ...createUISlice(...args),
    }),
    {
      name: 'root-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        cartItems: state.cartItems,
      }),
    }
  )
);
```

## Devtools middleware

Интеграция с Redux DevTools позволяет отслеживать все изменения состояния в браузере:

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export const useRootStore = create<RootStore>()(
  devtools(
    persist(
      (...args) => ({
        ...createAuthSlice(...args),
        ...createCartSlice(...args),
        ...createUISlice(...args),
      }),
      { name: 'root-store' }
    ),
    { name: 'RootStore', enabled: process.env.NODE_ENV !== 'production' }
  )
);
```

Для именования действий в DevTools используйте второй аргумент `set`:

```typescript
const createCartSlice: StateCreator<RootStore, [], [], CartSlice> = (set) => ({
  cartItems: [],
  addToCart: (item) =>
    set(
      (state) => ({ cartItems: [...state.cartItems, item] }),
      false,
      'cart/addToCart'
    ),
  removeFromCart: (id) =>
    set(
      (state) => ({ cartItems: state.cartItems.filter((i) => i.id !== id) }),
      false,
      'cart/removeFromCart'
    ),
});
```

Теперь в Redux DevTools каждое действие будет иметь понятное имя вместо анонимного `anonymous`.

## Оптимизация подписок и ре-рендеров

### Использование селекторов

По умолчанию компонент ре-рендерится при любом изменении состояния в сторе. Передавайте селектор, чтобы компонент реагировал только на нужную часть:

```typescript
// Плохо: компонент ре-рендерится при любом изменении стора
const state = useRootStore();

// Хорошо: ре-рендер только при изменении cartItems
const cartItems = useRootStore((state) => state.cartItems);

// Хорошо: несколько полей без создания нового объекта каждый рендер
const { user, isAuthenticated } = useRootStore(
  useShallow((state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }))
);
```

### useShallow для объектных селекторов

Если селектор возвращает объект, Zustand по умолчанию сравнивает результат по ссылке. Каждый вызов создаёт новый объект — компонент всегда ре-рендерится. Решение — `useShallow` из `zustand/react/shallow`:

```typescript
import { useShallow } from 'zustand/react/shallow';

function CartSummary() {
  const { itemCount, total } = useRootStore(
    useShallow((state) => ({
      itemCount: state.cartItems.length,
      total: state.getTotal(),
    }))
  );

  return (
    <div>
      <span>{itemCount} товаров</span>
      <span>{total} ₽</span>
    </div>
  );
}
```

### Подписка вне React: subscribe

Для side-эффектов, которые не должны вызывать ре-рендер компонента, используйте `subscribe`:

```typescript
import { useEffect } from 'react';

function SyncCartWithServer() {
  useEffect(() => {
    const unsubscribe = useRootStore.subscribe(
      (state) => state.cartItems,
      (cartItems) => {
        syncService.updateCart(cartItems);
      },
      { equalityFn: (a, b) => a.length === b.length }
    );

    return unsubscribe;
  }, []);

  return null;
}
```

Первый аргумент — селектор, второй — обработчик, третий — опции с функцией сравнения.

## Паттерн: атомарные сторы

Альтернатива слайсам — создание отдельных маленьких сторов для разных доменов. Это упрощает тестирование и исключает проблемы с взаимозависимостью:

```typescript
// stores/auth.store.ts
export const useAuthStore = create<AuthSlice>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (credentials) => { /* ... */ },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'auth' }
  )
);

// stores/cart.store.ts
export const useCartStore = create<CartSlice>()(
  persist(
    (set, get) => ({
      cartItems: [],
      addToCart: (item) => set((state) => ({ cartItems: [...state.cartItems, item] })),
      removeFromCart: (id) =>
        set((state) => ({ cartItems: state.cartItems.filter((i) => i.id !== id) })),
      getTotal: () =>
        get().cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    { name: 'cart' }
  )
);
```

Если между сторами нужна связь, один стор может вызывать методы другого через `getState`:

```typescript
const createCartSlice: StateCreator<CartSlice> = (set, get) => ({
  cartItems: [],
  checkout: async () => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('Необходима авторизация');
    await orderService.create({ userId: user.id, items: get().cartItems });
    set({ cartItems: [] });
  },
});
```

## Имитация immutable-апдейтов с Immer

Для сложных вложенных обновлений удобно использовать `immer` middleware:

```typescript
import { immer } from 'zustand/middleware/immer';

interface TreeStore {
  nodes: Record<string, TreeNode>;
  updateNodeTitle: (id: string, title: string) => void;
  addChild: (parentId: string, child: TreeNode) => void;
}

export const useTreeStore = create<TreeStore>()(
  immer((set) => ({
    nodes: {},
    updateNodeTitle: (id, title) =>
      set((state) => {
        state.nodes[id].title = title;
      }),
    addChild: (parentId, child) =>
      set((state) => {
        state.nodes[child.id] = child;
        state.nodes[parentId].children.push(child.id);
      }),
  }))
);
```

С `immer` можно мутировать состояние напрямую внутри `set` — библиотека создаёт иммутабельную копию автоматически.

## Тестирование сторов

За счёт отсутствия React-зависимости сторы Zustand легко тестировать в изоляции:

```typescript
import { act } from '@testing-library/react';
import { useCartStore } from './cart.store';

beforeEach(() => {
  useCartStore.setState({ cartItems: [] });
});

test('addToCart добавляет товар', () => {
  const { addToCart } = useCartStore.getState();

  act(() => {
    addToCart({ id: '1', name: 'Книга', price: 500, quantity: 1 });
  });

  expect(useCartStore.getState().cartItems).toHaveLength(1);
  expect(useCartStore.getState().cartItems[0].id).toBe('1');
});

test('getTotal считает сумму', () => {
  useCartStore.setState({
    cartItems: [
      { id: '1', name: 'A', price: 100, quantity: 2 },
      { id: '2', name: 'B', price: 300, quantity: 1 },
    ],
  });

  const total = useCartStore.getState().getTotal();
  expect(total).toBe(500);
});
```

Метод `setState` позволяет устанавливать любое начальное состояние, а `getState` — читать актуальное без хуков.

## Рекомендации по структуре проекта

Для средних и крупных проектов рекомендуется такая структура:

```
src/
  stores/
    slices/
      auth.slice.ts       # StateCreator для auth
      cart.slice.ts       # StateCreator для cart
      ui.slice.ts         # StateCreator для ui
    root.store.ts         # Объединение слайсов + middleware
    auth.store.ts         # Атомарный стор (если не используются slices)
    cart.store.ts
  hooks/
    useAuth.ts            # Обёртка над useRootStore с нужным селектором
    useCart.ts
```

Вынос хуков-обёрток помогает скрыть детали реализации стора от компонентов и упрощает рефакторинг.

## Итог

Zustand предоставляет мощный набор инструментов для работы с состоянием в React-приложениях. `persist` middleware решает задачу сохранения данных между сессиями с поддержкой миграций и частичной персистентности. Паттерн slices помогает масштабировать стор без потери читаемости. `devtools` упрощают отладку, а правильные селекторы и `useShallow` исключают лишние ре-рендеры.

Эти паттерны хорошо сочетаются друг с другом и позволяют строить предсказуемую архитектуру состояния даже в крупных React-приложениях.

Чтобы глубже разобраться с управлением состоянием и современными паттернами разработки на React, изучите курс на PurpleSchool: https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=zustand-advanced-patterns
---
metaTitle: "Zustand в Next.js: управление состоянием приложения"
metaDescription: "Как использовать Zustand в Next.js App Router: создание стора, работа с серверными и клиентскими компонентами, персистентность и TypeScript."
author: "Антон Ларичев"
title: "Next.js с Zustand: управление состоянием"
preview: "Подробный разбор интеграции Zustand в Next.js: создание сторов, обход ограничений SSR, персистентность состояния и паттерны для масштабируемых приложений."
---

## Что такое Zustand и зачем он в Next.js

Zustand — минималистичная библиотека управления состоянием для React. В отличие от Redux, она не требует бойлерплейта: нет экшенов, редьюсеров и провайдеров. В отличие от контекста React, не вызывает лишних ре-рендеров при изменении несвязанных частей состояния.

В Next.js App Router появляется дополнительная сложность: серверные и клиентские компоненты работают в разных окружениях. Zustand — клиентская библиотека, и использовать её нужно с учётом этого разделения. В статье разберём, как правильно встроить Zustand в Next.js-приложение.

## Установка

```bash
npm install zustand
```

Zustand не требует дополнительных зависимостей и работает с TypeScript из коробки.

## Создание стора

Стор в Zustand — это хук, созданный функцией `create`. Определим простой стор для корзины покупок.

```typescript
// store/cart-store.ts
import { create } from 'zustand'

type CartItem = {
  id: number
  name: string
  price: number
  quantity: number
}

type CartStore = {
  items: CartItem[]
  totalItems: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  totalItems: 0,

  addItem: (item) => {
    const existing = get().items.find((i) => i.id === item.id)
    if (existing) {
      set((state) => ({
        items: state.items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
        totalItems: state.totalItems + 1,
      }))
    } else {
      set((state) => ({
        items: [...state.items, { ...item, quantity: 1 }],
        totalItems: state.totalItems + 1,
      }))
    }
  },

  removeItem: (id) => {
    const item = get().items.find((i) => i.id === id)
    if (!item) return
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
      totalItems: state.totalItems - item.quantity,
    }))
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id)
      return
    }
    set((state) => {
      const item = state.items.find((i) => i.id === id)
      const diff = quantity - (item?.quantity ?? 0)
      return {
        items: state.items.map((i) =>
          i.id === id ? { ...i, quantity } : i
        ),
        totalItems: state.totalItems + diff,
      }
    })
  },

  clearCart: () => set({ items: [], totalItems: 0 }),
}))
```

Функция `set` обновляет состояние (можно передавать как объект, так и функцию от предыдущего состояния). Функция `get` читает текущее состояние внутри экшенов — удобно, когда нужны данные из стора без подписки на изменения.

## Использование стора в клиентских компонентах

Поскольку Zustand работает на клиенте, компоненты, использующие стор, должны быть помечены директивой `'use client'`.

```typescript
// components/cart-button.tsx
'use client'

import { useCartStore } from '@/store/cart-store'

export function CartButton() {
  const totalItems = useCartStore((state) => state.totalItems)

  return (
    <button className="relative">
      Корзина
      {totalItems > 0 && (
        <span className="badge">{totalItems}</span>
      )}
    </button>
  )
}
```

Обратите внимание на селектор `(state) => state.totalItems` — компонент подписывается только на `totalItems` и перерендерится лишь при его изменении. Если написать `useCartStore()` без селектора, компонент будет перерендериваться при любом изменении стора.

```typescript
// components/product-card.tsx
'use client'

import { useCartStore } from '@/store/cart-store'

type ProductCardProps = {
  id: number
  name: string
  price: number
}

export function ProductCard({ id, name, price }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  return (
    <div>
      <h3>{name}</h3>
      <p>{price} ₽</p>
      <button onClick={() => addItem({ id, name, price })}>
        В корзину
      </button>
    </div>
  )
}
```

## Проблема гидратации в Next.js

App Router рендерит HTML на сервере, а затем гидратирует его на клиенте. Если стор инициализируется с данными на клиенте, возникает несоответствие между серверным HTML и клиентским деревом — ошибка гидратации.

Пример проблемного кода:

```typescript
// ПЛОХО: может вызвать ошибку гидратации
'use client'

export function CartCount() {
  const totalItems = useCartStore((state) => state.totalItems)
  // На сервере: 0, на клиенте после гидратации: может быть другим
  return <span>{totalItems}</span>
}
```

Решение — хук `useEffect` для отложенного отображения данных, зависящих от клиентского состояния:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cart-store'

export function CartCount() {
  const totalItems = useCartStore((state) => state.totalItems)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <span>0</span>

  return <span>{totalItems}</span>
}
```

Либо используйте компонент `dynamic` с `ssr: false` для полного отключения серверного рендера конкретного компонента:

```typescript
// app/layout.tsx (или любой серверный компонент)
import dynamic from 'next/dynamic'

const CartButton = dynamic(
  () => import('@/components/cart-button').then((m) => m.CartButton),
  { ssr: false }
)
```

## Стор с провайдером для изоляции между запросами

По умолчанию глобальный стор Zustand — синглтон. Это нормально для клиентских приложений, но в Next.js один экземпляр стора может быть использован несколькими пользователями при серверном рендере, если неправильно настроить архитектуру.

Для надёжной изоляции используют паттерн «стор через контекст» — стор создаётся на уровне провайдера, а не глобально:

```typescript
// store/cart-store-context.tsx
'use client'

import { createContext, useContext, useRef } from 'react'
import { createStore, useStore } from 'zustand'

type CartState = {
  items: CartItem[]
  totalItems: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  clearCart: () => void
}

type CartStore = ReturnType<typeof createCartStore>

function createCartStore() {
  return createStore<CartState>((set) => ({
    items: [],
    totalItems: 0,
    addItem: (item) =>
      set((state) => ({
        items: [...state.items, { ...item, quantity: 1 }],
        totalItems: state.totalItems + 1,
      })),
    clearCart: () => set({ items: [], totalItems: 0 }),
  }))
}

const CartContext = createContext<CartStore | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<CartStore | null>(null)
  if (!storeRef.current) {
    storeRef.current = createCartStore()
  }
  return (
    <CartContext.Provider value={storeRef.current}>
      {children}
    </CartContext.Provider>
  )
}

export function useCartStore<T>(selector: (state: CartState) => T): T {
  const store = useContext(CartContext)
  if (!store) throw new Error('useCartStore must be used within CartProvider')
  return useStore(store, selector)
}
```

Провайдер подключается в корневом layout:

```typescript
// app/layout.tsx
import { CartProvider } from '@/store/cart-store-context'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
```

## Персистентность состояния

Zustand имеет встроенный middleware `persist` для сохранения состояния в `localStorage` или `sessionStorage`.

```typescript
// store/settings-store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

type SettingsStore = {
  theme: Theme
  language: string
  setTheme: (theme: Theme) => void
  setLanguage: (language: string) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'ru',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    }
  )
)
```

Опция `partialize` позволяет сохранять только нужные части состояния, исключая, например, временные данные или функции.

При использовании `persist` важно учитывать гидратацию. Стор после гидратации может отличаться от начального состояния. Zustand предоставляет хук `useHydration`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/store/settings-store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const theme = useSettingsStore((state) => state.theme)

  useEffect(() => {
    setHydrated(true)
  }, [])

  if (!hydrated) {
    return <div data-theme="system">{children}</div>
  }

  return <div data-theme={theme}>{children}</div>
}
```

## Разбивка на слайсы

Для больших приложений состояние удобно разбивать на слайсы и объединять в один стор:

```typescript
// store/slices/user-slice.ts
import { StateCreator } from 'zustand'

type User = {
  id: string
  name: string
  email: string
}

export type UserSlice = {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  logout: () => void
}

export const createUserSlice: StateCreator<UserSlice> = (set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
})
```

```typescript
// store/slices/ui-slice.ts
import { StateCreator } from 'zustand'

export type UISlice = {
  isSidebarOpen: boolean
  isModalOpen: boolean
  toggleSidebar: () => void
  openModal: () => void
  closeModal: () => void
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  isSidebarOpen: false,
  isModalOpen: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
})
```

```typescript
// store/root-store.ts
import { create } from 'zustand'
import { createUserSlice, UserSlice } from './slices/user-slice'
import { createUISlice, UISlice } from './slices/ui-slice'

type RootStore = UserSlice & UISlice

export const useRootStore = create<RootStore>()((...args) => ({
  ...createUserSlice(...args),
  ...createUISlice(...args),
}))

export const useUserStore = <T>(selector: (state: UserSlice) => T) =>
  useRootStore(selector)

export const useUIStore = <T>(selector: (state: UISlice) => T) =>
  useRootStore(selector)
```

## Immer для иммутабельных обновлений

При работе с глубоко вложенными структурами данных используйте middleware `immer`, чтобы писать мутирующий код, который автоматически превращается в иммутабельные обновления:

```bash
npm install immer
```

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type TodoStore = {
  todos: { id: number; text: string; done: boolean }[]
  toggleTodo: (id: number) => void
  addTodo: (text: string) => void
}

export const useTodoStore = create<TodoStore>()(immer((set) => ({
  todos: [],
  toggleTodo: (id) =>
    set((state) => {
      const todo = state.todos.find((t) => t.id === id)
      if (todo) todo.done = !todo.done
    }),
  addTodo: (text) =>
    set((state) => {
      state.todos.push({ id: Date.now(), text, done: false })
    }),
})))
```

## Тестирование стора

Zustand-сторы легко тестировать, поскольку не требуют React-окружения:

```typescript
// __tests__/cart-store.test.ts
import { useCartStore } from '@/store/cart-store'

describe('CartStore', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], totalItems: 0 })
  })

  it('добавляет товар в корзину', () => {
    const { addItem } = useCartStore.getState()
    addItem({ id: 1, name: 'Ноутбук', price: 50000 })

    const { items, totalItems } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(totalItems).toBe(1)
  })

  it('увеличивает количество при повторном добавлении', () => {
    const { addItem } = useCartStore.getState()
    addItem({ id: 1, name: 'Ноутбук', price: 50000 })
    addItem({ id: 1, name: 'Ноутбук', price: 50000 })

    const { items } = useCartStore.getState()
    expect(items[0].quantity).toBe(2)
  })
})
```

Метод `setState` позволяет сбросить стор перед каждым тестом, а `getState` — получить текущее состояние без React-хука.

## Сравнение подходов

В Next.js App Router для управления состоянием есть несколько вариантов:

- **URL state (searchParams)** — лучший выбор для фильтров, пагинации, поиска. Состояние сохраняется при навигации и доступно на сервере.
- **React Context** — подходит для темы, локали и других редко меняющихся данных. Не требует внешних библиотек.
- **Zustand** — оптимален для корзины, аутентификации, сложного UI-состояния. Не вызывает лишних ре-рендеров, легко тестируется.
- **Server state (React Query / SWR)** — для данных с сервера: кэширование, инвалидация, фоновое обновление.

Zustand не заменяет серверный стейт-менеджмент — используйте его только для клиентского состояния, которое не приходит с сервера.

## Практические рекомендации

Один файл на один стор — не складывайте весь стейт в один гигантский файл. Разбивайте по доменам: `cart-store`, `auth-store`, `ui-store`.

Пишите селекторы — никогда не используйте `useCartStore()` без аргумента в компонентах. Всегда выбирайте минимально необходимую часть состояния.

Не храните данные, которые можно вычислить — если `totalPrice` вычисляется из `items`, считайте его в компоненте или через `useMemo`, не дублируйте в сторе.

Отделяйте стор от компонентов — файлы стора не должны импортировать компоненты. Зависимость должна быть односторонней: компоненты импортируют стор, не наоборот.

---

Научиться строить полноценные Next.js-приложения с правильной архитектурой состояния вы можете на курсе [Next.js от PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-zustand).
---
metaTitle: "Valtio — атомарный state management в React"
metaDescription: "Подробный разбор Valtio: proxy-based state management для React. Установка, useSnapshot, derive, async, сравнение с Zustand и Jotai."
author: "Антон Ларичев"
title: "Valtio: атомарный state management в React"
preview: "Разбираем Valtio — минималистичный proxy-based менеджер состояния для React с поддержкой атомарных обновлений и подписок."
---

## Что такое Valtio и зачем он нужен

Valtio — библиотека управления состоянием для React и vanilla JavaScript, построенная на основе нативного JavaScript-механизма `Proxy`. Она позволяет работать с состоянием напрямую, как с обычным объектом, без экшенов, редьюсеров и boilerplate-кода.

Главная идея — **прозрачная реактивность**: вы мутируете объект состояния напрямую, а Valtio автоматически отслеживает, какие части дерева состояния изменились, и перерисовывает только те компоненты, которые подписаны именно на эти данные.

Под «атомарностью» в контексте Valtio подразумевается гранулярная подписка на изменения. Компонент реагирует не на изменение всего store, а только на те поля, к которым он обратился внутри хука `useSnapshot`.

```bash
npm install valtio
```

## Базовый пример: создание store и подписка

В Valtio состояние создаётся функцией `proxy`. Она оборачивает обычный объект в Proxy, который перехватывает все операции чтения и записи.

```typescript
import { proxy } from 'valtio'

const counterStore = proxy({
  count: 0,
  step: 1,
})
```

Для чтения состояния в компоненте используется хук `useSnapshot`. Он возвращает иммутабельный снапшот текущего состояния и подписывает компонент только на те поля, к которым произошло обращение во время рендера.

```typescript
import { useSnapshot } from 'valtio'

function Counter() {
  const snap = useSnapshot(counterStore)

  return (
    <div>
      <p>Счётчик: {snap.count}</p>
      <button onClick={() => (counterStore.count += counterStore.step)}>
        Увеличить
      </button>
    </div>
  )
}
```

Обратите внимание: мутация выполняется напрямую на объекте `counterStore`, а не через снапшот `snap` (снапшот заморожен). Это принципиальное отличие от Redux-подхода.

## Вложенные объекты и массивы

Valtio отслеживает изменения рекурсивно. Вложенные объекты и массивы автоматически оборачиваются в Proxy, поэтому гранулярная реактивность работает на любой глубине дерева.

```typescript
import { proxy } from 'valtio'

const todoStore = proxy({
  items: [
    { id: 1, text: 'Изучить Valtio', done: false },
    { id: 2, text: 'Написать проект', done: false },
  ],
  filter: 'all' as 'all' | 'active' | 'done',
})

// Прямые мутации работают корректно
function toggleTodo(id: number) {
  const item = todoStore.items.find((i) => i.id === id)
  if (item) {
    item.done = !item.done
  }
}

function addTodo(text: string) {
  todoStore.items.push({
    id: Date.now(),
    text,
    done: false,
  })
}

function removeTodo(id: number) {
  const index = todoStore.items.findIndex((i) => i.id === id)
  if (index !== -1) {
    todoStore.items.splice(index, 1)
  }
}
```

Компонент, который рендерит только `filter`, не перерисуется при добавлении нового элемента в `items` — именно это и называется атомарной подпиской.

```typescript
function FilterPanel() {
  const snap = useSnapshot(todoStore)
  // Этот компонент перерисуется только при смене snap.filter
  return (
    <div>
      {(['all', 'active', 'done'] as const).map((f) => (
        <button
          key={f}
          onClick={() => (todoStore.filter = f)}
          style={{ fontWeight: snap.filter === f ? 'bold' : 'normal' }}
        >
          {f}
        </button>
      ))}
    </div>
  )
}
```

## Вычисляемые значения с derive

Для производных (вычисляемых) значений Valtio предоставляет функцию `derive`. Она создаёт новый proxy-объект, поля которого автоматически пересчитываются при изменении зависимостей.

```typescript
import { proxy } from 'valtio'
import { derive } from 'valtio/utils'

const cartStore = proxy({
  items: [] as Array<{ name: string; price: number; qty: number }>,
  discount: 0,
})

const cartDerived = derive({
  subtotal: (get) =>
    get(cartStore).items.reduce((sum, item) => sum + item.price * item.qty, 0),

  total: (get) => {
    const { subtotal } = get(cartDerived)
    const { discount } = get(cartStore)
    return subtotal * (1 - discount / 100)
  },

  itemCount: (get) =>
    get(cartStore).items.reduce((sum, item) => sum + item.qty, 0),
})
```

`derive` ленив: вычисление запускается только тогда, когда к полю обращается компонент. Если компонент не читает `total`, это значение не пересчитывается.

```typescript
function CartSummary() {
  const snap = useSnapshot(cartDerived)

  return (
    <div>
      <p>Товаров: {snap.itemCount}</p>
      <p>Итого: {snap.total.toFixed(2)} ₽</p>
    </div>
  )
}
```

## Асинхронные операции

Valtio не диктует способ работы с async-кодом. Вы просто пишете асинхронную функцию и обновляете store по завершении.

```typescript
import { proxy } from 'valtio'

const usersStore = proxy({
  list: [] as User[],
  loading: false,
  error: null as string | null,
})

async function fetchUsers() {
  usersStore.loading = true
  usersStore.error = null

  try {
    const response = await fetch('/api/users')
    if (!response.ok) throw new Error('Ошибка загрузки')
    const data: User[] = await response.json()
    usersStore.list = data
  } catch (err) {
    usersStore.error = err instanceof Error ? err.message : 'Неизвестная ошибка'
  } finally {
    usersStore.loading = false
  }
}
```

Valtio корректно обрабатывает асинхронные значения в снапшотах. Если поле содержит Promise, `useSnapshot` приостановит рендер компонента (интеграция с React Suspense):

```typescript
const asyncStore = proxy({
  data: fetch('/api/config').then((r) => r.json()),
})

// В компоненте с Suspense-обёрткой:
function Config() {
  const snap = useSnapshot(asyncStore)
  // snap.data автоматически «разворачивает» промис через Suspense
  return <pre>{JSON.stringify(snap.data, null, 2)}</pre>
}
```

## Подписка вне компонентов: subscribe

Для подписки на изменения состояния вне React-компонентов (например, для сайд-эффектов, логирования или синхронизации с localStorage) используется функция `subscribe`.

```typescript
import { subscribe } from 'valtio'

// Подписка на весь store
const unsubscribe = subscribe(counterStore, () => {
  console.log('Store изменился:', counterStore)
})

// Подписка на конкретное поле
const unsubscribeCount = subscribeKey(counterStore, 'count', (value) => {
  localStorage.setItem('counter', String(value))
})

// Отписка
unsubscribe()
unsubscribeCount()
```

`subscribeKey` из `valtio/utils` — более гранулярный вариант: callback вызывается только при изменении конкретного ключа верхнего уровня.

## Паттерн: разделение store и actions

Хорошая практика — выносить мутации в отдельные функции-действия, а не писать их прямо в обработчиках событий. Это улучшает тестируемость и читаемость кода.

```typescript
// store/auth.ts
import { proxy } from 'valtio'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
}

export const authStore = proxy<AuthState>({
  user: null,
  token: null,
  loading: false,
})

// actions/auth.ts
export async function login(email: string, password: string) {
  authStore.loading = true
  try {
    const { user, token } = await authApi.login(email, password)
    authStore.user = user
    authStore.token = token
    localStorage.setItem('token', token)
  } finally {
    authStore.loading = false
  }
}

export function logout() {
  authStore.user = null
  authStore.token = null
  localStorage.removeItem('token')
}

export function restoreSession() {
  const token = localStorage.getItem('token')
  if (token) {
    authStore.token = token
  }
}
```

```typescript
// Использование в компоненте
import { useSnapshot } from 'valtio'
import { authStore } from './store/auth'
import { login, logout } from './actions/auth'

function AuthButton() {
  const { user, loading } = useSnapshot(authStore)

  if (loading) return <span>Загрузка...</span>
  if (user) return <button onClick={logout}>Выйти ({user.name})</button>

  return <button onClick={() => login('user@example.com', 'pass')}>Войти</button>
}
```

## Работа с DevTools

Valtio поддерживает интеграцию с Redux DevTools через утилиту `devtools` из пакета `valtio/utils`.

```typescript
import { devtools } from 'valtio/utils'

const store = proxy({ count: 0 })

// Второй аргумент — имя store в DevTools
const unsub = devtools(store, { name: 'CounterStore', enabled: true })
```

После подключения все мутации store будут отображаться в панели Redux DevTools браузера с возможностью путешествия во времени.

## Valtio и TypeScript

Valtio написан на TypeScript и предоставляет полный вывод типов из переданного объекта состояния. Никаких дополнительных обобщений не требуется в большинстве случаев.

```typescript
import { proxy, useSnapshot } from 'valtio'

interface Product {
  id: number
  name: string
  price: number
  stock: number
}

interface ShopState {
  products: Product[]
  selectedId: number | null
  searchQuery: string
}

const shopStore = proxy<ShopState>({
  products: [],
  selectedId: null,
  searchQuery: '',
})

// snap типизирован как DeepReadonly<ShopState>
function ProductSearch() {
  const snap = useSnapshot(shopStore)

  const filtered = snap.products.filter((p) =>
    p.name.toLowerCase().includes(snap.searchQuery.toLowerCase())
  )

  return (
    <div>
      <input
        value={snap.searchQuery}
        onChange={(e) => (shopStore.searchQuery = e.target.value)}
        placeholder="Поиск товаров"
      />
      {filtered.map((p) => (
        <div key={p.id} onClick={() => (shopStore.selectedId = p.id)}>
          {p.name} — {p.price} ₽
        </div>
      ))}
    </div>
  )
}
```

## Сравнение с Zustand и Jotai

Все три библиотеки относятся к «лёгким» менеджерам состояния, но имеют разные подходы.

**Zustand** требует явного определения store через функцию и использует иммутабельные обновления через `set`. Хорошо подходит, если команда привыкла к Redux-подобному стилю без его verbosity.

**Jotai** реализует атомарную модель снизу вверх: состояние делится на минимальные атомы, которые можно комбинировать. Отличный выбор для сложных взаимозависимостей между частями состояния.

**Valtio** делает ставку на максимальную простоту и привычный синтаксис мутаций. Proxy-механизм позволяет писать код без дополнительных абстракций. Подходит, когда нужна скорость разработки и минимальный boilerplate.

| Критерий | Valtio | Zustand | Jotai |
|---|---|---|---|
| Синтаксис обновления | Прямая мутация | `set()` с иммутабельностью | `setAtom()` |
| Гранулярность подписки | Автоматическая | Ручной selector | По атому |
| Вне-React использование | `subscribe` | `getState/setState` | `store.get/set` |
| Кривая обучения | Низкая | Низкая | Средняя |
| Отладка | Redux DevTools | Redux DevTools | DevTools плагин |

## Типичные ошибки при работе с Valtio

**Мутация снапшота вместо store.** Снапшот, возвращаемый `useSnapshot`, заморожен (Object.freeze). Попытка его изменить приведёт к ошибке в strict mode.

```typescript
// Неправильно:
const snap = useSnapshot(store)
snap.count++ // TypeError в strict mode

// Правильно:
store.count++
```

**Деструктуризация снапшота на верхнем уровне.** При деструктуризации примитивных значений теряется связь с proxy, но для снапшота это нормально — он уже иммутабелен. Проблема возникает, если деструктурировать сам store для последующего чтения:

```typescript
// Чтение через деструктуризацию — безопасно для отображения:
const { count, step } = useSnapshot(store)

// Деструктуризация store для мутации — нормально:
const { items } = store
items.push({ id: 1, text: 'task' }) // OK, items — тот же proxy-объект
```

**Замена объектов вместо мутации.** Если заменить весь вложенный объект новым, подписки на конкретные поля этого объекта могут не среагировать корректно. Предпочтительнее мутировать поля по одному или использовать `Object.assign`.

```typescript
// Менее предпочтительно:
store.user = { ...store.user, name: 'New Name' }

// Предпочтительно:
store.user.name = 'New Name'
```

## Итог

Valtio предлагает радикально простой API: `proxy` для создания состояния, `useSnapshot` для чтения в компонентах, прямые мутации для обновления. Встроенная атомарная реактивность через Proxy устраняет необходимость в ручных селекторах — библиотека сама отслеживает, какие данные читает каждый компонент.

Библиотека хорошо подходит для средних и больших приложений, где важна производительность рендеринга, но не хочется тратить время на настройку сложной инфраструктуры управления состоянием.

Для более глубокого погружения в работу с состоянием в React, компонентную архитектуру и современные паттерны — смотрите курс на PurpleSchool:
[React — полный курс для разработчиков](https://purpleschool.ru/course/react?utm_source=knowledgebase&utm_medium=text&utm_campaign=valtio-atomic-state-management)

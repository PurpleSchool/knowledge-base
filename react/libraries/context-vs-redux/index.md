---
metaTitle: Контекст vs Redux — когда что использовать в React
metaDescription: Подробное сравнение React Context API и Redux. Разбираем производительность, масштабируемость, инструменты разработки и практические сценарии — когда выбирать Context, а когда Redux
author: Олег Марков
title: Контекст vs Redux — когда что использовать
preview: Разбираемся, чем отличается React Context от Redux, как они справляются с производительностью и масштабированием, и как выбрать подходящий инструмент для управления состоянием в вашем проекте
---

## Введение

Управление состоянием — одна из ключевых задач в разработке React-приложений. Когда приложение растёт, разработчики сталкиваются с выбором: использовать встроенный React Context API или сторонние решения вроде Redux. Оба инструмента решают схожую задачу — передачу данных между компонентами — но делают это принципиально разными способами.

В этой статье вы узнаете:
- Как устроены Context API и Redux изнутри
- В чём принципиальные различия по производительности и масштабированию
- Когда стоит выбирать каждое решение
- Как применять гибридный подход
- Как мигрировать с одного инструмента на другой

## React Context API

Context API — встроенный механизм React для передачи данных через дерево компонентов без явной передачи пропсов на каждом уровне (prop drilling).

### Как работает Context

```javascript
import { createContext, useContext, useState } from 'react'

// 1. Создаём контекст
const ThemeContext = createContext(null)

// 2. Создаём провайдер
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// 3. Используем в компоненте
function Header() {
  const { theme, toggleTheme } = useContext(ThemeContext)

  return (
    <header className={`header--${theme}`}>
      <button onClick={toggleTheme}>
        Переключить тему: {theme}
      </button>
    </header>
  )
}

// 4. Оборачиваем приложение
function App() {
  return (
    <ThemeProvider>
      <Header />
      <Main />
    </ThemeProvider>
  )
}
```

### Паттерн с useReducer

Для более сложной логики Context часто комбинируют с `useReducer`, что делает его похожим на Redux:

```javascript
import { createContext, useContext, useReducer } from 'react'

// Типы действий
const ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_CART: 'CLEAR_CART',
}

// Редьюсер
function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_ITEM:
      return {
        ...state,
        items: [...state.items, action.payload],
      }
    case ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      }
    case ACTIONS.CLEAR_CART:
      return { ...state, items: [] }
    default:
      return state
  }
}

const CartContext = createContext(null)

function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}

function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart должен использоваться внутри CartProvider')
  }
  return context
}
```

### Множественные контексты

В реальных приложениях часто используют несколько независимых контекстов:

```javascript
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CartProvider>
          <Router>
            <AppRoutes />
          </Router>
        </CartProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
```

## Redux и Redux Toolkit

Redux — предсказуемый контейнер состояния, основанный на принципах Flux. В современных проектах используется Redux Toolkit (RTK) — официальный набор инструментов, устраняющий многословность классического Redux.

### Базовая структура Redux Toolkit

```javascript
import { createSlice, configureStore } from '@reduxjs/toolkit'
import { Provider, useSelector, useDispatch } from 'react-redux'

// Создаём slice (комбинация редьюсера + actions)
const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], total: 0 },
  reducers: {
    addItem(state, action) {
      // Immer позволяет писать мутирующий код
      state.items.push(action.payload)
      state.total += action.payload.price
    },
    removeItem(state, action) {
      const index = state.items.findIndex(item => item.id === action.payload)
      if (index !== -1) {
        state.total -= state.items[index].price
        state.items.splice(index, 1)
      }
    },
    clearCart(state) {
      state.items = []
      state.total = 0
    },
  },
})

export const { addItem, removeItem, clearCart } = cartSlice.actions

// Создаём стор
const store = configureStore({
  reducer: {
    cart: cartSlice.reducer,
  },
})

// Используем в компоненте
function CartButton() {
  const itemCount = useSelector(state => state.cart.items.length)
  const dispatch = useDispatch()

  return (
    <button onClick={() => dispatch(clearCart())}>
      Корзина ({itemCount})
    </button>
  )
}

// Провайдер
function App() {
  return (
    <Provider store={store}>
      <CartButton />
    </Provider>
  )
}
```

### Асинхронные операции с createAsyncThunk

```javascript
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

// Асинхронное действие
export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/products?category=${categoryId}`)
      if (!response.ok) throw new Error('Ошибка загрузки')
      return await response.json()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})
```

## Ключевые различия

### Производительность

Это самое важное техническое различие между двумя подходами.

**Context API** имеет известную проблему с производительностью: при изменении значения контекста **перерендериваются все компоненты**, которые его используют, даже если им нужна только часть данных.

```javascript
// Проблема: оба компонента перерендерятся при изменении user ИЛИ theme
const AppContext = createContext(null)

function ComponentA() {
  const { user } = useContext(AppContext) // нужен только user
  return <div>{user.name}</div>
}

function ComponentB() {
  const { theme } = useContext(AppContext) // нужна только theme
  return <div className={theme}>Content</div>
}
```

Решения для Context:
1. Разделить на несколько контекстов
2. Использовать `useMemo` и `useCallback` для значений
3. Применить библиотеку `use-context-selector`

```javascript
// Решение: разделённые контексты
const UserContext = createContext(null)
const ThemeContext = createContext(null)

// Теперь ComponentA перерендерится только при изменении user
// ComponentB — только при изменении theme
```

**Redux** решает эту проблему встроенными средствами: `useSelector` автоматически подписывается только на нужные части состояния. Компонент перерендерится только если выбранные данные изменились.

```javascript
// Redux: ComponentA перерендерится только при изменении user.name
function ComponentA() {
  const userName = useSelector(state => state.user.name)
  return <div>{userName}</div>
}

// ComponentB перерендерится только при изменении theme
function ComponentB() {
  const theme = useSelector(state => state.theme.current)
  return <div className={theme}>Content</div>
}
```

### Инструменты разработки

**Redux DevTools** предоставляет мощный набор инструментов:
- Инспекция всех диспатченных action'ов
- Просмотр состояния до и после каждого action'а
- **Time travel** — перемотка к любому предыдущему состоянию
- Импорт/экспорт состояния
- Запись и воспроизведение пользовательских сессий

```javascript
// Redux DevTools работает автоматически с configureStore
const store = configureStore({
  reducer: rootReducer,
  // devTools: true — включено по умолчанию в development
})
```

**Context API** не имеет встроенных DevTools. Для отладки используются:
- React DevTools (просмотр дерева компонентов и значений контекстов)
- Ручное логирование через `useEffect` или middleware-подобные паттерны

```javascript
// Самодельный "middleware" для Context
function useDebugContext(contextName, value) {
  if (process.env.NODE_ENV === 'development') {
    useEffect(() => {
      console.log(`[${contextName}] updated:`, value)
    }, [value])
  }
}
```

### Управление асинхронным состоянием

**Context + useReducer** не имеет стандартного способа обработки асинхронных операций:

```javascript
// Приходится реализовывать самостоятельно
function cartReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null }
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, data: action.payload }
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload }
    // ...много шаблонного кода
  }
}

// Необходимо писать вручную
async function fetchData(dispatch) {
  dispatch({ type: 'FETCH_START' })
  try {
    const data = await api.get('/endpoint')
    dispatch({ type: 'FETCH_SUCCESS', payload: data })
  } catch (error) {
    dispatch({ type: 'FETCH_ERROR', payload: error.message })
  }
}
```

**Redux Toolkit** предоставляет `createAsyncThunk` и `extraReducers` — стандартизированный способ с автоматической обработкой pending/fulfilled/rejected.

### Структура и организация кода

**Context API** более гибкий и менее структурированный:

```
src/
├── contexts/
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   └── ThemeContext.tsx
└── components/
    └── ...
```

**Redux** предполагает чёткую структуру (feature-based с RTK):

```
src/
├── store/
│   ├── index.ts          # configureStore
│   └── hooks.ts          # типизированные useAppSelector/useAppDispatch
├── features/
│   ├── auth/
│   │   ├── authSlice.ts
│   │   └── authThunks.ts
│   ├── cart/
│   │   ├── cartSlice.ts
│   │   └── cartSelectors.ts
│   └── products/
│       └── productsSlice.ts
└── components/
    └── ...
```

### Сравнительная таблица

| Критерий | Context API | Redux Toolkit |
|----------|-------------|---------------|
| Встроенность | ✅ Встроен в React | ❌ Внешняя зависимость |
| Бойлерплейт | ✅ Минимальный | ⚠️ Умеренный |
| Производительность | ⚠️ Требует оптимизации | ✅ Встроенные оптимизации |
| DevTools | ⚠️ Только React DevTools | ✅ Redux DevTools |
| Time travel | ❌ Нет | ✅ Есть |
| Async-операции | ⚠️ Нет стандарта | ✅ createAsyncThunk |
| Масштабируемость | ⚠️ Средняя | ✅ Высокая |
| Кривая обучения | ✅ Низкая | ⚠️ Умеренная |
| Размер бандла | ✅ 0 KB (встроен) | ⚠️ ~13 KB (RTK) |
| Тестируемость | ⚠️ Требует обёртки | ✅ Легко тестировать |
| Middleware | ❌ Нет | ✅ Полноценный |
| Подписки на часть стейта | ⚠️ Требует разделения | ✅ useSelector |

## Когда использовать Context API

Context лучше всего подходит в следующих ситуациях:

### 1. Статичные или редко изменяемые данные

```javascript
// Идеально для Context: тема, локаль, конфигурация
const ConfigContext = createContext(null)

function AppConfigProvider({ children }) {
  const config = useMemo(() => ({
    apiUrl: process.env.REACT_APP_API_URL,
    features: { darkMode: true, analytics: false },
    locale: navigator.language,
  }), []) // Изменяется очень редко

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  )
}
```

### 2. Аутентификационное состояние

```javascript
const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Проверяем токен при загрузке
    const token = localStorage.getItem('token')
    if (token) {
      verifyToken(token).then(user => {
        setUser(user)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const user = await authApi.login(credentials)
    setUser(user)
    localStorage.setItem('token', user.token)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('token')
  }, [])

  if (loading) return <Spinner />

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 3. Небольшие приложения и прототипы

Если ваше приложение небольшое и у вас нет сложной бизнес-логики, Context — отличный выбор. Не нужны дополнительные зависимости и сложная настройка.

### 4. Изолированные фичи с локальным состоянием

```javascript
// Компонент-аккордеон с собственным состоянием
const AccordionContext = createContext(null)

function Accordion({ children, defaultOpen = null }) {
  const [openItem, setOpenItem] = useState(defaultOpen)

  return (
    <AccordionContext.Provider value={{ openItem, setOpenItem }}>
      <div className="accordion">{children}</div>
    </AccordionContext.Provider>
  )
}

function AccordionItem({ id, title, children }) {
  const { openItem, setOpenItem } = useContext(AccordionContext)
  const isOpen = openItem === id

  return (
    <div>
      <button onClick={() => setOpenItem(isOpen ? null : id)}>
        {title}
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  )
}
```

## Когда использовать Redux

Redux оправдан в следующих сценариях:

### 1. Сложный глобальный стейт с частыми обновлениями

```javascript
// Интернет-магазин с корзиной, фильтрами, пагинацией
const store = configureStore({
  reducer: {
    products: productsReducer,     // список товаров
    cart: cartReducer,             // корзина
    filters: filtersReducer,       // активные фильтры
    ui: uiReducer,                 // состояние UI
    user: userReducer,             // данные пользователя
    orders: ordersReducer,         // история заказов
  },
})
```

### 2. Необходимость в Time Travel и отладке

При разработке сложных форм, многошаговых процессов или для воспроизведения багов Redux DevTools незаменим. Особенно это ценно при работе с QA-командой — можно экспортировать состояние и шаги воспроизведения бага.

### 3. Необходимость middleware

```javascript
import { configureStore } from '@reduxjs/toolkit'

// Логирование всех action'ов
const loggerMiddleware = store => next => action => {
  console.group(action.type)
  console.log('prev state:', store.getState())
  console.log('action:', action)
  const result = next(action)
  console.log('next state:', store.getState())
  console.groupEnd()
  return result
}

// Аналитика
const analyticsMiddleware = store => next => action => {
  if (action.meta?.track) {
    analytics.track(action.type, action.payload)
  }
  return next(action)
}

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(loggerMiddleware)
      .concat(analyticsMiddleware),
})
```

### 4. Большие команды и крупные приложения

Redux навязывает единый паттерн, что упрощает работу в команде: каждый разработчик знает, где искать состояние, как его изменять и как тестировать. Feature-based структура с slice'ами хорошо масштабируется.

### 5. Кросс-компонентные взаимодействия

```javascript
// Действие в одном месте — реакция в другом
// Например: успешный заказ → очистка корзины + уведомление + обновление истории

export const placeOrder = createAsyncThunk(
  'orders/place',
  async (orderData, { dispatch }) => {
    const order = await ordersApi.create(orderData)
    // Побочные эффекты в других slice'ах
    dispatch(clearCart())
    dispatch(addNotification({ type: 'success', message: 'Заказ оформлен!' }))
    return order
  }
)
```

## Гибридный подход

Самая эффективная стратегия — использовать оба инструмента там, где каждый лучше справляется:

```javascript
// Redux для глобального бизнес-состояния
const store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
    products: productsReducer,
  },
})

// Context для UI-состояния и конфигурации
const ThemeContext = createContext(null)
const ToastContext = createContext(null)
const ModalContext = createContext(null)

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ToastProvider>
          <ModalProvider>
            <Router>
              <AppRoutes />
            </Router>
          </ModalProvider>
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  )
}
```

### Что в Redux, что в Context

**В Redux (глобальное бизнес-состояние):**
- Данные пользователя и сессия авторизации
- Корзина и данные заказов
- Список продуктов, фильтры, пагинация
- Кэш данных с сервера
- Статус загрузки и ошибки API

**В Context (UI и конфигурация):**
- Текущая тема (светлая/тёмная)
- Локаль и i18n
- Тосты и уведомления
- Модальные окна
- Состояние навигационного меню
- Конфигурация приложения

## Схема выбора инструмента

Используйте следующую логику при выборе решения для управления состоянием:

```
Нужно ли передавать состояние через несколько уровней компонентов?
├── Нет → используйте локальный useState/useReducer
└── Да ↓
    Как часто меняется состояние?
    ├── Редко (тема, конфиг, локаль) → Context API
    └── Часто ↓
        Нужна ли сложная бизнес-логика / async / DevTools?
        ├── Нет, простая логика → Context + useReducer
        └── Да → Redux Toolkit
```

Дополнительные критерии:
- **Размер команды > 3-4 человека** → Redux (стандартизация)
- **Приложение > 10 страниц** → Redux (масштабируемость)
- **Нужен Time Travel debugging** → Redux DevTools
- **Только конфигурация/тема** → Context
- **Прототип / MVP** → Context (скорость разработки)

## TypeScript интеграция

### Context с TypeScript

```typescript
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

interface AuthContextType {
  user: User | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider')
  }
  return context
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = async (credentials: LoginCredentials) => {
    const userData = await authApi.login(credentials)
    setUser(userData)
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: user !== null,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Redux Toolkit с TypeScript

```typescript
import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'

const store = configureStore({
  reducer: {
    cart: cartReducer,
    user: userReducer,
  },
})

// Типизированные хуки
type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

// Используйте эти хуки вместо стандартных
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Использование в компоненте
function CartSummary() {
  const items = useAppSelector(state => state.cart.items)
  const total = useAppSelector(state => state.cart.total)
  const dispatch = useAppDispatch()

  return (
    <div>
      <p>Товаров: {items.length}</p>
      <p>Итого: {total} ₽</p>
      <button onClick={() => dispatch(clearCart())}>Очистить</button>
    </div>
  )
}
```

## Тестирование

### Тестирование Context

```javascript
import { render, screen, fireEvent } from '@testing-library/react'

function renderWithCart(ui) {
  return render(
    <CartProvider>
      {ui}
    </CartProvider>
  )
}

test('добавляет товар в корзину', () => {
  renderWithCart(<CartButton product={{ id: '1', name: 'Ноутбук', price: 50000 }} />)

  fireEvent.click(screen.getByText('Добавить в корзину'))

  expect(screen.getByText('1 товар')).toBeInTheDocument()
})
```

### Тестирование Redux

```javascript
import { configureStore } from '@reduxjs/toolkit'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { cartSlice } from './cartSlice'

function renderWithStore(ui, preloadedState = {}) {
  const store = configureStore({
    reducer: { cart: cartSlice.reducer },
    preloadedState,
  })
  return { ...render(<Provider store={store}>{ui}</Provider>), store }
}

test('отображает количество товаров из Redux', () => {
  const { getByText } = renderWithStore(<CartBadge />, {
    cart: { items: [{ id: '1' }, { id: '2' }], total: 1000 },
  })

  expect(getByText('2')).toBeInTheDocument()
})
```

## Итоги

Выбор между Context API и Redux не сводится к тому, что одно лучше другого — каждый инструмент имеет своё место:

- **Context API** — отличный выбор для простых сценариев: конфигурация приложения, тема, авторизационное состояние, небольшие проекты. Минимум зависимостей, быстрый старт, достаточно для большинства прототипов и небольших приложений
- **Redux Toolkit** — оправдан в крупных приложениях с частыми обновлениями состояния, сложной бизнес-логикой, большими командами и требованиями к отладке. Стандартизированный подход, мощные DevTools и отличная TypeScript-поддержка
- **Гибридный подход** — часто лучшее решение: Redux для бизнес-данных, Context для UI-состояния

Не бойтесь начать с Context и мигрировать на Redux по мере роста приложения — это естественный путь развития проекта.

Хотите освоить управление состоянием React на практике и научиться принимать взвешенные архитектурные решения? Ознакомьтесь с курсом по [React для профессионалов](https://purpleschool.ru/course/react-pro) на PurpleSchool.

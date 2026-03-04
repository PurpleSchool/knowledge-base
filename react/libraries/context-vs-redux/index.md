---
metaTitle: Контекст vs Redux - когда что использовать в React
metaDescription: Подробное сравнение React Context API и Redux для управления состоянием. Когда выбирать Context, когда Redux или Redux Toolkit, производительность, паттерны и практические советы
author: Олег Марков
title: Контекст vs Redux - когда что использовать
preview: Разберитесь, когда в React-проекте достаточно Context API, а когда нужен Redux — сравнение производительности, масштабируемости, сложности и реальные сценарии применения
---

## Введение

«Нам нужен Redux?» — один из самых частых вопросов при старте нового React-проекта. И один из самых спорных. Одни разработчики говорят «всегда используй Redux для глобального состояния», другие — «Context API справляется со всем».

Правда, как обычно, посередине. И Context API, и Redux — это инструменты, каждый из которых лучше подходит для определённых задач. В этой статье мы разберём различия между ними, рассмотрим реальные сценарии применения и дадим практические рекомендации.

## Что такое React Context

Context API — встроенный механизм React для передачи данных через дерево компонентов без явной передачи через props на каждом уровне.

### Как работает Context

```jsx
import { createContext, useContext, useState } from 'react';

// 1. Создаём контекст
const ThemeContext = createContext('light');

// 2. Оборачиваем дерево в Provider
function App() {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Header />
      <Main />
      <Footer />
    </ThemeContext.Provider>
  );
}

// 3. Используем в любом компоненте глубоко в дереве
function ThemeToggle() {
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Тема: {theme}
    </button>
  );
}
```

Context решает проблему **prop drilling** — передачи props через множество промежуточных компонентов, которые сами эти данные не используют.

### Ограничения Context API

```jsx
// ПРОБЛЕМА: при изменении value — все потребители перерендериваются
const AppContext = createContext(null);

function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [cart, setCart] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Когда меняется cart — перерендерятся ВСЕ компоненты,
  // подписанные на AppContext, включая те, что используют только user
  const value = { user, setUser, theme, setTheme, cart, setCart, notifications, setNotifications };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
```

Это главная проблема Context API: **нет гранулярных подписок**. Компонент подписывается на весь контекст целиком.

## Что такое Redux

Redux — предсказуемый контейнер состояния для JavaScript-приложений. Реализует однонаправленный поток данных: **Action → Reducer → Store → UI**.

```javascript
// Упрощённая схема Redux
dispatch({ type: 'COUNTER/INCREMENT' })
  ↓
reducer(currentState, action) → newState
  ↓
store.getState() // возвращает newState
  ↓
connected components re-render
```

### Ключевые принципы Redux

1. **Единый источник истины** — всё состояние в одном сторе
2. **Состояние только для чтения** — изменить можно только через action
3. **Чистые функции** — reducers должны быть предсказуемыми

## Сравнение по ключевым критериям

### Производительность

**Context API:**

```jsx
// Проблема производительности с большим контекстом
const BigContext = createContext(null);

function BigProvider() {
  const [counter, setCounter] = useState(0);
  const [user, setUser] = useState({ name: 'Алекс' });
  const [posts, setPosts] = useState([]);

  return (
    <BigContext.Provider value={{ counter, setCounter, user, setUser, posts, setPosts }}>
      {children}
    </BigContext.Provider>
  );
}

// При каждом increment перерендерятся Header и PostsList,
// хотя им counter не нужен
function Header() {
  const { user } = useContext(BigContext); // подписан на весь контекст
  return <h1>Привет, {user.name}!</h1>;
}

function PostsList() {
  const { posts } = useContext(BigContext); // тоже подписан на весь контекст
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

**Решение для Context — разделение контекстов:**

```jsx
// Разделяем контексты по доменам
const UserContext = createContext(null);
const PostsContext = createContext(null);
const UIContext = createContext(null);

// Теперь Header перерендерится только при изменении user
function Header() {
  const { user } = useContext(UserContext);
  return <h1>Привет, {user.name}!</h1>;
}
```

**Redux с селекторами:**

```javascript
// Redux: компонент подписывается только на нужную часть стора
function Header() {
  // Перерендерится ТОЛЬКО при изменении user.name
  const userName = useSelector((state) => state.user.name);
  return <h1>Привет, {userName}!</h1>;
}

function Counter() {
  // Перерендерится ТОЛЬКО при изменении counter
  const count = useSelector((state) => state.counter.value);
  return <p>{count}</p>;
}
```

Redux выигрывает по производительности при сложном состоянии, потому что `useSelector` сравнивает результаты и не вызывает ре-рендер если данные не изменились.

### Отладка и DevTools

**Context API** — нет встроенных инструментов отладки. Чтобы отследить изменения, нужно добавлять логирование вручную.

**Redux** — мощная интеграция с Redux DevTools Extension:
- Путешествие во времени (time-travel debugging)
- Просмотр всей истории actions
- Inspect состояния в любой момент
- Импорт/экспорт состояния
- Логирование действий

```javascript
// С Redux DevTools вы видите каждое действие и его эффект
// counter/increment { type: 'counter/increment' } | state: { counter: { value: 1 } }
// user/setName { payload: 'Мария' } | state: { user: { name: 'Мария' } }
// posts/addPost { payload: {...} } | state: { posts: { items: [{ id: 1, ... }] } }
```

### Асинхронные операции

**Context API** — нет встроенной поддержки асинхронности:

```jsx
function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUser = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUser(id);
      setUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, error, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}
```

**Redux с RTK:**

```javascript
// createAsyncThunk стандартизирует паттерн
const fetchUser = createAsyncThunk('user/fetch', async (id) => {
  const response = await api.getUser(id);
  return response.data;
});

// Состояния loading/error обрабатываются автоматически
const userSlice = createSlice({
  name: 'user',
  initialState: { data: null, status: 'idle', error: null },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});
```

### Масштабируемость

**Context API** хорошо работает для:
- Небольших и средних приложений
- Состояния, которое меняется редко
- Данных, нужных большинству компонентов (тема, локаль, авторизация)

**Redux** лучше справляется с:
- Крупными приложениями с командой разработчиков
- Сложной бизнес-логикой
- Частыми обновлениями состояния
- Необходимостью аудита изменений

## Практические сценарии

### Когда Context API — правильный выбор

**1. Тема приложения:**
```jsx
const ThemeContext = createContext('light');

// Меняется редко, нужна везде — идеально для Context
function App() {
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light'
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={theme}>
        <Router />
      </div>
    </ThemeContext.Provider>
  );
}
```

**2. Аутентификация:**
```jsx
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = async (credentials) => {
    const { user, token } = await api.login(credentials);
    setUser(user);
    setToken(token);
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**3. Локализация (i18n):**
```jsx
const I18nContext = createContext({ locale: 'ru', t: (key) => key });

// Меняется при смене языка — редко, подходит для Context
```

**4. Конфигурация компонента:**
```jsx
// Передача конфигурации внутри составного компонента
const AccordionContext = createContext(null);

function Accordion({ children, defaultOpen = null }) {
  const [openItem, setOpenItem] = useState(defaultOpen);
  return (
    <AccordionContext.Provider value={{ openItem, setOpenItem }}>
      <div>{children}</div>
    </AccordionContext.Provider>
  );
}
```

### Когда нужен Redux

**1. Сложная бизнес-логика:**
```javascript
// Корзина с промокодами, расчётом налогов, скидками, разными валютами —
// лучше в Redux с явными actions и предсказуемыми reducers
const cartSlice = createSlice({
  name: 'cart',
  reducers: {
    addItem, removeItem, updateQuantity, applyPromo,
    applyDiscount, changeCurrency, clearCart,
    applyLoyaltyPoints, addGiftCard,
  }
});
```

**2. Данные, нужные в разных частях приложения:**
```javascript
// Список уведомлений нужен в хедере, боковой панели и странице уведомлений
// При этом часто обновляется — Redux с гранулярными селекторами оптимальнее
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: [],
  reducers: {
    addNotification, markRead, markAllRead, dismiss, clear,
  }
});

// Каждый компонент подписывается только на нужные данные
const unreadCount = useSelector(selectUnreadCount);
const notifications = useSelector(selectAllNotifications);
const criticalNotifications = useSelector(selectCriticalNotifications);
```

**3. Синхронизация между вкладками:**
```javascript
// Redux + redux-persist + BroadcastChannel для синхронизации
// между несколькими вкладками браузера
```

**4. Offline-first приложения:**
```javascript
// Redux + redux-persist для сохранения состояния
// и синхронизации с сервером при восстановлении соединения
```

## Гибридный подход

Самое прагматичное решение — использовать оба инструмента в одном проекте, каждый для своей задачи:

```jsx
// Redux — для сложного серверного и глобального состояния
const store = configureStore({
  reducer: {
    auth: authReducer,           // Авторизация (читается везде)
    products: productsReducer,   // Каталог (сложная фильтрация, пагинация)
    cart: cartReducer,           // Корзина (бизнес-логика)
    orders: ordersReducer,       // Заказы (история, статусы)
    [api.reducerPath]: api.reducer, // RTK Query кэш
  },
});

// Context — для UI-состояния и конфигурации
const ThemeContext = createContext();    // Тема оформления
const ModalContext = createContext();   // Управление модальными окнами
const ToastContext = createContext();   // Toast-уведомления

// Zustand или Jotai — для изолированного состояния фич
const useFiltersStore = create((set) => ({
  search: '',
  category: null,
  sortBy: 'date',
  // ...
}));
```

## Руководство по выбору

Используйте следующую схему при принятии решения:

### Используйте Context API если:
- ✅ Данные меняются редко (тема, локаль, конфигурация)
- ✅ Небольшое или среднее приложение (до ~10 разработчиков)
- ✅ Данные нужны многим компонентам, но не критична производительность
- ✅ Это состояние конкретного поддерева (составные компоненты)
- ✅ Вы хотите минимум зависимостей

### Используйте Redux (Toolkit) если:
- ✅ Крупное приложение с командой разработчиков
- ✅ Сложная бизнес-логика с множеством взаимосвязанных изменений
- ✅ Нужна отладка и воспроизведение ошибок
- ✅ Часто обновляемые данные (уведомления, чат, real-time)
- ✅ Нужен аудит всех изменений состояния
- ✅ Уже есть Redux в проекте

### Рассмотрите Zustand или Jotai если:
- ✅ Нужна простота как у Context, но с лучшей производительностью
- ✅ Хотите управление состоянием без Redux-церемонии
- ✅ Изолированное состояние отдельных фич

## Распространённые заблуждения

**«Context — это плохо для производительности»**

Неправда. Context плохо работает только при неправильном использовании (один большой контекст с часто меняющимися данными). Правильно разбитые контексты работают отлично.

**«Redux — только для больших приложений»**

Тоже неправда, хотя в маленьком проекте Redux Toolkit может быть избыточным. Правильнее сказать: Redux даёт максимальную пользу в сложных приложениях.

**«Context заменил Redux»**

Нет. Context появился в React 16.3, и React-команда явно говорила: Context — для редко меняющихся данных, Redux — для сложного состояния. Это не конкуренты, а инструменты для разных задач.

**«В 2024 году никто не использует Redux»**

По данным npm, Redux Toolkit скачивают более 5 миллионов раз в неделю. Redux по-прежнему широко используется в enterprise-проектах.

## Заключение

Нет универсального ответа — лучший инструмент зависит от задачи:

| Сценарий | Рекомендация |
|----------|-------------|
| Тема, локаль, авторизация | Context API |
| Сложная бизнес-логика | Redux Toolkit |
| Данные из API | RTK Query или React Query |
| UI-состояние компонента | useState |
| Изолированное состояние фичи | Zustand или Jotai |
| Атомарные независимые данные | Jotai |

Начинайте с простого: `useState` → Context → Zustand/Jotai → Redux Toolkit. Добавляйте сложность только когда в ней действительно есть нужда.

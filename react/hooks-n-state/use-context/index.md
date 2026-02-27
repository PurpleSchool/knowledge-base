---
metaTitle: useContext в React — работа с контекстом
metaDescription: Полное руководство по хуку useContext в React — как создавать контекст, передавать данные между компонентами без prop drilling, оптимизировать производительность и избегать распространённых ошибок
author: Олег Марков
title: useContext — работа с контекстом в React
preview: Разберитесь как использовать хук useContext в React для передачи данных между компонентами без прокидывания пропсов через каждый уровень иерархии — с практическими примерами, лучшими практиками и разбором ошибок
---

## Введение

Когда приложение на React растёт, передача данных между компонентами начинает превращаться в настоящую проблему. Представьте: у вас есть информация о текущем пользователе, которая нужна в десяти разных местах — в шапке сайта, в боковом меню, в личном кабинете, в настройках. Передавать эти данные через пропсы на каждом уровне иерархии крайне неудобно и засоряет код.

Именно для решения этой проблемы в React существует Context API, а хук `useContext` делает работу с контекстом максимально простой и удобной. В этой статье мы подробно разберём, что такое `useContext`, как работает Context API в целом, рассмотрим реальные практические примеры и узнаем, когда контекст — это правильный выбор, а когда лучше обратиться к другим инструментам.

## Что такое Context API и проблема prop drilling

Прежде чем разбираться с `useContext`, важно понять, зачем вообще нужен контекст.

### Проблема prop drilling

В React данные передаются от родительского компонента к дочернему через пропсы. Это работает отлично, когда компоненты находятся рядом в иерархии. Но когда данные нужны глубоко вложенному компоненту, их приходится "пробрасывать" через все промежуточные уровни — это называется prop drilling (бурение пропсами).

```tsx
// Проблема: username нужен только в UserGreeting,
// но приходится передавать через все уровни
function App() {
  const username = "Алексей";
  return <Layout username={username} />;
}

function Layout({ username }: { username: string }) {
  // Layout не использует username, но вынужден его передавать
  return <Header username={username} />;
}

function Header({ username }: { username: string }) {
  // Header тоже не использует username напрямую
  return <Navigation username={username} />;
}

function Navigation({ username }: { username: string }) {
  // И только здесь username наконец используется
  return <UserGreeting username={username} />;
}

function UserGreeting({ username }: { username: string }) {
  return <div>Привет, {username}!</div>;
}
```

Как видите, `username` проходит через три промежуточных компонента, которые его вообще не используют. Context API решает именно эту проблему.

### Что такое Context

Context (контекст) — это механизм React, позволяющий передавать данные через дерево компонентов, минуя промежуточные уровни. Контекст похож на "глобальную переменную" для поддерева компонентов — любой компонент внутри может получить к ней доступ напрямую.

## Как работает Context API: createContext, Provider и useContext

Context API состоит из трёх ключевых элементов: создание контекста (`createContext`), поставщик данных (`Provider`) и потребитель данных (`useContext`).

### createContext — создание контекста

Контекст создаётся с помощью функции `createContext`, которой передаётся значение по умолчанию:

```tsx
import { createContext } from 'react';

// Создаём контекст с начальным значением null
const UserContext = createContext<string | null>(null);

// Или с конкретным значением по умолчанию
const ThemeContext = createContext<'light' | 'dark'>('light');
```

Значение по умолчанию используется только тогда, когда компонент не находится внутри соответствующего Provider. На практике это редкая ситуация, но значение по умолчанию помогает при тестировании и позволяет TypeScript корректно определить тип контекста.

### Provider — поставщик данных

`Provider` — это компонент, который "поставляет" данные контекста всем своим потомкам. Любой компонент, находящийся внутри `Provider`, может получить доступ к его данным.

```tsx
import { createContext, useState } from 'react';

const ThemeContext = createContext<'light' | 'dark'>('light');

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    // Оборачиваем приложение в Provider и передаём значение через prop value
    <ThemeContext.Provider value={theme}>
      <Header />
      <Main />
      <Footer />
    </ThemeContext.Provider>
  );
}
```

Когда значение в `Provider` меняется, все компоненты, подписанные на этот контекст, автоматически перерисовываются.

### useContext — получение данных из контекста

`useContext` — это хук, который позволяет компоненту получить текущее значение указанного контекста:

```tsx
import { useContext } from 'react';

function ThemeButton() {
  // Передаём объект контекста в useContext — получаем его текущее значение
  const theme = useContext(ThemeContext);

  return (
    <button className={`btn btn-${theme}`}>
      Текущая тема: {theme}
    </button>
  );
}
```

Хук `useContext` автоматически подписывается на изменения контекста и вызывает повторный рендер компонента при изменении значения.

## Базовый синтаксис useContext

```tsx
const value = useContext(SomeContext);
```

Где:
- `SomeContext` — объект контекста, созданный через `createContext`
- `value` — текущее значение контекста, полученное от ближайшего `Provider` выше по дереву

Если компонент не находится внутри `Provider`, `useContext` вернёт значение по умолчанию, переданное в `createContext`.

## Практические примеры использования useContext

### Пример 1: Управление темой приложения

Один из классических примеров использования контекста — переключение темы (светлой/тёмной):

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

// Описываем тип для контекста темы
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Создаём контекст
const ThemeContext = createContext<ThemeContextType | null>(null);

// Провайдер темы — отдельный компонент для удобства
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Кастомный хук для удобного доступа к контексту темы
function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme должен использоваться внутри ThemeProvider');
  }
  return context;
}

// Компонент-кнопка переключения темы
function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: theme === 'light' ? '#fff' : '#333',
        color: theme === 'light' ? '#333' : '#fff',
        padding: '8px 16px',
        border: '1px solid currentColor',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      Сейчас: {theme === 'light' ? 'Светлая' : 'Тёмная'} тема
    </button>
  );
}

// Компонент-страница, использующий тему
function PageContent() {
  const { theme } = useTheme();

  return (
    <div style={{
      minHeight: '100vh',
      background: theme === 'light' ? '#f5f5f5' : '#1a1a1a',
      color: theme === 'light' ? '#333' : '#f5f5f5',
      padding: '20px',
    }}>
      <ThemeToggleButton />
      <h1>Контент страницы</h1>
      <p>Тема применяется ко всему приложению через контекст.</p>
    </div>
  );
}

// Корневой компонент
function App() {
  return (
    <ThemeProvider>
      <PageContent />
    </ThemeProvider>
  );
}
```

Обратите внимание на паттерн с кастомным хуком `useTheme` — это лучшая практика при работе с контекстом, которую мы разберём подробнее.

### Пример 2: Передача данных авторизованного пользователя

Типичный случай — передача информации о текущем пользователе по всему приложению:

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

// Тип пользователя
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Тип контекста аутентификации
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Провайдер аутентификации
function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => {
    setUser(userData);
    // Здесь можно сохранить токен в localStorage
  };

  const logout = () => {
    setUser(null);
    // Здесь можно удалить токен из localStorage
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: user !== null,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Кастомный хук для доступа к контексту аутентификации
function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
}

// Компонент навигации использует данные пользователя
function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
      <span>Логотип</span>
      {isAuthenticated ? (
        <div style={{ float: 'right' }}>
          <span>Привет, {user?.name}!</span>
          <button onClick={logout} style={{ marginLeft: '16px' }}>
            Выйти
          </button>
        </div>
      ) : (
        <a href="/login" style={{ float: 'right' }}>Войти</a>
      )}
    </nav>
  );
}

// Компонент профиля — тоже использует контекст
function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Пожалуйста, войдите в систему</div>;
  }

  return (
    <div>
      <h1>Профиль</h1>
      <p>Имя: {user?.name}</p>
      <p>Email: {user?.email}</p>
      <p>Роль: {user?.role}</p>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <ProfilePage />
    </AuthProvider>
  );
}
```

### Пример 3: Локализация (i18n)

Контекст отлично подходит для хранения языковых настроек:

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

type Locale = 'ru' | 'en';

// Словарь переводов
const translations = {
  ru: {
    greeting: 'Привет',
    farewell: 'До свидания',
    language: 'Язык',
  },
  en: {
    greeting: 'Hello',
    farewell: 'Goodbye',
    language: 'Language',
  },
};

type TranslationKeys = keyof typeof translations['ru'];

interface LocaleContextType {
  locale: Locale;
  t: (key: TranslationKeys) => string;
  changeLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('ru');

  const t = (key: TranslationKeys): string => {
    return translations[locale][key];
  };

  return (
    <LocaleContext.Provider value={{ locale, t, changeLocale: setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale должен использоваться внутри LocaleProvider');
  }
  return context;
}

// Компонент переключателя языка
function LanguageSwitcher() {
  const { locale, changeLocale, t } = useLocale();

  return (
    <div>
      <span>{t('language')}: </span>
      <button
        onClick={() => changeLocale('ru')}
        style={{ fontWeight: locale === 'ru' ? 'bold' : 'normal' }}
      >
        РУ
      </button>
      <button
        onClick={() => changeLocale('en')}
        style={{ fontWeight: locale === 'en' ? 'bold' : 'normal', marginLeft: '8px' }}
      >
        EN
      </button>
    </div>
  );
}

// Компонент использует переводы
function WelcomePage() {
  const { t } = useLocale();

  return (
    <div>
      <LanguageSwitcher />
      <h1>{t('greeting')}!</h1>
      <p>{t('farewell')}!</p>
    </div>
  );
}
```

### Пример 4: Корзина покупок

Более сложный пример — управление корзиной интернет-магазина с использованием `useReducer` внутри контекста:

```tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';

// Типы для корзины
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: { id: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'CLEAR_CART' };

// Редьюсер для управления состоянием корзины
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        // Если товар уже есть, увеличиваем количество
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return {
          items: updatedItems,
          total: state.total + action.payload.price,
        };
      }
      // Если товара нет, добавляем новый
      return {
        items: [...state.items, { ...action.payload, quantity: 1 }],
        total: state.total + action.payload.price,
      };
    }
    case 'REMOVE_ITEM': {
      const itemToRemove = state.items.find(item => item.id === action.payload.id);
      return {
        items: state.items.filter(item => item.id !== action.payload.id),
        total: state.total - (itemToRemove ? itemToRemove.price * itemToRemove.quantity : 0),
      };
    }
    case 'UPDATE_QUANTITY': {
      const item = state.items.find(i => i.id === action.payload.id);
      if (!item) return state;
      const diff = action.payload.quantity - item.quantity;
      return {
        items: state.items.map(i =>
          i.id === action.payload.id
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
        total: state.total + diff * item.price,
      };
    }
    case 'CLEAR_CART':
      return { items: [], total: 0 };
    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider value={{ state, addItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart должен использоваться внутри CartProvider');
  }
  return context;
}

// Компонент кнопки добавления товара
function AddToCartButton({ product }: { product: Omit<CartItem, 'quantity'> }) {
  const { addItem } = useCart();

  return (
    <button onClick={() => addItem(product)}>
      Добавить в корзину
    </button>
  );
}

// Компонент отображения корзины
function CartWidget() {
  const { state, removeItem, clearCart } = useCart();

  return (
    <div>
      <h2>Корзина ({state.items.length} товара)</h2>
      {state.items.map(item => (
        <div key={item.id}>
          <span>{item.name} × {item.quantity}</span>
          <span> — {item.price * item.quantity} ₽</span>
          <button onClick={() => removeItem(item.id)}>✕</button>
        </div>
      ))}
      <div><strong>Итого: {state.total} ₽</strong></div>
      <button onClick={clearCart}>Очистить корзину</button>
    </div>
  );
}
```

## Когда использовать useContext

Контекст — мощный инструмент, но использовать его нужно обдуманно. Вот ситуации, когда `useContext` — правильный выбор:

**Используйте useContext когда:**
- Данные нужны во многих компонентах на разных уровнях иерархии
- Вы передаёте глобальные настройки: тема, язык, валюта
- Нужно хранить данные авторизации и информацию о пользователе
- Реализуете паттерн "передача функций вниз" (колбэки, диспетчеры)
- Есть несколько не связанных компонентов, которым нужны одни данные

**Не используйте useContext когда:**
- Данные нужны только двум-трём соседним компонентам (передайте через пропсы)
- Данные меняются очень часто (это вызовет множество лишних ре-рендеров)
- Приложение небольшое и prop drilling не является проблемой

## Лучшие практики

### 1. Создавайте кастомные хуки для контекстов

Всегда оборачивайте `useContext` в кастомный хук. Это делает код чище и позволяет добавить валидацию:

```tsx
// Плохо — прямое использование useContext везде
function MyComponent() {
  const theme = useContext(ThemeContext); // а вдруг null?
}

// Хорошо — кастомный хук с валидацией
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme должен использоваться внутри ThemeProvider');
  }
  return context;
}

function MyComponent() {
  const theme = useTheme(); // безопасно и понятно
}
```

### 2. Выносите Provider в отдельный компонент

Держите создание состояния и Provider в одном месте:

```tsx
// Выделяем всю логику в отдельный файл ThemeProvider.tsx
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  // ... логика
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 3. Разделяйте контексты по ответственности

Не создавайте один огромный "глобальный" контекст. Лучше иметь несколько узкоспециализированных:

```tsx
// Плохо — один огромный контекст со всем подряд
const AppContext = createContext({ user, theme, cart, notifications, ... });

// Хорошо — каждый контекст отвечает за свою область
const UserContext = createContext(...);
const ThemeContext = createContext(...);
const CartContext = createContext(...);
```

### 4. Мемоизируйте значение контекста

Если в Provider передаётся объект, мемоизируйте его через `useMemo`, чтобы избежать лишних ре-рендеров:

```tsx
import { useMemo } from 'react';

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Мемоизируем объект контекста — он создаётся заново только при изменении user
  const value = useMemo(() => ({
    user,
    setUser,
    isAdmin: user?.role === 'admin',
  }), [user]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}
```

### 5. Типизируйте контексты через TypeScript

Всегда указывайте тип контекста — это предотвращает ошибки:

```tsx
// Явная типизация гарантирует корректное использование
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);
```

## Распространённые ошибки

### Ошибка 1: Использование контекста вне Provider

```tsx
// Ошибка: компонент не обёрнут в Provider
function App() {
  return <MyComponent />; // MyComponent использует useContext, но нет Provider!
}

// Правильно
function App() {
  return (
    <ThemeProvider>
      <MyComponent />
    </ThemeProvider>
  );
}
```

### Ошибка 2: Обновление объекта без мемоизации

```tsx
// Плохо: при каждом рендере Parent создаётся новый объект value
// Это вызывает ре-рендер ВСЕХ потребителей контекста
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <MyContext.Provider value={{ count, setCount }}> {/* новый объект каждый раз! */}
      <Child />
    </MyContext.Provider>
  );
}

// Хорошо: мемоизируем объект
function Parent() {
  const [count, setCount] = useState(0);
  const value = useMemo(() => ({ count, setCount }), [count]);
  return (
    <MyContext.Provider value={value}>
      <Child />
    </MyContext.Provider>
  );
}
```

### Ошибка 3: Помещать всё состояние в один контекст

```tsx
// Плохо: изменение любого значения вызывает ре-рендер ВСЕХ потребителей
const AppContext = createContext({
  user: null,
  theme: 'light',
  notifications: [],
  cart: [],
  // ... ещё 20 полей
});

// Хорошо: разделяем по смыслу, изменения изолированы
const UserContext = createContext(null);
const ThemeContext = createContext('light');
const NotificationsContext = createContext([]);
```

### Ошибка 4: Чрезмерное использование контекста

Не нужно переносить всё в контекст. Если данные используются только в одном месте или передаются максимум через один-два уровня — оставьте пропсы:

```tsx
// Излишнее использование контекста
const ButtonTextContext = createContext('');
function MyButton() {
  const text = useContext(ButtonTextContext); // для одной кнопки — перебор
  return <button>{text}</button>;
}

// Просто используйте пропс
function MyButton({ text }: { text: string }) {
  return <button>{text}</button>;
}
```

## useContext vs Redux и другие стейт-менеджеры

Один из самых частых вопросов: когда использовать Context API, а когда Redux, Zustand или другие библиотеки управления состоянием?

### Сравнительная таблица

| Критерий | Context API | Redux / Zustand |
|----------|-------------|-----------------|
| Размер приложения | Малое и среднее | Среднее и крупное |
| Сложность настройки | Минимальная | Требует конфигурации |
| Производительность | Ре-рендер всех потребителей | Точечные обновления |
| DevTools | Нет | Есть (Redux DevTools) |
| Middleware | Нет | Есть (thunk, saga) |
| Сложная бизнес-логика | Неудобно | Хорошо подходит |
| Зависимости | Встроено в React | Внешняя библиотека |

### Когда Context API достаточно

- Передача темы, языка, информации о пользователе
- Небольшие и средние приложения без сложной бизнес-логики
- Когда не нужна история изменений состояния и time-travel отладка
- Данные меняются относительно редко

### Когда нужен Redux / Zustand

- Очень частые обновления состояния (например, real-time данные)
- Сложная бизнес-логика с множеством зависимостей
- Необходима отладка через DevTools с историей изменений
- Большая команда, где важна единая конвенция работы с состоянием
- Нужны middleware для асинхронных операций (thunk, saga)

### Комбинирование подходов

На практике часто используют оба подхода вместе:

```tsx
// Redux/Zustand — для сложной бизнес-логики (корзина, заказы, фильтры)
// Context — для UI-настроек (тема, язык, sidebar открыт/закрыт)

function App() {
  return (
    <Provider store={store}> {/* Redux для бизнес-данных */}
      <ThemeProvider>        {/* Context для UI */}
        <LocaleProvider>    {/* Context для локализации */}
          <Router>
            <MainLayout />
          </Router>
        </LocaleProvider>
      </ThemeProvider>
    </Provider>
  );
}
```

## Производительность и оптимизация

Важно понимать, как Context влияет на производительность приложения.

### Как работает обновление контекста

Когда значение в `Provider` меняется, **все** компоненты, подписанные на этот контекст через `useContext`, будут повторно отрисованы — даже если они используют только часть данных контекста.

```tsx
// Если меняется только user.name, ВСЕ три компонента перерисуются
const UserContext = createContext({ name: '', email: '', avatar: '' });

function UserName() {
  const { name } = useContext(UserContext); // перерисовывается при любом изменении
  return <span>{name}</span>;
}

function UserEmail() {
  const { email } = useContext(UserContext); // перерисовывается при любом изменении
  return <span>{email}</span>;
}
```

### Способы оптимизации

**Разделяйте контексты по частоте обновлений:**

```tsx
// Отдельный контекст для редко меняемых данных
const UserStaticContext = createContext({ id: 0, email: '' });

// Отдельный контекст для часто меняемых данных
const UserDynamicContext = createContext({ isOnline: false, lastSeen: null });
```

**Используйте memo для дочерних компонентов:**

```tsx
import { memo } from 'react';

// Компонент не перерисовывается если его пропсы не изменились
const ExpensiveChild = memo(function ExpensiveChild({ data }: { data: string }) {
  return <div>{data}</div>;
});
```

## Заключение

`useContext` — это мощный и простой инструмент для решения проблемы prop drilling в React. Он позволяет передавать данные напрямую к любому компоненту в дереве, минуя промежуточные уровни.

Ключевые моменты, которые стоит запомнить:

- **Context API** состоит из трёх частей: `createContext`, `Provider` и `useContext`
- Всегда создавайте **кастомные хуки** для доступа к контексту вместо прямого вызова `useContext`
- Добавляйте **валидацию** в кастомные хуки — бросайте ошибку, если компонент вне Provider
- **Мемоизируйте** объекты значений контекста через `useMemo`
- **Разделяйте** контексты по ответственности и частоте обновлений
- Используйте Context для глобальных UI-настроек, но рассмотрите Redux/Zustand для сложной бизнес-логики

Context API прекрасно подходит для среднего масштаба задач и при правильном применении значительно упрощает архитектуру приложения.

Если вы хотите глубоко разобраться в работе с состоянием React, включая Context API, Redux Toolkit и другие инструменты управления данными — приходите на курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=usecontext-rabota-s-kontekstom). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Почему мой компонент перерисовывается, хотя нужное мне значение не изменилось?

Это происходит потому, что `useContext` подписывает компонент на весь контекст, а не на его часть. Если в контексте хранится объект и любое его поле меняется, все потребители перерисовываются. Решения: разделить контекст на несколько, мемоизировать значения через `useMemo`, или использовать библиотеку `use-context-selector`.

### Можно ли использовать несколько контекстов одновременно в одном компоненте?

Да, можно вызывать несколько `useContext` в одном компоненте:

```tsx
function MyComponent() {
  const theme = useTheme();
  const { user } = useAuth();
  const { t } = useLocale();
  // ...
}
```

### Как обновить контекст из глубоко вложенного компонента?

Передайте функцию-обновления в значении контекста:

```tsx
const CounterContext = createContext<{ count: number; increment: () => void } | null>(null);

function CounterProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const value = useMemo(() => ({
    count,
    increment: () => setCount(c => c + 1),
  }), [count]);

  return <CounterContext.Provider value={value}>{children}</CounterContext.Provider>;
}

// В любом дочернем компоненте
function DeepChild() {
  const { increment } = useContext(CounterContext)!;
  return <button onClick={increment}>+1</button>;
}
```

### Как тестировать компоненты, использующие useContext?

Оберните тестируемый компонент в нужный Provider с тестовыми данными:

```tsx
import { render, screen } from '@testing-library/react';

test('отображает имя пользователя', () => {
  render(
    <UserContext.Provider value={{ user: { name: 'Тест', email: 'test@example.com' } }}>
      <UserProfile />
    </UserContext.Provider>
  );
  expect(screen.getByText('Тест')).toBeInTheDocument();
});
```

### Можно ли использовать контекст вне React-компонента (в обычных JS-функциях)?

Нет, `useContext` работает только внутри функциональных компонентов или кастомных хуков. Если нужен доступ к данным вне React (например, в API-сервисах), используйте отдельные модули или такие инструменты как Redux, Zustand — они предоставляют доступ к состоянию вне компонентов через `getState()` или хранилища.

### Что произойдёт, если использовать useContext без Provider?

`useContext` вернёт значение по умолчанию, переданное в `createContext`. Если использовать паттерн с `null` по умолчанию и валидацией в кастомном хуке, вы получите понятную ошибку. Без валидации вы получите `null` и, скорее всего, ошибку при попытке обратиться к свойствам.

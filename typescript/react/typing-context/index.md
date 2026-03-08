---
metaTitle: Типизация Context API в React с TypeScript — провайдеры и хуки
metaDescription: Подробное руководство по типизации React Context API с TypeScript. Создание типобезопасных контекстов, провайдеров и кастомных хуков доступа к контексту
author: Олег Марков
title: Context API с TypeScript в React
preview: Научитесь правильно типизировать React Context: создавайте типобезопасные провайдеры, потребители и кастомные хуки с полной поддержкой TypeScript
---

## Введение

Context API в React позволяет передавать данные через дерево компонентов без явной передачи пропсов на каждом уровне. TypeScript делает работу с контекстом значительно безопаснее — вы получаете автодополнение, проверку типов и гарантии того, что контекст используется правильно. В этой статье мы разберём все паттерны типизации контекста.

## Базовый паттерн типизации контекста

Самый распространённый паттерн — создание контекста с типом значения и хука для его потребления:

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

// 1. Определяем тип значения контекста
interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// 2. Создаём контекст с null как начальным значением
// null означает "контекст не был предоставлен"
const ThemeContext = createContext<ThemeContextValue | null>(null);

// 3. Создаём провайдер
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark';
}

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(defaultTheme);
  
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 4. Создаём хук с проверкой null
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  
  return context;
}

// Использование
function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <Header />
      <Main />
    </ThemeProvider>
  );
}

function Header() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className={`header header--${theme}`}>
      <button onClick={toggleTheme}>
        {theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
      </button>
    </header>
  );
}
```

## Контекст аутентификации

Аутентификация — один из наиболее распространённых случаев использования контекста:

```tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'avatar'>>) => Promise<void>;
  hasRole: (role: User['role']) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true, // true при первичной загрузке
  });
  
  // Проверка сессии при монтировании
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const user: User = await response.json();
          setState({ user, isAuthenticated: true, isLoading: false });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    checkSession();
  }, []);
  
  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error: { message: string } = await response.json();
      throw new Error(error.message);
    }
    
    const user: User = await response.json();
    setState({ user, isAuthenticated: true, isLoading: false });
  }, []);
  
  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setState({ user: null, isAuthenticated: false, isLoading: false });
  }, []);
  
  const updateProfile = useCallback(async (updates: Partial<Pick<User, 'name' | 'avatar'>>) => {
    const response = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) throw new Error('Не удалось обновить профиль');
    
    const updatedUser: User = await response.json();
    setState(prev => ({ ...prev, user: updatedUser }));
  }, []);
  
  const hasRole = useCallback((role: User['role']): boolean => {
    if (!state.user) return false;
    
    // Иерархия ролей: admin > editor > viewer
    const roleHierarchy: Record<User['role'], number> = {
      admin: 3,
      editor: 2,
      viewer: 1,
    };
    
    return roleHierarchy[state.user.role] >= roleHierarchy[role];
  }, [state.user]);
  
  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateProfile, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// Компонент защищённого маршрута
function ProtectedRoute({ children, requiredRole }: {
  children: ReactNode;
  requiredRole?: User['role'];
}) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  
  if (isLoading) return <div>Проверка авторизации...</div>;
  if (!isAuthenticated) return <div>Требуется авторизация</div>;
  if (requiredRole && !hasRole(requiredRole)) return <div>Недостаточно прав</div>;
  
  return <>{children}</>;
}
```

## Контекст с useReducer

Для сложного состояния используйте `useReducer` внутри провайдера:

```tsx
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE'; payload: { id: number } }
  | { type: 'UPDATE_QTY'; payload: { id: number; quantity: number } }
  | { type: 'CLEAR' };

interface CartContextValue {
  state: CartState;
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  isInCart: (id: number) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find(item => item.id === action.payload.id);
      const items = existing
        ? state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...state.items, { ...action.payload, quantity: 1 }];
      
      return {
        items,
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        itemCount: items.reduce((count, item) => count + item.quantity, 0),
      };
    }
    
    case 'REMOVE': {
      const items = state.items.filter(item => item.id !== action.payload.id);
      return {
        items,
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        itemCount: items.reduce((count, item) => count + item.quantity, 0),
      };
    }
    
    case 'UPDATE_QTY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE', payload: { id } });
      }
      const items = state.items.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      return {
        items,
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        itemCount: items.reduce((count, item) => count + item.quantity, 0),
      };
    }
    
    case 'CLEAR':
      return { items: [], total: 0, itemCount: 0 };
    
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = React.useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0,
  });
  
  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD', payload: item });
  }, []);
  
  const removeFromCart = useCallback((id: number) => {
    dispatch({ type: 'REMOVE', payload: { id } });
  }, []);
  
  const updateQuantity = useCallback((id: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QTY', payload: { id, quantity } });
  }, []);
  
  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);
  
  const isInCart = useCallback((id: number): boolean => {
    return state.items.some(item => item.id === id);
  }, [state.items]);
  
  return (
    <CartContext.Provider value={{
      state, addToCart, removeFromCart, updateQuantity, clearCart, isInCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
```

## Разделение контекста на части

Для производительности можно разделить контекст на состояние и методы:

```tsx
// Разделяем данные и методы на два отдельных контекста
// Это позволяет компонентам, которые только вызывают методы,
// не перерендериваться при изменении данных

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

interface NotificationActions {
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

const NotificationStateContext = createContext<NotificationState | null>(null);
const NotificationActionsContext = createContext<NotificationActions | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const addNotification = useCallback((
    notif: Omit<Notification, 'id' | 'createdAt' | 'read'>
  ) => {
    const newNotification: Notification = {
      ...notif,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);
  
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);
  
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);
  
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  const state: NotificationState = {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
  };
  
  const actions: NotificationActions = {
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
  
  return (
    <NotificationStateContext.Provider value={state}>
      <NotificationActionsContext.Provider value={actions}>
        {children}
      </NotificationActionsContext.Provider>
    </NotificationStateContext.Provider>
  );
}

// Два отдельных хука — потребитель выбирает, что ему нужно
export function useNotificationState(): NotificationState {
  const context = useContext(NotificationStateContext);
  if (!context) throw new Error('useNotificationState must be used within NotificationProvider');
  return context;
}

export function useNotificationActions(): NotificationActions {
  const context = useContext(NotificationActionsContext);
  if (!context) throw new Error('useNotificationActions must be used within NotificationProvider');
  return context;
}

// Компонент иконки — только счётчик, не перерендеривается при изменении actions
function NotificationBell() {
  const { unreadCount } = useNotificationState();
  return (
    <button>
      🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
    </button>
  );
}

// Компонент кнопки — только actions, не перерендеривается при изменении данных
function MarkAllReadButton() {
  const { markAllAsRead } = useNotificationActions();
  return <button onClick={markAllAsRead}>Прочитать все</button>;
}
```

## Типизация с defaultValue

Альтернативный паттерн — использовать дефолтное значение вместо null:

```tsx
// Вариант с дефолтным значением (не рекомендуется для большинства случаев,
// так как ошибочное использование вне провайдера не будет обнаружено)

const defaultLocaleValue: LocaleContextValue = {
  locale: 'ru',
  setLocale: () => { /* no-op */ },
  t: (key: string) => key, // Возвращаем ключ как заглушку
};

const LocaleContext = createContext<LocaleContextValue>(defaultLocaleValue);

// Хук без проверки null — если контекст не предоставлен, используется дефолтное значение
export function useLocale() {
  return useContext(LocaleContext);
}
```

## Лучшие практики

**1. Всегда создавайте кастомный хук для доступа к контексту:**

```tsx
// Плохо — используется напрямую, без проверки
const theme = useContext(ThemeContext);

// Хорошо — через кастомный хук с проверкой
const { theme } = useTheme();
```

**2. Разделяйте данные и методы для оптимизации перерендеров:**

Компоненты, которые только вызывают методы, не должны перерендериваться при изменении данных.

**3. Экспортируйте только хуки, а не сам контекст:**

```tsx
// Хорошо — внутренняя деталь реализации
const ThemeContext = createContext<ThemeContextValue | null>(null);

// Экспортируем только провайдер и хук
export { ThemeProvider, useTheme };
```

**4. Давайте описательные сообщения об ошибках:**

```tsx
if (!context) {
  throw new Error(
    'useAuth hook was called outside of AuthProvider. ' +
    'Make sure to wrap your component tree with <AuthProvider>.'
  );
}
```

## Заключение

Правильная типизация Context API с TypeScript:

- Используйте `createContext<T | null>(null)` и проверяйте null в хуке
- Создавайте кастомные хуки для каждого контекста
- Разделяйте состояние и методы для оптимизации производительности
- `useReducer` внутри провайдера — лучший выбор для сложного состояния
- Экспортируйте только провайдер и хуки, скрывая объект контекста

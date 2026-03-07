---
metaTitle: React с TypeScript — настройка и основные паттерны
metaDescription: Полное руководство по настройке TypeScript в React-проекте. Типизация компонентов, хуков, событий, контекста, форм и продвинутые паттерны с generics
author: Олег Марков
title: React с TypeScript — настройка
preview: Научитесь настраивать TypeScript в React-проектах и применять ключевые паттерны типизации — пропсы, хуки, события, контекст и дженерики
---

## Введение

TypeScript и React — мощная комбинация, которая делает разработку более надёжной и предсказуемой. TypeScript добавляет статическую типизацию, что позволяет поймать ошибки на этапе компиляции, улучшает автодополнение в IDE и делает рефакторинг безопасным.

В этой статье вы узнаете, как настроить TypeScript в React-проекте с нуля и освоите ключевые паттерны типизации, которые встречаются в реальных проектах.

## Создание проекта с TypeScript

### Vite (рекомендуется для новых проектов)

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
```

### Create React App

```bash
npx create-react-app my-app --template typescript
cd my-app
```

### Next.js

```bash
npx create-next-app@latest my-app --typescript
```

## Настройка tsconfig.json

Оптимальная конфигурация TypeScript для React-проекта:

```json
{
  "compilerOptions": {
    /* Основные настройки */
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    
    /* Строгий режим — обязателен для качественного кода */
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    
    /* Разрешение модулей */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    
    /* Совместимость */
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    
    /* Улучшение DX */
    "skipLibCheck": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Типизация компонентов

### Функциональные компоненты

```tsx
import { ReactNode, FC } from 'react';

// Способ 1: через FC<Props> (не рекомендуется в современном React)
const Button: FC<{ onClick: () => void; children: ReactNode }> = ({ onClick, children }) => (
  <button onClick={onClick}>{children}</button>
);

// Способ 2: явная типизация пропсов (рекомендуется)
interface ButtonProps {
  /** Текст или JSX внутри кнопки */
  children: ReactNode;
  /** Обработчик клика */
  onClick: () => void;
  /** Вариант отображения */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Размер кнопки */
  size?: 'sm' | 'md' | 'lg';
  /** Отключённое состояние */
  disabled?: boolean;
  /** CSS класс */
  className?: string;
}

function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`btn btn-${variant} btn-${size} ${className}`}
    >
      {children}
    </button>
  );
}
```

### Компоненты с дженериками

```tsx
interface SelectProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string | number;
  placeholder?: string;
}

function Select<T>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
  placeholder = 'Выберите...',
}: SelectProps<T>) {
  return (
    <select
      value={value ? String(getValue(value)) : ''}
      onChange={e => {
        const selected = options.find(o => String(getValue(o)) === e.target.value);
        if (selected) onChange(selected);
      }}
    >
      <option value="">{placeholder}</option>
      {options.map(option => (
        <option key={String(getValue(option))} value={String(getValue(option))}>
          {getLabel(option)}
        </option>
      ))}
    </select>
  );
}

// Использование с полной типобезопасностью
interface City {
  id: number;
  name: string;
  country: string;
}

<Select<City>
  options={cities}
  value={selectedCity}
  onChange={setSelectedCity}
  getLabel={city => `${city.name}, ${city.country}`}
  getValue={city => city.id}
/>
```

## Типизация хуков

### useState

```tsx
// TypeScript автоматически выводит тип из начального значения
const [count, setCount] = useState(0); // number
const [name, setName] = useState(''); // string
const [isOpen, setIsOpen] = useState(false); // boolean

// Явная типизация нужна для сложных типов и null/undefined
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
}

// Начальное значение null — нужна явная типизация
const [user, setUser] = useState<User | null>(null);

// Для массивов
const [items, setItems] = useState<string[]>([]);

// Для объектов с неизвестными ключами
const [errors, setErrors] = useState<Record<string, string>>({});
```

### useRef

```tsx
import { useRef, useEffect } from 'react';

function VideoPlayer({ src }: { src: string }) {
  // Для DOM-элементов — начальное значение null
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);
  
  return <video ref={videoRef} src={src} />;
}

// Для мутабельных значений без DOM (таймеры, предыдущие значения)
function Timer() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const start = () => {
    timerRef.current = setInterval(() => {
      console.log('tick');
    }, 1000);
  };
  
  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  
  return (
    <div>
      <button onClick={start}>Старт</button>
      <button onClick={stop}>Стоп</button>
    </div>
  );
}
```

### useReducer

```tsx
// Определяем типы для состояния и действий
interface CartState {
  items: CartItem[];
  total: number;
  isLoading: boolean;
  error: string | null;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

// Дискриминантные union типы для actions
type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { id: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string };

const initialState: CartState = {
  items: [],
  total: 0,
  isLoading: false,
  error: null,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(item => item.id === action.payload.id);
      const items = existing
        ? state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        : [...state.items, action.payload];
      
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return { ...state, items, total };
    }
    
    case 'REMOVE_ITEM': {
      const items = state.items.filter(item => item.id !== action.payload.id);
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return { ...state, items, total };
    }
    
    case 'CLEAR_CART':
      return { ...initialState };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    default:
      return state;
  }
}

function Cart() {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  return (
    <div>
      {state.items.map(item => (
        <div key={item.id}>
          {item.name} × {item.quantity}
          <button onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id } })}>
            Удалить
          </button>
        </div>
      ))}
      <div>Итого: {state.total} ₽</div>
    </div>
  );
}
```

## Типизация событий

```tsx
import { ChangeEvent, FormEvent, MouseEvent, KeyboardEvent } from 'react';

function Form() {
  const [value, setValue] = useState('');

  // Обработчик input
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  // Обработчик select
  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    console.log(e.target.value);
  };

  // Обработчик textarea
  const handleTextarea = (e: ChangeEvent<HTMLTextAreaElement>) => {
    console.log(e.target.value);
  };

  // Обработчик формы
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('submit', value);
  };

  // Обработчик клика с доступом к элементу
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    console.log(e.currentTarget.id);
  };

  // Обработчик клавиатуры
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button id="submit-btn" type="submit" onClick={handleClick}>
        Отправить
      </button>
    </form>
  );
}
```

## Типизация контекста

```tsx
import { createContext, useContext, ReactNode } from 'react';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Создаём контекст с явным типом
const AuthContext = createContext<AuthContextValue | null>(null);

// Провайдер
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) throw new Error('Authentication failed');
    
    const userData: AuthUser = await response.json();
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    fetch('/api/auth/logout', { method: 'POST' });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Хук с проверкой контекста
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Использование
function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <div>
      <span>{user!.name}</span> {/* user точно не null если isAuthenticated */}
      <button onClick={logout}>Выйти</button>
    </div>
  );
}
```

## Расширение HTML-пропсов

```tsx
import { ComponentPropsWithoutRef, ComponentPropsWithRef, forwardRef } from 'react';

// Расширяем стандартные HTML атрибуты
interface InputProps extends ComponentPropsWithoutRef<'input'> {
  label?: string;
  error?: string;
  hint?: string;
}

function Input({ label, error, hint, className = '', ...inputProps }: InputProps) {
  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <input
        className={`input ${error ? 'input--error' : ''} ${className}`}
        {...inputProps}
      />
      {error && <span className="input-error">{error}</span>}
      {hint && !error && <span className="input-hint">{hint}</span>}
    </div>
  );
}

// Компонент с forwardRef
const TextInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...inputProps }, ref) => {
    return (
      <div className="input-wrapper">
        {label && <label>{label}</label>}
        <input ref={ref} className={`input ${error ? 'input--error' : ''} ${className}`} {...inputProps} />
        {error && <span className="input-error">{error}</span>}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
```

## Типизация кастомных хуков

```tsx
// Хук для работы с API
interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useApi<T>(url: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json: T = await response.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return { data, isLoading, error, refetch: fetchData };
}

// Использование с конкретным типом
interface Product {
  id: number;
  name: string;
  price: number;
}

function ProductList() {
  const { data: products, isLoading, error } = useApi<Product[]>('/api/products');

  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  if (!products) return null;

  return (
    <ul>
      {products.map(product => (
        <li key={product.id}>{product.name} — {product.price} ₽</li>
      ))}
    </ul>
  );
}
```

## Утилитарные типы React

```tsx
// Извлечение типов пропсов компонента
import { ComponentProps, ComponentPropsWithRef } from 'react';

type ButtonProps = ComponentProps<typeof Button>;
type InputProps = ComponentPropsWithRef<'input'>;

// React.ReactElement vs ReactNode vs JSX.Element
import { ReactElement, ReactNode } from 'react';

// ReactNode — наиболее широкий тип (string, number, element, array, null...)
function Container({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

// ReactElement — только React-элемент (JSX)
function Wrapper({ child }: { child: ReactElement }) {
  return <div className="wrapper">{child}</div>;
}

// Для render props
interface WithLoadingProps {
  isLoading: boolean;
  children: (data: SomeData) => ReactNode;
}
```

## Итоги

Интеграция TypeScript в React — правильное решение для любого проекта, который планирует расти. Ключевые практики:

1. **Включайте строгий режим** (`"strict": true`) — он поймает большинство ошибок
2. **Типизируйте пропсы явно** через `interface` или `type`, а не `FC<Props>`
3. **Используйте дискриминантные union** для `useReducer` actions
4. **Для событий** — используйте `ChangeEvent`, `FormEvent`, `MouseEvent` из React
5. **Для дженериков** — делайте компоненты и хуки максимально переиспользуемыми
6. **Для context** — всегда проверяйте `null` в хуке-обёртке

TypeScript в React увеличивает время разработки поначалу, но значительно снижает количество runtime-ошибок и делает рефакторинг безопасным.

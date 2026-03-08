---
metaTitle: Типизация хуков React с TypeScript — useState, useEffect, useRef, useCallback
metaDescription: Полное руководство по типизации встроенных хуков React с TypeScript. Примеры для useState, useEffect, useRef, useCallback, useReducer и useMemo
author: Олег Марков
title: Хуки React с TypeScript — правильная типизация
preview: Научитесь правильно типизировать все встроенные хуки React с TypeScript — от простого useState до сложного useReducer с дискриминантными union-типами
---

## Введение

Хуки — основа современного React, а TypeScript делает работу с ними значительно безопаснее. Правильная типизация хуков позволяет компилятору ловить ошибки, которые иначе проявились бы только в runtime. В этой статье мы подробно разберём типизацию всех ключевых хуков.

## useState

`useState` умеет автоматически выводить тип из начального значения. Однако есть случаи, когда явная типизация необходима.

### Автоматический вывод типа

```tsx
// TypeScript сам выводит типы — явная типизация не нужна
const [count, setCount] = useState(0);           // number
const [name, setName] = useState('');            // string
const [isVisible, setIsVisible] = useState(false); // boolean
const [score, setScore] = useState(3.14);        // number
```

### Явная типизация для сложных случаев

```tsx
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

// null как начальное значение требует явного указания типа
const [user, setUser] = useState<User | null>(null);

// Массивы
const [users, setUsers] = useState<User[]>([]);

// Объект с динамическими ключами
const [formData, setFormData] = useState<Record<string, string>>({});

// Объединение примитивных типов
const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
```

### Функциональный апдейт useState

```tsx
// TypeScript правильно типизирует функциональный апдейт
const [items, setItems] = useState<string[]>([]);

// Функция получает предыдущее значение с правильным типом
const addItem = (item: string) => {
  setItems(prevItems => [...prevItems, item]);
};

const removeItem = (index: number) => {
  setItems(prevItems => prevItems.filter((_, i) => i !== index));
};
```

### Ленивая инициализация

```tsx
// Если начальное значение вычисляется из сложной функции,
// используйте ленивую инициализацию
const [sortedData, setSortedData] = useState<number[]>(() => {
  // Эта функция вызывается только при первом рендере
  return [...largeDataArray].sort((a, b) => a - b);
});
```

## useEffect

`useEffect` не требует явной типизации — TypeScript автоматически проверяет типы зависимостей и возвращаемого значения функции очистки.

```tsx
import { useEffect, useState } from 'react';

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // TypeScript знает типы всего, что используется внутри
    let cancelled = false;
    
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data: User = await response.json();
        
        // Проверяем флаг отмены перед обновлением состояния
        if (!cancelled) {
          setUser(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    
    fetchUser();
    
    // Функция очистки — TypeScript проверяет, что она возвращает void
    return () => {
      cancelled = true;
    };
  }, [userId]); // TypeScript проверяет, что userId имеет правильный тип

  if (isLoading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error.message}</div>;
  if (!user) return null;
  
  return <div>{user.name}</div>;
}
```

### useEffect с EventListener

```tsx
useEffect(() => {
  // TypeScript знает типы событий window
  const handleResize = (event: UIEvent) => {
    console.log(window.innerWidth);
  };
  
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      // что-то делаем
    }
  };
  
  window.addEventListener('resize', handleResize);
  document.addEventListener('keydown', handleKeyDown);
  
  return () => {
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('keydown', handleKeyDown);
  };
}, []);
```

## useRef

`useRef` имеет три разные сигнатуры в зависимости от использования — это важно понимать.

### useRef для DOM-элементов

```tsx
import { useRef, useEffect } from 'react';

function AutoFocusInput() {
  // Для DOM ref — указываем тип элемента, начальное значение null
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // inputRef.current может быть null, нужна проверка
    inputRef.current?.focus();
  }, []);
  
  return <input ref={inputRef} type="text" />;
}

// Разные HTML-элементы требуют разных типов
const divRef = useRef<HTMLDivElement>(null);
const formRef = useRef<HTMLFormElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);
const videoRef = useRef<HTMLVideoElement>(null);
const buttonRef = useRef<HTMLButtonElement>(null);
```

### useRef для мутабельных значений

```tsx
function Timer() {
  // Для хранения значений — тип без null, начальное значение соответствует типу
  const timerIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef<number>(0);
  const prevValueRef = useRef<string>('');
  
  const startTimer = () => {
    // Очищаем предыдущий таймер если есть
    if (timerIdRef.current !== null) {
      clearInterval(timerIdRef.current);
    }
    
    timerIdRef.current = setInterval(() => {
      countRef.current += 1;
      console.log(`Тик #${countRef.current}`);
    }, 1000);
  };
  
  const stopTimer = () => {
    if (timerIdRef.current !== null) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  };
  
  // Ref не вызывает перерендер при изменении — используйте для значений,
  // которые нужны в обработчиках событий, но не влияют на рендер
  
  return (
    <div>
      <button onClick={startTimer}>Старт</button>
      <button onClick={stopTimer}>Стоп</button>
    </div>
  );
}
```

### Три сигнатуры useRef

```tsx
// 1. DOM ref — current может быть null (readonly)
const domRef = useRef<HTMLDivElement>(null);
// domRef.current: HTMLDivElement | null (readonly)

// 2. Мутабельный ref — current не null
const mutableRef = useRef<number>(0);
// mutableRef.current: number (mutable)

// 3. Мутабельный ref с null — для значений, которые могут не быть инициализированы
const nullableRef = useRef<AbortController | null>(null);
// nullableRef.current: AbortController | null (mutable)
```

## useCallback

`useCallback` кешируют функцию и требуют правильной типизации входных и выходных параметров:

```tsx
import { useCallback, useState } from 'react';

interface Item {
  id: number;
  name: string;
  completed: boolean;
}

function TodoList() {
  const [items, setItems] = useState<Item[]>([]);
  
  // TypeScript выводит тип возвращаемого значения автоматически
  const addItem = useCallback((name: string) => {
    setItems(prev => [
      ...prev,
      { id: Date.now(), name, completed: false }
    ]);
  }, []); // Пустой массив зависимостей — функция создаётся один раз
  
  const toggleItem = useCallback((id: number) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []); // setItems стабильна, поэтому зависимостей нет
  
  const removeItem = useCallback((id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);
  
  return (
    <ul>
      {items.map(item => (
        <TodoItem
          key={item.id}
          item={item}
          onToggle={toggleItem}
          onRemove={removeItem}
        />
      ))}
    </ul>
  );
}

// Мемоизируем дочерний компонент для оптимизации
const TodoItem = React.memo(function TodoItem({
  item,
  onToggle,
  onRemove,
}: {
  item: Item;
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <li>
      <input
        type="checkbox"
        checked={item.completed}
        onChange={() => onToggle(item.id)}
      />
      <span>{item.name}</span>
      <button onClick={() => onRemove(item.id)}>Удалить</button>
    </li>
  );
});
```

## useMemo

`useMemo` кеширует вычисленное значение, TypeScript выводит его тип:

```tsx
import { useMemo } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

function ProductList({
  products,
  filterCategory,
  sortBy,
  showInStock,
}: {
  products: Product[];
  filterCategory: string;
  sortBy: 'name' | 'price';
  showInStock: boolean;
}) {
  // TypeScript выводит тип результата как Product[]
  const filteredAndSorted = useMemo(() => {
    let result = products;
    
    if (filterCategory) {
      result = result.filter(p => p.category === filterCategory);
    }
    
    if (showInStock) {
      result = result.filter(p => p.inStock);
    }
    
    return [...result].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.price - b.price;
    });
  }, [products, filterCategory, sortBy, showInStock]);
  
  // Статистика — TypeScript выводит тип объекта
  const stats = useMemo(() => ({
    total: filteredAndSorted.length,
    totalPrice: filteredAndSorted.reduce((sum, p) => sum + p.price, 0),
    averagePrice: filteredAndSorted.length
      ? filteredAndSorted.reduce((sum, p) => sum + p.price, 0) / filteredAndSorted.length
      : 0,
  }), [filteredAndSorted]);
  
  return (
    <div>
      <p>Товаров: {stats.total}, средняя цена: {stats.averagePrice.toFixed(2)} ₽</p>
      {filteredAndSorted.map(product => (
        <div key={product.id}>{product.name} — {product.price} ₽</div>
      ))}
    </div>
  );
}
```

## useReducer

`useReducer` — один из хуков, где TypeScript действительно сияет. Дискриминантные union типы для action делают reducer полностью типобезопасным:

```tsx
// Типы состояния
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  couponCode: string | null;
  discount: number;
}

// Дискриминантные union для actions
type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: { id: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'APPLY_COUPON'; payload: { code: string; discount: number } }
  | { type: 'REMOVE_COUPON' }
  | { type: 'CLEAR_CART' };

const calculateTotal = (items: CartItem[], discount: number): number => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return subtotal * (1 - discount / 100);
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(item => item.id === action.payload.id);
      
      const items = existing
        ? state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...state.items, { ...action.payload, quantity: 1 }];
      
      return {
        ...state,
        items,
        total: calculateTotal(items, state.discount),
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      
      if (quantity <= 0) {
        const items = state.items.filter(item => item.id !== id);
        return { ...state, items, total: calculateTotal(items, state.discount) };
      }
      
      const items = state.items.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      return { ...state, items, total: calculateTotal(items, state.discount) };
    }
    
    case 'APPLY_COUPON':
      return {
        ...state,
        couponCode: action.payload.code,
        discount: action.payload.discount,
        total: calculateTotal(state.items, action.payload.discount),
      };
    
    case 'REMOVE_COUPON':
      return {
        ...state,
        couponCode: null,
        discount: 0,
        total: calculateTotal(state.items, 0),
      };
    
    case 'CLEAR_CART':
      return { items: [], total: 0, couponCode: null, discount: 0 };
    
    default:
      return state;
  }
}

const initialState: CartState = {
  items: [],
  total: 0,
  couponCode: null,
  discount: 0,
};

function Cart() {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  // dispatch типобезопасен — TypeScript не даст передать неверный action
  const handleAddItem = (product: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };
  
  return (
    <div>
      {state.items.map(item => (
        <div key={item.id}>
          {item.name} × {item.quantity} = {item.price * item.quantity} ₽
          <button onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: { id: item.id } })}>
            Удалить
          </button>
        </div>
      ))}
      <div>Итого: {state.total.toFixed(2)} ₽</div>
      <button onClick={() => dispatch({ type: 'CLEAR_CART' })}>
        Очистить корзину
      </button>
    </div>
  );
}
```

## useContext

Типизация контекста разобрана в отдельной статье, но основной паттерн выглядит так:

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
```

## Лучшие практики

**1. Доверяйте выводу типов для простых случаев:**

```tsx
// Не нужно писать useState<number>(0) — TypeScript и так знает тип
const [count, setCount] = useState(0);
```

**2. Явно типизируйте useState с null:**

```tsx
// Без явного типа TypeScript выведет тип как null, что не то, что нужно
const [data, setData] = useState<ApiResponse | null>(null);
```

**3. Используйте ReturnType для useRef с таймерами:**

```tsx
// Правильно — работает в Node.js и в браузере
const timerId = useRef<ReturnType<typeof setTimeout> | null>(null);
```

**4. Массив зависимостей useEffect и useCallback не типизируется явно** — TypeScript сам проверит, что используемые переменные имеют стабильные типы.

**5. Для useReducer создавайте действия через хелперы:**

```tsx
// Action creators делают код чище
const cartActions = {
  addItem: (item: Omit<CartItem, 'quantity'>): CartAction => ({
    type: 'ADD_ITEM',
    payload: item,
  }),
  clearCart: (): CartAction => ({ type: 'CLEAR_CART' }),
};

dispatch(cartActions.addItem(product));
```

## Заключение

TypeScript значительно улучшает опыт работы с хуками React. Основные моменты:

- `useState` выводит типы автоматически — явная типизация нужна только для `null`, сложных объектов и union-типов
- `useEffect` не требует явной типизации — TypeScript проверяет типы внутри автоматически
- `useRef` имеет три разные сигнатуры — выбирайте правильную в зависимости от использования
- `useCallback` и `useMemo` выводят тип возвращаемого значения автоматически
- `useReducer` лучше всего работает с дискриминантными union-типами для actions

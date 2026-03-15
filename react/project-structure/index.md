---
metaTitle: Структура React-проекта - лучшие практики и архитектурные паттерны
metaDescription: Полное руководство по организации структуры React-проекта: CRA, Vite, Next.js, атомарный дизайн, feature-based архитектура, хуки, стейт-менеджмент, TypeScript и тестирование
author: Олег Марков
title: Структура React-проекта - лучшие практики и архитектурные паттерны
preview: Узнайте, как правильно организовать структуру папок в React-проекте. Рассматриваем подходы CRA, Vite и Next.js, атомарный дизайн, feature-based архитектуру, организацию хуков, стейт-менеджмента, API-сервисов и TypeScript-типизации
---

## Введение

Одна из самых частых ошибок разработчиков при создании React-приложений — это игнорирование вопроса структуры проекта на начальном этапе. Кажется, что сначала важно просто «сделать, чтобы работало», а структуру можно навести потом. На практике «потом» превращается в болезненный рефакторинг, когда проект уже вырос до нескольких десятков компонентов, и понять, где что лежит, становится всё сложнее.

Хорошая структура проекта — это не просто красивое расположение файлов. Это архитектурное решение, которое влияет на:

- **Масштабируемость** — как легко добавлять новую функциональность
- **Сопровождаемость** — как быстро разработчик (в том числе новый в команде) разберётся в коде
- **Тестируемость** — насколько просто писать тесты
- **Совместную разработку** — насколько редко разработчики «наступают друг другу на ноги»

В этой статье мы разберём базовые структуры для разных инструментов сборки, рассмотрим популярные архитектурные подходы — атомарный дизайн и feature-based структуру, поговорим об организации хуков, стейт-менеджмента, API-сервисов и TypeScript-типизации.

## Базовая структура React-проекта

### Create React App (CRA)

Create React App генерирует следующую начальную структуру:

```
my-app/
├── node_modules/
├── public/
│   ├── favicon.ico
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── App.css
│   ├── App.test.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── index.tsx
│   └── react-app-env.d.ts
├── .gitignore
├── package.json
├── README.md
└── tsconfig.json
```

Это минимальная точка отсчёта. По мере роста проекта папку `src/` нужно структурировать самостоятельно.

### Vite

Vite создаёт более лаконичную начальную структуру:

```
my-app/
├── node_modules/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

Ключевое отличие от CRA — `index.html` находится в корне проекта (не в `public/`), а точка входа — `src/main.tsx`.

### Next.js (App Router)

Next.js 13+ с App Router имеет собственные соглашения:

```
my-app/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/
│   │   └── users/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── lib/
├── public/
├── .gitignore
├── next.config.js
├── package.json
└── tsconfig.json
```

В Next.js структура роутинга определяется структурой файловой системы внутри `app/`, что накладывает дополнительные соглашения на организацию кода.

## Расширенная структура для реального проекта

Независимо от инструмента сборки, реальный проект обычно требует следующих директорий:

```
src/
├── assets/           # Статические ресурсы (изображения, шрифты, иконки)
├── components/       # Переиспользуемые компоненты
├── hooks/            # Кастомные React-хуки
├── pages/            # Компоненты страниц (или app/ в Next.js)
├── services/         # API-сервисы и внешние интеграции
├── store/            # Стейт-менеджмент (Redux, Zustand и т.д.)
├── types/            # TypeScript-типы и интерфейсы
├── utils/            # Вспомогательные функции
├── constants/        # Константы приложения
├── config/           # Конфигурационные файлы
└── styles/           # Глобальные стили
```

Разберём каждую директорию подробнее.

## Организация компонентов

### Принципы группировки

Существует два основных подхода к организации компонентов: **атомарный дизайн** и **feature-based (доменный) подход**.

### Атомарный дизайн

Концепция атомарного дизайна, предложенная Брэдом Фростом, делит компоненты на 5 уровней:

```
components/
├── atoms/            # Базовые элементы UI
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   ├── Input/
│   ├── Label/
│   └── Icon/
├── molecules/        # Комбинации атомов
│   ├── FormField/    # Label + Input
│   ├── SearchBar/    # Input + Button
│   └── Card/
├── organisms/        # Сложные секции UI
│   ├── Header/
│   ├── UserForm/
│   └── ProductList/
├── templates/        # Шаблоны страниц (layout без данных)
│   ├── DashboardLayout/
│   └── AuthLayout/
└── pages/            # Конкретные страницы с данными
    ├── HomePage/
    └── ProfilePage/
```

**Атомы** — простейшие UI-элементы, которые нельзя разбить дальше: кнопки, инпуты, иконки, метки.

**Молекулы** — небольшие группы атомов, выполняющие одну функцию: поле формы (метка + инпут), карточка с заголовком и текстом.

**Организмы** — сложные секции интерфейса, построенные из молекул и атомов: хедер сайта, форма регистрации, список товаров.

**Шаблоны** — сетки страниц без конкретного контента, только структура.

**Страницы** — конкретные экземпляры шаблонов с реальными данными.

Пример атома — компонент Button:

```tsx
// components/atoms/Button/Button.tsx
import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  children,
  disabled,
  ...rest
}) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? <span className={styles.spinner} /> : children}
    </button>
  );
};
```

Пример молекулы — поле формы FormField:

```tsx
// components/molecules/FormField/FormField.tsx
import React from 'react';
import { Label } from '../../atoms/Label';
import { Input } from '../../atoms/Input';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  required,
}) => {
  return (
    <div className="form-field">
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <span id={`${name}-error`} className="error-message" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};
```

### Feature-based (доменный) подход

Feature-based структура группирует код по функциональным областям приложения, а не по техническому типу:

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── hooks/
│   │   │   ├── useLogin.ts
│   │   │   └── useRegister.ts
│   │   ├── services/
│   │   │   └── authService.ts
│   │   ├── store/
│   │   │   └── authSlice.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   └── index.ts      # Публичный API фичи
│   ├── products/
│   │   ├── components/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductList.tsx
│   │   │   └── ProductFilter.tsx
│   │   ├── hooks/
│   │   │   └── useProducts.ts
│   │   ├── services/
│   │   │   └── productsService.ts
│   │   ├── store/
│   │   │   └── productsSlice.ts
│   │   └── index.ts
│   └── cart/
│       ├── components/
│       ├── hooks/
│       ├── store/
│       └── index.ts
├── shared/             # Переиспользуемое между фичами
│   ├── components/
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Modal/
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   ├── utils/
│   └── types/
└── app/                # Конфигурация приложения
    ├── router.tsx
    ├── store.ts
    └── providers.tsx
```

Ключевое правило feature-based подхода: **каждая фича экспортирует публичный API через `index.ts`**. Другие фичи могут импортировать только из этого файла, но не напрямую из внутренних модулей.

```ts
// features/auth/index.ts — публичный API фичи
export { LoginForm } from './components/LoginForm';
export { RegisterForm } from './components/RegisterForm';
export { useLogin } from './hooks/useLogin';
export type { AuthUser, LoginCredentials } from './types/auth.types';
```

**Когда выбирать атомарный дизайн?**
- Проект ориентирован на построение дизайн-системы
- Команда дизайнеров активно участвует в разработке
- Высокая потребность в переиспользуемых UI-компонентах

**Когда выбирать feature-based?**
- Большое приложение с чёткими доменными областями
- Несколько команд работают над разными фичами
- Важна низкая связность между модулями приложения

## Организация хуков и утилит

### Структура хуков

Кастомные хуки должны решать одну конкретную задачу и быть легко тестируемыми:

```
hooks/
├── api/               # Хуки для работы с API
│   ├── useUsers.ts
│   └── useProducts.ts
├── ui/                # Хуки для UI-логики
│   ├── useModal.ts
│   ├── useToast.ts
│   └── useIntersectionObserver.ts
├── utils/             # Утилитные хуки
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── useWindowSize.ts
└── index.ts           # Реэкспорт всех хуков
```

Пример правильно организованного хука:

```ts
// hooks/utils/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Задерживает обновление значения на указанное время.
 * Используется для оптимизации поисковых запросов и форм.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

```ts
// hooks/utils/useLocalStorage.ts
import { useState, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Failed to set localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch {
      // ignore
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
```

### Утилитные функции

```
utils/
├── date.ts            # Работа с датами
├── string.ts          # Операции со строками
├── number.ts          # Форматирование чисел
├── validation.ts      # Вспомогательные функции валидации
├── storage.ts         # Работа с localStorage/sessionStorage
└── index.ts
```

```ts
// utils/string.ts
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

## Организация стейт-менеджмента

### Структура Redux Toolkit

```
store/
├── index.ts           # Корневой store
├── rootReducer.ts     # Объединение редьюсеров
└── slices/
    ├── authSlice.ts
    ├── cartSlice.ts
    └── uiSlice.ts
```

```ts
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```ts
// store/slices/cartSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

const initialState: CartState = {
  items: [],
  isOpen: false,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id
      );
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
  },
});

export const { addItem, removeItem, toggleCart } = cartSlice.actions;
```

### Типизированные хуки для Redux

```ts
// hooks/redux.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store';

// Используйте эти типизированные хуки вместо стандартных
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### Zustand как альтернатива

Для небольших и средних проектов Zustand предлагает более простой подход:

```ts
// store/useCartStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  toggleCart: () => void;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  devtools(
    persist(
      (set, get) => ({
        items: [],
        isOpen: false,
        addItem: (item) =>
          set((state) => {
            const existing = state.items.find((i) => i.id === item.id);
            if (existing) {
              return {
                items: state.items.map((i) =>
                  i.id === item.id
                    ? { ...i, quantity: i.quantity + item.quantity }
                    : i
                ),
              };
            }
            return { items: [...state.items, item] };
          }),
        removeItem: (id) =>
          set((state) => ({
            items: state.items.filter((i) => i.id !== id),
          })),
        toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
        totalPrice: () =>
          get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      }),
      { name: 'cart-storage' }
    )
  )
);
```

## Работа с API и сервисами

### Структура API-сервисов

```
services/
├── api.ts             # Базовый HTTP-клиент (axios instance)
├── authService.ts     # Аутентификация
├── productsService.ts # Работа с продуктами
├── userService.ts     # Пользователи
└── types/
    ├── api.types.ts   # Общие типы для API
    └── responses.ts   # Типы ответов сервера
```

```ts
// services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Добавление токена авторизации
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ошибок и обновление токена
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
```

```ts
// services/productsService.ts
import { api } from './api';
import type { Product, CreateProductDto, UpdateProductDto } from './types';

export const productsService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
  }) => {
    const { data } = await api.get<{ items: Product[]; total: number }>(
      '/products',
      { params }
    );
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  },

  create: async (dto: CreateProductDto) => {
    const { data } = await api.post<Product>('/products', dto);
    return data;
  },

  update: async (id: string, dto: UpdateProductDto) => {
    const { data } = await api.patch<Product>(`/products/${id}`, dto);
    return data;
  },

  remove: async (id: string) => {
    await api.delete(`/products/${id}`);
  },
};
```

### React Query для серверного состояния

При использовании React Query (TanStack Query) рекомендуется выделять хуки запросов отдельно:

```ts
// hooks/api/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '../../services/productsService';
import type { CreateProductDto } from '../../services/types';

// Ключи запросов — центральное место их хранения
export const productsKeys = {
  all: ['products'] as const,
  lists: () => [...productsKeys.all, 'list'] as const,
  list: (filters: object) => [...productsKeys.lists(), filters] as const,
  details: () => [...productsKeys.all, 'detail'] as const,
  detail: (id: string) => [...productsKeys.details(), id] as const,
};

export function useProducts(params?: {
  page?: number;
  limit?: number;
  category?: string;
}) {
  return useQuery({
    queryKey: productsKeys.list(params ?? {}),
    queryFn: () => productsService.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 минут
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productsKeys.detail(id),
    queryFn: () => productsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateProductDto) => productsService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKeys.lists() });
    },
  });
}
```

## Типизация и TypeScript

### Структура типов

```
types/
├── common.ts          # Общие типы (ID, Pagination, ApiResponse)
├── auth.ts            # Типы аутентификации
├── user.ts            # Типы пользователя
├── product.ts         # Типы продуктов
└── index.ts           # Реэкспорт всех типов
```

```ts
// types/common.ts
export type ID = string;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, string[]>;
}

export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  field: string;
  order: SortOrder;
}

// Утилитные типы
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireOnly<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;
```

```ts
// types/user.ts
import type { ID } from './common';

export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: ID;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

// Вычисляемые типы
export type UserWithoutDates = Omit<User, 'createdAt' | 'updatedAt'>;
export type UserPreview = Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
```

### Типизация компонентов

```tsx
// types для компонентов лучше держать в том же файле или рядом
interface TableProps<T extends { id: string }> {
  data: T[];
  columns: Array<{
    key: keyof T;
    header: string;
    render?: (value: T[keyof T], row: T) => React.ReactNode;
    sortable?: boolean;
    width?: string;
  }>;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function Table<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  isLoading,
  emptyMessage = 'Данные отсутствуют',
}: TableProps<T>) {
  if (isLoading) return <TableSkeleton columns={columns.length} />;
  if (data.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)} style={{ width: col.width }}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr
            key={row.id}
            onClick={() => onRowClick?.(row)}
            className={onRowClick ? 'clickable' : ''}
          >
            {columns.map((col) => (
              <td key={String(col.key)}>
                {col.render
                  ? col.render(row[col.key], row)
                  : String(row[col.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Тестирование

### Структура тестов

В React-проектах существует два подхода к расположению тестов:

**Рядом с компонентом (colocated):**

```
components/
└── Button/
    ├── Button.tsx
    ├── Button.test.tsx  ← тест рядом с компонентом
    └── index.ts
```

**В отдельной папке `__tests__` или `tests/`:**

```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       └── index.ts
└── __tests__/
    └── components/
        └── Button.test.tsx
```

Большинство команд предпочитает первый подход — тест находится рядом с кодом, и его легче найти.

### Пример тестов компонента

```tsx
// components/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('рендерит текст кнопки', () => {
    render(<Button>Нажми меня</Button>);
    expect(screen.getByRole('button', { name: 'Нажми меня' })).toBeInTheDocument();
  });

  it('вызывает обработчик клика', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Нажми</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('не вызывает клик при disabled', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick} disabled>Нажми</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('показывает спиннер при isLoading', () => {
    render(<Button isLoading>Загрузка</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });
});
```

### Тест кастомного хука

```ts
// hooks/utils/useDebounce.test.ts
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

jest.useFakeTimers();

describe('useDebounce', () => {
  it('возвращает начальное значение сразу', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('не обновляет значение до истечения задержки', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial');
  });

  it('обновляет значение после истечения задержки', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    rerender({ value: 'updated', delay: 500 });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('updated');
  });
});
```

## Практические примеры структур

### Небольшой проект (< 20 компонентов)

```
src/
├── components/
│   ├── common/        # Общие компоненты
│   └── layout/        # Компоненты макета
├── pages/             # Страницы
├── hooks/             # Хуки
├── services/          # API
├── store/             # Стейт
├── types/             # Типы
├── utils/             # Утилиты
└── App.tsx
```

### Средний проект (20–100 компонентов)

```
src/
├── features/
│   ├── auth/
│   ├── dashboard/
│   └── profile/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── utils/
├── app/
│   ├── router.tsx
│   └── store.ts
└── main.tsx
```

### Крупный проект (100+ компонентов)

```
src/
├── features/          # Доменные фичи
│   ├── auth/
│   ├── products/
│   ├── orders/
│   ├── users/
│   └── analytics/
├── shared/            # Переиспользуемое
│   ├── components/
│   │   ├── ui/        # Базовые UI-компоненты
│   │   └── forms/     # Компоненты форм
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── types/
│   └── utils/
├── app/               # Конфигурация приложения
│   ├── providers/
│   ├── router/
│   └── store/
└── main.tsx
```

## Дополнительные рекомендации

### Соглашения об именовании

- **Компоненты:** PascalCase (`UserCard.tsx`, `ProductList.tsx`)
- **Хуки:** camelCase с префиксом `use` (`useAuth.ts`, `useProducts.ts`)
- **Утилиты и сервисы:** camelCase (`authService.ts`, `formatDate.ts`)
- **Типы:** PascalCase с суффиксом по контексту (`User`, `CreateUserDto`, `UserResponse`)
- **Константы:** SCREAMING_SNAKE_CASE (`API_URL`, `MAX_FILE_SIZE`)
- **CSS-модули:** camelCase для классов (`.userCard`, `.primaryButton`)

### Правило index.ts

Каждая директория должна иметь `index.ts` для публичного API:

```ts
// components/Button/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';
```

Это позволяет импортировать компоненты без указания внутренней структуры:

```ts
// Хорошо
import { Button } from '@/components/Button';

// Плохо — зависимость от внутренней структуры
import { Button } from '@/components/Button/Button';
```

### Абсолютные импорты

Настройте абсолютные импорты через `tsconfig.json`, чтобы избежать относительных путей типа `../../../`:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@services/*": ["./src/services/*"],
      "@types/*": ["./src/types/*"],
      "@utils/*": ["./src/utils/*"]
    }
  }
}
```

Для Vite также добавьте в конфигурацию:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Сопровождение документации

Для крупных проектов рекомендуется добавить `README.md` в ключевые директории:

```
features/
├── auth/
│   ├── README.md      # Описание фичи, API, зависимости
│   └── ...
└── ...
```

## Заключение

Не существует единственно «правильной» структуры React-проекта — всё зависит от размера команды, сложности приложения и ваших конкретных требований. Тем не менее, следующие принципы применимы в большинстве случаев:

1. **Начинайте просто** — для маленьких проектов достаточно базовой структуры с папками `components`, `hooks`, `services` и `utils`. Усложняйте по мере роста.

2. **Будьте последовательны** — важнее придерживаться одного подхода во всём проекте, чем выбрать «идеальный» подход.

3. **Группируйте по смыслу** — либо по типу (атомарный дизайн), либо по домену (feature-based). Не смешивайте оба подхода бессистемно.

4. **Ограничивайте зависимости между модулями** — каждый модуль/фича должен иметь чёткий публичный API через `index.ts`, а прямые импорты из внутренних файлов других модулей — запрещены.

5. **Типизируйте всё** — TypeScript с `strict: true` поможет поймать ошибки на этапе компиляции и сделает рефакторинг безопаснее.

6. **Пишите тесты рядом с кодом** — размещение тестов рядом с тестируемыми модулями упрощает их поддержку.

7. **Используйте абсолютные пути** — настройте алиасы для импортов, чтобы не писать длинные относительные пути.

Правильно выстроенная структура проекта — это инвестиция в будущее. Она окупается при каждом новом разработчике в команде, при каждой большой фиче и при каждом сеансе отладки.

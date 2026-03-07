---
metaTitle: Tailwind CSS с React — практическое руководство
metaDescription: Полное руководство по использованию Tailwind CSS в React-приложениях. Утилитарные классы, условные стили, компонентный подход, кастомизация и лучшие практики
author: Олег Марков
title: Tailwind CSS с React
preview: Научитесь эффективно применять Tailwind CSS в React-проектах — от базовых классов до продвинутых паттернов с условными стилями, темами и повторно используемыми компонентами
---

## Введение

Tailwind CSS — утилитарный CSS-фреймворк, который предлагает принципиально иной подход к стилизации по сравнению с CSS-in-JS библиотеками или традиционным CSS. Вместо написания кастомных классов, вы комбинируете сотни готовых утилитарных классов прямо в JSX-разметке.

В связке с React Tailwind работает особенно хорошо благодаря компонентной архитектуре: утилитарные классы можно инкапсулировать внутри компонентов, получая переиспользуемые строительные блоки UI без написания единой строки кастомного CSS.

В этой статье мы разберём Tailwind CSS применительно к React-разработке: как организовать условные стили, создавать компоненты, работать с темой и сохранять чистый код.

## Базовые принципы Tailwind в React

Ключевое отличие от HTML — в React вы используете `className` вместо `class`:

```jsx
// Простая карточка с Tailwind
function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-purple-600">
            {product.price} ₽
          </span>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
            В корзину
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Условные стили

В React часто нужно применять разные стили в зависимости от состояния. Tailwind не имеет встроенного механизма для этого, но есть несколько популярных подходов:

### Тернарный оператор

```jsx
function Button({ variant = 'primary', disabled, children }) {
  return (
    <button
      disabled={disabled}
      className={`
        px-6 py-3 rounded-lg font-semibold text-sm transition-all
        ${variant === 'primary'
          ? 'bg-purple-600 text-white hover:bg-purple-700'
          : 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );
}
```

### Библиотека clsx / classnames

Для сложных условий лучше использовать `clsx`:

```bash
npm install clsx
```

```jsx
import clsx from 'clsx';

function Alert({ type = 'info', children }) {
  return (
    <div
      className={clsx(
        'p-4 rounded-lg border flex items-start gap-3',
        {
          'bg-blue-50 border-blue-200 text-blue-800': type === 'info',
          'bg-green-50 border-green-200 text-green-800': type === 'success',
          'bg-yellow-50 border-yellow-200 text-yellow-800': type === 'warning',
          'bg-red-50 border-red-200 text-red-800': type === 'error',
        }
      )}
    >
      {children}
    </div>
  );
}
```

### Библиотека tailwind-merge

При наследовании классов могут возникать конфликты. `tailwind-merge` умно объединяет классы:

```bash
npm install tailwind-merge
```

```jsx
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

// Удобная утилита cn (common pattern в React-проектах)
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Базовая кнопка
const baseButton = 'px-4 py-2 rounded-lg bg-purple-600 text-white';

// При переопределении классов tailwind-merge выбирает последний
function CustomButton({ className, children }) {
  return (
    <button className={cn(baseButton, className)}>
      {children}
    </button>
  );
}

// className="bg-red-500" перепишет bg-purple-600 без конфликта
<CustomButton className="bg-red-500">Удалить</CustomButton>
```

## Компонентный подход

В React Tailwind-классы живут внутри компонентов, что решает проблему дублирования:

```jsx
// Система компонентов с вариантами
const buttonVariants = {
  variant: {
    primary: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-purple-600 hover:bg-purple-50 focus:ring-purple-500',
  },
  size: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  },
};

function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'font-medium rounded-lg',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'transition-all duration-200',
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Использование
<Button variant="primary" size="lg">Сохранить</Button>
<Button variant="danger">Удалить</Button>
<Button variant="ghost" size="sm">Отмена</Button>
```

## Адаптивный дизайн

Tailwind использует мобильно-первый подход с префиксами для брейкпоинтов:

```jsx
function HeroSection() {
  return (
    <section className="
      px-4 py-12
      sm:px-6 sm:py-16
      md:px-8 md:py-20
      lg:px-12 lg:py-24
    ">
      <div className="max-w-7xl mx-auto">
        <div className="
          flex flex-col items-center text-center
          lg:flex-row lg:text-left lg:justify-between
        ">
          <div className="lg:max-w-xl">
            <h1 className="
              text-3xl font-bold text-gray-900
              sm:text-4xl
              lg:text-5xl xl:text-6xl
            ">
              Заголовок страницы
            </h1>
            <p className="
              mt-4 text-gray-600
              text-base sm:text-lg
            ">
              Описание продукта
            </p>
          </div>
          
          <div className="mt-8 lg:mt-0">
            {/* Изображение или иллюстрация */}
          </div>
        </div>
      </div>
    </section>
  );
}
```

## Тёмная тема

Tailwind поддерживает тёмную тему через `dark:` префикс:

```jsx
// tailwind.config.js
module.exports = {
  darkMode: 'class', // или 'media'
  // ...
};
```

```jsx
// Переключатель темы
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(prev => !prev)}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}

// Компонент с поддержкой тёмной темы
function Card({ children }) {
  return (
    <div className="
      bg-white dark:bg-gray-800
      border border-gray-200 dark:border-gray-700
      rounded-xl p-6
      shadow-sm dark:shadow-gray-900/30
    ">
      <p className="text-gray-900 dark:text-gray-100">
        {children}
      </p>
    </div>
  );
}
```

## Кастомизация через tailwind.config

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#6c63ff',
          600: '#5a52d5',
          700: '#4b44b5',
          900: '#2d2880',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Cal Sans', 'Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};
```

## Директива @apply — выделение стилей

Когда классы становятся слишком длинными, можно использовать `@apply` в CSS:

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn {
    @apply inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all;
  }

  .btn-primary {
    @apply btn bg-purple-600 text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2;
  }

  .card {
    @apply bg-white rounded-xl border border-gray-200 shadow-sm p-6;
  }
  
  .input-field {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent;
  }
}
```

**Важно:** используйте `@apply` умеренно. Основное преимущество Tailwind — визуальность стилей в JSX. Чрезмерное использование `@apply` возвращает вас к проблемам обычного CSS.

## Типизация с TypeScript

```tsx
import { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        {
          'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500': variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500': variant === 'secondary',
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': variant === 'danger',
          'bg-transparent text-purple-600 hover:bg-purple-50 focus:ring-purple-500': variant === 'ghost',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
          'opacity-50 cursor-not-allowed': disabled || isLoading,
        },
        className
      )}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
```

## Итоги

Tailwind CSS отлично вписывается в React-экосистему благодаря компонентному подходу. Ключевые моменты для эффективной работы:

- Используйте `clsx` или `cn` (clsx + tailwind-merge) для условных классов
- Инкапсулируйте повторяющиеся классы в компоненты, а не через `@apply`
- Настройте `tailwind.config.js` под дизайн-систему проекта
- Для TypeScript типизируйте варианты компонентов через union types
- Включайте поддержку тёмной темы через `class` стратегию для большего контроля

Tailwind — это не замена CSS-in-JS, а альтернативный подход к стилизации. Выбор между ними зависит от предпочтений команды и требований проекта.

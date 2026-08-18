---
metaTitle: "Next.js и Tailwind CSS: полное руководство по настройке"
metaDescription: "Как установить и настроить Tailwind CSS в Next.js проекте: конфигурация, утилиты, тёмная тема, адаптивность, оптимизация бандла."
author: "Антон Ларичев"
title: "Next.js с Tailwind CSS: настройка и практическое использование"
preview: "Полное руководство по интеграции Tailwind CSS в Next.js: от установки до кастомизации темы и оптимизации бандла."
---

## Что такое Tailwind CSS

Tailwind CSS — утилитарный CSS-фреймворк, который позволяет стилизовать компоненты прямо в разметке с помощью предопределённых классов. В отличие от Bootstrap или Material UI, Tailwind не предоставляет готовые компоненты — он даёт набор низкоуровневых утилит для построения любого дизайна.

Next.js имеет официальную поддержку Tailwind CSS, а установка занимает несколько минут.

## Установка Tailwind CSS в проект Next.js

### Создание нового проекта

При создании нового Next.js проекта через `create-next-app` можно сразу выбрать Tailwind CSS:

```bash
npx create-next-app@latest my-app
```

В процессе установки появится вопрос:

```
Would you like to use Tailwind CSS? › Yes
```

При выборе `Yes` все необходимые файлы будут настроены автоматически.

### Добавление в существующий проект

Если проект уже создан, установите необходимые зависимости:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Команда `tailwindcss init -p` создаёт два файла: `tailwind.config.js` и `postcss.config.js`.

## Настройка конфигурации

### tailwind.config.js

После инициализации файл `tailwind.config.js` выглядит так:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Параметр `content` указывает, в каких файлах Tailwind должен искать используемые классы для включения их в итоговый бандл. Это ключевой механизм оптимизации — в продакшн попадут только те стили, которые реально используются.

### Подключение стилей

В файле глобальных стилей (`app/globals.css` или `styles/globals.css`) добавьте директивы Tailwind:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Убедитесь, что этот файл импортируется в корневом layout:

```typescript
// app/layout.tsx
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
```

## Основы использования утилитарных классов

### Типографика

Tailwind покрывает все аспекты работы с текстом: размер, насыщенность, межстрочный интервал, отслеживание символов.

```tsx
export default function Typography() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Заголовок страницы
      </h1>
      <p className="text-lg text-gray-600 leading-relaxed">
        Основной текст с удобочитаемым межстрочным интервалом.
      </p>
      <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">
        Метка
      </span>
    </div>
  )
}
```

### Flexbox и Grid

```tsx
export default function FlexLayout() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 bg-white rounded-lg shadow p-6">
        <p>Левая колонка</p>
      </div>
      <div className="flex-1 bg-white rounded-lg shadow p-6">
        <p>Правая колонка</p>
      </div>
    </div>
  )
}
```

```tsx
const items = [{ id: 1 }, { id: 2 }, { id: 3 }]

export default function GridLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm">
          Карточка {item.id}
        </div>
      ))}
    </div>
  )
}
```

## Адаптивный дизайн

Tailwind использует мобильно-первый подход. Классы без префикса применяются на всех экранах, а префиксы задают минимальную ширину:

| Префикс | Минимальная ширина |
|---------|-------------------|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |
| `2xl:` | 1536px |

```tsx
export default function ResponsiveCard() {
  return (
    <div className="w-full sm:w-1/2 lg:w-1/3 p-4 md:p-6 lg:p-8">
      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">
        Адаптивный заголовок
      </h2>
      <p className="text-sm md:text-base text-gray-600 mt-2">
        Текст масштабируется в зависимости от ширины экрана.
      </p>
    </div>
  )
}
```

## Тёмная тема

### Настройка

Добавьте поддержку тёмной темы в конфигурацию:

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  // ...
}
```

Режим `'class'` управляется классом `dark` на элементе `<html>`, `'media'` — системными настройками пользователя. Режим `class` предпочтительнее, когда нужен переключатель.

### Использование в компонентах

```tsx
export default function DarkModeCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <h2 className="text-gray-900 dark:text-white font-bold text-xl">
        Заголовок карточки
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mt-2">
        Текст адаптируется к тёмной теме автоматически.
      </p>
    </div>
  )
}
```

### Переключатель темы

```tsx
'use client'

import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    }
  }, [])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
    setIsDark(!isDark)
  }

  return (
    <button
      onClick={toggleTheme}
      className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700
                 text-gray-800 dark:text-white transition-colors"
    >
      {isDark ? 'Светлая тема' : 'Тёмная тема'}
    </button>
  )
}
```

## Кастомизация темы

### Расширение дефолтных значений

Все кастомные значения добавляются в блок `extend`, чтобы не перезаписывать дефолтные токены Tailwind:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
}
```

После этого кастомные значения доступны как обычные классы:

```tsx
<div className="bg-brand-50 text-brand-900 rounded-4xl font-sans">
  Кастомный компонент
</div>
```

### Кастомные компоненты через @layer

Если один и тот же набор классов повторяется, вынесите его в слой `components`:

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply px-6 py-3 bg-blue-600 text-white font-medium rounded-lg
           hover:bg-blue-700 focus:outline-none focus:ring-2
           focus:ring-blue-500 focus:ring-offset-2 transition-colors;
  }

  .card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

Использование:

```tsx
export default function Page() {
  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Заголовок</h2>
      <button className="btn-primary">Отправить</button>
    </div>
  )
}
```

## Псевдоклассы и состояния

### Hover, Focus, Active

```tsx
export default function InteractiveButton() {
  return (
    <button
      className="
        bg-blue-600 text-white px-6 py-3 rounded-lg
        hover:bg-blue-700
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        active:bg-blue-800
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
      "
    >
      Кнопка
    </button>
  )
}
```

### Модификатор group

Позволяет стилизовать дочерние элементы при наведении на родителя:

```tsx
export default function GroupCard() {
  return (
    <div className="group bg-white hover:bg-blue-50 p-6 rounded-lg cursor-pointer transition-colors">
      <h3 className="text-gray-900 group-hover:text-blue-600 font-bold transition-colors">
        Заголовок карточки
      </h3>
      <p className="text-gray-500 group-hover:text-gray-700 transition-colors">
        Стиль меняется при наведении на родителя.
      </p>
      <span className="opacity-0 group-hover:opacity-100 text-blue-600 text-sm transition-opacity">
        Подробнее →
      </span>
    </div>
  )
}
```

## Анимации

### Встроенные утилиты

```tsx
export default function AnimatedComponents() {
  return (
    <div className="space-y-4">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4" />
      <div className="animate-bounce w-8 h-8 bg-blue-500 rounded-full" />
    </div>
  )
}
```

### Скелетон для загрузки данных

```tsx
export default function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white rounded-xl p-6 shadow-sm">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
    </div>
  )
}
```

## Оптимизация бандла

Tailwind автоматически удаляет неиспользуемые стили при сборке на основе анализа файлов из `content`. Важно правильно сформировать пути и никогда не строить классы динамической конкатенацией строк:

```tsx
// Неправильно — Tailwind не найдёт класс при анализе
const color = 'blue'
<div className={`bg-${color}-500`} />

// Правильно — полное название класса всегда присутствует в коде
const colorClass = isActive ? 'bg-blue-500' : 'bg-gray-200'
<div className={colorClass} />
```

## Работа с clsx и tailwind-merge

Для условного применения классов и разрешения конфликтов установите вспомогательные библиотеки:

```bash
npm install clsx tailwind-merge
```

Создайте утилиту `cn`:

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

`tailwind-merge` решает проблему конфликтующих классов: если компонент получает `className="bg-red-500"` снаружи, он правильно переопределит базовый `bg-blue-600`, а не применит оба.

Пример переиспользуемого компонента Button:

```tsx
import { cn } from '@/lib/utils'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  onClick,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        {
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400': variant === 'secondary',
        },
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  )
}
```

## Интеграция шрифтов Next.js

Next.js Font Optimization удобно комбинировать с Tailwind через CSS-переменные:

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
```

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
}
```

Теперь класс `font-sans` будет использовать загруженный через Next.js шрифт Inter с оптимизированной загрузкой без внешних запросов к Google Fonts в рантайме.

## Итоги

Tailwind CSS органично вписывается в экосистему Next.js: официальная поддержка, автоматическая оптимизация бандла, удобная работа с тёмной темой и адаптивностью. Ключевые практики:

- Указывайте полные имена классов, не собирайте их конкатенацией
- Используйте `cn()` из `clsx` + `tailwind-merge` для условной стилизации в компонентах
- Выносите повторяющиеся наборы классов в `@layer components`
- Расширяйте тему через `extend`, не перезаписывая дефолтные токены

Для углублённого изучения Next.js и построения полноценных продакшн-приложений смотрите курс на PurpleSchool: https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-tailwind-css

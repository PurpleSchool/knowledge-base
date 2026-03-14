---
metaTitle: Создание библиотеки компонентов на React - полное руководство
metaDescription: Как создать и опубликовать собственную библиотеку UI-компонентов на React с TypeScript, Vite и Storybook. Настройка сборки, экспорты, npm-публикация и использование в проектах
author: Олег Марков
title: Создание библиотеки компонентов
preview: Узнайте как создать собственную библиотеку React-компонентов с нуля — настройка Vite в library mode, TypeScript, экспорты, документация через Storybook, публикация в npm и интеграция в проекты
---

## Введение

Когда над несколькими проектами работает одна команда, рано или поздно возникает задача: вынести общие UI-компоненты в отдельный пакет и переиспользовать его везде. Создание собственной библиотеки компонентов решает сразу несколько проблем — устраняет дублирование кода, обеспечивает визуальную согласованность интерфейсов и упрощает поддержку дизайн-системы.

В этой статье вы узнаете:
- как с нуля создать проект библиотеки компонентов на React и TypeScript;
- как настроить Vite в режиме library для корректной сборки пакета;
- как правильно организовать структуру файлов и экспортов;
- как настроить Storybook для документации и разработки компонентов;
- как опубликовать библиотеку в npm и подключить её к реальному проекту.

Если вы только начинаете знакомство с React, рекомендую сначала пройти наш курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=component-library). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Зачем создавать собственную библиотеку компонентов

Прежде чем начинать, важно понять, когда это действительно нужно.

### Ситуации, когда библиотека компонентов оправдана

**Несколько проектов с общим дизайном.** Если у вас есть две и более команды, которые пишут разные приложения с одинаковым визуальным стилем — библиотека компонентов позволит синхронизировать UI без ручного копирования кода.

**Дизайн-система компании.** Когда дизайнеры описали единый язык визуальных элементов (цвета, шрифты, отступы, компоненты), разработчики воплощают это в виде набора переиспользуемых компонентов.

**Ускорение разработки.** Готовые, протестированные компоненты значительно ускоряют создание новых страниц и фичей.

### Когда стоит подождать

Если у вас один проект и нет планов создавать другие — создание библиотеки будет преждевременной оптимизацией. Начните с внутренней папки `components/shared` и только когда почувствуете реальную потребность в переиспользовании — выносите в отдельный пакет.

## Инициализация проекта

### Создание базовой структуры

Начнём с создания нового проекта. Мы будем использовать Vite в режиме библиотеки — это современный и быстрый способ собирать npm-пакеты.

```bash
mkdir my-ui-library
cd my-ui-library
npm init -y
```

Установим основные зависимости:

```bash
# Зависимости разработки
npm install --save-dev \
  vite \
  @vitejs/plugin-react \
  typescript \
  @types/react \
  @types/react-dom \
  vite-plugin-dts

# Peer-зависимости (не будут включены в сборку)
# react и react-dom объявляем как peerDependencies
```

Обновим `package.json`:

```json
{
  "name": "my-ui-library",
  "version": "0.1.0",
  "description": "Библиотека UI-компонентов",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^6.0.0",
    "vite-plugin-dts": "^4.0.0"
  }
}
```

Обратите внимание на поля `main`, `module` и `exports`. Поле `main` указывает на CommonJS-версию для совместимости со старыми инструментами, `module` — на ES Module-версию для современных сборщиков, `types` — на файл TypeScript-деклараций.

### Структура файлов

Организуем проект так, чтобы он был удобен для разработки и масштабирования:

```
my-ui-library/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   │   ├── Input.tsx
│   │   │   ├── Input.module.css
│   │   │   ├── Input.stories.tsx
│   │   │   └── index.ts
│   │   └── Modal/
│   │       ├── Modal.tsx
│   │       ├── Modal.module.css
│   │       ├── Modal.stories.tsx
│   │       └── index.ts
│   ├── hooks/
│   │   └── useClickOutside.ts
│   ├── utils/
│   │   └── classNames.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts          # Главный экспорт библиотеки
├── .storybook/
│   ├── main.ts
│   └── preview.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

Такая структура — «один компонент — одна папка» — является стандартной практикой. Каждый компонент живёт рядом с файлами стилей, историями Storybook и экспортами.

## Настройка TypeScript

Создадим `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "declaration": true,
    "declarationDir": "dist/types"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.stories.tsx"]
}
```

Параметр `jsx: "react-jsx"` позволяет использовать JSX без явного импорта React в каждом файле — это современная практика для React 17+.

## Настройка Vite в режиме библиотеки

Это ключевая часть. Vite поддерживает специальный режим сборки для npm-пакетов:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({
      // Генерирует TypeScript-декларации из исходников
      include: ['src'],
      exclude: ['src/**/*.stories.tsx'],
    }),
  ],
  build: {
    // Режим библиотеки
    lib: {
      // Точка входа — файл с экспортами всей библиотеки
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyUILibrary',      // Глобальное имя для UMD-формата
      formats: ['es', 'cjs'],    // Собираем и ESM, и CommonJS
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      // Исключаем peer-зависимости из сборки
      // Они будут взяты из проекта, который использует библиотеку
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        // Сохраняем ссылки на глобальные переменные в UMD-сборке
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'react/jsx-runtime',
        },
      },
    },
    // Генерируем sourcemaps для удобства отладки
    sourcemap: true,
    // Очищаем папку dist перед каждой сборкой
    emptyOutDir: true,
  },
})
```

Обратите особое внимание на поле `external`. Если не вынести `react` и `react-dom` во внешние зависимости, Vite включит их в бандл, и в проекте-потребителе будет два экземпляра React — это приведёт к ошибкам.

## Написание компонентов

### Базовый компонент Button

Посмотрим, как написать компонент с правильной типизацией и стилизацией:

```typescript
// src/components/Button/Button.tsx
import React from 'react'
import styles from './Button.module.css'

// Описываем все возможные варианты компонента
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

// Расширяем стандартные пропсы HTML-кнопки
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const classNames = [
      styles.button,
      styles[variant],
      styles[size],
      fullWidth ? styles.fullWidth : '',
      loading ? styles.loading : '',
      className || '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        className={classNames}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...rest}
      >
        {loading && (
          <span className={styles.spinner} aria-hidden="true" />
        )}
        {leftIcon && !loading && (
          <span className={styles.icon}>{leftIcon}</span>
        )}
        <span className={styles.label}>{children}</span>
        {rightIcon && !loading && (
          <span className={styles.icon}>{rightIcon}</span>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'
```

Здесь я использую `React.forwardRef` — это важная практика для компонентов в библиотеках. Она позволяет потребителю передать `ref` напрямую к DOM-элементу, что нужно, например, для управления фокусом.

### CSS-модули для изоляции стилей

```css
/* src/components/Button/Button.module.css */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 0.375rem;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, opacity 0.15s ease;
  white-space: nowrap;
  text-decoration: none;
  outline: none;
}

.button:focus-visible {
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
}

.button:disabled,
.button[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Варианты */
.primary {
  background-color: #3b82f6;
  color: #ffffff;
}

.primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.secondary {
  background-color: #e5e7eb;
  color: #374151;
}

.secondary:hover:not(:disabled) {
  background-color: #d1d5db;
}

.danger {
  background-color: #ef4444;
  color: #ffffff;
}

.danger:hover:not(:disabled) {
  background-color: #dc2626;
}

.ghost {
  background-color: transparent;
  color: #374151;
  border: 1px solid #d1d5db;
}

.ghost:hover:not(:disabled) {
  background-color: #f9fafb;
}

/* Размеры */
.sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  min-height: 2rem;
}

.md {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  min-height: 2.5rem;
}

.lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
  min-height: 3rem;
}

/* Модификаторы */
.fullWidth {
  width: 100%;
}

.loading .label {
  opacity: 0;
}

/* Спиннер загрузки */
.spinner {
  position: absolute;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
```

### Компонент Input с поддержкой состояний

```typescript
// src/components/Input/Input.tsx
import React from 'react'
import styles from './Input.module.css'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  helperText?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  leftAddon?: React.ReactNode
  rightAddon?: React.ReactNode
  fullWidth?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      size = 'md',
      leftAddon,
      rightAddon,
      fullWidth = false,
      id,
      className,
      ...rest
    },
    ref,
  ) => {
    // Генерируем уникальный ID если не передан, для связи label и input
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`

    const wrapperClass = [
      styles.wrapper,
      fullWidth ? styles.fullWidth : '',
    ]
      .filter(Boolean)
      .join(' ')

    const inputClass = [
      styles.input,
      styles[size],
      error ? styles.error : '',
      leftAddon ? styles.hasLeftAddon : '',
      rightAddon ? styles.hasRightAddon : '',
      className || '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={wrapperClass}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {leftAddon && (
            <span className={`${styles.addon} ${styles.leftAddon}`}>
              {leftAddon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={inputClass}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...rest}
          />
          {rightAddon && (
            <span className={`${styles.addon} ${styles.rightAddon}`}>
              {rightAddon}
            </span>
          )}
        </div>
        {error && (
          <span id={`${inputId}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={`${inputId}-helper`} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
```

### Экспорт компонентов

Каждый компонент экспортирует свои типы и компонент через `index.ts`:

```typescript
// src/components/Button/index.ts
export { Button } from './Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button'
```

Главный файл экспортирует всё из библиотеки:

```typescript
// src/index.ts
// Компоненты
export { Button } from './components/Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/Button'

export { Input } from './components/Input'
export type { InputProps } from './components/Input'

export { Modal } from './components/Modal'
export type { ModalProps } from './components/Modal'

// Хуки
export { useClickOutside } from './hooks/useClickOutside'

// Утилиты
export { classNames } from './utils/classNames'
```

Обратите внимание: в библиотеках принято явно экспортировать все типы. Это значительно упрощает работу потребителей библиотеки с TypeScript.

## Документация с помощью Storybook

Storybook — незаменимый инструмент для разработки библиотек. Он позволяет создавать, документировать и тестировать компоненты в изоляции.

### Установка Storybook

```bash
npx storybook@latest init
```

При первоначальной установке Storybook сам определит, что вы используете Vite, и настроит конфигурацию. После установки появятся файлы в `.storybook/`.

### Настройка Storybook

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y', // Проверка доступности
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag', // Автоматическая документация для stories с тегом autodocs
  },
}

export default config
```

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react'
import '../src/styles/global.css' // Подключаем глобальные стили

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
```

### Написание Stories

Stories — это примеры использования компонента в разных состояниях:

```typescript
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

// Метаданные для всей группы stories
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'], // Генерирует автоматическую страницу документации
  parameters: {
    layout: 'centered',
  },
  // Описание аргументов для панели Controls
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
      description: 'Визуальный вариант кнопки',
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
      description: 'Размер кнопки',
    },
    loading: {
      control: 'boolean',
      description: 'Состояние загрузки',
    },
    disabled: {
      control: 'boolean',
    },
    children: {
      control: 'text',
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

// Основная история — базовое использование
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Нажми меня',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Вторичная кнопка',
  },
}

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Удалить',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Отменить',
  },
}

export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Сохранение...',
  },
}

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Недоступно',
  },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}

// История, демонстрирующая все варианты сразу
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
}
```

## Создание полезного хука useClickOutside

Библиотека может экспортировать не только компоненты, но и вспомогательные хуки:

```typescript
// src/hooks/useClickOutside.ts
import { useEffect, useRef } from 'react'

type Handler = (event: MouseEvent | TouchEvent) => void

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: Handler,
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Не вызываем handler, если клик был внутри элемента
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler(event)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [handler])

  return ref
}
```

Использование хука в компоненте Modal:

```typescript
// src/components/Modal/Modal.tsx
import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useClickOutside } from '../../hooks/useClickOutside'
import styles from './Modal.module.css'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
}) => {
  const modalRef = useClickOutside<HTMLDivElement>(
    closeOnOverlayClick ? onClose : () => {},
  )

  // Закрываем по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Блокируем скролл при открытом модале
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div
        ref={modalRef}
        className={`${styles.modal} ${styles[size]}`}
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div className={styles.header}>
          {title && (
            <h2 id="modal-title" className={styles.title}>
              {title}
            </h2>
          )}
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}
```

## Сборка библиотеки

### Запуск сборки

```bash
npm run build
```

После сборки структура папки `dist/` будет выглядеть так:

```
dist/
├── index.js          # ESM-версия
├── index.cjs         # CommonJS-версия
├── index.js.map      # Sourcemap для ESM
├── index.cjs.map     # Sourcemap для CJS
└── index.d.ts        # TypeScript-декларации
```

### Проверка содержимого пакета

Перед публикацией важно убедиться, что в пакет попадёт только нужное:

```bash
# Показывает, какие файлы будут включены в npm-пакет
npm pack --dry-run
```

Убедитесь что в вывод попадают:
- `dist/index.js`
- `dist/index.cjs`
- `dist/index.d.ts`
- `package.json`
- `README.md`

Если вы видите лишние файлы — добавьте их в `.npmignore` или отредактируйте поле `files` в `package.json`.

## Публикация в npm

### Подготовка к публикации

1. **Убедитесь что у вас есть аккаунт на npmjs.com**

2. **Войдите в npm:**
```bash
npm login
```

3. **Обновите версию по semver:**
```bash
# Для патч-обновлений (исправление ошибок): 0.1.0 → 0.1.1
npm version patch

# Для минорных обновлений (новые возможности): 0.1.0 → 0.2.0
npm version minor

# Для мажорных обновлений (breaking changes): 0.1.0 → 1.0.0
npm version major
```

4. **Выполните сборку и опубликуйте:**
```bash
npm run build && npm publish
```

### Публикация scoped-пакета (под организацией)

Если вы хотите опубликовать пакет под именем организации (`@myorg/ui-library`):

```bash
# Создайте организацию на npmjs.com, затем:
npm publish --access public
```

Поле `--access public` нужно, потому что scoped-пакеты по умолчанию публикуются как приватные.

### Публикация в GitHub Packages

Альтернативой npm является GitHub Packages — удобно для внутренних пакетов компании:

```json
// package.json
{
  "name": "@your-org/ui-library",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

```bash
# Аутентификация
npm login --scope=@your-org --registry=https://npm.pkg.github.com

# Публикация
npm publish
```

## Использование библиотеки в проекте

После публикации установите пакет в целевой проект:

```bash
npm install @myorg/ui-library
```

Использование компонентов:

```tsx
// App.tsx
import { Button, Input, Modal } from '@myorg/ui-library'
import { useState } from 'react'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [email, setEmail] = useState('')

  return (
    <div>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="example@mail.com"
        helperText="Введите ваш email"
      />

      <Button
        variant="primary"
        onClick={() => setIsModalOpen(true)}
        style={{ marginTop: '1rem' }}
      >
        Открыть модальное окно
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Подтверждение"
      >
        <p>Вы уверены в своих действиях?</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Button variant="primary" onClick={() => setIsModalOpen(false)}>
            Подтвердить
          </Button>
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
            Отменить
          </Button>
        </div>
      </Modal>
    </div>
  )
}
```

TypeScript автоматически подхватит типы из `dist/index.d.ts` и предоставит полную поддержку автодополнения.

## Работа со стилями в библиотеке

Выбор подхода к стилизации — один из важных архитектурных решений при создании библиотеки.

### CSS-модули (рекомендуется)

Преимущества:
- Изолированные классы, нет конфликтов имён
- Нативный CSS, нет JavaScript-overhead
- Vite поддерживает из коробки

Недостатки:
- Стили включаются в бандл отдельным файлом (нужна настройка)
- Ограниченная кастомизация без CSS Custom Properties

```typescript
// vite.config.ts — добавляем поддержку CSS-файла
export default defineConfig({
  build: {
    lib: { /* ... */ },
    rollupOptions: {
      output: {
        assetFileNames: 'styles.[ext]', // styles.css в dist/
      },
    },
  },
})
```

Пользователи библиотеки должны будут импортировать CSS:
```typescript
import '@myorg/ui-library/dist/styles.css'
```

### CSS Custom Properties для кастомизации

Чтобы дать пользователям возможность настраивать внешний вид без перекрытия классов, используйте CSS Custom Properties:

```css
/* Дефолтные значения токенов */
:root {
  --ui-color-primary: #3b82f6;
  --ui-color-primary-hover: #2563eb;
  --ui-border-radius: 0.375rem;
  --ui-font-family: inherit;
}

/* В компонентах используем переменные */
.button.primary {
  background-color: var(--ui-color-primary);
}

.button.primary:hover {
  background-color: var(--ui-color-primary-hover);
}
```

Пользователь может переопределить любой токен:
```css
:root {
  --ui-color-primary: #7c3aed; /* Переключаем на фиолетовый */
  --ui-border-radius: 9999px;  /* Делаем кнопки таблетообразными */
}
```

## Версионирование и управление изменениями

### Semantic Versioning (semver)

Придерживайтесь строгого семантического версионирования:

- **Patch** (`1.0.x`) — исправление ошибок без изменения API
- **Minor** (`1.x.0`) — новые возможности с обратной совместимостью
- **Major** (`x.0.0`) — изменения, ломающие обратную совместимость (breaking changes)

### Поддержка CHANGELOG

Ведите `CHANGELOG.md` с описанием изменений между версиями:

```markdown
# Changelog

## [1.2.0] - 2026-03-01

### Added
- Компонент `Tooltip` с поддержкой разных позиций
- Хук `useDebounce` для отложенного обновления значений

### Fixed
- Button: исправлено отображение спиннера при `loading=true` в Safari

## [1.1.0] - 2026-02-15

### Added
- Компонент `Modal` с поддержкой анимации
- `closeOnOverlayClick` для Modal

### Changed
- Input: поле `helperText` теперь отображается даже при наличии ошибки (ранее скрывалось)
```

## Автоматизация через GitHub Actions

Настройте CI/CD для автоматической сборки и публикации:

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  push:
    tags:
      - 'v*' # Запускаем при пуше тега вида v1.2.3

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build library
        run: npm run build

      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Теперь для публикации достаточно создать git-тег:

```bash
npm version patch  # или minor/major
git push origin --tags
```

GitHub Actions автоматически запустит сборку и опубликует пакет.

## Типичные проблемы и их решения

### Проблема: "Invalid hook call" в проекте-потребителе

**Причина:** В бандл попал `react`, хотя он должен быть внешней зависимостью. В итоге в проекте оказываются два экземпляра React.

**Решение:** Убедитесь, что `react` и `react-dom` находятся в `external` в конфигурации Vite, и только в `peerDependencies` в `package.json` (не в `dependencies`).

### Проблема: Стили не применяются

**Причина:** CSS-файл не импортирован в проекте-потребителе.

**Решение:** Добавьте в документацию библиотеки инструкцию по импорту CSS. Или рассмотрите использование CSS-in-JS (styled-components, emotion), который встраивает стили в JS.

### Проблема: TypeScript не находит типы

**Причина:** Неправильно настроено поле `types` в `package.json` или не сгенерированы `.d.ts` файлы.

**Решение:** Проверьте что в `package.json` поле `types` указывает на `"./dist/index.d.ts"`, а `vite-plugin-dts` настроен и включён в сборку.

### Проблема: "Cannot use import statement in a module"

**Причина:** Потребитель ожидает CommonJS, но получает ESM.

**Решение:** Убедитесь, что Vite собирает и `es`, и `cjs` форматы, и что `main` в `package.json` указывает на `.cjs`-файл, а `module` — на `.js`.

## Итоги

Вы научились создавать полноценную библиотеку UI-компонентов на React:

- **Инициализация проекта** с Vite, TypeScript и правильной структурой `package.json` для npm-пакета.
- **Настройка Vite в library mode** с правильным разделением на `external` зависимости и форматы сборки.
- **Написание компонентов** с `React.forwardRef`, доступностью (a11y), поддержкой всех HTML-атрибутов и TypeScript-типами.
- **Storybook** для документирования и разработки компонентов в изоляции.
- **Публикация в npm** с правильным семантическим версионированием.
- **CI/CD** для автоматической сборки и публикации через GitHub Actions.

Создание библиотеки компонентов — это инвестиция, которая многократно окупается в командах, работающих над несколькими проектами. Правильно спроектированная библиотека становится фундаментом дизайн-системы и значительно ускоряет разработку.

Если вы хотите глубже разобраться в React и научиться писать качественные компоненты, приходите на наш курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=component-library). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

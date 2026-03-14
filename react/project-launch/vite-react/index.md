---
metaTitle: Vite и React - полная настройка сборщика для современных React проектов
metaDescription: Полное руководство по настройке Vite для React проектов: vite.config.ts, плагины, алиасы, переменные окружения, оптимизация production-сборки, code splitting и TypeScript
author: Олег Марков
title: Vite и React
preview: Узнайте как настроить Vite для React проекта — от базовой конфигурации до продвинутой оптимизации: vite.config.ts, TypeScript, алиасы путей, переменные окружения, code splitting и деплой
---

## Введение

Vite стал стандартом де-факто для создания и разработки современных React-приложений. В отличие от устаревшего Create React App на базе Webpack, Vite обеспечивает мгновенный старт dev-сервера и молниеносную горячую перезагрузку (HMR) даже в крупных проектах.

Но стандартный шаблон `npm create vite@latest` — это только отправная точка. В реальных проектах вам потребуется настроить алиасы путей, переменные окружения, code splitting, оптимизацию изображений, прокси для API и множество других параметров.

В этой статье вы узнаете:
- как устроена конфигурация Vite (`vite.config.ts`) и какие параметры можно настраивать;
- как настроить TypeScript, пути-алиасы и плагины;
- как работать с переменными окружения в Vite-проектах;
- как оптимизировать production-сборку с code splitting;
- как настроить прокси для dev-сервера;
- лучшие практики организации Vite-проекта.

Если вы хотите не только разобраться с Vite, но и в целом освоить профессиональную разработку на React, приходите на наш большой курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=vite-react). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Создание проекта с Vite

### Инициализация нового проекта

Для создания нового React-проекта с Vite используйте официальный шаблон:

```bash
npm create vite@latest my-react-app -- --template react-ts
cd my-react-app
npm install
npm run dev
```

Флаг `--template react-ts` создаёт проект с TypeScript. Если TypeScript не нужен, используйте `--template react`.

Доступные шаблоны для React:
- `react` — React + JavaScript
- `react-ts` — React + TypeScript
- `react-swc` — React + JavaScript + SWC (более быстрый компилятор)
- `react-swc-ts` — React + TypeScript + SWC

### Структура проекта после инициализации

```
my-react-app/
├── public/                 # Статические файлы (копируются "как есть")
│   └── vite.svg
├── src/
│   ├── assets/             # Ресурсы, обрабатываемые Vite
│   │   └── react.svg
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx            # Точка входа приложения
│   └── vite-env.d.ts       # Типы Vite для TypeScript
├── index.html              # Корневой HTML-файл (точка входа Vite)
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts          # Конфигурация Vite
```

Важное отличие от других сборщиков — `index.html` находится в **корне проекта**, а не внутри `public/`. Это сделано намеренно: Vite использует `index.html` как точку входа и может обрабатывать `<script type="module">` прямо в нём.

### Базовые команды

```bash
npm run dev        # Запуск dev-сервера (обычно http://localhost:5173)
npm run build      # Production-сборка (результат в ./dist)
npm run preview    # Предпросмотр production-сборки локально
```

## Конфигурационный файл vite.config.ts

Вся настройка Vite происходит через файл `vite.config.ts` (или `vite.config.js`). Это TypeScript-файл с функцией `defineConfig`.

### Базовая структура конфига

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

Функция `defineConfig` — это просто type-хелпер для автодополнения в IDE, она не изменяет конфигурацию. Её использование необязательно, но рекомендуется.

### Опции конфигурации

Рассмотрим ключевые опции конфига и что они делают:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  // Плагины
  plugins: [react()],

  // Настройки dev-сервера
  server: {
    port: 3000,           // Порт (по умолчанию 5173)
    host: true,           // Слушать на 0.0.0.0 (доступно в сети)
    open: true,           // Открыть браузер при запуске
    https: false,         // HTTPS для dev-сервера
  },

  // Настройки сборки
  build: {
    outDir: 'dist',           // Директория вывода (по умолчанию 'dist')
    sourcemap: true,          // Генерировать source maps
    minify: 'esbuild',        // Минификатор: 'esbuild' | 'terser' | false
    target: 'es2015',         // Целевые браузеры/версии ES
    chunkSizeWarningLimit: 500, // Предупреждение о размере чанка (КБ)
  },

  // Разрешение модулей
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Переменные CSS
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },
})
```

## Настройка алиасов путей

Алиасы — это удобные сокращения для длинных путей импорта. Вместо `'../../components/Button'` вы пишете `'@/components/Button'`.

### Настройка алиасов в vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@store': path.resolve(__dirname, './src/store'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
})
```

### Настройка TypeScript для понимания алиасов

Чтобы TypeScript понимал алиасы и не подчёркивал импорты красным, нужно настроить `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
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
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@utils/*": ["./src/utils/*"],
      "@assets/*": ["./src/assets/*"],
      "@pages/*": ["./src/pages/*"],
      "@store/*": ["./src/store/*"],
      "@types/*": ["./src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Теперь импорты с алиасами работают в коде:

```typescript
// Без алиаса (неудобно)
import { Button } from '../../../components/Button'

// С алиасом (удобно)
import { Button } from '@/components/Button'
import { useAuth } from '@hooks/useAuth'
```

## Переменные окружения

Vite имеет встроенную поддержку переменных окружения через файлы `.env`.

### Файлы .env

Vite автоматически подгружает переменные из следующих файлов:

```
.env                    # Всегда загружается
.env.local              # Всегда загружается, игнорируется git
.env.development        # Загружается только при npm run dev
.env.development.local  # Загружается только при dev, игнорируется git
.env.production         # Загружается только при npm run build
.env.production.local   # Загружается только при build, игнорируется git
```

### Правила именования переменных

**Важно:** Vite открывает браузеру только переменные с префиксом `VITE_`. Переменные без этого префикса доступны только в Node.js (в `vite.config.ts`).

```bash
# .env
VITE_API_URL=https://api.example.com      # Доступна в браузере
VITE_APP_TITLE=My React App               # Доступна в браузере
SECRET_KEY=super-secret                   # НЕ доступна в браузере (без VITE_)
```

### Использование в коде

```typescript
// Доступ к переменным в React-компонентах
const apiUrl = import.meta.env.VITE_API_URL
const appTitle = import.meta.env.VITE_APP_TITLE

// Встроенные переменные Vite
const isDev = import.meta.env.DEV         // true в development
const isProd = import.meta.env.PROD       // true в production
const mode = import.meta.env.MODE        // 'development' или 'production'
const baseUrl = import.meta.env.BASE_URL // значение опции base из конфига

console.log('API URL:', apiUrl)
console.log('Mode:', import.meta.env.MODE)
```

### Типизация переменных окружения

Для TypeScript добавьте типы в файл `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_FEATURE_FLAG: string
  // добавьте остальные переменные...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

Теперь `import.meta.env` будет полностью типизирован с автодополнением.

## Настройка плагинов

Экосистема плагинов Vite огромна. Рассмотрим наиболее полезные для React-проектов.

### @vitejs/plugin-react vs @vitejs/plugin-react-swc

По умолчанию используется `@vitejs/plugin-react` на базе Babel. Для более быстрой компиляции можно переключиться на SWC:

```bash
npm install -D @vitejs/plugin-react-swc
```

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
})
```

SWC (Speedy Web Compiler) написан на Rust и компилирует TypeScript/JSX значительно быстрее Babel. Разница особенно заметна в крупных проектах.

### Настройка @vitejs/plugin-react

Плагин React поддерживает ряд опций:

```typescript
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Включить Fast Refresh для компонентов
      // (включён по умолчанию в dev-режиме)
      fastRefresh: true,

      // Дополнительные Babel-плагины
      babel: {
        plugins: [
          // Например, для emotion CSS-in-JS
          ['@emotion/babel-plugin'],
        ],
      },

      // Включить JSX runtime (по умолчанию true)
      jsxRuntime: 'automatic',
    }),
  ],
})
```

### vite-plugin-svgr — SVG как компоненты React

Позволяет импортировать SVG-файлы как React-компоненты:

```bash
npm install -D vite-plugin-svgr
```

```typescript
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [
    react(),
    svgr(),
  ],
})
```

Использование:

```typescript
// Импорт SVG как React-компонента
import { ReactComponent as Logo } from './logo.svg'
// или с именованным импортом (новый синтаксис)
import Logo from './logo.svg?react'

function Header() {
  return <Logo width={100} height={50} />
}
```

### vite-plugin-checker — проверка типов во время разработки

По умолчанию Vite не выполняет проверку типов TypeScript (только транспиляцию через esbuild). Для проверки типов в реальном времени:

```bash
npm install -D vite-plugin-checker
```

```typescript
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,     // Проверять TypeScript
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
      },
    }),
  ],
})
```

### rollup-plugin-visualizer — анализ размера бандла

Незаменимый плагин для оптимизации: показывает, какие модули занимают больше всего места:

```bash
npm install -D rollup-plugin-visualizer
```

```typescript
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,         // Открыть отчёт после сборки
      gzipSize: true,     // Показывать gzip-размер
      brotliSize: true,   // Показывать brotli-размер
      filename: 'dist/stats.html',
    }),
  ],
})
```

## Настройка dev-сервера и прокси

### Базовые настройки server

```typescript
export default defineConfig({
  server: {
    port: 3000,       // Порт dev-сервера
    host: '0.0.0.0',  // Доступ из локальной сети
    open: '/login',   // Открыть конкретный URL при запуске
    strictPort: true, // Ошибка вместо смены порта, если порт занят
    https: {          // HTTPS (нужны сертификаты)
      key: './certs/key.pem',
      cert: './certs/cert.pem',
    },
  },
})
```

### Настройка прокси для API

Прокси позволяет решить проблему CORS при разработке — запросы к `/api` будут перенаправляться на бэкенд-сервер:

```typescript
export default defineConfig({
  server: {
    proxy: {
      // Простой прокси
      '/api': 'http://localhost:8080',

      // Прокси с дополнительными опциями
      '/api/v2': {
        target: 'http://localhost:8080',
        changeOrigin: true,  // Изменить заголовок Host
        rewrite: (path) => path.replace(/^\/api\/v2/, '/api'),
      },

      // Прокси для WebSocket
      '/socket.io': {
        target: 'ws://localhost:8080',
        ws: true,
      },

      // Несколько путей на разные сервисы
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

Теперь в коде React можно делать запросы без указания полного URL:

```typescript
// Запрос уйдёт через прокси на http://localhost:8080/api/users
const response = await fetch('/api/users')
```

### HMR настройки

```typescript
export default defineConfig({
  server: {
    hmr: {
      port: 5174,           // Отдельный порт для WebSocket HMR
      overlay: true,        // Показывать ошибки поверх приложения
    },
  },
})
```

## Оптимизация production-сборки

### Настройки build

```typescript
export default defineConfig({
  build: {
    outDir: 'dist',                  // Директория вывода
    assetsDir: 'assets',             // Поддиректория для ресурсов
    sourcemap: false,                // Отключить source maps в prod
    minify: 'esbuild',               // Минификатор (быстрее terser)
    target: 'es2015',                // Поддержка браузеров
    cssCodeSplit: true,              // Разделять CSS по чанкам
    chunkSizeWarningLimit: 1000,     // Предупреждение (КБ)
    emptyOutDir: true,               // Очищать dist перед сборкой
    reportCompressedSize: false,     // Не считать размер сжатых файлов (ускоряет сборку)
  },
})
```

### Code Splitting — разделение кода

Code splitting позволяет разбить приложение на части (чанки), которые загружаются по мере необходимости, уменьшая начальный размер бандла.

#### Динамический импорт в React

Самый простой способ code splitting — `React.lazy()` с `Suspense`:

```typescript
import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'

// Эти компоненты будут в отдельных чанках
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))
const Profile = lazy(() => import('./pages/Profile'))

function App() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  )
}
```

При этом Vite автоматически создаст отдельный `.js`-файл для каждой страницы.

#### Ручная настройка чанков через rollupOptions

Для контроля над разделением бандла используйте `rollupOptions`:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Разделить vendor-библиотеки в отдельные чанки
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'redux': ['@reduxjs/toolkit', 'react-redux'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },

        // Или через функцию для динамического определения чанков
        // manualChunks(id) {
        //   if (id.includes('node_modules')) {
        //     return 'vendor'
        //   }
        // },

        // Настройка имён файлов
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
})
```

### Оптимизация зависимостей

Vite использует `esbuild` для предварительной оптимизации зависимостей (dep optimization). Это ускоряет загрузку страниц в режиме разработки.

```typescript
export default defineConfig({
  optimizeDeps: {
    // Явно включить пакеты для предоптимизации
    include: [
      'lodash-es',
      '@mui/material',
      'react-virtualized',
    ],
    // Исключить пакеты из предоптимизации
    exclude: ['some-local-package'],
    // Дополнительные esbuild-опции для оптимизации
    esbuildOptions: {
      target: 'es2020',
    },
  },
})
```

## Работа с ресурсами (assets)

### Импорт изображений

```typescript
// Импорт изображения — Vite вернёт URL
import logoUrl from './logo.png'

function App() {
  return <img src={logoUrl} alt="Logo" />
}

// Явное получение URL через ?url
import imageUrl from './hero.jpg?url'

// Импорт как строка base64 (для маленьких изображений)
import iconBase64 from './icon.png?inline'

// Получение сырых байт
import rawData from './data.bin?raw'
```

### Настройка лимита для inline-ресурсов

По умолчанию Vite инлайнит ресурсы меньше 4KB как base64. Можно изменить:

```typescript
export default defineConfig({
  build: {
    assetsInlineLimit: 8192, // 8KB (в байтах)
  },
})
```

### Публичные ресурсы

Файлы в папке `public/` копируются в корень `dist/` без обработки. Они доступны по абсолютному пути:

```typescript
// public/robots.txt → dist/robots.txt
// public/images/logo.png → dist/images/logo.png

// В коде обращайтесь по абсолютному пути
<img src="/images/logo.png" alt="Logo" />
```

## TypeScript в Vite-проектах

### tsconfig.node.json для конфига Vite

Файл `tsconfig.node.json` нужен для того, чтобы TypeScript правильно проверял `vite.config.ts` — этот файл выполняется в Node.js, а не в браузере:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### Использование importMeta в TypeScript

Если используете `import.meta.env` или другие Vite-специфичные фичи, добавьте ссылку на типы Vite:

```typescript
// src/vite-env.d.ts (создаётся автоматически при инициализации)
/// <reference types="vite/client" />
```

Это добавляет типы для `import.meta.env`, `import.meta.hot` и т.д.

## Режимы и конфигурация под разные окружения

### Несколько конфигов через режимы

Vite поддерживает режимы (`mode`). По умолчанию:
- `npm run dev` → режим `development`
- `npm run build` → режим `production`

Можно задавать свои режимы:

```bash
vite build --mode staging
vite build --mode preview
```

В зависимости от режима загружаются разные `.env`-файлы:

```
.env.staging        # загружается при --mode staging
.env.preview        # загружается при --mode preview
```

### Условная конфигурация в vite.config.ts

```typescript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // Загружаем переменные окружения вручную
  const env = loadEnv(mode, process.cwd(), '')

  const isDev = command === 'serve'
  const isProd = command === 'build'

  return {
    plugins: [react()],

    define: {
      // Делаем переменные доступными глобально в коде
      __APP_VERSION__: JSON.stringify(env.npm_package_version),
      __API_URL__: JSON.stringify(env.VITE_API_URL),
    },

    server: isDev ? {
      port: 3000,
      proxy: {
        '/api': env.VITE_API_URL,
      },
    } : undefined,

    build: isProd ? {
      sourcemap: false,
      minify: 'esbuild',
    } : undefined,
  }
})
```

## Настройка CSS и препроцессоров

### CSS Modules

Vite поддерживает CSS Modules из коробки — просто назовите файл `.module.css`:

```css
/* Button.module.css */
.button {
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
}

.buttonPrimary {
  background-color: #0056b3;
}
```

```typescript
import styles from './Button.module.css'

function Button({ primary }: { primary?: boolean }) {
  return (
    <button
      className={`${styles.button} ${primary ? styles.buttonPrimary : ''}`}
    >
      Click me
    </button>
  )
}
```

### SCSS/Sass

Просто установите `sass` — никаких плагинов не нужно:

```bash
npm install -D sass
```

```typescript
// Теперь можно импортировать .scss/.sass файлы
import './styles/main.scss'
```

Для глобальных переменных SCSS во всех файлах:

```typescript
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        // Автоматически добавлять импорт переменных во все SCSS файлы
        additionalData: `@use "@/styles/variables" as *;`,
      },
    },
  },
})
```

### Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```typescript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Vite обрабатывает PostCSS автоматически при наличии `postcss.config.js` в корне.

## Практический пример: полный vite.config.ts для production

Вот реалистичный конфиг для реального React-проекта с TypeScript, Tailwind CSS, алиасами и оптимизацией:

```typescript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import svgr from 'vite-plugin-svgr'
import checker from 'vite-plugin-checker'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  const isAnalyze = process.env.ANALYZE === 'true'

  return {
    plugins: [
      react(),
      svgr(),
      checker({
        typescript: true,
      }),
      isAnalyze && visualizer({
        open: true,
        gzipSize: true,
        filename: 'dist/stats.html',
      }),
    ].filter(Boolean),

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@store': path.resolve(__dirname, './src/store'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
        '@assets': path.resolve(__dirname, './src/assets'),
      },
    },

    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: !isProduction,
      minify: isProduction ? 'esbuild' : false,
      target: 'es2015',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'router': ['react-router-dom'],
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: ({ name }) => {
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(name ?? '')) {
              return 'assets/images/[name]-[hash][extname]'
            }
            if (/\.css$/.test(name ?? '')) {
              return 'assets/css/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          },
        },
      },
    },

    optimizeDeps: {
      include: ['react', 'react-dom'],
    },

    css: {
      devSourcemap: true,
    },
  }
})
```

## Сравнение Vite и Create React App

Понимание разницы поможет вам объяснить выбор инструмента коллегам или на собеседовании:

| Критерий | Vite | Create React App |
|----------|------|-----------------|
| Время холодного старта | < 1 секунды | 10-30 секунд |
| HMR (горячая перезагрузка) | Мгновенная | 2-10 секунд |
| Базовый сборщик | Rollup (prod), ESM (dev) | Webpack |
| Настраиваемость | Очень гибкий | Ограниченная (eject) |
| TypeScript | Встроенная поддержка | Встроенная поддержка |
| Поддержка | Активная | Устаревший (не рекомендуется) |
| Конфиг файл | `vite.config.ts` | Скрытый (нужен eject) |
| Плагины | Огромная экосистема | Ограниченная |
| Размер node_modules | Меньше | Больше |

CRA (Create React App) официально считается устаревшим и больше не рекомендуется командой React. Vite — рекомендуемый выбор для новых проектов.

## Типичные проблемы и их решение

### Проблема: CommonJS-модули не работают с ESM

Некоторые старые npm-пакеты используют CommonJS, что может вызывать проблемы:

```typescript
// Решение: добавить в optimizeDeps.include
export default defineConfig({
  optimizeDeps: {
    include: ['some-commonjs-package'],
  },
})
```

### Проблема: import.meta.env не работает

```typescript
// Неправильно — не делайте деструктуризацию
const { VITE_API_URL } = import.meta.env  // может не работать

// Правильно — обращайтесь напрямую
const apiUrl = import.meta.env.VITE_API_URL
```

### Проблема: Vite не видит изменения в node_modules

```bash
# Очистите кэш Vite и перезапустите
npx vite --force
# или
rm -rf node_modules/.vite
```

### Проблема: process.env не определён

В отличие от CRA, Vite не предоставляет `process.env`. Используйте `import.meta.env`:

```typescript
// Неправильно (CRA стиль)
const apiUrl = process.env.REACT_APP_API_URL

// Правильно (Vite стиль)
const apiUrl = import.meta.env.VITE_API_URL
```

Если нужна совместимость со старым кодом, добавьте в конфиг:

```typescript
export default defineConfig({
  define: {
    'process.env': {}
  },
})
```

## Заключение

Vite — мощный и гибкий инструмент, который значительно ускоряет разработку React-приложений. В этой статье вы изучили:

- **Структуру и базовую конфигурацию** через `vite.config.ts`
- **Алиасы путей** для удобных импортов и их настройку в TypeScript
- **Переменные окружения** через `.env` файлы и `import.meta.env`
- **Популярные плагины** для SVG, проверки типов и анализа бандла
- **Прокси** для решения CORS-проблем при разработке
- **Оптимизацию сборки** с code splitting, manualChunks и минификацией
- **Работу с CSS** — CSS Modules, SCSS и Tailwind CSS
- **Типичные проблемы** и способы их решения

Понимание конфигурации Vite — обязательный навык для современного React-разработчика. С хорошо настроенным Vite ваши проекты будут быстро собираться, удобно разрабатываться и оптимально работать в production.

Если вы хотите глубже погрузиться в React и научиться создавать профессиональные приложения, приходите на наш курс [Основы React, React Router и Redux Toolkit](https://purpleschool.ru/course/react-redux?utm_source=knowledgebase&utm_medium=article&utm_campaign=vite-react). На курсе 177 уроков и 17 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7.

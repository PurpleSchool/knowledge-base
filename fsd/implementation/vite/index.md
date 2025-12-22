---
metaTitle: Конфигурация Vite vite-config
metaDescription: Подробное руководство по конфигурации Vite vite-config - настройка сборки плагинов алиасов окружений и оптимизаций под реальные проекты
author: Олег Марков
title: Конфигурация Vite vite-config
preview: Разберитесь как настроить Vite через vite-config - от базового конфига до продвинутых сценариев с плагинами и разными режимами сборки
---

## Введение

Конфигурация Vite строится вокруг файла vite.config, который определяет, как именно будет собираться и запускаться ваше фронтенд‑приложение. Vite сам по себе работает "из коробки", но как только вы выходите за пределы простого демо‑проекта, почти всегда нужно настроить пути, среды, плагины, обработку статики, интеграцию с backend и многое другое.

Смотрите, в этой статье я покажу вам, как:

- создать и типизировать конфиг Vite
- использовать разные режимы (mode) и переменные окружения
- настраивать dev‑сервер и прокси
- управлять alias‑ами путей и корневой директорией
- тонко настраивать сборку и оптимизацию
- подключать плагины (например, для Vue или React)
- использовать множественные entry points и микрофронтенды
- разделять конфиг для разработки и продакшена

Я буду опираться на Vite 5, но большинство идей актуальны и для Vite 4, за исключением некоторых нюансов по плагинам и опциям.

---

## Базовый файл конфигурации vite.config

### Где должен лежать файл vite.config

По умолчанию Vite ищет конфиг в корне проекта. Поддерживаются несколько вариантов имен с различными расширениями:

- vite.config.js
- vite.config.mjs
- vite.config.ts
- vite.config.cjs

Если у вас TypeScript‑проект, удобнее всего использовать vite.config.ts — вы получите автодополнение и подсказки типов.

### Базовый пример vite.config.ts

Давайте разберем минимальный рабочий конфиг на TypeScript и посмотрим, что в нем происходит:

```ts
// vite.config.ts
import { defineConfig } from 'vite'      // Импортируем helper для типизации и автодополнения
import react from '@vitejs/plugin-react' // Пример плагина для React

// Экспортируем конфиг по умолчанию
export default defineConfig({
  plugins: [
    react(), // Подключаем поддержку React Fast Refresh, JSX, SWC/Babel и т.п.
  ],
  root: '.', // Каталог проекта, откуда Vite будет считать все пути
})
```

Здесь ключевой элемент — функция defineConfig. Она не обязательна, но я рекомендую всегда ее использовать, особенно в TypeScript. Смотрите, что она делает:

- добавляет типы к конфигу
- помогает редактору кода понимать структуру объекта
- минимизирует риск опечаток в названиях полей

Если вы пишете конфиг на обычном JavaScript, его структура будет той же, просто вы можете опустить типы.

---

## Структура и основные поля конфига

ViteConfig — это объект с несколькими крупными разделами. Я покажу вам важные поля и объясню, где их использовать.

### Поле root — корень проекта

По умолчанию root равен текущей директории, откуда вы запускаете Vite. Но иногда структура проекта сложнее: например, фронтенд лежит в папке frontend, а backend — в backend.

В этом случае вы можете указать root:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  root: 'frontend', // Здесь указываем каталог с index.html и исходниками
  plugins: [vue()],
})
```

Важно понимать: root влияет на:

- поиск index.html
- базовый путь для статических файлов
- относительные пути в конфиге (например, в resolve.alias чаще удобнее использовать path.resolve, чтобы избежать путаницы)

---

### Поле plugins — расширение Vite

Плагины — главный способ настроить Vite под конкретный фреймворк и ваши задачи.

Пример для Vue и React:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    vue(),   // Поддержка .vue файлов
    react(), // Поддержка React Fast Refresh
  ],
})
```

Обратите внимание:

- порядок плагинов важен — они обрабатывают файлы по цепочке
- многие задачи (анализ кода, импорт SVG, auto‑import компонентов) решаются именно через плагины

О плагинах мы поговорим подробнее ниже.

---

### Поле resolve — алиасы и расширения

Часто в проекте неудобно писать длинные относительные пути вроде ../../components/Button. Для этого в Vite есть resolve.alias.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      // @ будет ссылаться на src
      '@': path.resolve(__dirname, 'src'),
      // Можно добавить и другие алиасы
      '@components': path.resolve(__dirname, 'src/components'),
    },
  },
})
```

Как видите, этот код:

- использует path.resolve для создания абсолютных путей, так вы избегаете проблем с относительными путями
- позволяет дальше в коде писать:
  - import Button from '@components/Button'
  - import { api } from '@/api'

Можно задавать алиасы и как массив с объектами, если нужно использовать regexp или сложные условия. Но для большинства проектов достаточно простой формы объекта.

---

### Поле server — настройки dev‑сервера

Во время разработки Vite поднимает dev‑сервер. Его поведение настраивается через поле server.

Давайте посмотрим на практический пример:

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,          // Порт dev-сервера
    host: '0.0.0.0',     // Делает сервер доступным по локальной сети
    open: true,          // Автоматически открывать браузер
    strictPort: true,    // Если порт занят - не переключаться на следующий, а падать с ошибкой
    cors: true,          // Включить CORS, если нужно
  },
})
```

Обратите внимание на host: '0.0.0.0'. Это особенно полезно, если вы:

- разрабатываете в Docker‑контейнере
- хотите открыть проект с телефона в одной сети
- подключаетесь к dev‑серверу с другой машины

Мы еще отдельно разберем proxy для API.

---

### Поле build — настройки сборки

Разработка и сборка — разные задачи. Для продакшена вам может понадобиться:

- изменить директорию с итоговыми файлами
- настроить формат выходных файлов
- разделить бандлы
- оптимизировать размер

Вот базовый пример:

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',        // Директория, куда попадет сборка
    assetsDir: 'assets',   // Поддиректория для статики внутри outDir
    sourcemap: true,       // Генерировать source map для отладки
    minify: 'esbuild',     // Минификатор - esbuild или terser
    cssCodeSplit: true,    // Делить CSS по чанкам, а не собирать все в один
  },
})
```

Смотрите, важный момент: Vite внутри использует Rollup для сборки, поэтому многие настройки завязаны на Rollup‑конфиг. Мы к этому вернемся.

---

### Поле define — глобальные константы

Если вам нужно подставить какие‑то значения на этапе сборки (например, режим приложения или номер версии), вы можете использовать define.

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify('1.2.3'), // Важно оборачивать строки в JSON.stringify
    __FEATURE_X_ENABLED__: 'true',            // Литерал true без кавычек
  },
})
```

Дальше в коде вы можете написать:

```ts
// main.ts
// Здесь мы используем значения, подставленные на этапе сборки
console.log('App version', __APP_VERSION__)

if (__FEATURE_X_ENABLED__) {
  // Здесь можно включить экспериментальный функционал
}
```

Эти значения будут "захардкожены" в итоговом бандле. Это удобно для feature‑флагов и версионирования.

---

## Режимы (mode), переменные окружения и env‑файлы

### Что такое mode в Vite

Vite имеет понятие режима (mode). Он влияет:

- на то, какие env‑файлы будут загружены
- на значение process.env.NODE_ENV (в зависимости от режима)
- на то, как вы можете разделять конфигурации

По умолчанию:

- команда dev запускает mode='development'
- команда build — mode='production'
- команда preview — тоже mode='production'

Вы можете явно указать режим:

- vite dev --mode staging
- vite build --mode test

Теперь давайте разберемся, как это связано с env‑файлами.

---

### env‑файлы и префикс VITE_

Vite читает env‑файлы по имени:

- .env — общий для всех режимов
- .env.development — только для режима development
- .env.production — только для режима production
- .env.staging — только для mode='staging' и так далее

Внутри этих файлов вы можете задавать переменные. Но Vite по умолчанию "пропускает" в клиентский код только переменные с префиксом VITE_.

Например:

.env:

VITE_API_URL=https://api.example.com
SECRET_KEY=super-secret-value

В dev‑коде вы сможете получить только VITE_API_URL.

Пример использования в компоненте:

```ts
// src/config.ts
// Здесь мы читаем переменную окружения, доступную на клиенте
export const API_URL = import.meta.env.VITE_API_URL
```

Если вы попытаетесь обратиться к SECRET_KEY, его там не будет — и это очень важная защита от случайной утечки секретов в браузер.

---

### import.meta.env — доступ к окружению

Vite предоставляет объект import.meta.env с рядом полей:

- import.meta.env.MODE — текущий mode (development, production, staging и т.д.)
- import.meta.env.DEV — boolean, true в dev‑режиме
- import.meta.env.PROD — boolean, true в production
- import.meta.env.SSR — boolean, true при SSR
- плюс все ваши VITE_* переменные

Пример:

```ts
// src/env.ts
// Здесь мы читаем полезные флаги окружения
export const isDev = import.meta.env.DEV
export const isProd = import.meta.env.PROD

export const apiUrl = import.meta.env.VITE_API_URL

if (import.meta.env.DEV) {
  // Этот код будет выполняться только в dev-режиме
  console.log('Running in dev mode')
}
```

Давайте посмотрим реальный сценарий: переключение API в зависимости от режима.

```ts
// src/api/client.ts
// Здесь мы настраиваем базовый URL для запросов
const baseUrl =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:3000'
    : import.meta.env.VITE_API_URL

export async function fetchUsers() {
  const res = await fetch(`${baseUrl}/users`)
  return res.json()
}
```

Такой подход дает вам гибкость: можно задавать разные API для dev, staging и продакшена.

---

## Настройка dev‑сервера и proxy

### Зачем нужен proxy

Когда вы разрабатываете SPA и backend отдельно, часто возникает ситуация:

- frontend: http://localhost:5173
- backend: http://localhost:8080

Если вы напрямую отправите fetch на http://localhost:8080, вы столкнетесь с CORS‑ограничениями. Один из удобных способов решить это на этапе разработки — настроить proxy в Vite.

Vite‑сервер будет принимать запросы, например, по /api и прокидывать их дальше на backend.

---

### Пример настройки server.proxy

Смотрите, я покажу вам практическую конфигурацию:

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      // Все запросы к /api будут проксироваться на backend
      '/api': {
        target: 'http://localhost:8080', // Адрес backend-сервера
        changeOrigin: true,              // Подменять Origin заголовок
        secure: false,                   // Игнорировать self-signed сертификаты для HTTPS
        rewrite: (path) => path.replace(/^\/api/, ''), 
        // Здесь мы убираем префикс /api, если backend его не ожидает
      },
    },
  },
})
```

Теперь вы можете писать в коде:

```ts
// src/api/users.ts
// Здесь мы делаем запросы на относительный путь /api
export async function getUsers() {
  const res = await fetch('/api/users')
  return res.json()
}
```

Как это работает:

- в dev‑режиме браузер отправит запрос на Vite‑сервер: http://localhost:5173/api/users
- Vite‑сервер перенаправит его на http://localhost:8080/users (после rewrite)
- CORS не сработает, потому что браузер видит запрос как к тому же домену/порту

В продакшене вы обычно настраиваете аналогичный proxy уже на уровне nginx или другого сервера.

---

## Настройка путей, базового URL и статических файлов

### Поле base — базовый URL приложения

Если вы деплоите приложение не в корень домена, а в поддиректорию (например, https://example.com/app/), вам нужно указать base.

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  // Базовый путь, с которого будет обслуживаться приложение
  base: '/app/',
})
```

Это влияет:

- на пути к скриптам и стилям в итоговом index.html
- на загрузку статики из public
- на импорты динамических чанков

Важно: base должен начинаться и заканчиваться слешем в большинстве случаев (например, '/app/').

---

### Папка public — статика вне бандла

Vite использует папку public для "сырых" статических файлов, которые:

- не проходят через бандлер
- копируются как есть в корень сборки
- доступны по прямому URL

Например, если вы положите файл public/robots.txt, то после сборки он будет доступен как /robots.txt.

Пример:

структура проекта:

- public
  - logo.svg
- src
  - main.ts

В коде вы можете обратиться к файлу так:

```ts
// src/components/Logo.tsx
// Здесь мы подключаем статический файл из public
export function Logo() {
  return (
    <img src="/logo.svg" alt="Logo" />
  )
}
```

Если вы используете base, путь будет автоматически скорректирован при сборке.

---

## Множественные entry points и HTML‑файлы

### Один Vite‑проект с несколькими страницами

Vite может работать не только с одним index.html. Вы можете сделать несколько HTML‑входов и собрать несколько "страниц" в рамках одного проекта.

Например, структура:

- index.html
- admin.html
- src
  - main.ts
  - admin.ts

Теперь давайте укажем несколько entry points в build.rollupOptions.input:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),  // Главная страница
        admin: path.resolve(__dirname, 'admin.html'), // Админ-панель
      },
    },
  },
})
```

Теперь Vite соберет два HTML‑файла и соответствующие бандлы. Это удобно, если у вас несколько независимых частей приложения, но вы хотите держать их в одном репозитории и под одним конфигом.

---

## Расширенная конфигурация сборки

### Разделение кода (manualChunks)

Иногда нужно управлять тем, как код делится на чанки. Например, вы хотите вынести тяжелые библиотеки в отдельный файл vendor.

Покажу, как это реализовано на практике:

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Здесь мы настраиваем разделение чанков
        manualChunks: {
          // Вынести React в отдельный чанк vendor-react
          'vendor-react': ['react', 'react-dom'],
        },
      },
    },
  },
})
```

Теперь в результате сборки появится отдельный файл vendor-react, который можно кешировать дольше, чем основной код.

Если вам нужно более гибкое поведение, manualChunks может быть функцией. Например, вы можете разделять зависимости по группам.

---

### Настройки target, minify и chunkSizeWarningLimit

Vite использует esbuild для трансформации и минификации по умолчанию. Через build вы можете настроить уровень поддержки браузеров.

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'es2018',       // Целевой стандарт JavaScript
    minify: 'esbuild',      // Минификация esbuild (по умолчанию) или terser
    chunkSizeWarningLimit: 700, // Порог предупреждения о размере чанка (в КБ)
  },
})
```

Если вы работаете с очень старыми браузерами, придется использовать дополнительные плагины и полифилы, но сама базовая настройка target тоже важна.

---

## SSR, библиотечная сборка и другие режимы

### SSR (Server Side Rendering)

Vite умеет работать в режиме SSR, когда вы рендерите React/Vue на сервере. Для этого в конфиге появляется секция ssr.

Я не буду уходить глубоко в SSR, но покажу базовые настройки:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  ssr: {
    noExternal: ['some-esm-only-lib'], // Заставить Vite бандлить эту зависимость
    external: ['fsevents'],            // Не бандлить, а оставить как external
  },
})
```

Это важно, если у вас есть зависимости, которые:

- плохо работают при require
- должны быть собраны как часть SSR‑бандла

---

### Библиотечный режим (build.lib)

Если вы создаете не SPA, а библиотеку (например, компонентную библиотеку на React), Vite можно переключить в "library mode".

Давайте разберемся на примере.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'), // Точка входа библиотеки
      name: 'MyUiLib',                                 // Глобальное имя для UMD/IIFE
      fileName: (format) => `my-ui-lib.${format}.js`,  // Схема имен файлов
    },
    rollupOptions: {
      // Эти зависимости не будут включены внутрь бандла
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',       // Имя глобальной переменной для UMD/IIFE
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
```

Такой режим удобен, если вы хотите распространять библиотеку через npm, а не деплоить SPA.

---

## Работа с плагинами Vite

### Как устроен плагин в целом

Vite‑плагины основаны на плагинной системе Rollup, плюс имеют свои хуки под dev‑сервер. В реальных проектах вы чаще подключаете готовые плагины, но иногда удобно написать свой.

Базовая структура плагина:

```ts
// plugins/my-plugin.ts
import type { Plugin } from 'vite'

// Здесь мы объявляем простой плагин, который логирует id каждого импортируемого модуля
export function myPlugin(): Plugin {
  return {
    name: 'my-plugin',
    // Хук transform вызывается для каждого модуля
    transform(code, id) {
      console.log('Transforming module', id)
      // Здесь можно модифицировать код, но мы сейчас просто возвращаем его как есть
      return code
    },
  }
}
```

Подключение в конфиге:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { myPlugin } from './plugins/my-plugin'

export default defineConfig({
  plugins: [myPlugin()],
})
```

Таким образом, вы можете:

- менять код модулей "на лету"
- внедрять макросы
- реализовывать собственные варианты импорта ресурсов и т.д.

---

### Часто используемые плагины

Рассмотрим несколько видимых на практике случаев.

#### Плагин для Vue

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
```

Этот плагин:

- обрабатывает .vue файлы
- включает HMR для Vue
- настраивает компилятор шаблонов

#### Плагин для Vue с JSX

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(), // Поддержка JSX/TSX в компонентах Vue
  ],
})
```

#### Плагин для React

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

Этот плагин:

- включает Fast Refresh
- настраивает JSX
- может использовать SWC или Babel внутри (в зависимости от версии)

---

## Разделение конфига на "общий", dev и prod

### Зачем разделять конфиг

Со временем vite.config может разрастаться. Часто удобно:

- иметь базовый конфиг, общий для всех режимов
- накладывать поверх dev‑специфичные или prod‑специфичные настройки

Один из распространенных подходов — экспортировать функцию, зависящую от mode и command.

---

### Использование функции в vite.config

Смотрите, я покажу вам, как это выглядит в коде:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // Здесь мы вычисляем, какой это режим
  const isDev = mode === 'development'
  const isBuild = command === 'build'

  // Можно загрузить кастомные env-файлы при необходимости
  // const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [react()],
    base: isDev ? '/' : '/app/', // Разный base для dev и prod
    server: {
      port: 5173,
    },
    build: {
      sourcemap: isDev,      // В dev можно включить source map
      minify: isBuild && 'esbuild',
    },
  }
})
```

Вызов defineConfig с функцией позволяет:

- выбирать нужные настройки в зависимости от того, идет ли сборка или dev
- использовать разные env‑файлы
- изменять поведение без дублирования кода

---

## Типизация и использование Vite в TypeScript

### Типизация конфига

Если вы используете TypeScript, вы можете явно типизировать конфиг и плагин:

```ts
// vite.config.ts
import { defineConfig, type UserConfig } from 'vite'

// Здесь мы создаем конфиг с явной типизацией
const config: UserConfig = {
  server: {
    port: 3000,
  },
}

export default defineConfig(config)
```

Так редактор подскажет вам все доступные поля и заполнит типы глубоко внутри объектов (server, build, resolve и т.д.).

---

### Типизация import.meta.env

Чтобы TypeScript понимал, какие именно переменные окружения у вас есть, стоит добавить типизацию import.meta.env.

Создайте файл src/env.d.ts:

```ts
// src/env.d.ts
/// <reference types="vite/client" />

// Здесь мы расширяем типы окружения своими переменными
interface ImportMetaEnv {
  readonly VITE_API_URL: string         // Обязательная строковая переменная
  readonly VITE_FEATURE_FLAG?: string   // Необязательная переменная
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

Теперь, когда вы напишете import.meta.env.VITE_API_URL, TypeScript будет знать, что это строка, и предупредит, если вы опечатаетесь в имени.

---

## Заключение

Конфигурация Vite через vite.config позволяет очень гибко управлять тем, как ваш проект работает в dev‑режиме и как он собирается в продакшен. Вы можете:

- задавать корень проекта и базовый URL
- настраивать dev‑сервер, proxy и порты
- использовать env‑файлы и режимы (mode), разделять dev/staging/prod окружения
- управлять сборкой через build и rollupOptions
- подключать плагины под ваш фреймворк и задачи
- определять нескольких entry points и собирать несколько страниц
- включать SSR и библиотечный режим при необходимости
- типизировать конфиг и переменные окружения в TypeScript

Дальше вы сможете развивать конфигурацию под ваш конкретный стек: добавлять плагины для анализа бандла, оптимизировать загрузку, внедрять автогенерацию маршрутов и многое другое. Главное — понимать, какую часть поведения Vite отвечает за что, и использовать конфиг как инструмент, а не как "магический" файл.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как использовать разные env‑файлы для dev, staging и prod одновременно

Создайте несколько файлов:

- .env — общие переменные
- .env.development — для dev
- .env.staging — для staging
- .env.production — для prod

Запускайте Vite с нужным mode:

- vite dev --mode development
- vite build --mode staging
- vite build --mode production

Внутри кода используйте import.meta.env.VITE_*. Vite сам подберет нужный набор env‑файлов (общий плюс специфичный для текущего mode).

---

### Как сделать так, чтобы алиасы работали и в TypeScript, и в Vite

Помимо resolve.alias в vite.config, настройте paths в tsconfig.json:

tsconfig.json:

{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"]
    }
  }
}

vite.config.ts:

resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src'),
    '@components': path.resolve(__dirname, 'src/components'),
  },
},

Так редактор и TypeScript будут понимать алиасы так же, как Vite.

---

### Как подключить SCSS с глобальными переменными без импорта в каждом файле

Используйте css.preprocessorOptions в конфиге:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "${path.resolve(__dirname, 'src/styles/variables.scss')}";
        `,
      },
    },
  },
})
```

Теперь все SCSS‑файлы будут автоматически получать переменные и миксины из variables.scss.

---

### Как отключить HMR или настроить его поведение

Вы можете настроить hmr в server:

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    hmr: {
      protocol: 'ws',  // Можно указать wss при необходимости
      host: 'localhost',
      port: 5173,
      overlay: true,   // Показ ошибок в оверлее
    },
  },
})
```

Чтобы полностью отключить HMR, можно запустить сервер с флагом --force или использовать browserSync/другие схемы, но чаще достаточно просто настроить hmr под вашу инфраструктуру.

---

### Как настроить разные outDir для разных режимов

Используйте функцию в defineConfig и переключайтесь по mode:

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isStaging = mode === 'staging'

  return {
    build: {
      outDir: isStaging ? 'dist-staging' : 'dist',
    },
  }
})
```

Теперь команда vite build --mode staging будет складывать файлы в dist-staging, а обычная vite build — в dist.
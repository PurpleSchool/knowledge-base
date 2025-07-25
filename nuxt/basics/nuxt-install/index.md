---
metaTitle: Инструкция по установке Nuxt 4 3 2
metaDescription: Полная инструкция по установке Nuxt 4 3 2 - пошаговые примеры, анализ различий, особенности запуска, настройка проектов и ответы на технические вопросы
author: Артем Кузнецов
title: Инструкция по установке Nuxt 4 3 2
preview: Изучите пошаговые инструкции для установки Nuxt 4 3 и 2 - сравнение особенностей разных версий, лучшие советы по настройке окружения и запуску вашего первого проекта на Nuxt
---

## Введение

Nuxt — мощный фреймворк для разработки универсальных (SSR), статических и SPA-приложений на основе Vue.js. С каждым крупным релизом Nuxt меняется стратегия установки, процесс настройки и возможности по созданию современных Web-приложений. В этой статье вы познакомитесь с процессом установки Nuxt 2, 3 и 4, узнаете, чем эти версии отличаются, а также получите пошаговые инструкции с примерами кода и важными пояснениями.

Вы увидите, какие вспомогательные инструменты понадобятся вам для запуска проекта на каждой из версий, каковы минимальные требования, как создавать приложения, настраивать основные параметры, запускать и собирать готовый продукт. Для каждой версии отдельное описание процесса установки и ключевых отличий.

## Как выбрать нужную версию Nuxt

Перед началом важно определиться — какую версию Nuxt имеет смысл использовать именно вам:

- **Nuxt 2** — легаси-решение. Подходит для проектов, где нужна стабильность, совместимость с большим количеством плагинов, поддержка старых версий Vue (2.x), но не нужен функционал последних спецификаций.
- **Nuxt 3** — новая архитектура, полностью на Vue 3. Существенно увеличивает производительность и расширяет возможности гибкой настройки.
- **Nuxt 4** — продолжение развития Nuxt 3. Предлагает улучшенную DX, еще более быстрый рендеринг, тесную интеграцию с современными инструментами (например, Bun), исправляет недостатки предыдущих версий и расширяет спектр поддержки UI/SSR.

Я покажу вам процессы для всех трех версий, чтобы вы могли легко разобраться, что вам подойдет и как быстро начать работу.

## Установка Nuxt 4

### Требования к окружению

- Node.js: v18 или выше (рекомендуется LTS)
- NPM: v9 или выше, или Yarn/Bun
- git (для создания исходных шаблонов)

### Установка через nuxi (рекомендуемый способ)

#### 1. Инициализация нового проекта

Самый простой способ — воспользоваться CLI-командой `nuxi` (Nuxt CLI):

```bash
# Создаём новый проект с помощью nuxi (npm >= 9)
npm create nuxt-app@latest my-nuxt4-project

# Или с помощью pnpm
pnpm create nuxt-app@latest my-nuxt4-project

# Или с помощью yarn
yarn create nuxt-app my-nuxt4-project

# Или с помощью bun
bunx create-nuxt-app@latest my-nuxt4-project
```

**Что происходит:**  
Эта команда запустит мастер установки, который попросит выбрать шаблон (apps, template, minimal), добавить модули, указать предпочтительные технологии (TypeScript/JavaScript, Prettier/Linting и т.д.), настроить интеграцию с Tailwind, Pinia или другими библиотеками.

#### 2. Переход в папку проекта и запуск

```bash
cd my-nuxt4-project
npm install     # если не было выполнено автоматически
npm run dev     # запуск проекта в режиме разработки
```

Теперь проект будет доступен по адресу http://localhost:3000

#### 3. Индивидуальная настройка

Основные параметры проекта вы задаёте в файле `nuxt.config.ts` или `nuxt.config.js`. Например:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: true,    // включаем серверный рендеринг
  devtools: true,
  modules: ['@nuxt/content'],   // подключаем нужные модули
  app: {
    head: {
      title: 'My Nuxt 4 Project'
    }
  }
})
```

### Возможности и особенности Nuxt 4

Nuxt 4 наследует архитектуру Nuxt 3:

- Использует Vue 3 и Vite (или Webpack, по желанию)
- Расширяет поддержку Bun, pnpm, современных инструментов
- Мощный серверный рендеринг
- File-based routing (роутинг по структуре файлов)
- Поддержка server/ API routes (endpoints)
- Улучшенная DX - Developer Experience
- Типизированный конфиг на TypeScript

### Сборка и деплой

Для сборки production-версии используйте команду:

```bash
npm run build
npm run start   # запуск собранного приложения в режиме production
```
Файлы для деплоя будут находиться в `.output/` или `dist/` (зависит от шаблона и вашего build-режима).

---

## Установка Nuxt 3

Nuxt 3 — первый релиз, полностью основанный на Vue 3. Установка очень похожа на Nuxt 4, так как большинство инструментов были сохранены и улучшены.

### Требования

- Node.js: v16.11.0 или выше
- NPM: v8 или выше

### Установка через nuxi

```bash
npx nuxi init my-nuxt3-app
cd my-nuxt3-app
npm install
npm run dev
```

#### Пояснения:

- `nuxi init` — создаёт начальный шаблон проекта с нужной структурой
- После `npm run dev` — вы получите работающий сервер разработки на http://localhost:3000

#### Стартовое редактирование

В Nuxt 3 вся логика и роутинг строятся файлам в папке `pages/`. Просто добавляете новые .vue-файлы, и они автоматически становятся вашими маршрутами.

### Пример настройки Nuxt 3 проекта

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: true,       // включите или отключите SSR
  modules: [
    '@unocss/nuxt', // подключение дополнительных Nuxt-модулей
  ],
  app: {
    head: {
      title: 'Hello Nuxt 3',
    },
  },
})
```

### Сборка и деплой

```bash
npm run build    # сборка проекта
npm run start    # запуск production-сервера
```

Весь билд будет находиться в папке `.output`.

### Что появилось нового в Nuxt 3

- Vue 3 by default (Composition API)
- Vite/webpack в качестве сборщика (по умолчанию Vite)
- Server routes: можно делать API прямо в `/server/api/`
- Полная поддержка TypeScript
- Интеграция composables и plugins по best practices
- Пакетный менеджер — любой, вплоть до pnpm и yarn berry

---

## Установка Nuxt 2

Nuxt 2 основан на Vue 2 и до сих пор поддерживается для легаси проектов.

### Требования

- Node.js: 10.13+ (лучше 12.x или 14.x)
- NPM: v6 или выше

### Установка через create-nuxt-app

```bash
npx create-nuxt-app my-nuxt2-app
cd my-nuxt2-app
npm install      # редко требуется, создается сразу с зависимостями
npm run dev
```

**При запуске `create-nuxt-app` вы выбираете:**

- SPA или SSR (Server Side Rendering)
- Язык (JavaScript или TypeScript)
- UI фреймворки (Vuetify, Element UI и др.)
- Линтеры, тестовые фреймворки, Prettier
- Поддержку Progressive Web App

### Пример конфига для Nuxt 2

```js
// nuxt.config.js
export default {
  ssr: true,
  head: {
    title: 'Nuxt 2 Project',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' }
    ]
  },
  buildModules: [
    // добавляйте современные модули, работающие с Nuxt 2
    '@nuxtjs/eslint-module',
    '@nuxt/typescript-build'
  ],
  modules: [
    '@nuxtjs/axios'
  ]
}
```

### Архитектура Nuxt 2

- Использует Vue 2
- Только Webpack (Vite официально не поддерживается)
- File-based routing на основе папки `pages/`
- handle middleware, плагины, layouts как отдельные сущности

### Сборка Nuxt 2

```bash
npm run build
npm run start      # для production
```
После сборки проект можно развернуть на любом Node.js сервере.

---

## Сравнение основных возможностей Nuxt 2, 3 и 4

| Возможность             | Nuxt 2        | Nuxt 3          | Nuxt 4          |
|------------------------ |--------------:|----------------:|----------------:|
| Vue версии              | 2.x           | 3.x             | 3.x             |
| Сборщик                 | Webpack       | Vite/Webpack    | Vite/Webpack/Bun|
| SSR                     | Доступно      | Доступно        | Доступно        |
| Static Generation       | Nuxt Generate | Nuxt Generate   | Nuxt Generate   |
| File-Based Routing      | Да            | Да              | Да              |
| Командный интерфейс     | create-nuxt-app| nuxi           | nuxi            |
| Полная поддержка TS     | Частично      | Да              | Да              |
| Серверные маршруты      | Нет           | Да              | Да              |
| Full Static             | Ограниченно   | Расширено       | Расширено       |
| Поддержка Bun           | Нет           | Экспериментально| Да              |
| Интеграция с Nitro      | Нет           | Да              | Да              |

---

## Подробности настройки и запуска на всех версиях

### Где искать документацию

- Nuxt 2: https://v2.nuxt.com
- Nuxt 3: https://nuxt.com/docs/getting-started/installation
- Nuxt 4: https://nuxt.com/docs

### Добавление модулей и плагинов

#### Nuxt 4 и 3

Добавлять модули можно в файле `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxt/image',
    '@nuxt/content',
  ]
})
```

#### Nuxt 2

Всё аналогично, но часто используется `buildModules` для новых модулей:

```js
export default {
  modules: [
    '@nuxtjs/axios',
  ],
  buildModules: [
    '@nuxt/typescript-build',
  ]
}
```

### Создание страниц

Во всех версиях страницы создаются в папке `pages/`. Каждый .vue-файл автоматически становится маршрутом.

```vue
<!-- pages/about.vue -->
<template>
  <div>
    <h1>О проекте Nuxt</h1>
  </div>
</template>
```

### Работа с API/Endpoints (Nuxt 3 и 4)

В папке `/server/api/` можно создавать файлы .ts/.js, каждый из которых станет отдельным endpoint:

```typescript
// server/api/hello.ts
export default defineEventHandler(event => {
  return { message: "Привет из Nuxt API" }
})
```
Этот эндпоинт будет доступен по адресу `/api/hello`.

---

## Заключение

Вы рассмотрели базовые отличия и научились устанавливать Nuxt 2, 3 и 4. Теперь вы сможете быстро развернуть стартовый проект, выбрать подходящую версию в зависимости от ваших целей, а также получить общее представление о процессе настройки и модульности Nuxt. Структура каждой из версий схожа, однако развитие функционала и переход на новые подходы (например, server/API routes и интеграция с Bun) обеспечивают гибкость для самых разных задач.

---

## Частозадаваемые технические вопросы по теме и ответы

### Как мигрировать проект с Nuxt 2 на Nuxt 3/4?

Для миграции вам потребуется:
1. Проверить совместимость зависимостей (большинство Nuxt-модулей для Nuxt 2 с Nuxt 3/4 несовместимы)
2. Переписать компоненты с использованием Composition API (если требуется)
3. Перенести nuxt.config.js в nuxt.config.ts с новыми настройками
4. Заменить плагины и middleware под новый API
5. Проверить работу роутинга и middleware

### Как подключить CSS-фреймворки (например, Tailwind) в Nuxt 3/4?

Установите модуль:
```bash
npm install -D @nuxtjs/tailwindcss
```
Добавьте в modules массив в nuxt.config.ts:
```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss']
})
```

### Можно ли запускать Nuxt 4/3/2 в Docker?

Да, во всех версиях используются стандартные Node.js-окружения. Пример Dockerfile:
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "run", "dev"]
```

### Как указать кастомный порт для dev-сервера Nuxt?

Добавьте в package.json:
```json
"scripts": {
  "dev": "nuxi dev -p 4000"
}
```
Или запустите напрямую:
```bash
nuxi dev -p 4000
```

### Как использовать Environment Variables?

Создайте файл `.env`, переменные будут доступны через process.env или useRuntimeConfig (Nuxt 3/4).

```env
NUXT_PUBLIC_API_URL=https://myapi.com
```
В Nuxt 3/4 используйте:
```typescript
const config = useRuntimeConfig();
console.log(config.public.apiUrl);
```
В Nuxt 2:
```js
process.env.API_URL
```

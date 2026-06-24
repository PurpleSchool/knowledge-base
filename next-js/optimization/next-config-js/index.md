---
metaTitle: "Настройка next.config.js в Next.js — полное руководство"
metaDescription: "Как настроить next.config.js: переменные окружения, редиректы, изображения, webpack, output и другие ключевые опции Next.js."
author: "Антон Ларичев"
title: "Настройка next.config.js"
preview: "Разбираем все ключевые настройки next.config.js: от базовой структуры до редиректов, изображений и кастомизации webpack."
---

## Что такое next.config.js

`next.config.js` — главный конфигурационный файл Next.js-приложения. Он располагается в корне проекта рядом с `package.json` и управляет поведением сборки, сервера, маршрутизации и оптимизации.

Важно понимать: этот файл выполняется только в Node.js-окружении — ни в браузере, ни в React-компонентах. Это не JSON и не модуль ESM по умолчанию, а обычный CommonJS-модуль.

## Базовая структура

Простейший вариант конфига — объект с настройками:

```js
// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
```

Комментарий `@type` подключает автодополнение и проверку типов в редакторе без необходимости использовать TypeScript-файл.

### TypeScript-конфиг

Если проект использует TypeScript, можно создать `next.config.ts` — Next.js подхватит его автоматически:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
}

export default nextConfig
```

### ESM-конфиг

Для использования ES-модульного синтаксиса создайте файл с расширением `.mjs`:

```js
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

export default nextConfig
```

Расширения `.cjs` и `.cts` не поддерживаются.

## Конфигурация как функция

Вместо объекта можно экспортировать функцию. Это удобно, когда настройки зависят от текущей фазы сборки.

```js
const { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } = require('next/constants')

module.exports = (phase, { defaultConfig }) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      reactStrictMode: true,
    }
  }

  if (phase === PHASE_PRODUCTION_BUILD) {
    return {
      reactStrictMode: true,
      compress: true,
    }
  }

  return {}
}
```

Доступные фазы:

- `PHASE_DEVELOPMENT_SERVER` — запуск `next dev`
- `PHASE_PRODUCTION_BUILD` — запуск `next build`
- `PHASE_PRODUCTION_SERVER` — запуск `next start`
- `PHASE_EXPORT` — запуск `next export`

Функция также может быть асинхронной, если нужно загрузить данные перед формированием конфига:

```js
module.exports = async (phase, { defaultConfig }) => {
  const remoteConfig = await fetchRemoteConfig()

  return {
    ...defaultConfig,
    env: remoteConfig.env,
  }
}
```

## Основные настройки

### reactStrictMode

Включает строгий режим React, который помогает обнаруживать потенциальные проблемы в разработке: двойной вызов функций, устаревшие API и побочные эффекты в неожиданных местах.

```js
module.exports = {
  reactStrictMode: true,
}
```

Рекомендуется включать для всех новых проектов. В строгом режиме некоторые функции вызываются дважды только в режиме разработки — это намеренное поведение, не баг.

### env

Позволяет встроить переменные окружения напрямую в JavaScript-бандл. Значения будут доступны через `process.env` в клиентском и серверном коде:

```js
module.exports = {
  env: {
    API_BASE_URL: 'https://api.example.com',
    APP_VERSION: '2.1.0',
  },
}
```

Использование в коде:

```js
const url = process.env.API_BASE_URL
console.log(process.env.APP_VERSION)
```

Важное отличие от `.env`-файлов: переменные из `env` в конфиге **всегда попадают в бандл**, независимо от префикса `NEXT_PUBLIC_`. Для чувствительных данных лучше использовать `.env.local` и серверные компоненты.

### output

Определяет формат вывода после сборки:

```js
module.exports = {
  output: 'standalone',
}
```

Доступные значения:

- `undefined` (по умолчанию) — стандартная сборка Next.js
- `'standalone'` — минимальная сборка для деплоя в Docker, включает только необходимые файлы и зависимости
- `'export'` — полностью статический экспорт (HTML/CSS/JS без Node.js сервера)

Режим `standalone` особенно удобен для Docker-контейнеров:

```js
module.exports = {
  output: 'standalone',
}
```

После `next build` в папке `.next/standalone` будет готовый к деплою минимальный Node.js-сервер.

### basePath

Если приложение размещается не в корне домена, а по определённому пути — используйте `basePath`:

```js
module.exports = {
  basePath: '/dashboard',
}
```

Теперь страница `pages/about.js` будет доступна по `/dashboard/about`. Компонент `<Link>` автоматически учитывает `basePath` — указывать префикс вручную не нужно.

### compress

Включает gzip-компрессию ответов сервера. Включена по умолчанию. Отключите, если перед Next.js стоит reverse proxy (nginx, Cloudflare), который сам сжимает ответы:

```js
module.exports = {
  compress: false,
}
```

### poweredByHeader

По умолчанию Next.js добавляет заголовок `X-Powered-By: Next.js`. Отключите его в продакшене по соображениям безопасности:

```js
module.exports = {
  poweredByHeader: false,
}
```

### trailingSlash

Управляет наличием завершающего слеша в URL:

```js
module.exports = {
  trailingSlash: true,
}
```

При `true` страница `/about` будет перенаправлять на `/about/`. Полезно для согласования с CDN или CMS.

## Редиректы и перезаписи URL

### redirects

Асинхронная функция, возвращающая массив правил редиректа:

```js
module.exports = {
  async redirects() {
    return [
      {
        source: '/old-blog/:slug',
        destination: '/blog/:slug',
        permanent: true,
      },
      {
        source: '/promo',
        destination: '/sale',
        permanent: false,
      },
    ]
  },
}
```

Параметры каждого правила:

- `source` — входящий путь (поддерживает параметры `:param` и wildcards `:path*`)
- `destination` — целевой путь
- `permanent` — `true` даёт 308 (кешируется навсегда), `false` даёт 307 (временный)

Next.js намеренно использует 307/308 вместо 301/302, чтобы браузеры сохраняли HTTP-метод при редиректе.

Пример с wildcard для переноса целого раздела:

```js
async redirects() {
  return [
    {
      source: '/docs/:path*',
      destination: '/documentation/:path*',
      permanent: true,
    },
  ]
},
```

### rewrites

Перезаписи позволяют изменить, какой контент отдаётся по URL, не меняя сам URL в браузере. Часто используется для проксирования запросов к внешним API:

```js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/products/:id',
        destination: 'https://external-api.com/products/:id',
      },
    ]
  },
}
```

Также `rewrites` можно разбить на `beforeFiles`, `afterFiles` и `fallback` для тонкого контроля порядка проверки:

```js
async rewrites() {
  return {
    beforeFiles: [
      {
        source: '/some-page',
        destination: '/somewhere-else',
        has: [{ type: 'query', key: 'overrideMe' }],
      },
    ],
    afterFiles: [
      {
        source: '/non-existent',
        destination: '/somewhere-else',
      },
    ],
    fallback: [
      {
        source: '/:path*',
        destination: 'https://my-old-site.example.com/:path*',
      },
    ],
  }
},
```

### headers

Добавляет HTTP-заголовки к ответам. Удобно для настройки политик безопасности:

```js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

## Оптимизация изображений

Секция `images` настраивает встроенный оптимизатор изображений Next.js:

```js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.example.com',
        port: '',
        pathname: '/images/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}
```

- `remotePatterns` — разрешённые внешние домены для оптимизации изображений
- `formats` — предпочтительные форматы (AVIF даёт лучшее сжатие, WebP — широкую поддержку)
- `deviceSizes` и `imageSizes` — брейкпоинты для генерации адаптивных версий

## Кастомизация Webpack

Для тонкой настройки сборки доступна функция `webpack`:

```js
module.exports = {
  webpack(config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }

    return config
  },
}
```

Функция получает текущий конфиг webpack и должна вернуть изменённый объект. Параметры:

- `config` — текущая конфигурация webpack
- `dev` — `true` в режиме разработки
- `isServer` — `true` для серверной сборки
- `nextRuntime` — `'edge'` или `'nodejs'`

### transpilePackages

Простая альтернатива webpack-конфигу для транспиляции npm-пакетов, которые поставляются как ESM или используют современный синтаксис:

```js
module.exports = {
  transpilePackages: ['some-esm-package', '@my-org/ui-library'],
}
```

## Практический пример: production-конфиг

Вот полноценный конфиг для типового продакшен-приложения:

```js
// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.example.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

## Переменные окружения в конфиге

Очень часто настройки в `next.config.js` сами зависят от переменных окружения. Это работает, потому что файл выполняется в Node.js:

```js
const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  compress: isProd,
  poweredByHeader: !isProd,

  images: {
    remotePatterns: isProd
      ? [{ protocol: 'https', hostname: 'cdn.example.com' }]
      : [{ protocol: 'http', hostname: 'localhost' }],
  },
}
```

## Итог

`next.config.js` — центральная точка управления поведением Next.js-приложения. Через него настраиваются: формат сборки (`output`), оптимизация изображений (`images`), редиректы и перезаписи URL, HTTP-заголовки, переменные окружения и кастомизация webpack. Конфиг может быть объектом или функцией — функциональный вариант позволяет применять разные настройки в зависимости от фазы сборки.

Для глубокого изучения Next.js и всех возможностей фреймворка: [курс по Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-config).
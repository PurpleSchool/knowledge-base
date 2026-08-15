---
metaTitle: "instrumentation.ts в Next.js: мониторинг и трассировка"
metaDescription: "Разбираем файлы instrumentation.ts и instrumentation-client.ts в Next.js: register, onRequestError, OpenTelemetry, Sentry и практические примеры."
author: "Антон Ларичев"
title: "instrumentation.ts: мониторинг и трассировка в Next.js"
preview: "Как использовать instrumentation.ts для подключения мониторинга, трассировки и наблюдаемости в Next.js-приложениях на сервере и клиенте."
---

## Что такое instrumentation.ts

Next.js предоставляет специальный механизм наблюдаемости (observability) через файлы `instrumentation.ts` и `instrumentation-client.ts`. Эти файлы позволяют подключать инструменты мониторинга, логирования и трассировки на самом раннем этапе жизненного цикла приложения — до того, как сервер начнёт обрабатывать запросы или браузер выполнит гидратацию React.

Инструментирование решает несколько задач:

- подключение OpenTelemetry для распределённой трассировки;
- интеграция Sentry, Datadog или других APM-систем;
- выполнение задач инициализации при старте сервера;
- перехват серверных ошибок и отправка их в сторонние сервисы;
- отслеживание клиентской навигации и производительности.

## Серверная часть: instrumentation.ts

### Расположение файла

Файл `instrumentation.ts` должен находиться в **корне проекта** — рядом с `next.config.ts`, `package.json` и другими конфигурационными файлами. Если проект использует директорию `src`, файл помещают внутрь неё:

```
project-root/
├── instrumentation.ts   ← здесь
├── next.config.ts
├── app/
└── ...
```

Файл не должен находиться внутри директорий `app/` или `pages/` — это важное ограничение.

### Функция register

Основной экспорт файла — функция `register`. Next.js вызывает её **один раз** при инициализации нового серверного экземпляра. Функция должна завершиться до того, как сервер начнёт принимать запросы.

```typescript
export async function register() {
  console.log('Сервер запущен, инициализация...')
}
```

Функция может быть асинхронной — Next.js дождётся её завершения.

### Интеграция с OpenTelemetry

OpenTelemetry — стандарт для распределённой трассировки. Пакет `@vercel/otel` упрощает его подключение к Next.js:

```bash
npm install @vercel/otel
```

```typescript
import { registerOTel } from '@vercel/otel'

export function register() {
  registerOTel('my-next-app')
}
```

После этого Next.js автоматически создаёт трейсы для входящих запросов, Server Components, Route Handlers и Server Actions. Трейсы можно экспортировать в Jaeger, Zipkin, Grafana Tempo и другие совместимые системы.

Для более тонкой настройки передают конфигурацию напрямую в OpenTelemetry SDK:

```typescript
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const sdk = new NodeSDK({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: 'my-next-app',
      }),
      spanProcessor: new SimpleSpanProcessor(
        new OTLPTraceExporter({
          url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
        })
      ),
    })

    sdk.start()
  }
}
```

### Перехват серверных ошибок: onRequestError

Функция `onRequestError` (добавлена в Next.js 15) позволяет перехватывать все серверные ошибки и отправлять их в сторонние сервисы мониторинга.

```typescript
import { type Instrumentation } from 'next'

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  console.error('Серверная ошибка:', {
    message: err.message,
    digest: err.digest,
    path: request.path,
    method: request.method,
    routeType: context.routeType,
    routePath: context.routePath,
  })
}
```

Функция принимает три параметра:

**`error`** — объект ошибки с дополнительным свойством `digest`. Поле `digest` — уникальный идентификатор ошибки, полезен для сопоставления с тем, что видит пользователь в браузере (Next.js отображает `digest` вместо деталей ошибки в продакшене).

**`request`** — информация о запросе:

```typescript
{
  path: string    // путь, например /api/users?page=1
  method: string  // GET, POST и т.д.
  headers: { [key: string]: string | string[] }
}
```

**`context`** — контекст возникновения ошибки:

```typescript
{
  routerKind: 'Pages Router' | 'App Router'
  routePath: string       // /app/blog/[slug]
  routeType: 'render' | 'route' | 'action' | 'proxy'
  renderSource: 'react-server-components' | 'react-server-components-payload' | 'server-rendering'
  revalidateReason: 'on-demand' | 'stale' | undefined
  renderType: 'dynamic' | 'dynamic-resume'
}
```

### Интеграция с Sentry через onRequestError

```typescript
import { type Instrumentation } from 'next'
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  Sentry.captureException(err, {
    extra: {
      requestPath: request.path,
      requestMethod: request.method,
      routeType: context.routeType,
      routePath: context.routePath,
    },
  })
}
```

### Разделение кода по рантаймам

Next.js вызывает `register` в обоих рантаймах — Node.js и Edge. Многие библиотеки мониторинга работают только в Node.js и упадут при запуске в Edge-среде. Используйте переменную `NEXT_RUNTIME` для разделения кода:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Этот код выполняется только в Node.js
    await import('./instrumentation.node')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Этот код выполняется только в Edge Runtime
    await import('./instrumentation.edge')
  }
}
```

Важно: импорты внутри `register` используются вместо импортов на уровне модуля. Это гарантирует, что тяжёлые Node.js-зависимости не попадут в Edge-бандл.

### Практический пример: запуск задач при старте сервера

`register` удобен не только для мониторинга, но и для инициализации любых серверных подсистем:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Подключаем трассировку
    const { registerOTel } = await import('@vercel/otel')
    registerOTel('my-app')

    // Сбрасываем зависшие задачи в БД
    const { prisma } = await import('./app/lib/prisma')
    const { count } = await prisma.job.updateMany({
      where: { status: 'running' },
      data: { status: 'failed', error: 'Прервано: сервер перезапущен' },
    })
    if (count > 0) {
      console.log(`[startup] Сброшено зависших задач: ${count}`)
    }

    // Запускаем фоновые крон-задачи
    const { startMetricsCron } = await import('./app/lib/metrics/cron')
    startMetricsCron()
  }
}
```

Этот паттерн решает распространённую проблему: при перезапуске сервера задачи, которые находились в статусе "выполняется", зависают навсегда. `register` — идеальное место для очистки такого состояния.

## Клиентская часть: instrumentation-client.ts

Файл `instrumentation-client.ts` (добавлен в Next.js 15.3) выполняется в браузере **после** загрузки HTML-документа, но **до** начала React-гидратации. Это делает его идеальным местом для инициализации клиентского мониторинга.

### Расположение

Аналогично серверному варианту — корень проекта или директория `src`:

```
project-root/
├── instrumentation.ts         ← серверная инструментация
├── instrumentation-client.ts  ← клиентская инструментация
├── next.config.ts
└── ...
```

### Базовый пример

В отличие от серверного файла, здесь не нужно экспортировать обязательные функции — код на верхнем уровне модуля выполняется сразу:

```typescript
// Отмечаем время инициализации
performance.mark('app-init')

// Перехватываем необработанные ошибки
window.addEventListener('error', (event) => {
  fetch('/api/errors', {
    method: 'POST',
    body: JSON.stringify({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
    }),
    headers: { 'Content-Type': 'application/json' },
  })
})

// Перехватываем отклонённые промисы
window.addEventListener('unhandledrejection', (event) => {
  fetch('/api/errors', {
    method: 'POST',
    body: JSON.stringify({
      reason: String(event.reason),
    }),
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### Отслеживание навигации: onRouterTransitionStart

Экспортируемая функция `onRouterTransitionStart` вызывается при каждой клиентской навигации:

```typescript
performance.mark('app-init')

export function onRouterTransitionStart(
  url: string,
  navigationType: 'push' | 'replace' | 'traverse'
) {
  performance.mark(`nav-start-${url}`)
  console.log(`Навигация: ${navigationType} → ${url}`)
}
```

Параметры функции:
- `url` — URL, на который происходит переход;
- `navigationType` — тип навигации: `push` (новая запись в истории), `replace` (замена текущей), `traverse` (назад/вперёд).

### Мониторинг производительности с PerformanceObserver

```typescript
const startTime = performance.now()

const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry instanceof PerformanceNavigationTiming) {
      const tti = entry.loadEventEnd - startTime
      console.log(`Time to Interactive: ${tti.toFixed(0)}ms`)

      // Отправляем метрику
      fetch('/api/metrics', {
        method: 'POST',
        body: JSON.stringify({ tti }),
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
})

observer.observe({ entryTypes: ['navigation'] })

export function onRouterTransitionStart(url: string) {
  performance.mark(`nav-start:${url}`)
}
```

### Инициализация Sentry на клиенте

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
})

export function onRouterTransitionStart(url: string) {
  Sentry.addBreadcrumb({
    message: `Navigation to ${url}`,
    category: 'navigation',
    level: 'info',
  })
}
```

> **Важно:** клиентский код выполняется до гидратации, поэтому избегайте тяжёлых операций. Next.js выводит предупреждение в режиме разработки, если инициализация занимает более 16 мс.

## Сравнение двух файлов

| Характеристика | instrumentation.ts | instrumentation-client.ts |
|---|---|---|
| Среда выполнения | Node.js / Edge (сервер) | Браузер (клиент) |
| Когда вызывается | При старте сервера | До React-гидратации |
| Обязательный экспорт | `register` (опционально) | Нет |
| Дополнительный экспорт | `onRequestError` | `onRouterTransitionStart` |
| Доступ к `window` | Нет | Да |
| Доступ к Node.js API | Да (только при `NEXT_RUNTIME === 'nodejs'`) | Нет |
| Добавлено в версии | v13.2 (experimental), v15.0 (stable) | v15.3 |

## Версионная история

| Версия | Изменения |
|---|---|
| `v15.3` | Добавлен `instrumentation-client.ts` |
| `v15.0` | `onRequestError` стабилен, `instrumentation` стабилен |
| `v14.0.4` | Поддержка Turbopack |
| `v13.2.0` | `instrumentation` как экспериментальная функция |

## Типичные ошибки

**Импорт Node.js-модулей на верхнем уровне.** Если написать `import { NodeSDK } from '@opentelemetry/sdk-node'` на верхнем уровне файла, Edge Runtime упадёт при старте. Всегда используйте динамические импорты внутри `register` с проверкой `NEXT_RUNTIME`.

**Размещение файла внутри `app/`.** Файл `instrumentation.ts` внутри директории `app/` не будет найден Next.js. Он должен быть строго в корне проекта или в `src/`.

**Долгий `register`.** Функция `register` блокирует запуск сервера. Не запускайте в ней долгие операции синхронно — если нужно что-то тяжёлое, запустите его в фоне через `Promise` без `await`.

**Не awaiting async tasks в onRequestError.** Если в `onRequestError` есть асинхронные операции, их необходимо awaiting, иначе Next.js не дождётся их завершения и данные об ошибке могут не дойти до сервиса мониторинга.

## Итог

Файлы `instrumentation.ts` и `instrumentation-client.ts` — официальный механизм Next.js для подключения наблюдаемости. Серверный файл позволяет инициализировать OpenTelemetry, перехватывать ошибки через `onRequestError` и выполнять задачи при старте сервера. Клиентский файл обеспечивает мониторинг производительности и отслеживание навигации до гидратации React. Вместе они покрывают полный цикл наблюдаемости современного Next.js-приложения.

Подробнее о Next.js, включая продвинутые паттерны мониторинга и оптимизации, можно узнать на курсе PurpleSchool: [Next.js — полный курс](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-instrumentation).
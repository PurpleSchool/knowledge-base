---
metaTitle: "Next.js connection() — динамический рендеринг в App Router"
metaDescription: "Как работает функция connection() в Next.js, зачем нужен динамический рендеринг и как управлять стратегией рендеринга в App Router."
author: "Антон Ларичев"
title: "Функция connection() и динамический рендеринг"
preview: "Разбираем функцию connection() из next/server: когда и зачем принудительно включать динамический рендеринг в Next.js App Router."
---

## Статический и динамический рендеринг в Next.js

Next.js App Router строит рендеринг вокруг одного ключевого принципа: граница между статическим и динамическим контентом находится **на уровне компонента**, а не на уровне маршрута. Одна страница может одновременно содержать статическую оболочку, кешированные данные и динамические секции, которые стримятся при каждом запросе.

По умолчанию Next.js пытается пре-рендерить (prerender) как можно больше на этапе сборки. Если компонент не использует данные, доступные только во время запроса, Next.js сгенерирует его один раз при `next build` и будет отдавать готовый HTML без обращения к серверу.

### Что такое Request-time APIs

Some APIs в Next.js автоматически переключают компонент в режим динамического рендеринга, потому что они зависят от текущего HTTP-запроса:

- `cookies()` — куки пользователя
- `headers()` — заголовки запроса
- `searchParams` — параметры строки запроса
- `params` — параметры динамических сегментов маршрута (если не указан `generateStaticParams`)

Как только компонент вызывает любой из этих APIs, Next.js понимает: страницу нельзя пре-рендерить, потому что её содержимое зависит от конкретного запроса.

```typescript
import { cookies } from 'next/headers'

export default async function ProfilePage() {
  // cookies() автоматически делает страницу динамической
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value

  return <div>User: {userId}</div>
}
```

## Проблема: данные без Request-time API

Иногда нужно, чтобы страница всегда рендерилась заново при каждом запросе, но при этом она не использует ни один из перечисленных выше APIs. Типичные примеры:

- Случайные данные: `Math.random()`
- Текущее время: `new Date()`
- Внешний источник, который должен возвращать свежие данные при каждом обращении, но запрос к нему не передаёт куки и заголовки

```typescript
export default async function RandomQuotePage() {
  // Next.js не знает, что это значение должно меняться
  // при каждом запросе — и закеширует его при сборке
  const random = Math.random()
  return <p>Random: {random}</p>
}
```

Без дополнительных указаний Next.js пре-рендерит эту страницу один раз при сборке. Все пользователи увидят одинаковое число — то, которое было сгенерировано в момент `next build`.

## Функция connection()

Функция `connection()` из пакета `next/server` решает именно эту задачу. Она сигнализирует Next.js, что компоненту нужно дождаться живого соединения с пользователем (то есть реального HTTP-запроса) перед рендерингом.

```typescript
import { connection } from 'next/server'

export default async function Page() {
  await connection()
  // Всё, что ниже — рендерится при каждом запросе
  const rand = Math.random()
  return <span>{rand}</span>
}
```

Функция имеет простую сигнатуру:

```typescript
function connection(): Promise<void>
```

Она не принимает параметров и не возвращает полезного значения — её единственная роль заключается в том, чтобы сообщить компилятору Next.js: этот компонент не должен пре-рендериться.

### connection() заменяет unstable_noStore

До Next.js 15 для той же цели использовалась функция `unstable_noStore()`. Она работала аналогично, но с нестабильным API. В Next.js 15 появилась стабильная замена — `connection()`.

```typescript
// Старый способ (устарел)
import { unstable_noStore as noStore } from 'next/cache'

export default async function Page() {
  noStore()
  // ...
}

// Новый способ
import { connection } from 'next/server'

export default async function Page() {
  await connection()
  // ...
}
```

## Практические примеры

### Генерация случайных данных

Страница с виджетом, который показывает случайную цитату при каждом посещении:

```typescript
import { connection } from 'next/server'

const quotes = [
  'Кто владеет информацией, тот владеет миром.',
  'Простота — это высшая степень изощрённости.',
  'Код читают люди, а не машины.',
]

export default async function QuotePage() {
  await connection()

  const index = Math.floor(Math.random() * quotes.length)
  const quote = quotes[index]

  return (
    <main>
      <h1>Цитата дня</h1>
      <blockquote>{quote}</blockquote>
    </main>
  )
}
```

Без `await connection()` Next.js пре-рендерит страницу один раз при сборке, и все пользователи будут видеть одну и ту же цитату до следующего деплоя.

### Отображение актуального времени

```typescript
import { connection } from 'next/server'

export default async function ServerTimePage() {
  await connection()

  const now = new Date()
  const formatted = now.toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    dateStyle: 'full',
    timeStyle: 'medium',
  })

  return (
    <div>
      <p>Время на сервере: {formatted}</p>
    </div>
  )
}
```

### Получение всегда свежих данных из внешнего API

Предположим, есть API биржевых курсов, который не требует авторизации через куки, но должен возвращать актуальные данные при каждом запросе:

```typescript
import { connection } from 'next/server'

async function getExchangeRates() {
  const res = await fetch('https://api.example.com/rates', {
    cache: 'no-store',
  })
  return res.json()
}

export default async function RatesPage() {
  await connection()
  const rates = await getExchangeRates()

  return (
    <table>
      <tbody>
        {rates.map((rate: { currency: string; value: number }) => (
          <tr key={rate.currency}>
            <td>{rate.currency}</td>
            <td>{rate.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

Здесь `connection()` и `cache: 'no-store'` работают вместе: первый отключает пре-рендеринг страницы, второй гарантирует, что сам fetch не будет кешироваться.

### Использование в дочерних компонентах

`connection()` можно вызывать не только на уровне страницы, но и внутри любого серверного компонента:

```typescript
import { connection } from 'next/server'

async function LiveCounter() {
  await connection()

  const count = await fetchCurrentVisitors()

  return <span>Сейчас на сайте: {count}</span>
}

export default function HomePage() {
  return (
    <main>
      <h1>Добро пожаловать</h1>
      <LiveCounter />
    </main>
  )
}
```

Вызов `connection()` внутри `LiveCounter` помечает весь поддерев компонентов как динамический, но только ту ветку, которая его содержит.

## Комбинирование с Suspense

Когда динамические компоненты завёрнуты в `<Suspense>`, Next.js может сначала отправить статическую оболочку страницы, а затем потоком (streaming) передать содержимое динамической части. Это позволяет пользователю сразу видеть интерфейс, не дожидаясь выполнения всех запросов:

```typescript
import { Suspense } from 'react'
import { connection } from 'next/server'

async function DynamicContent() {
  await connection()
  const data = await fetchFreshData()
  return <div>{data.value}</div>
}

export default function Page() {
  return (
    <main>
      {/* Статическая часть — рендерится сразу */}
      <header>
        <h1>Мой дашборд</h1>
      </header>

      {/* Динамическая часть — стримится после первого ответа */}
      <Suspense fallback={<p>Загрузка данных...</p>}>
        <DynamicContent />
      </Suspense>
    </main>
  )
}
```

Без `<Suspense>` вся страница будет ждать завершения динамического рендеринга. С `<Suspense>` браузер получает HTML немедленно, а динамическое содержимое подгружается по мере готовности.

## Когда connection() нужен, а когда нет

Функция нужна только в одном специфическом случае: **компонент должен быть динамическим, но не использует ни один Request-time API**.

| Ситуация | Нужен ли connection()? |
|---|---|
| Компонент вызывает `cookies()` | Нет — динамический рендеринг включится автоматически |
| Компонент вызывает `headers()` | Нет — то же самое |
| Страница использует `searchParams` | Нет — то же самое |
| Нужен `Math.random()` | Да |
| Нужен `new Date()` | Да |
| Данные из fetch всегда должны быть свежими, но куки не используются | Да — в сочетании с `cache: 'no-store'` |

## Версии и совместимость

Функция `connection()` появилась как Release Candidate в Next.js 15.0.0-RC и была стабилизирована в Next.js 15.0.0. В более ранних версиях используется `unstable_noStore()` из пакета `next/cache`.

Проверить текущую версию Next.js в проекте:

```bash
npx next --version
```

Установить или обновить Next.js до последней стабильной версии:

```bash
npm install next@latest
```

## Итог

Функция `connection()` — это явный способ сообщить Next.js, что компонент зависит от живого запроса, даже если он не обращается к куки, заголовкам или параметрам URL. Она заменила нестабильный `unstable_noStore()` и стала частью стандартного API начиная с Next.js 15.

Правило простое: если компонент использует любой из стандартных Request-time APIs (`cookies`, `headers`, `searchParams`), `connection()` не нужен. Он нужен только тогда, когда динамическое поведение явно не выражено через эти APIs, но присутствует в логике компонента.

Чтобы глубже разобраться с Next.js App Router, рендерингом, стримингом и кешированием — смотрите курс на PurpleSchool: https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=connection-dynamic-rendering
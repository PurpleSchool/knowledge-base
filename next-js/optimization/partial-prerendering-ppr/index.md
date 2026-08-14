---
metaTitle: "Partial Prerendering (PPR) в Next.js: статика + динамика"
metaDescription: "Разбираем Partial Prerendering в Next.js: как работает статическая оболочка, use cache, Suspense и cacheComponents для максимальной производительности."
author: "Антон Ларичев"
title: "Partial Prerendering (PPR) в Next.js"
preview: "Partial Prerendering объединяет статический и динамический рендеринг на уровне компонентов — статическая оболочка отдаётся мгновенно, динамический контент стримится следом."
---

## Что такое Partial Prerendering

Традиционные фреймворки проводят чёткую границу: страница либо полностью статическая (генерируется на этапе сборки), либо полностью динамическая (рендерится при каждом запросе). Такой подход прост, но жертвует производительностью: одна медленная база данных или API-запрос делает динамической всю страницу целиком.

Next.js выбрал другой путь. **Граница между статическим и динамическим — на уровне компонентов, а не маршрутов.** Partial Prerendering (PPR) позволяет одной странице иметь:

- статическую оболочку, которая отдаётся мгновенно из CDN;
- динамические секции, которые стримятся с сервера по мере готовности.

Пользователь видит полезный контент сразу, не дожидаясь полного рендера страницы.

## Как это работает

### Статическая оболочка

При сборке Next.js обходит дерево компонентов и выделяет всё, что может быть предрендерено: лейауты, навигацию, заголовки, футер, закешированные данные. Всё это формирует **статическую оболочку** (static shell) — HTML, который отправляется браузеру немедленно.

Туда же включаются **fallback-заглушки** из `<Suspense>` — скелетоны или индикаторы загрузки, которые пользователь видит на месте ещё не загруженного динамического контента.

### Динамический контент

Компоненты, которым нужны данные запроса (куки, заголовки, параметры URL) или которые намеренно не кешируются, рендерятся на сервере в момент запроса. Их HTML стримится к клиенту через chunked transfer encoding и React вставляет его на место соответствующих Suspense-заглушек без перезагрузки страницы.

В итоге клиент получает один стриминговый HTTP-ответ, где сначала идёт статическая оболочка, а за ней — динамические части по мере их готовности.

## Включение PPR в Next.js 16

Starting with Next.js 16, PPR включается через флаг `cacheComponents` в конфигурации проекта.

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
}

module.exports = nextConfig
```

После включения флага поведение рендеринга меняется:

- **Без `use cache`** — компонент считается динамическим и рендерится на каждый запрос.
- **С `use cache`** — компонент или функция кешируются и попадают в статическую оболочку.
- **В `<Suspense>`** — динамический компонент стримится, не блокируя статическую оболочку.

> В Next.js 14 и 15 PPR включался через `experimental: { ppr: true }`. В Next.js 16 эта опция удалена — используйте `cacheComponents`.

## Директива use cache

Для кеширования данных и компонентов в Next.js 16 используется директива `'use cache'`. Она размещается в теле функции или компонента и говорит Next.js сохранить результат выполнения в кеш.

### Кеширование на уровне данных

```ts
// app/lib/products.ts
import { cacheLife } from 'next/cache'

export async function getProducts() {
  'use cache'
  cacheLife('hours')

  const res = await fetch('https://api.example.com/products')
  return res.json()
}
```

Функция `getProducts` вызывается один раз, результат кешируется на несколько часов. Все компоненты, использующие эту функцию, получат одни и те же данные из кеша без повторных запросов.

### Кеширование на уровне компонента

```tsx
// app/components/ProductList.tsx
import { cacheLife } from 'next/cache'
import { getProducts } from '@/lib/products'

export async function ProductList() {
  'use cache'
  cacheLife('hours')

  const products = await getProducts()

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>{product.name} — {product.price} ₽</li>
      ))}
    </ul>
  )
}
```

Компонент целиком попадает в статическую оболочку и отдаётся без серверного рендера при каждом запросе.

## Suspense как граница статики и динамики

`<Suspense>` определяет точку разрыва между статической оболочкой и стримящимся динамическим контентом. Всё, что находится внутри `<Suspense>` и не кешируется — рендерится динамически.

### Пример: страница магазина

Рассмотрим страницу товара в интернет-магазине. Каталог и описание товара можно кешировать. Корзина и персональные рекомендации зависят от пользователя — они должны быть динамическими.

```tsx
// app/products/[id]/page.tsx
import { Suspense } from 'react'
import { ProductDetail } from '@/components/ProductDetail'
import { UserCart } from '@/components/UserCart'
import { Recommendations } from '@/components/Recommendations'

export default function ProductPage({ params }) {
  return (
    <main>
      {/* Статическая оболочка — кешированный компонент */}
      <ProductDetail id={params.id} />

      {/* Динамическая секция — корзина пользователя */}
      <Suspense fallback={<CartSkeleton />}>
        <UserCart />
      </Suspense>

      {/* Динамическая секция — персональные рекомендации */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations userId={params.id} />
      </Suspense>
    </main>
  )
}
```

```tsx
// app/components/ProductDetail.tsx
import { cacheLife } from 'next/cache'

async function fetchProduct(id: string) {
  'use cache'
  cacheLife('days')
  const res = await fetch(`https://api.example.com/products/${id}`)
  return res.json()
}

export async function ProductDetail({ id }: { id: string }) {
  const product = await fetchProduct(id)

  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <span>{product.price} ₽</span>
    </article>
  )
}
```

```tsx
// app/components/UserCart.tsx
import { cookies } from 'next/headers'

export async function UserCart() {
  // cookies() — Runtime API, компонент автоматически динамический
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session_id')?.value

  if (!sessionId) {
    return <p>Корзина пуста</p>
  }

  const res = await fetch(`https://api.example.com/cart/${sessionId}`)
  const cart = await res.json()

  return (
    <aside>
      <h2>Корзина ({cart.items.length})</h2>
      <ul>
        {cart.items.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </aside>
  )
}
```

При запросе страницы браузер немедленно получает HTML с деталями товара и скелетонами корзины и рекомендаций. Пока сервер обращается к API за персональными данными, пользователь уже читает описание товара. Динамические секции добавляются в поток HTML по готовности.

## Runtime API и динамический рендеринг

Компоненты, обращающиеся к Runtime API, автоматически становятся динамическими при включённом `cacheComponents`. Сюда входят:

- `cookies()` — куки пользователя;
- `headers()` — заголовки запроса;
- `searchParams` — параметры строки запроса;
- `params` — параметры динамического маршрута (если не предоставлены через `generateStaticParams`).

Такие компоненты следует оборачивать в `<Suspense>`, чтобы они не блокировали статическую оболочку.

```tsx
// app/search/page.tsx
import { Suspense } from 'react'
import { SearchResults } from '@/components/SearchResults'

export default function SearchPage({ searchParams }) {
  return (
    <main>
      <h1>Результаты поиска</h1>
      <Suspense fallback={<ResultsSkeleton />}>
        <SearchResults query={searchParams.q} />
      </Suspense>
    </main>
  )
}
```

```tsx
// app/components/SearchResults.tsx
interface Props {
  query: string
}

export async function SearchResults({ query }: Props) {
  const res = await fetch(`https://api.example.com/search?q=${query}`)
  const data = await res.json()

  return (
    <ul>
      {data.results.map((item) => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  )
}
```

Заголовок «Результаты поиска» часть статической оболочки — отображается мгновенно. Сам список ждёт ответа API и добавляется позднее.

## Инвалидация кеша

С `use cache` работает гранулярная инвалидация через теги. Можно пометить кешированные данные тегом и сбросить только нужную часть кеша, не затрагивая остальной контент.

```ts
// app/lib/posts.ts
import { cacheLife, cacheTag } from 'next/cache'

export async function getPosts() {
  'use cache'
  cacheLife('hours')
  cacheTag('posts')  // маркируем кеш тегом

  const res = await fetch('https://api.example.com/posts')
  return res.json()
}
```

```ts
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { tag } = await request.json()
  revalidateTag(tag)
  return Response.json({ revalidated: true })
}
```

При вызове `revalidateTag('posts')` Next.js пересчитает только те части страницы, которые зависят от данных с тегом `posts`. Остальная статическая оболочка остаётся нетронутой.

## Скелетоны как часть UX

Fallback в `<Suspense>` — это не просто индикатор загрузки. Он часть статической оболочки, отдаётся мгновенно вместе с остальным статическим контентом и формирует ожидаемый макет страницы. Качественный скелетон снижает восприятие задержки.

```tsx
// app/components/CartSkeleton.tsx
export function CartSkeleton() {
  return (
    <aside className="animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-1/2 bg-gray-200 rounded" />
    </aside>
  )
}
```

Пользователь мгновенно видит форму корзины, даже до того, как её содержимое загружено с сервера.

## Независимые Suspense-границы

Несколько `<Suspense>`-границ на одной странице разрешаются независимо. Если корзина загружается быстро, а рекомендации медленно — корзина появится сразу, не ожидая рекомендаций.

```tsx
export default function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Три независимых потока — каждый стримится сам по себе */}
      <Suspense fallback={<StatsSkeleton />}>
        <SalesStats />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <RevenueChart />
      </Suspense>

      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  )
}
```

Каждая панель дашборда стримится независимо. Пользователь видит данные по мере их готовности, а не ждёт самого медленного запроса.

## История развития PPR

PPR появился как экспериментальная функция в Next.js 14 и прошёл несколько итераций:

| Версия | Конфигурация | Особенности |
|--------|-------------|-------------|
| Next.js 14 | `experimental: { ppr: true }` | Только для всего приложения |
| Next.js 15 | `experimental: { ppr: 'incremental' }` + `export const experimental_ppr = true` | Включение на уровне маршрута |
| Next.js 16 | `cacheComponents: true` | Новая модель, `experimental_ppr` удалён |

В Next.js 16 PPR переработан и стал частью унифицированной модели кеширования. Если вы переходите с Next.js 15 и использовали `experimental.ppr`, рекомендуется оставаться на текущей версии Next.js 15 или изучить руководство по миграции на Cache Components.

## Преимущества PPR

**Скорость восприятия (perceived performance).** Пользователь видит контент немедленно. Статическая оболочка отображается за миллисекунды, динамический контент появляется без перезагрузки страницы.

**Экономия ресурсов сервера.** Статические части не рендерятся повторно при каждом запросе. Сервер выполняет только динамическую работу.

**Гибкость кеширования.** Каждая функция или компонент кешируется независимо. Изменение одного продукта инвалидирует только его данные, не затрагивая весь сайт.

**Нет компромисса между статикой и динамикой.** Страница с персонализированным контентом больше не обязана полностью жертвовать CDN-кешированием ради одного динамического блока.

## Когда использовать PPR

PPR особенно эффективен для страниц, где есть смешанный контент:

- Страницы товаров: описание из кеша, корзина и рекомендации динамически;
- Дашборды: закешированные метрики, живые показатели через Suspense;
- Новостные сайты: статьи из кеша, комментарии и реакции динамически;
- Страницы профиля: публичные данные в статике, личная информация динамически.

Если страница полностью статическая — PPR не нужен, достаточно обычного статического рендеринга. Если страница полностью динамическая с уникальным контентом для каждого запроса — PPR также не даст преимуществ.

## Итог

Partial Prerendering — это фундаментальный сдвиг в модели рендеринга: от выбора «статика или динамика для маршрута» к гранулярному контролю на уровне компонентов. В Next.js 16 механизм PPR объединён с директивой `use cache` и `cacheComponents`, что делает статическую оболочку и динамический стриминг частью единого подхода к рендерингу.

Для освоения Next.js с нуля до продвинутого уровня, включая PPR, серверные компоненты и современные паттерны кеширования, рекомендуем курс PurpleSchool: https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=ppr

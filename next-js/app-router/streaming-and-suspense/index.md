---
metaTitle: "Streaming и Suspense в Next.js App Router"
metaDescription: "Как использовать Streaming и React Suspense в Next.js App Router: пошаговые примеры, loading.tsx, обработка ошибок и best practices."
author: "Антон Ларичев"
title: "Streaming и Suspense в Next.js"
preview: "Разбираем, как Streaming и Suspense ускоряют загрузку страниц в Next.js App Router и как правильно их применять."
---

## Что такое Streaming и зачем он нужен

В традиционном SSR (Server-Side Rendering) сервер должен полностью сформировать HTML-страницу, прежде чем отправить её клиенту. Если какой-то компонент требует медленного запроса к базе данных или внешнему API, пользователь вынужден ждать полной загрузки страницы, глядя на пустой экран.

Streaming решает эту проблему: сервер начинает отправлять HTML поэтапно, по мере готовности отдельных частей страницы. Браузер получает и отображает первые фрагменты немедленно, пока остальные данные ещё загружаются.

Next.js App Router поддерживает Streaming из коробки, опираясь на два механизма:
- React Suspense — декларативная граница ожидания для асинхронных компонентов
- HTTP Streaming — отправка ответа частями через Transfer-Encoding: chunked

## Как работает Suspense

`Suspense` — это компонент React, который принимает prop `fallback`. Пока дочерние компоненты ожидают данных (находятся в состоянии ожидания), отображается `fallback`. Когда данные готовы, React заменяет fallback на реальный контент.

```typescript
import { Suspense } from 'react'
import UserProfile from './UserProfile'
import UserSkeleton from './UserSkeleton'

export default function ProfilePage() {
  return (
    <main>
      <h1>Профиль пользователя</h1>
      <Suspense fallback={<UserSkeleton />}>
        <UserProfile />
      </Suspense>
    </main>
  )
}
```

В этом примере `UserProfile` — асинхронный серверный компонент, который делает запрос к базе данных. Пока запрос выполняется, пользователь видит `UserSkeleton` — компонент-заглушку в виде скелетона.

## Асинхронные серверные компоненты

В App Router серверные компоненты могут быть асинхронными. Это ключевое условие для работы Streaming: компонент «подвешивается» (suspends), пока `await` не завершится.

```typescript
// app/dashboard/UserProfile.tsx
async function getUserData(userId: string) {
  const response = await fetch(`https://api.example.com/users/${userId}`, {
    cache: 'no-store'
  })
  return response.json()
}

export default async function UserProfile({ userId }: { userId: string }) {
  const user = await getUserData(userId)

  return (
    <div className="profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <p>Зарегистрирован: {new Date(user.createdAt).toLocaleDateString('ru-RU')}</p>
    </div>
  )
}
```

Next.js автоматически обнаруживает, что компонент асинхронный, и стримит его содержимое, как только данные станут доступны.

## Файл loading.tsx — автоматический Suspense

Next.js предоставляет встроенный способ задать fallback для целой страницы — специальный файл `loading.tsx`. Он автоматически оборачивает содержимое маршрута в `<Suspense>`.

```
app/
  dashboard/
    loading.tsx    ← автоматический fallback для всего сегмента
    page.tsx
    UserProfile.tsx
```

```typescript
// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="loading-container">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" />
    </div>
  )
}
```

Этот подход хорош для простых случаев, но не даёт гибкости: весь сегмент показывает один индикатор загрузки. Для более тонкого контроля используйте `Suspense` напрямую.

## Гранулярный Streaming с несколькими границами Suspense

Настоящая сила Streaming раскрывается, когда страница разделена на независимые части, каждая из которых загружается в своём темпе.

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react'
import RecentOrders from './RecentOrders'
import UserStats from './UserStats'
import Recommendations from './Recommendations'
import { OrdersSkeleton, StatsSkeleton, RecommendationsSkeleton } from './skeletons'

export default function DashboardPage() {
  return (
    <div className="dashboard">
      <h1>Дашборд</h1>

      <Suspense fallback={<StatsSkeleton />}>
        <UserStats />
      </Suspense>

      <div className="dashboard-grid">
        <Suspense fallback={<OrdersSkeleton />}>
          <RecentOrders />
        </Suspense>

        <Suspense fallback={<RecommendationsSkeleton />}>
          <Recommendations />
        </Suspense>
      </div>
    </div>
  )
}
```

```typescript
// app/dashboard/UserStats.tsx
async function fetchStats() {
  const res = await fetch('https://api.example.com/stats', { cache: 'no-store' })
  return res.json()
}

export default async function UserStats() {
  const stats = await fetchStats()

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <span className="stat-value">{stats.totalOrders}</span>
        <span className="stat-label">Заказов</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{stats.totalRevenue} ₽</span>
        <span className="stat-label">Выручка</span>
      </div>
    </div>
  )
}
```

```typescript
// app/dashboard/RecentOrders.tsx
async function fetchRecentOrders() {
  const res = await fetch('https://api.example.com/orders/recent', {
    cache: 'no-store'
  })
  return res.json()
}

export default async function RecentOrders() {
  const orders = await fetchRecentOrders()

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Товар</th>
          <th>Сумма</th>
          <th>Статус</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order: any) => (
          <tr key={order.id}>
            <td>#{order.id}</td>
            <td>{order.productName}</td>
            <td>{order.amount} ₽</td>
            <td>{order.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

Теперь каждый блок дашборда отображается независимо: пользователь видит статистику сразу, как только она загрузится, не дожидаясь заказов и рекомендаций.

## Параллельная загрузка данных

Частая ошибка — последовательные `await` внутри одного компонента, которые создают «водопад» запросов (waterfall). Каждый запрос ждёт завершения предыдущего.

```typescript
// Плохо: последовательные запросы
export default async function UserDashboard({ userId }: { userId: string }) {
  const user = await fetchUser(userId)      // ждём...
  const orders = await fetchOrders(userId)  // ...потом ждём ещё
  const stats = await fetchStats(userId)    // ...и ещё раз

  return <div>...</div>
}
```

Решение — `Promise.all` для параллельного выполнения независимых запросов:

```typescript
// Хорошо: параллельные запросы
export default async function UserDashboard({ userId }: { userId: string }) {
  const [user, orders, stats] = await Promise.all([
    fetchUser(userId),
    fetchOrders(userId),
    fetchStats(userId)
  ])

  return (
    <div>
      <h2>{user.name}</h2>
      <p>Заказов: {orders.length}</p>
      <p>Выручка: {stats.revenue} ₽</p>
    </div>
  )
}
```

Если запросы зависят друг от друга, разбейте компонент на части и используйте несколько границ Suspense. Каждая часть получает только те данные, которые ей нужны, и не блокирует остальных.

## Обработка ошибок с error.tsx

Когда асинхронный компонент выбрасывает ошибку, её перехватывает ближайшая граница ошибки. В App Router это файл `error.tsx`.

```
app/
  dashboard/
    error.tsx    ← граница ошибки для сегмента
    loading.tsx
    page.tsx
```

```typescript
// app/dashboard/error.tsx
'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="error-container">
      <h2>Что-то пошло не так</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Попробовать снова</button>
    </div>
  )
}
```

`error.tsx` должен быть клиентским компонентом (`'use client'`), потому что он получает объект ошибки и функцию `reset` как props от React.

### Изолирование ошибок через вложенные границы

Чтобы ошибка в одном блоке не ломала остальную страницу, создайте компонент-обёртку, совмещающий Suspense и ErrorBoundary:

```typescript
// components/SafeSection.tsx
'use client'

import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

interface SafeSectionProps {
  children: React.ReactNode
  fallback: React.ReactNode
  errorFallback?: React.ReactNode
}

export default function SafeSection({
  children,
  fallback,
  errorFallback
}: SafeSectionProps) {
  return (
    <ErrorBoundary
      fallback={<>{errorFallback || <p>Не удалось загрузить данные</p>}</>}
    >
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}
```

```typescript
// app/dashboard/page.tsx
import SafeSection from '@/components/SafeSection'
import RecentOrders from './RecentOrders'
import { OrdersSkeleton } from './skeletons'

export default function DashboardPage() {
  return (
    <SafeSection
      fallback={<OrdersSkeleton />}
      errorFallback={<p>Не удалось загрузить заказы. Попробуйте позже.</p>}
    >
      <RecentOrders />
    </SafeSection>
  )
}
```

## Паттерн с use() и передачей Promise

В React 19 появился хук `use()`, который позволяет ожидать Promise прямо внутри клиентского компонента. Этот паттерн удобен, когда серверный компонент-страница инициирует загрузку, а клиентский компонент её потребляет.

```typescript
// app/products/page.tsx
import { Suspense } from 'react'
import ProductList from './ProductList'

async function getProducts() {
  const res = await fetch('https://api.example.com/products', {
    cache: 'no-store'
  })
  return res.json()
}

export default function ProductsPage() {
  // Запускаем загрузку, но не ждём результата
  const productsPromise = getProducts()

  return (
    <Suspense fallback={<p>Загрузка товаров...</p>}>
      <ProductList productsPromise={productsPromise} />
    </Suspense>
  )
}
```

```typescript
// app/products/ProductList.tsx
'use client'

import { use } from 'react'

interface Product {
  id: number
  name: string
  price: number
}

interface ProductListProps {
  productsPromise: Promise<Product[]>
}

export default function ProductList({ productsPromise }: ProductListProps) {
  // use() приостанавливает рендер до готовности данных
  const products = use(productsPromise)

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          {product.name} — {product.price} ₽
        </li>
      ))}
    </ul>
  )
}
```

## generateMetadata и дедупликация запросов

Функция `generateMetadata` выполняется до начала стриминга: Next.js ждёт её завершения, чтобы сформировать `<head>`. Если компонент страницы обращается к тем же данным, используйте `cache()` из React для дедупликации — один и тот же fetch не выполнится дважды.

```typescript
// lib/products.ts
import { cache } from 'react'

export const getProduct = cache(async (id: string) => {
  const res = await fetch(`https://api.example.com/products/${id}`)
  return res.json()
})
```

```typescript
// app/products/[id]/page.tsx
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getProduct } from '@/lib/products'
import ProductDetails from './ProductDetails'
import ProductSkeleton from './ProductSkeleton'

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProduct(params.id)
  return { title: product.name, description: product.description }
}

export default function ProductPage({ params }: PageProps) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetails productId={params.id} />
    </Suspense>
  )
}
```

```typescript
// app/products/[id]/ProductDetails.tsx
import { getProduct } from '@/lib/products'

export default async function ProductDetails({ productId }: { productId: string }) {
  // cache() гарантирует, что реального запроса не будет — данные уже в кэше
  const product = await getProduct(productId)

  return (
    <article>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p className="price">{product.price} ₽</p>
    </article>
  )
}
```

## Практические рекомендации

### Где размещать границы Suspense

Размещайте `Suspense` максимально близко к компонентам, которые загружают данные. Не оборачивайте всю страницу в один Suspense — пользователь получит тот же опыт, что при обычном SSR.

```typescript
// Плохо: один большой Suspense блокирует всё
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Header />         {/* статичный */}
      <SlowComponent />  {/* медленный */}
      <Footer />         {/* статичный */}
    </Suspense>
  )
}

// Хорошо: точечный Suspense только там, где нужно
export default function Page() {
  return (
    <>
      <Header />
      <Suspense fallback={<ComponentSkeleton />}>
        <SlowComponent />
      </Suspense>
      <Footer />
    </>
  )
}
```

### Качественные fallback-компоненты

Хороший fallback сохраняет layout страницы, предотвращая скачки контента (layout shift). Используйте скелетоны, повторяющие форму реального контента:

```typescript
// components/skeletons/StatsSkeleton.tsx
export default function StatsSkeleton() {
  return (
    <div className="stats-grid" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="stat-card skeleton">
          <div className="skeleton-value" />
          <div className="skeleton-label" />
        </div>
      ))}
    </div>
  )
}
```

```css
.skeleton-value {
  height: 2rem;
  width: 60%;
  background: #e5e7eb;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  animation: pulse 1.5s ease-in-out infinite;
}

.skeleton-label {
  height: 1rem;
  width: 40%;
  background: #e5e7eb;
  border-radius: 4px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Не злоупотребляйте 'use client'

Каждый клиентский компонент исключается из серверного стриминга. Держите большинство компонентов серверными и добавляйте `'use client'` только туда, где нужны интерактивность, хуки состояния или браузерные API.

### Проверка Streaming в DevTools

Для проверки откройте DevTools браузера на вкладке Network, найдите запрос страницы и убедитесь, что ответ приходит несколькими чанками. В Chrome это видно на вкладке Timing: сервер присылает HTML поэтапно, а не единым блоком.

Для проверки в разработке добавьте искусственную задержку:

```typescript
// только для разработки
export default async function SlowComponent() {
  await new Promise(resolve => setTimeout(resolve, 2000))
  const data = await fetchData()
  return <div>{data.value}</div>
}
```

Это поможет убедиться, что Suspense-fallback отображается корректно, не дожидаясь реально медленных данных в продакшене.

---

Полноценно освоить Next.js App Router, серверные компоненты и продвинутые паттерны стриминга можно на курсе [Next.js от PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=streaming-suspense).
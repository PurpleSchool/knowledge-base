---
metaTitle: React Suspense — приостановка рендера и отложенная загрузка
metaDescription: Полное руководство по React Suspense — как использовать границы ожидания для code splitting, data fetching, стриминга в Next.js App Router и вложенных границ Suspense.
author: Олег Марков
title: React Suspense — приостановка рендера
preview: Разбираем React Suspense от основ до продвинутых паттернов — code splitting с React.lazy, границы ожидания, data fetching, вложенные Suspense-границы и стриминг SSR в Next.js App Router.
---

## Введение

React Suspense — это механизм, позволяющий компоненту «приостановить» рендер и показать резервный UI (fallback) до тех пор, пока не выполнится какое-либо асинхронное условие. Изначально Suspense появился в React 16.6 как инструмент исключительно для отложенной загрузки (code splitting) через `React.lazy`. В React 18 возможности Suspense значительно расширились: теперь он поддерживает data fetching и серверный стриминг.

В этой статье вы узнаете:

- Что такое Suspense и как он устроен внутри
- Как использовать `React.lazy` для code splitting
- Как работает data fetching с Suspense
- Что такое границы Suspense и как их вкладывать
- Как Suspense работает в Next.js App Router для стриминга

## Что такое Suspense

**Suspense** — это компонент React, который перехватывает «брошенный» промис от дочерних компонентов и отображает резервный UI (fallback) до его разрешения.

Базовый синтаксис выглядит так:

```tsx
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <SomeAsyncComponent />
    </Suspense>
  );
}
```

Когда `SomeAsyncComponent` «приостанавливается» (suspend), React:
1. Прерывает рендер дерева компонентов внутри `<Suspense>`
2. Отображает содержимое `fallback`
3. Когда промис разрешается — повторяет рендер дочерних компонентов

### Как Suspense работает внутри

Механизм Suspense основан на том, что компонент может «бросить» (throw) промис вместо того, чтобы вернуть JSX. React перехватывает это исключение, ищет ближайший `<Suspense>` в дереве и показывает его fallback.

```tsx
// Упрощённая схема внутреннего механизма
function SuspendingComponent() {
  const data = cache.read(); // бросает промис, если данные ещё не готовы
  return <div>{data}</div>;
}
```

> Важно: вы не должны бросать промисы вручную в компонентах. Этим занимаются специальные библиотеки (React Query, SWR, Relay) или механизмы Next.js.

## Code Splitting с React.lazy

Первое и наиболее распространённое применение Suspense — **code splitting** с `React.lazy`. Это позволяет разбить бандл на части и загружать компоненты лазиво (только тогда, когда они нужны).

### Базовый пример

```tsx
import { lazy, Suspense } from 'react';

// Динамический импорт — компонент загружается лениво
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <div>
      <h1>Дашборд</h1>
      <Suspense fallback={<div>Загрузка графика...</div>}>
        <HeavyChart />
      </Suspense>
    </div>
  );
}
```

Когда `Dashboard` рендерится впервые, `HeavyChart` ещё не загружен — React показывает fallback. Когда чанк загружен — показывается настоящий компонент.

### Ленивая загрузка на основе роутов

Самый распространённый паттерн — разбивать код по страницам/роутам:

```tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="spinner" />
      <span>Загрузка страницы...</span>
    </div>
  );
}
```

### Named exports с React.lazy

`React.lazy` ожидает, что импортируемый модуль экспортирует компонент по умолчанию (`default export`). Если у вас `named export`, оберните его:

```tsx
// Если компонент экспортирован не по умолчанию:
// export function MyComponent() { ... }

const MyComponent = lazy(() =>
  import('./MyComponent').then((module) => ({
    default: module.MyComponent,
  }))
);
```

## Границы Suspense (Suspense Boundaries)

**Граница Suspense** — это место в дереве компонентов, где React «поймает» приостановленный дочерний компонент и покажет fallback. Это аналогия с `ErrorBoundary` (который ловит ошибки), только для асинхронных состояний.

### Размещение границы

Где вы разместите `<Suspense>`, там и будет показан fallback:

```tsx
function ProductPage({ productId }: { productId: string }) {
  return (
    <div>
      <h1>Страница товара</h1>

      {/* Граница для основной информации о товаре */}
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetails productId={productId} />
      </Suspense>

      {/* Граница для связанных товаров — независимо от основной */}
      <Suspense fallback={<RelatedSkeleton />}>
        <RelatedProducts productId={productId} />
      </Suspense>
    </div>
  );
}
```

Здесь `ProductDetails` и `RelatedProducts` загружаются независимо. Когда один компонент готов — он показывается, не дожидаясь другого.

### Один fallback на несколько компонентов

Если нужно показать один fallback на всё дерево, оберните его в одну границу:

```tsx
function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      {/* Все три компонента покажут один общий fallback */}
      <CartItems />
      <DeliveryOptions />
      <PaymentForm />
    </Suspense>
  );
}
```

## Вложенные границы Suspense

Вложенные границы Suspense позволяют управлять гранулярностью загрузки: показывать UI постепенно, по мере готовности отдельных частей.

### Пример с вложенными границами

```tsx
function ArticlePage({ articleId }: { articleId: string }) {
  return (
    <div className="article-layout">
      {/* Внешняя граница — показывает fallback, пока не загрузится шапка */}
      <Suspense fallback={<HeaderSkeleton />}>
        <ArticleHeader articleId={articleId} />

        {/* Внутренняя граница — загружается независимо */}
        <Suspense fallback={<ContentSkeleton />}>
          <ArticleContent articleId={articleId} />

          {/* Самая внутренняя граница — комментарии */}
          <Suspense fallback={<div>Загрузка комментариев...</div>}>
            <CommentsSection articleId={articleId} />
          </Suspense>
        </Suspense>
      </Suspense>
    </div>
  );
}
```

В этом примере:
1. Сначала показывается `<HeaderSkeleton />` для всего блока
2. Когда `ArticleHeader` готов — он появляется; для остального показывается `<ContentSkeleton />`
3. Когда `ArticleContent` готов — он появляется; комментарии всё ещё загружаются
4. Когда `CommentsSection` готов — всё дерево полностью отрендерено

### SuspenseList для упорядочивания (экспериментально)

В React есть экспериментальный компонент `SuspenseList`, который позволяет управлять порядком появления вложенных Suspense-границ:

```tsx
import { SuspenseList, Suspense } from 'react';

function FeedPage() {
  return (
    // revealOrder: forwards — показывать в порядке сверху вниз
    <SuspenseList revealOrder="forwards" tail="collapsed">
      <Suspense fallback={<PostSkeleton />}>
        <Post id={1} />
      </Suspense>
      <Suspense fallback={<PostSkeleton />}>
        <Post id={2} />
      </Suspense>
      <Suspense fallback={<PostSkeleton />}>
        <Post id={3} />
      </Suspense>
    </SuspenseList>
  );
}
```

Параметр `revealOrder` может принимать:
- `"forwards"` — показывать компоненты строго сверху вниз
- `"backwards"` — показывать снизу вверх
- `"together"` — показывать все одновременно, когда все готовы

`tail="collapsed"` означает, что одновременно показывается только один `fallback` для ещё не загрузившихся элементов.

## Data Fetching с Suspense

React Suspense может интегрироваться с библиотеками для получения данных. Важно: сам по себе React не предоставляет способа «суспендить» компонент при fetch — это делают библиотеки.

### Интеграция с React Query (TanStack Query)

React Query поддерживает Suspense через специальный хук `useSuspenseQuery`:

```tsx
import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';

// Компонент, использующий useSuspenseQuery
function UserProfile({ userId }: { userId: string }) {
  // Этот хук «суспендит» компонент до загрузки данных
  const { data: user } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // Если мы дошли сюда — данные гарантированно есть
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

// Оборачиваем в Suspense там, где используем компонент
function App() {
  return (
    <Suspense fallback={<UserSkeleton />}>
      <UserProfile userId="123" />
    </Suspense>
  );
}
```

### Интеграция с SWR

SWR также поддерживает режим Suspense:

```tsx
import useSWR from 'swr';
import { Suspense } from 'react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function ProductInfo({ productId }: { productId: string }) {
  // suspense: true включает режим Suspense
  const { data } = useSWR(`/api/products/${productId}`, fetcher, {
    suspense: true,
  });

  return (
    <div>
      <h3>{data.name}</h3>
      <p>{data.price} ₽</p>
    </div>
  );
}

function ProductPage({ productId }: { productId: string }) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductInfo productId={productId} />
    </Suspense>
  );
}
```

### use() API в React 19

React 19 добавил хук `use()`, который позволяет читать промисы прямо в компонентах и автоматически интегрируется с Suspense:

```tsx
import { use, Suspense } from 'react';

// Промис создаётся вне компонента (например, в Server Component)
async function fetchPost(id: string) {
  const res = await fetch(`/api/posts/${id}`);
  return res.json();
}

// Клиентский компонент использует use() для чтения промиса
function PostContent({ postPromise }: { postPromise: Promise<Post> }) {
  const post = use(postPromise); // суспендирует компонент до разрешения промиса
  return <article>{post.content}</article>;
}

function PostPage({ id }: { id: string }) {
  const postPromise = fetchPost(id);

  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <PostContent postPromise={postPromise} />
    </Suspense>
  );
}
```

## Suspense и обработка ошибок

При работе с Suspense важно также обрабатывать ошибки. Для этого используется `ErrorBoundary`:

```tsx
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function DataSection() {
  return (
    <ErrorBoundary
      fallback={<div>Ошибка загрузки данных. Попробуйте обновить страницу.</div>}
    >
      <Suspense fallback={<DataSkeleton />}>
        <DataComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

Правильный порядок: `ErrorBoundary` снаружи, `Suspense` внутри. Так ошибки сети или API будут перехвачены `ErrorBoundary`, а состояние загрузки — `Suspense`.

## Стриминг в Next.js с Suspense (App Router)

Одно из главных применений Suspense в Next.js App Router — **HTTP-стриминг**. Это позволяет отправлять части страницы клиенту по мере их готовности, не дожидаясь полного рендера на сервере.

### Как работает стриминг

Без стриминга:
1. Сервер ждёт все данные
2. Рендерит полный HTML
3. Отправляет всё клиенту сразу

Со стримингом (Suspense):
1. Сервер сразу отправляет «оболочку» страницы (HTML без ожидаемых данных)
2. Клиент видит страницу с `loading.tsx` (или Suspense fallback)
3. Когда данные готовы — сервер «досылает» их чанками
4. React на клиенте встраивает их в уже отображённую страницу

### loading.tsx в App Router

Next.js App Router предоставляет специальный файл `loading.tsx`, который автоматически оборачивает страницу в `<Suspense>`:

```tsx
// app/products/loading.tsx
export default function ProductsLoading() {
  return (
    <div className="products-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// app/products/page.tsx — выполняется параллельно с отображением loading.tsx
export default async function ProductsPage() {
  // Долгий запрос к базе данных
  const products = await db.product.findMany({ take: 20 });

  return (
    <div className="products-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Ручной Suspense для стриминга в App Router

Для более тонкого управления стримингом используйте `<Suspense>` напрямую в Server Components:

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';

// Компоненты, которые делают асинхронные запросы
async function RevenueChart() {
  const revenue = await getRevenue(); // ~1 секунда
  return <Chart data={revenue} />;
}

async function LatestInvoices() {
  const invoices = await getLatestInvoices(); // ~2 секунды
  return <InvoiceList invoices={invoices} />;
}

async function StatsCards() {
  const stats = await getCardData(); // ~0.5 секунды
  return <Cards data={stats} />;
}

// Страница рендерится немедленно, компоненты стримятся по мере готовности
export default function DashboardPage() {
  return (
    <main>
      <h1>Дашборд</h1>

      {/* Карточки — самые быстрые, появятся первыми */}
      <Suspense fallback={<CardsSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* Остальные компоненты загружаются независимо */}
      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart />
        </Suspense>

        <Suspense fallback={<InvoicesSkeleton />}>
          <LatestInvoices />
        </Suspense>
      </div>
    </main>
  );
}
```

В этом примере клиент сразу видит структуру страницы с skeleton-заглушками. Когда каждый компонент завершает свой запрос, он «вставляется» в страницу без перезагрузки.

### Параллельные запросы данных

Чтобы запросы выполнялись параллельно (а не последовательно), инициируйте промисы до первого `await`:

```tsx
// app/user/[id]/page.tsx
async function UserPage({ params }: { params: { id: string } }) {
  // Запускаем оба запроса параллельно
  const userPromise = getUser(params.id);
  const postsPromise = getUserPosts(params.id);

  // Ждём оба результата
  const [user, posts] = await Promise.all([userPromise, postsPromise]);

  return (
    <div>
      <UserCard user={user} />
      <PostList posts={posts} />
    </div>
  );
}
```

Или с Suspense для независимых секций:

```tsx
import { Suspense } from 'react';

async function UserInfo({ userId }: { userId: string }) {
  const user = await getUser(userId);
  return <UserCard user={user} />;
}

async function UserPosts({ userId }: { userId: string }) {
  const posts = await getUserPosts(userId);
  return <PostList posts={posts} />;
}

// Оба компонента загружают данные параллельно
export default function UserPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <Suspense fallback={<UserSkeleton />}>
        <UserInfo userId={params.id} />
      </Suspense>

      <Suspense fallback={<PostsSkeleton />}>
        <UserPosts userId={params.id} />
      </Suspense>
    </div>
  );
}
```

## Skeleton-компоненты как fallback

Хорошая практика — использовать skeleton-компоненты (заглушки в форме контента) вместо простого спиннера:

```tsx
// components/skeletons/ProductCardSkeleton.tsx
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border p-4">
      <div className="mb-4 h-48 rounded-md bg-gray-200" />
      <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
      <div className="mb-4 h-4 w-1/2 rounded bg-gray-200" />
      <div className="h-8 w-full rounded bg-gray-200" />
    </div>
  );
}

// Использование
function ProductsSection() {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <ProductGrid />
    </Suspense>
  );
}
```

## Когда использовать Suspense

**Используйте Suspense для:**

- **Code splitting** с `React.lazy` — разбивайте бандл по роутам и компонентам
- **Data fetching в Server Components** (Next.js App Router) — стриминг серверно-рендеренных данных
- **Data fetching с поддерживающими библиотеками** — React Query (`useSuspenseQuery`), SWR (`{ suspense: true }`)
- **Постепенного раскрытия UI** — показывайте части страницы по мере загрузки

**Не используйте Suspense для:**

- **Обычного useEffect + fetch** — обычный `fetch` в `useEffect` не интегрируется с Suspense
- **Обработки ошибок** — для ошибок используйте `ErrorBoundary` вместе с Suspense
- **Условного рендеринга** — Suspense не заменяет условные проверки `if (!data) return null`

## Лучшие практики

**1. Размещайте границы как можно ближе к данным**

```tsx
// Хорошо: отдельные границы для независимых секций
function Page() {
  return (
    <>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>
      <Suspense fallback={<ContentSkeleton />}>
        <MainContent />
      </Suspense>
    </>
  );
}

// Плохо: одна граница на всё — показывает skeleton пока грузится самая медленная часть
function Page() {
  return (
    <Suspense fallback={<FullPageSkeleton />}>
      <Header />
      <MainContent />
    </Suspense>
  );
}
```

**2. Всегда добавляйте ErrorBoundary рядом с Suspense**

```tsx
function SafeSection({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<Skeleton />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
```

**3. Используйте осмысленные fallback-компоненты**

Skeleton > спиннер > текст «Загрузка...» — чем ближе fallback к финальному UI, тем лучше воспринимается загрузка.

**4. Начинайте промисы как можно раньше**

В Server Components инициируйте запросы до первого `await`, чтобы они выполнялись параллельно.

## Итог

React Suspense — мощный инструмент для управления асинхронным рендером:

- **`React.lazy` + `Suspense`** — стандартный способ code splitting. Разбивайте бандл по роутам и тяжёлым компонентам.
- **Границы Suspense** аналогичны `try/catch` для асинхронных состояний: они изолируют «подвисшие» компоненты от остального UI.
- **Вложенные границы** дают тонкий контроль над постепенным раскрытием интерфейса.
- **Data fetching с Suspense** работает через библиотеки (React Query, SWR) или нативный `use()` в React 19.
- **Стриминг в Next.js App Router** — главное применение Suspense в современном React. Через `loading.tsx` или явные `<Suspense>` в Server Components вы можете начать показывать страницу клиенту ещё до загрузки всех данных.
- Всегда используйте **`ErrorBoundary` вместе с `Suspense`** для обработки ошибок сети.

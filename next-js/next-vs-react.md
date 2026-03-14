---
metaTitle: Next.js vs React — в чём разница между фреймворком и библиотекой
metaDescription: Подробное сравнение Next.js и React. Разбираем, что такое React как библиотека, что добавляет Next.js (SSR, SSG, роутинг, API routes), и как выбрать правильный инструмент для вашего проекта
author: Олег Марков
title: Next.js vs React — в чём разница
preview: Разбираемся, чем отличается Next.js от React, зачем нужен фреймворк поверх библиотеки, как работают серверный рендеринг и статическая генерация, и когда стоит выбрать каждый инструмент
---

## Введение

Когда начинающие разработчики впервые сталкиваются с экосистемой React, они нередко путаются: есть React, есть Next.js, и оба используются для создания веб-приложений. В чём же разница? Почему одни проекты используют «чистый» React, а другие — Next.js?

Короткий ответ: **React — это библиотека для построения UI, а Next.js — полноценный фреймворк поверх React**, который добавляет серверный рендеринг, роутинг, оптимизацию изображений, API-маршруты и многое другое.

В этой статье вы узнаете:
- Что такое React и чем он ограничен как библиотека
- Что именно добавляет Next.js поверх React
- Как работают SSR, SSG и другие режимы рендеринга
- Когда использовать React без фреймворка, а когда — Next.js
- Как выглядит один и тот же функционал в React и Next.js

## React: мощная библиотека с ограниченной областью ответственности

React — это JavaScript-библиотека для построения пользовательских интерфейсов, разработанная Meta (Facebook). Ключевое слово здесь — **библиотека**, а не фреймворк.

### Что умеет React

React решает одну задачу, но делает это исключительно хорошо: **декларативное описание UI через компоненты**.

```javascript
// React отвечает за то, как выглядит и ведёт себя UI
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Счётчик: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Увеличить
      </button>
    </div>
  )
}
```

Основные возможности React:
- **Компонентная архитектура** — UI разбивается на независимые переиспользуемые компоненты
- **Virtual DOM** — эффективное обновление реального DOM через сравнение виртуальных деревьев
- **Хуки** — управление состоянием и побочными эффектами (`useState`, `useEffect`, `useContext` и др.)
- **JSX** — синтаксический сахар для описания UI в виде HTML-подобных конструкций
- **Однонаправленный поток данных** — данные передаются сверху вниз через пропсы

### Чего не хватает React «из коробки»

React намеренно оставляет многие решения на усмотрение разработчика. Это гибкость, но и источник сложности при построении полноценных приложений:

| Задача | Решение в React | Проблема |
|--------|-----------------|----------|
| Роутинг | Нужна внешняя библиотека (React Router) | Дополнительная настройка |
| Серверный рендеринг | Нужна ручная настройка | Сложно и трудозатратно |
| SEO | Плохой по умолчанию (SPA) | Контент не индексируется |
| Оптимизация изображений | Нужно самому | Производительность страдает |
| API-маршруты | Нужен отдельный сервер | Усложнение инфраструктуры |
| Сборка и конфигурация | Webpack/Vite настройка вручную | Высокий порог входа |
| Code splitting | Нужна ручная настройка | Легко упустить |

Когда вы создаёте приложение только на React, вам приходится принимать десятки архитектурных решений и подключать множество дополнительных инструментов. Именно здесь на помощь приходит Next.js.

## Next.js: фреймворк, который решает проблемы React

Next.js — это фреймворк для React, разработанный компанией Vercel. Он берёт на себя все «скучные» части веб-разработки и предоставляет готовые решения для типичных задач.

```
React (библиотека для UI)
    ↓
Next.js (фреймворк = React + роутинг + SSR/SSG + API + оптимизации + ...)
```

### Файловая система как роутинг

Одно из главных нововведений Next.js — **файловая структура определяет маршруты приложения**.

**В React (с React Router):**
```javascript
// App.jsx — нужно вручную описывать все маршруты
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import UserPage from './pages/UserPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/users/:id" element={<UserPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

**В Next.js (App Router):**
```
app/
├── page.tsx           → /
├── about/
│   └── page.tsx       → /about
├── users/
│   └── [id]/
│       └── page.tsx   → /users/:id
└── not-found.tsx      → страница 404
```

```typescript
// app/users/[id]/page.tsx — роут создаётся автоматически
interface Props {
  params: { id: string }
}

export default function UserPage({ params }: Props) {
  return <div>Пользователь: {params.id}</div>
}
```

Маршруты создаются автоматически по файловой структуре — не нужно ничего регистрировать.

### Режимы рендеринга: SSR, SSG, ISR и CSR

Это ключевое отличие Next.js от «чистого» React. Next.js поддерживает несколько стратегий рендеринга, позволяя выбрать оптимальную для каждой страницы.

#### CSR — Client-Side Rendering (React по умолчанию)

Стандартное поведение React. HTML генерируется в браузере после загрузки JavaScript.

```javascript
// Обычный React компонент — рендерится в браузере
import { useState, useEffect } from 'react'

function ProductList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Загрузка...</div>

  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  )
}
```

**Проблемы CSR:**
- Поисковые роботы видят пустую страницу (плохо для SEO)
- Пользователь видит «мигание» (loading state) при первой загрузке
- Медленный Time to First Contentful Paint (FCP)

#### SSR — Server-Side Rendering

HTML генерируется на сервере при каждом запросе. Пользователь сразу получает готовый контент.

```typescript
// app/products/page.tsx — Next.js App Router
// Этот компонент выполняется на СЕРВЕРЕ при каждом запросе

async function getProducts() {
  const res = await fetch('https://api.example.com/products', {
    cache: 'no-store' // отключаем кэш = SSR
  })
  return res.json()
}

export default async function ProductsPage() {
  const products = await getProducts() // данные получены ДО отправки HTML

  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  )
}
```

**Преимущества SSR:**
- Отличное SEO — поисковики видят готовый контент
- Быстрый FCP — пользователь видит контент без задержки
- Актуальные данные при каждом запросе

**Недостатки SSR:**
- Нагрузка на сервер при каждом запросе
- Медленнее, чем статические страницы

#### SSG — Static Site Generation

HTML генерируется **один раз** при сборке проекта. Отлично подходит для контента, который меняется редко.

```typescript
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'

// Указываем, какие пути нужно сгенерировать при сборке
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json())

  return posts.map((post: { slug: string }) => ({
    slug: post.slug,
  }))
}

async function getPost(slug: string) {
  const res = await fetch(`https://api.example.com/posts/${slug}`)
  if (!res.ok) return null
  return res.json()
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getPost(params.slug)

  if (!post) notFound()

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  )
}
```

**Преимущества SSG:**
- Максимальная скорость — статические файлы отдаются из CDN
- Минимальная нагрузка на сервер
- Отличное SEO

**Ограничение:** контент актуален только на момент сборки.

#### ISR — Incremental Static Regeneration

Гибрид SSG и SSR: страницы генерируются статически, но могут обновляться через заданный интервал.

```typescript
// app/news/page.tsx
async function getNews() {
  const res = await fetch('https://api.example.com/news', {
    next: { revalidate: 3600 } // обновлять каждый час
  })
  return res.json()
}

export default async function NewsPage() {
  const news = await getNews()

  return (
    <div>
      {news.map((item: { id: string; title: string }) => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  )
}
```

**ISR объединяет лучшее из SSG и SSR:**
- Скорость статических страниц
- Актуальность данных без пересборки всего проекта

### API Routes — бэкенд прямо в Next.js

Next.js позволяет создавать API-маршруты прямо в проекте, без отдельного сервера.

**В React (нужен отдельный бэкенд):**
```
Frontend (React)  ←→  Backend (Node.js/Express/NestJS)
```

**В Next.js:**
```
Next.js
├── app/                  → Frontend страницы
└── app/api/              → Backend маршруты
```

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'

// GET /api/products
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  const products = await db.products.findMany({
    where: category ? { category } : undefined,
  })

  return NextResponse.json(products)
}

// POST /api/products
export async function POST(request: NextRequest) {
  const body = await request.json()

  // Валидация
  if (!body.name || !body.price) {
    return NextResponse.json(
      { error: 'Необходимы name и price' },
      { status: 400 }
    )
  }

  const product = await db.products.create({ data: body })
  return NextResponse.json(product, { status: 201 })
}
```

Это особенно удобно для:
- Небольших проектов, где не нужен отдельный сервис
- Проксирования запросов к внешним API
- Работы с базой данных напрямую из Next.js
- Веб-хуков (Stripe, GitHub, Telegram)

### React Server Components (RSC)

Next.js (начиная с версии 13) внедрил поддержку React Server Components — компонентов, которые выполняются **исключительно на сервере** и не отправляют JavaScript в браузер.

```typescript
// app/dashboard/page.tsx — Server Component по умолчанию
// Этот код НЕ попадает в JS-бандл браузера

import { db } from '@/lib/db'

export default async function Dashboard() {
  // Прямое обращение к БД — безопасно, т.к. выполняется на сервере
  const stats = await db.getStats()
  const recentOrders = await db.orders.findMany({ take: 10 })

  return (
    <div>
      <h1>Дашборд</h1>
      <StatsCard data={stats} />
      <OrderList orders={recentOrders} />
    </div>
  )
}
```

```typescript
// components/AddToCart.tsx — Client Component
'use client' // Это директива — компонент выполняется в браузере

import { useState } from 'react'

export function AddToCart({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false)

  const handleClick = async () => {
    await fetch('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    })
    setAdded(true)
  }

  return (
    <button onClick={handleClick}>
      {added ? 'Добавлено ✓' : 'Добавить в корзину'}
    </button>
  )
}
```

**Что даёт RSC:**
- Меньший JS-бандл (серверный код не отправляется браузеру)
- Прямой доступ к БД, файловой системе и секретам на сервере
- Лучшая производительность за счёт снижения гидратации

### Оптимизация изображений

Next.js предоставляет компонент `<Image>` с автоматической оптимизацией:

```typescript
// В обычном React — вы сами отвечаете за оптимизацию
<img src="/hero.jpg" alt="Hero" />

// В Next.js — автоматическая оптимизация
import Image from 'next/image'

export default function Hero() {
  return (
    <Image
      src="/hero.jpg"
      alt="Главный баннер"
      width={1200}
      height={600}
      priority          // загружать сразу (LCP элемент)
      placeholder="blur" // показывать размытую версию пока грузится
    />
  )
}
```

**Что делает `<Image>` автоматически:**
- Конвертирует изображения в современные форматы (WebP, AVIF)
- Генерирует несколько размеров под разные экраны (srcset)
- Lazy loading по умолчанию
- Предотвращает Cumulative Layout Shift (CLS)
- Кэширует оптимизированные версии

### Оптимизация шрифтов

```typescript
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={`${inter.className} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

Next.js загружает шрифты через собственный сервер, устраняя задержки от внешних CDN и предотвращая нежелательные запросы к Google Fonts.

### Metadata и SEO

```typescript
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

// Динамические метаданные для SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
    },
  }
}

export default async function BlogPost({ params }: Props) {
  const post = await getPost(params.slug)
  return <article>{/* ... */}</article>
}
```

В React для управления метаданными нужна отдельная библиотека (например, `react-helmet`). В Next.js это встроено.

### Middleware

Next.js позволяет выполнять код **до** обработки запроса — идеально для аутентификации, A/B тестирования, редиректов.

```typescript
// middleware.ts — выполняется перед каждым запросом
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  // Защищённые маршруты
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token || !verifyToken(token)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // A/B тест для главной страницы
  if (request.nextUrl.pathname === '/') {
    const variant = Math.random() > 0.5 ? 'a' : 'b'
    const response = NextResponse.next()
    response.cookies.set('ab-variant', variant)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/'],
}
```

## Ключевые различия: сравнительная таблица

| Характеристика | React (CRA/Vite) | Next.js |
|----------------|------------------|---------|
| **Тип** | Библиотека | Фреймворк |
| **Роутинг** | React Router (сторонний) | Встроенный (файловая система) |
| **Рендеринг** | CSR (только браузер) | CSR + SSR + SSG + ISR |
| **SEO** | Плохо (нужен доп. инструмент) | Отлично (встроено) |
| **API сервер** | Нужен отдельный | Встроенные API Routes |
| **Оптимизация изображений** | Вручную | Встроенный компонент `<Image>` |
| **Оптимизация шрифтов** | Вручную | Встроенный `next/font` |
| **Метаданные** | react-helmet | Встроенное API metadata |
| **Middleware** | Нет | Встроенный |
| **Server Components** | Нет | Да (App Router) |
| **Code Splitting** | Нужна настройка | Автоматически |
| **Гибкость конфигурации** | Высокая | Умеренная |
| **Время до первого контента** | Медленнее (CSR) | Быстрее (SSR/SSG) |
| **Порог входа** | Ниже | Немного выше |

## Когда использовать React без Next.js

Несмотря на все преимущества Next.js, «чистый» React (с Vite) имеет свои сценарии применения.

### 1. Внутренние инструменты и дашборды

Если приложение работает за авторизацией и его не нужно индексировать поисковиками — SSR не нужен.

```
✅ Подходит React + Vite:
- Корпоративный дашборд для сотрудников
- CRM-система
- Административная панель
- Инструменты для внутреннего использования
```

### 2. SPA с полным контролем над конфигурацией

```javascript
// vite.config.ts — полный контроль над конфигурацией сборки
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts', 'd3'],
        },
      },
    },
  },
})
```

### 3. Прототипы и учебные проекты

Когда важно быстро проверить идею без изучения соглашений фреймворка.

### 4. Встраиваемые виджеты

Если вы создаёте компонент для встраивания на сторонние сайты — React без Next.js предпочтительнее.

### 5. Мобильные приложения с React Native

React Native использует React-компоненты, но Next.js здесь не применяется — для мобильной разработки нужен именно React.

## Когда использовать Next.js

### 1. Публичные сайты с SEO-требованиями

```
✅ Подходит Next.js:
- Интернет-магазины (e-commerce)
- Блоги и медиа-порталы
- Корпоративные сайты
- Лендинги
- Новостные ресурсы
```

### 2. Fullstack-приложения

Next.js позволяет объединить фронтенд и бэкенд в одном проекте:

```typescript
// Один проект вместо двух
app/
├── page.tsx              → Главная страница
├── dashboard/
│   └── page.tsx          → Дашборд
└── api/
    ├── auth/
    │   └── route.ts      → Авторизация
    ├── products/
    │   └── route.ts      → API товаров
    └── orders/
        └── route.ts      → API заказов
```

### 3. Высоконагруженные проекты с требованиями к производительности

SSG + ISR позволяет отдавать контент из CDN с минимальной задержкой.

### 4. Проекты с большой командой

Чёткие соглашения Next.js (файловый роутинг, API routes) упрощают совместную разработку.

## Миграция с React на Next.js

Если у вас есть React-приложение и вы хотите перейти на Next.js, вот общий план:

### Шаг 1: Установка Next.js

```bash
npx create-next-app@latest my-next-app --typescript --tailwind --app
```

### Шаг 2: Перенос компонентов

Большинство React-компонентов работают без изменений. Нужно лишь добавить `'use client'` для компонентов с хуками:

```typescript
// Было (React):
import { useState } from 'react'

function Toggle() {
  const [open, setOpen] = useState(false)
  return <button onClick={() => setOpen(!open)}>Toggle</button>
}

// Стало (Next.js):
'use client' // добавили эту директиву

import { useState } from 'react'

function Toggle() {
  const [open, setOpen] = useState(false)
  return <button onClick={() => setOpen(!open)}>Toggle</button>
}
```

### Шаг 3: Замена роутинга

```typescript
// Было (React Router):
import { Link, useNavigate, useParams } from 'react-router-dom'

function ProductCard({ id }) {
  const navigate = useNavigate()
  return (
    <div>
      <Link to={`/products/${id}`}>Открыть</Link>
      <button onClick={() => navigate('/cart')}>В корзину</button>
    </div>
  )
}

// Стало (Next.js):
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function ProductCard({ id }: { id: string }) {
  const router = useRouter()
  return (
    <div>
      <Link href={`/products/${id}`}>Открыть</Link>
      <button onClick={() => router.push('/cart')}>В корзину</button>
    </div>
  )
}
```

### Шаг 4: Замена fetch с useEffect на async Server Components

```typescript
// Было (React — клиентский fetch):
'use client'
import { useState, useEffect } from 'react'

function ProductList() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(setProducts)
  }, [])

  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>
}

// Стало (Next.js — серверный компонент):
async function ProductList() {
  const products = await fetch('https://api.example.com/products').then(r => r.json())
  return <ul>{products.map((p: { id: string; name: string }) => <li key={p.id}>{p.name}</li>)}</ul>
}
```

## Практический пример: одно приложение на React и Next.js

Рассмотрим простую страницу блога с загрузкой статей.

### React + Vite вариант

```javascript
// src/pages/BlogPage.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function BlogPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/posts?_limit=10')
      .then(res => {
        if (!res.ok) throw new Error('Ошибка загрузки')
        return res.json()
      })
      .then(data => {
        setPosts(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Загрузка...</div>
  if (error) return <div>Ошибка: {error}</div>

  return (
    <div>
      <h1>Блог</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>
            <Link to={`/blog/${post.id}`}>{post.title}</Link>
          </h2>
          <p>{post.body}</p>
        </article>
      ))}
    </div>
  )
}

export default BlogPage
```

**Проблемы этого подхода:**
- Пустой HTML до загрузки JS → плохое SEO
- Пользователь видит спиннер → плохой UX
- Нет метаданных → не работает Open Graph

### Next.js вариант

```typescript
// app/blog/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

// SEO метаданные — встроены в Next.js
export const metadata: Metadata = {
  title: 'Блог — последние статьи',
  description: 'Читайте наши последние статьи о веб-разработке',
}

interface Post {
  id: number
  title: string
  body: string
}

// Серверный компонент — данные получены ДО отправки HTML
async function getPosts(): Promise<Post[]> {
  const res = await fetch(
    'https://jsonplaceholder.typicode.com/posts?_limit=10',
    { next: { revalidate: 3600 } } // ISR: обновлять каждый час
  )

  if (!res.ok) throw new Error('Ошибка загрузки постов')
  return res.json()
}

export default async function BlogPage() {
  const posts = await getPosts() // данные готовы синхронно

  return (
    <div>
      <h1>Блог</h1>
      {posts.map(post => (
        <article key={post.id}>
          <h2>
            <Link href={`/blog/${post.id}`}>{post.title}</Link>
          </h2>
          <p>{post.body}</p>
        </article>
      ))}
    </div>
  )
}
```

**Преимущества Next.js версии:**
- HTML с контентом отдаётся сразу → отличное SEO
- Нет спиннера → лучший UX
- Метаданные встроены → работает Open Graph
- ISR — обновление раз в час без пересборки
- Меньше кода — нет useState, useEffect, обработчиков ошибок в компоненте

## Итоги

Подводя итог, вот как определить, что вам нужно:

**Выбирайте React + Vite, если:**
- Создаёте SPA за авторизацией (дашборды, CRM, внутренние инструменты)
- SEO не важен для вашего проекта
- Нужен полный контроль над конфигурацией сборки
- Делаете прототип или учебный проект
- Строите встраиваемые виджеты

**Выбирайте Next.js, если:**
- Создаёте публичный сайт с требованиями к SEO
- Нужна быстрая первая загрузка страницы
- Хотите объединить фронтенд и бэкенд в одном проекте
- Строите e-commerce, блог, корпоративный сайт
- Важна производительность и Core Web Vitals

**Главное, что нужно запомнить:** Next.js не заменяет React — он строится поверх него. Все знания React полностью применимы в Next.js. Изучая React, вы одновременно готовитесь к работе с Next.js.

Если вы хотите освоить React и Next.js с нуля и научиться строить production-ready приложения — ознакомьтесь с курсами на [PurpleSchool](https://purpleschool.ru).

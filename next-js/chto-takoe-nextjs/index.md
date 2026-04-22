---
metaTitle: Что такое Next.js и зачем он нужен — полный обзор фреймворка
metaDescription: Разбираем что такое Next.js, зачем он нужен, какие задачи решает поверх React, ключевые возможности и когда стоит его использовать.
author: Антон Ларичев
title: Что такое Next.js и зачем он нужен
preview: Узнайте, что такое Next.js, зачем он нужен разработчикам на React, какие задачи он решает и почему стал стандартом для production-приложений.
---

## Введение

Next.js — это фреймворк поверх React, который превращает библиотеку для построения UI в полноценный инструмент для разработки production-приложений. Если React отвечает только за рендеринг компонентов в браузере, то Next.js добавляет серверный рендеринг, файловый роутинг, API-маршруты, оптимизацию изображений и многое другое.

В этой статье вы узнаете:

* Что такое Next.js и как он соотносится с React
* Какие проблемы он решает
* Ключевые возможности фреймворка
* Когда имеет смысл его использовать
* Как выглядит структура Next.js проекта

## Что такое Next.js

Next.js — это open-source фреймворк для React, разработанный компанией Vercel. Первая версия вышла в 2016 году, и с тех пор он стал одним из самых популярных инструментов в экосистеме JavaScript.

Простая формула:

```
Next.js = React + роутинг + SSR/SSG + API + оптимизации + инструменты сборки
```

React — это **библиотека**: она решает одну задачу очень хорошо — декларативный рендеринг UI через компоненты. Всё остальное (роутинг, загрузка данных на сервере, SEO, оптимизация производительности) разработчику приходится добавлять самостоятельно.

Next.js — это **фреймворк**: он принимает архитектурные решения за вас и предоставляет готовые решения для всех типичных задач веб-разработки.

### Исторический контекст

До появления Next.js разработчики на React сталкивались с серьёзными проблемами при создании публичных сайтов:

* **SEO**: React-приложения рендерились только в браузере, поэтому поисковые роботы видели пустую HTML-страницу
* **Производительность**: пользователь видел белый экран, пока загружался и выполнялся JavaScript
* **Роутинг**: нужно было подключать и настраивать отдельную библиотеку (React Router)
* **Сборка**: сложная конфигурация Webpack с нуля

Next.js решил все эти проблемы сразу, предоставив готовую «батарею» из необходимых инструментов.

## Ключевые возможности Next.js

### Серверный рендеринг (SSR)

Одна из главных возможностей — рендеринг HTML на сервере до отправки пользователю. Это означает, что браузер получает уже готовую страницу с контентом, а не пустой HTML, в который React потом вставляет данные.

```typescript
// app/products/page.tsx
// Этот компонент выполняется на СЕРВЕРЕ при каждом запросе

async function getProducts() {
  // Запрашиваем данные прямо на сервере — безопасно
  const res = await fetch('https://api.example.com/products', {
    cache: 'no-store' // без кэша = актуальные данные каждый раз
  })
  return res.json()
}

export default async function ProductsPage() {
  const products = await getProducts() // данные готовы ДО отправки HTML

  return (
    <ul>
      {products.map(p => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  )
}
```

Пользователь сразу видит список продуктов — без спиннеров и задержек. Поисковик тоже видит готовый контент.

### Статическая генерация (SSG)

Некоторые страницы вообще не меняются между запросами — например, статьи блога. Для них Next.js поддерживает статическую генерацию: HTML создаётся **один раз** при сборке проекта и раздаётся из CDN с максимальной скоростью.

```typescript
// app/blog/[slug]/page.tsx
// generateStaticParams говорит Next.js, какие страницы сгенерировать

export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json())

  return posts.map((post: { slug: string }) => ({
    slug: post.slug,
  }))
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`).then(r => r.json())

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  )
}
```

### Файловый роутинг

В Next.js роутинг основан на файловой структуре — никакой ручной регистрации маршрутов не нужно.

```
app/
├── page.tsx           → /
├── about/
│   └── page.tsx       → /about
├── blog/
│   ├── page.tsx       → /blog
│   └── [slug]/
│       └── page.tsx   → /blog/:slug (динамический маршрут)
└── dashboard/
    ├── layout.tsx     → общий layout для дашборда
    └── page.tsx       → /dashboard
```

Создал файл — создал маршрут. Это интуитивно понятно и исключает ошибки с конфигурацией роутера.

Если вы хотите детально изучить Next.js с нуля и освоить все возможности фреймворка — приходите на наш большой курс [Next.js](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=article&utm_campaign=chto-takoe-nextjs).
На курсе более 100 уроков и практических упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### API Routes

Next.js позволяет создавать бэкенд-маршруты прямо в проекте — без отдельного сервера.

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'

// GET /api/users
export async function GET(request: NextRequest) {
  const users = await db.users.findMany()
  return NextResponse.json(users)
}

// POST /api/users
export async function POST(request: NextRequest) {
  const body = await request.json()

  if (!body.email || !body.name) {
    return NextResponse.json(
      { error: 'Email и имя обязательны' },
      { status: 400 }
    )
  }

  const user = await db.users.create({ data: body })
  return NextResponse.json(user, { status: 201 })
}
```

Небольшие fullstack-приложения можно строить полностью в рамках одного Next.js проекта.

### React Server Components

Начиная с Next.js 13, фреймворк поддерживает React Server Components (RSC) — компоненты, которые выполняются **только на сервере** и не включаются в JavaScript-бандл, который загружает браузер.

```typescript
// Серверный компонент (по умолчанию в App Router)
// Этот код НЕ попадает в браузер
import { db } from '@/lib/db'

export default async function UserProfile({ userId }: { userId: string }) {
  // Прямой доступ к БД — безопасно, т.к. выполняется только на сервере
  const user = await db.users.findUnique({ where: { id: userId } })

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  )
}
```

```typescript
// Клиентский компонент — нужен для интерактивности
'use client' // директива обязательна

import { useState } from 'react'

export function FollowButton({ userId }: { userId: string }) {
  const [following, setFollowing] = useState(false)

  return (
    <button onClick={() => setFollowing(!following)}>
      {following ? 'Отписаться' : 'Подписаться'}
    </button>
  )
}
```

RSC радикально снижают объём JavaScript, загружаемого браузером, что напрямую влияет на скорость загрузки.

### Оптимизация изображений

Компонент `<Image>` автоматически оптимизирует изображения:

```typescript
import Image from 'next/image'

export default function Hero() {
  return (
    <Image
      src="/hero.jpg"
      alt="Главный баннер"
      width={1200}
      height={600}
      priority          // загружать в приоритете (LCP элемент)
      placeholder="blur" // показывать размытый placeholder пока грузится
    />
  )
}
```

Что происходит автоматически:
* Конвертация в современные форматы (WebP, AVIF)
* Генерация нескольких размеров под разные экраны
* Lazy loading для изображений вне viewport
* Предотвращение Cumulative Layout Shift (CLS)

### Встроенное SEO

```typescript
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = await getPost(params.slug)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage }],
    },
  }
}
```

Метаданные для SEO и Open Graph генерируются прямо в коде страницы — не нужны сторонние библиотеки вроде `react-helmet`.

### Middleware

Next.js позволяет выполнять код до обработки любого запроса — удобно для авторизации, редиректов, A/B тестирования:

```typescript
// middleware.ts — выполняется перед каждым подходящим запросом
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  // Защита приватных маршрутов
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

## Структура Next.js проекта

Типичная структура проекта с App Router (Next.js 13+):

```
my-app/
├── app/                    # Основная директория приложения
│   ├── layout.tsx          # Корневой layout (обёртка для всех страниц)
│   ├── page.tsx            # Главная страница /
│   ├── globals.css         # Глобальные стили
│   ├── blog/
│   │   ├── page.tsx        # Страница /blog
│   │   └── [slug]/
│   │       └── page.tsx    # Страница /blog/:slug
│   └── api/
│       └── users/
│           └── route.ts    # API маршрут /api/users
├── components/             # Переиспользуемые компоненты
│   ├── ui/                 # UI-компоненты
│   └── features/           # Компоненты функциональности
├── lib/                    # Вспомогательные утилиты, конфигурация
├── public/                 # Статические файлы (изображения, шрифты)
├── next.config.ts          # Конфигурация Next.js
├── tsconfig.json           # TypeScript конфигурация
└── package.json
```

## Когда использовать Next.js

### Подходит Next.js

* **Публичные сайты с SEO**: интернет-магазины, блоги, корпоративные сайты, новостные порталы
* **Fullstack-приложения**: когда нужен и фронтенд, и API в одном проекте
* **Высоконагруженные проекты**: SSG + CDN даёт максимальную скорость
* **Контентные платформы**: с большим количеством страниц и частыми обновлениями
* **Командная разработка**: чёткие соглашения упрощают совместную работу

### Лучше использовать React без Next.js

* **Внутренние инструменты**: дашборды, CRM, административные панели — SEO не нужен
* **SPA с нестандартными требованиями**: когда нужен полный контроль над конфигурацией
* **Встраиваемые виджеты**: компоненты для встраивания в сторонние сайты
* **React Native**: мобильная разработка — Next.js здесь неприменим

## Быстрый старт

Создать новый Next.js проект с TypeScript и Tailwind CSS:

```bash
npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app
npm run dev
```

После этого приложение будет доступно на `http://localhost:3000`. Можно сразу редактировать `app/page.tsx` и видеть изменения в реальном времени благодаря Fast Refresh.

## Частые ошибки

* **Использовать `useState` в серверном компоненте** — выдаст ошибку. Для компонентов с состоянием нужна директива `'use client'`
* **Смешивать Pages Router и App Router** — в проекте должен использоваться один подход
* **Не указывать `cache: 'no-store'` для динамических данных** — Next.js кэширует fetch-запросы по умолчанию, что может давать устаревшие данные
* **Использовать `useRouter` из `next/router` в App Router** — нужен `useRouter` из `next/navigation`

## Частозадаваемые вопросы

**Нужно ли знать React перед изучением Next.js?**
Да, Next.js строится поверх React. Перед изучением Next.js рекомендуется хорошо разобраться с компонентами, хуками и базовыми концепциями React.

**Можно ли использовать Next.js для мобильных приложений?**
Нет, Next.js предназначен исключительно для веб-разработки. Для мобильных приложений на React используется React Native.

**Платный ли Next.js?**
Next.js — полностью бесплатный open-source проект. Компания Vercel (создатель Next.js) предлагает платный хостинг, но деплоить Next.js можно на любой платформе: собственный сервер, AWS, Netlify и т.д.

**Что лучше — Pages Router или App Router?**
App Router (появился в Next.js 13) — это современный подход с поддержкой React Server Components. Для новых проектов рекомендуется использовать App Router. Pages Router по-прежнему поддерживается для обратной совместимости.

## Заключение

Next.js — это логичное продолжение React для построения production-ready веб-приложений. Он решает системные проблемы «голого» React: плохое SEO, медленная первая загрузка, необходимость самостоятельно собирать инфраструктуру из отдельных библиотек.

Ключевые преимущества:
* Серверный и статический рендеринг для SEO и производительности
* Файловый роутинг без дополнительной конфигурации
* React Server Components для уменьшения JS-бандла
* Встроенные API-маршруты для fullstack-разработки
* Оптимизация изображений, шрифтов и SEO из коробки

Для закрепления навыков работы с Next.js рекомендуем курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=article&utm_campaign=chto-takoe-nextjs).
В первых модулях курса доступно бесплатное содержание, что позволяет познакомиться с подходом преподавателя и оценить качество материала до покупки полного доступа.

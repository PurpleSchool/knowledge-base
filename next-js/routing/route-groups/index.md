---
metaTitle: "Route Groups в Next.js — организация маршрутов"
metaDescription: "Как использовать Route Groups в Next.js App Router для организации маршрутов, создания нескольких layout и группировки страниц без изменения URL."
author: "Антон Ларичев"
title: "Route Groups в Next.js: организация маршрутов без влияния на URL"
preview: "Разбираемся с Route Groups в Next.js: как группировать маршруты, создавать несколько корневых layout и организовывать структуру проекта."
---

## Что такое Route Groups

Route Groups — это механизм App Router в Next.js, позволяющий логически группировать маршруты и файлы внутри директории `app`, не изменяя при этом итоговый URL. Группа обозначается именем папки, заключённым в круглые скобки: `(folderName)`.

Когда Next.js строит маршруты, он игнорирует сегменты в скобках при формировании URL. Папка `(marketing)` не добавляет `/marketing` к адресу — она существует только на уровне файловой системы.

Это решает три распространённые задачи:

- организация кода без загрязнения URL;
- применение разных `layout.tsx` к разным группам страниц;
- создание нескольких корневых макетов в одном приложении.

## Синтаксис

Правило простое: оберните имя папки в круглые скобки.

```
app/
  (marketing)/
    about/
      page.tsx      → /about
    blog/
      page.tsx      → /blog
  (shop)/
    products/
      page.tsx      → /products
    cart/
      page.tsx      → /cart
```

URL `/about`, `/blog`, `/products` и `/cart` — плоские, без каких-либо префиксов. Группы видны только вам как разработчику.

## Организация маршрутов без изменения URL

Самый простой случай — навести порядок в большом приложении. Представьте, что в `app/` накопилось несколько десятков папок. Route Groups позволяют разложить их по смысловым блокам.

```
app/
  (auth)/
    login/
      page.tsx      → /login
    register/
      page.tsx      → /register
    forgot-password/
      page.tsx      → /forgot-password
  (dashboard)/
    overview/
      page.tsx      → /overview
    settings/
      page.tsx      → /settings
    profile/
      page.tsx      → /profile
  (public)/
    page.tsx        → /
    pricing/
      page.tsx      → /pricing
```

Все маршруты работают как обычно — группировка влияет только на файловую структуру.

## Layout для отдельных групп

Главная практическая польза Route Groups — возможность назначать разные `layout.tsx` для разных наборов страниц, не вкладывая их друг в друга иерархически.

Предположим, у нас есть публичный сайт и личный кабинет. У публичных страниц — шапка с навигацией и подвал. У личного кабинета — боковая панель и совсем другой хедер.

```
app/
  (public)/
    layout.tsx       ← layout для публичных страниц
    page.tsx         → /
    about/
      page.tsx       → /about
  (dashboard)/
    layout.tsx       ← layout для личного кабинета
    overview/
      page.tsx       → /overview
    reports/
      page.tsx       → /reports
  layout.tsx         ← корневой layout (обязателен)
```

`app/(public)/layout.tsx` — макет с шапкой и подвалом:

```tsx
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
```

`app/(dashboard)/layout.tsx` — макет с боковой панелью:

```tsx
import { Sidebar } from '@/components/Sidebar'
import { DashboardHeader } from '@/components/DashboardHeader'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard__content">
        <DashboardHeader />
        <main>{children}</main>
      </div>
    </div>
  )
}
```

Страница `/overview` получит `DashboardLayout`, страница `/about` — `PublicLayout`. URL при этом чистые, без лишних сегментов.

## Несколько корневых layout

Route Groups открывают нестандартную возможность: создать несколько корневых `layout.tsx`, каждый со своим тегом `<html>`. Это полезно, когда части приложения принципиально разные — например, основной сайт и встроенный виджет или мобильная версия.

```
app/
  (main)/
    layout.tsx       ← <html lang="ru">
    page.tsx         → /
    about/
      page.tsx       → /about
  (widget)/
    layout.tsx       ← <html lang="ru" data-theme="compact">
    embed/
      page.tsx       → /embed
```

`app/(main)/layout.tsx`:

```tsx
export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
```

`app/(widget)/layout.tsx`:

```tsx
export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" data-theme="compact">
      <body className="widget-body">{children}</body>
    </html>
  )
}
```

Важно: если вы используете несколько корневых layout, корневой `app/layout.tsx` должен отсутствовать — Next.js не допускает их одновременного существования.

## Исключение страниц из общего layout

Route Groups решают задачу, которая раньше требовала ухищрений: вывести страницу за пределы layout-а без изменения URL.

Допустим, страница `/login` должна быть без хедера и сайдбара, но остальные страницы — с ними.

```
app/
  (with-layout)/
    layout.tsx
    dashboard/
      page.tsx       → /dashboard
    profile/
      page.tsx       → /profile
  (no-layout)/
    login/
      page.tsx       → /login
    register/
      page.tsx       → /register
  layout.tsx
```

Страницы в `(no-layout)` наследуют только корневой `app/layout.tsx`, минуя `(with-layout)/layout.tsx`. При этом URL `/login` и `/register` остаются чистыми.

## Вложенные Route Groups

Route Groups можно вкладывать друг в друга. Это дает дополнительный уровень организации.

```
app/
  (admin)/
    (content)/
      articles/
        page.tsx     → /articles
      pages/
        page.tsx     → /pages
    (settings)/
      users/
        page.tsx     → /users
      roles/
        page.tsx     → /roles
```

Все четыре маршрута — `/articles`, `/pages`, `/users`, `/roles` — плоские. Вложенность групп влияет только на организацию файлов.

## Полный практический пример

Рассмотрим реальную структуру SaaS-приложения с публичным лендингом, аутентификацией и личным кабинетом.

```
app/
  (landing)/
    layout.tsx
    page.tsx              → /
    pricing/
      page.tsx            → /pricing
    blog/
      page.tsx            → /blog
      [slug]/
        page.tsx          → /blog/:slug
  (auth)/
    layout.tsx
    login/
      page.tsx            → /login
    register/
      page.tsx            → /register
    reset-password/
      page.tsx            → /reset-password
  (app)/
    layout.tsx
    (overview)/
      page.tsx            → /
    workspace/
      [id]/
        page.tsx          → /workspace/:id
    settings/
      page.tsx            → /settings
      billing/
        page.tsx          → /settings/billing
  layout.tsx
```

`app/(landing)/layout.tsx` — лендинг со своим стилем:

```tsx
import { LandingNav } from '@/components/LandingNav'
import { LandingFooter } from '@/components/LandingFooter'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | MyApp',
    default: 'MyApp — удобный инструмент для команд',
  },
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <LandingNav />
      <main>{children}</main>
      <LandingFooter />
    </>
  )
}
```

`app/(auth)/layout.tsx` — минималистичный layout для форм:

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-wrapper">
      <div className="auth-card">{children}</div>
    </div>
  )
}
```

`app/(app)/layout.tsx` — layout приложения с проверкой сессии:

```tsx
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { AppSidebar } from '@/components/AppSidebar'
import { AppHeader } from '@/components/AppHeader'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="app-shell">
      <AppSidebar user={session.user} />
      <div className="app-main">
        <AppHeader user={session.user} />
        <main className="app-content">{children}</main>
      </div>
    </div>
  )
}
```

Проверка авторизации находится в одном месте и автоматически распространяется на все страницы внутри `(app)`. Новая защищённая страница — просто новая папка внутри группы.

## Metadata для групп

Route Groups совместимы с системой метаданных Next.js. Каждый `layout.tsx` внутри группы может экспортировать объект `metadata` или функцию `generateMetadata`.

```tsx
// app/(landing)/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  openGraph: {
    siteName: 'MyApp',
    images: [{ url: '/og-landing.png' }],
  },
}
```

```tsx
// app/(app)/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false },
  openGraph: {
    siteName: 'MyApp — кабинет',
    images: [{ url: '/og-app.png' }],
  },
}
```

Личный кабинет получает `robots: { index: false }` — поисковики не будут индексировать закрытую часть приложения.

## Конфликты маршрутов

Route Groups могут привести к конфликту, если два маршрута внутри разных групп разрешаются в одинаковый URL.

```
app/
  (a)/
    about/
      page.tsx    → /about
  (b)/
    about/
      page.tsx    → /about  ← конфликт!
```

Next.js выбросит ошибку сборки. Следите за тем, чтобы маршруты внутри групп не пересекались.

Аналогичная ситуация возникает с корневыми страницами:

```
app/
  (a)/
    page.tsx    → /
  (b)/
    page.tsx    → /  ← конфликт!
```

Корневую `page.tsx` можно разместить только в одной группе.

## Ограничения

**Имена групп не попадают в URL, но влияют на маршрутизацию.** Два файла в разных группах не могут давать одинаковый путь.

**`loading.tsx`, `error.tsx` и `not-found.tsx` работают на уровне группы.** Файл `app/(dashboard)/loading.tsx` применяется ко всем страницам внутри `(dashboard)`.

**Группы не создают изоляции контекста.** React Context и глобальное состояние по-прежнему доступны через границы групп.

**Переходы между страницами из разных корневых layout** вызывают полную перезагрузку страницы — Next.js должен поменять тег `<html>`. Учитывайте это при проектировании навигации.

## Итог

Route Groups — инструмент организации, а не функциональная возможность в традиционном смысле. Они не меняют поведение приложения, но кардинально меняют то, насколько легко с ним работать.

Используйте Route Groups, когда:

- разные страницы требуют принципиально разных макетов;
- нужно защитить группу страниц на уровне layout (проверка авторизации);
- хочется разбить большую директорию `app/` на логические блоки;
- приложение содержит несколько совершенно независимых зон (лендинг + продукт + виджет).

Хотите освоить App Router, Server Components и весь современный стек Next.js — приходите на курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-route-groups).
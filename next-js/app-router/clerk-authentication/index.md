---
metaTitle: "Аутентификация в Next.js с Clerk — полное руководство"
metaDescription: "Как настроить аутентификацию в Next.js App Router с помощью Clerk: установка, middleware, защита маршрутов, получение данных пользователя."
author: "Антон Ларичев"
title: "Next.js с Clerk: аутентификация пользователей"
preview: "Пошаговая настройка Clerk в Next.js App Router: middleware, защита маршрутов, серверные и клиентские хуки для работы с пользователем."
---

Clerk — это готовый сервис аутентификации, который избавляет от необходимости самостоятельно реализовывать регистрацию, вход, управление сессиями и токенами. Он предоставляет готовые UI-компоненты, SDK для Next.js и гибкое API для управления пользователями.

В этой статье разберём полную интеграцию Clerk с Next.js App Router: от установки пакетов до защиты серверных и клиентских компонентов.

## Установка и первоначальная настройка

Перед началом нужно создать аккаунт на сайте Clerk и создать новое приложение. В дашборде Clerk получите два ключа: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` и `CLERK_SECRET_KEY`.

Установите пакет SDK:

```bash
npm install @clerk/nextjs
```

Добавьте ключи в файл `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxx
```

Dashboard Clerk также позволяет задать URL для страниц входа и регистрации, которые будут использоваться при перенаправлении:

```bash
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

## Подключение ClerkProvider

Оберните корневой layout в `ClerkProvider`. Это обязательный шаг — провайдер предоставляет контекст сессии всему приложению.

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import type { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ru">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

## Настройка middleware

Middleware — ключевая часть интеграции. Без него Clerk не сможет перехватывать запросы и проверять сессии. Создайте файл `middleware.ts` в корне проекта (рядом с `app/`):

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

`createRouteMatcher` принимает массив паттернов и возвращает функцию, проверяющую, совпадает ли текущий маршрут с публичным. `auth.protect()` автоматически перенаправит неавторизованного пользователя на страницу входа.

### Гибкая настройка защиты

Если нужно разграничить доступ по ролям, middleware позволяет проверять метаданные пользователя:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/'])

export default clerkMiddleware(async (auth, request) => {
  if (isAdminRoute(request)) {
    await auth.protect((has) => has({ role: 'org:admin' }))
  } else if (!isPublicRoute(request)) {
    await auth.protect()
  }
})
```

## Страницы входа и регистрации

Clerk предоставляет готовые компоненты `<SignIn>` и `<SignUp>`. Создайте страницы по путям, которые указали в переменных окружения.

```tsx
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignIn />
    </main>
  )
}
```

```tsx
// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignUp />
    </main>
  )
}
```

Обратите внимание на синтаксис `[[...sign-in]]` — это catch-all сегмент, который нужен Clerk для обработки многошаговых форм (подтверждение email, OAuth-редиректы и т.д.).

## Компоненты для управления сессией

Clerk предоставляет готовые компоненты для хедера или навбара:

```tsx
// app/components/Header.tsx
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'

export function Header() {
  return (
    <header className="flex justify-between p-4 border-b">
      <span>Мой сайт</span>
      <div>
        <SignedOut>
          <SignInButton mode="modal" />
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  )
}
```

- `<SignedIn>` — рендерит дочерние элементы только для авторизованных пользователей
- `<SignedOut>` — рендерит только для неавторизованных
- `<SignInButton>` — кнопка входа (mode="modal" открывает всплывающее окно)
- `<UserButton>` — аватар с меню управления аккаунтом

## Получение данных пользователя на сервере

В серверных компонентах и серверных действиях используется функция `auth()` и `currentUser()`.

### Функция auth()

`auth()` возвращает объект с `userId` и вспомогательными методами. Это лёгкий вариант — не делает запрос к API Clerk:

```tsx
// app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div>
      <h1>Добро пожаловать!</h1>
      <p>Ваш ID: {userId}</p>
    </div>
  )
}
```

### Функция currentUser()

`currentUser()` делает запрос к Clerk API и возвращает полный объект пользователя с именем, email, аватаром и метаданными:

```tsx
// app/profile/page.tsx
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div>
      <img src={user.imageUrl} alt="Аватар" width={80} height={80} />
      <h1>{user.firstName} {user.lastName}</h1>
      <p>{user.emailAddresses[0].emailAddress}</p>
    </div>
  )
}
```

### Использование в Server Actions

```typescript
// app/actions/post.ts
'use server'

import { auth } from '@clerk/nextjs/server'

export async function createPost(formData: FormData) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Необходима авторизация')
  }

  const title = formData.get('title') as string

  // Сохранение поста с привязкой к userId
  await db.post.create({
    data: { title, authorId: userId },
  })
}
```

### Использование в Route Handlers

```typescript
// app/api/user/route.ts
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const user = await currentUser()

  return NextResponse.json({
    id: user?.id,
    name: `${user?.firstName} ${user?.lastName}`,
    email: user?.emailAddresses[0]?.emailAddress,
  })
}
```

## Получение данных пользователя на клиенте

Для клиентских компонентов Clerk предоставляет хуки `useAuth()` и `useUser()`.

### Хук useAuth()

```tsx
'use client'

import { useAuth } from '@clerk/nextjs'

export function AuthStatus() {
  const { isLoaded, isSignedIn, userId, sessionId } = useAuth()

  if (!isLoaded) {
    return <div>Загрузка...</div>
  }

  if (!isSignedIn) {
    return <div>Вы не авторизованы</div>
  }

  return <div>Авторизован. ID сессии: {sessionId}</div>
}
```

### Хук useUser()

```tsx
'use client'

import { useUser } from '@clerk/nextjs'

export function UserGreeting() {
  const { isLoaded, isSignedIn, user } = useUser()

  if (!isLoaded || !isSignedIn) {
    return null
  }

  return (
    <div>
      <img src={user.imageUrl} alt="Аватар" width={40} height={40} />
      <span>Привет, {user.firstName}!</span>
    </div>
  )
}
```

### Хук useClerk()

Для программного управления сессией используйте `useClerk()`:

```tsx
'use client'

import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const { signOut } = useClerk()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <button onClick={handleSignOut}>
      Выйти
    </button>
  )
}
```

## Работа с метаданными пользователя

Clerk поддерживает два вида метаданных: `publicMetadata` (доступны всем) и `privateMetadata` (только на сервере).

Обновление метаданных через Clerk Backend API:

```typescript
// app/api/set-role/route.ts
import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const client = await clerkClient()

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      role: 'premium',
    },
  })

  return NextResponse.json({ success: true })
}
```

Проверка метаданных в middleware или серверном компоненте:

```typescript
import { auth } from '@clerk/nextjs/server'

export async function checkPremium() {
  const { sessionClaims } = await auth()
  return sessionClaims?.metadata?.role === 'premium'
}
```

## Webhooks для синхронизации данных

Когда пользователь регистрируется или удаляет аккаунт, Clerk может отправить webhook в ваше приложение. Это полезно для синхронизации данных с собственной базой.

Установите пакет для верификации webhook-событий:

```bash
npm install svix
```

Создайте обработчик:

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Нет секрета webhook' }, { status: 500 })
  }

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Нет заголовков svix' }, { status: 400 })
  }

  const payload = await request.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(webhookSecret)
  let event: WebhookEvent

  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch {
    return NextResponse.json({ error: 'Неверная подпись' }, { status: 400 })
  }

  if (event.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = event.data

    await db.user.create({
      data: {
        clerkId: id,
        email: email_addresses[0].email_address,
        name: `${first_name} ${last_name}`,
      },
    })
  }

  if (event.type === 'user.deleted') {
    await db.user.delete({
      where: { clerkId: event.data.id },
    })
  }

  return NextResponse.json({ received: true })
}
```

## Кастомизация внешнего вида

Компоненты Clerk поддерживают кастомизацию через проп `appearance`:

```tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
          card: 'shadow-xl rounded-2xl',
          headerTitle: 'text-2xl font-bold',
        },
        variables: {
          colorPrimary: '#2563eb',
          borderRadius: '0.75rem',
        },
      }}
    />
  )
}
```

Если используете Tailwind CSS, передавайте классы напрямую в элементы компонентов. Clerk применяет их через `className`, не перезаписывая базовые стили.

## Итог

Clerk закрывает большинство потребностей аутентификации в Next.js-приложениях без написания boilerplate-кода. Основные шаги интеграции:

1. Установить `@clerk/nextjs` и задать ключи окружения
2. Обернуть layout в `<ClerkProvider>`
3. Настроить `clerkMiddleware` с определением публичных маршрутов
4. Создать страницы `/sign-in` и `/sign-up` с готовыми компонентами
5. Использовать `auth()` / `currentUser()` на сервере и `useAuth()` / `useUser()` на клиенте

Для более глубокого освоения Next.js, включая продвинутые паттерны App Router, аутентификации и работы с серверными компонентами — смотрите курс по Next.js на PurpleSchool: https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-clerk-auth
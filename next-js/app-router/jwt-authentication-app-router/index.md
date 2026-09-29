---
metaTitle: "JWT аутентификация в Next.js App Router без библиотек"
metaDescription: "Пошаговая реализация JWT-аутентификации в Next.js App Router: создание токенов через Web Crypto API, httpOnly-куки, Middleware и Server Components."
author: "Антон Ларичев"
title: "Аутентификация с JWT в App Router без сторонних библиотек"
preview: "Реализуем полноценную JWT-аутентификацию в Next.js App Router, используя только встроенные API платформы — без NextAuth и других зависимостей."
---

## Зачем делать JWT без библиотек

NextAuth, jose, jsonwebtoken — популярные решения, которые берут на себя рутину. Но у каждого из них своя модель данных, своя конфигурация и своя версионность. Если требования к аутентификации нестандартные или нужен полный контроль над структурой токена, проще написать тонкую обёртку над встроенным `Web Crypto API` и встроенным `cookies()` из Next.js.

Эта статья показывает, как построить рабочий auth-слой для App Router с нуля: выдача токена, хранение в httpOnly-куке, проверка в Middleware и чтение пользователя в Server Components.

## Структура решения

Будем хранить JWT в httpOnly-куке — это стандартная практика для веб-приложений. Схема работы:

1. Пользователь POST-ит credentials на `/api/auth/login`.
2. Route Handler проверяет данные, создаёт JWT и кладёт его в куку `token`.
3. Middleware проверяет куку на защищённых маршрутах и редиректит при отсутствии токена.
4. Server Components читают JWT из куки и получают данные пользователя.
5. Logout — Route Handler удаляет куку.

## Работа с JWT через Web Crypto API

Node.js 18+ и Edge Runtime поддерживают `globalThis.crypto` — стандартный Web Crypto API. Создадим модуль `lib/jwt.ts`, который умеет подписывать и верифицировать токены алгоритмом HS256.

```typescript
// lib/jwt.ts

const SECRET = process.env.JWT_SECRET!

function base64url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === 'string'
      ? new TextEncoder().encode(input)
      : new Uint8Array(input)
  let str = ''
  bytes.forEach((b) => (str += String.fromCharCode(b)))
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64urlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    str.length + ((4 - (str.length % 4)) % 4),
    '='
  )
  return atob(padded)
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export interface JwtPayload {
  sub: string
  email: string
  role: string
  iat: number
  exp: number
}

export async function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  expiresInSeconds = 60 * 60 * 24
): Promise<string> {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const body = base64url(
    JSON.stringify({ ...payload, iat: now, exp: now + expiresInSeconds })
  )
  const key = await getKey()
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${header}.${body}`)
  )
  return `${header}.${body}.${base64url(signature)}`
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const [header, body, sig] = token.split('.')
    if (!header || !body || !sig) return null

    const key = await getKey()
    const rawSig = Uint8Array.from(base64urlDecode(sig), (c) => c.charCodeAt(0))
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      rawSig,
      new TextEncoder().encode(`${header}.${body}`)
    )
    if (!valid) return null

    const payload: JwtPayload = JSON.parse(base64urlDecode(body))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}
```

Модуль не импортирует ничего внешнего — только стандартный `crypto`. Функция `verifyJwt` возвращает `null` при любой ошибке (неверная подпись, истёкший токен, битый формат).

### Переменная окружения

Добавьте в `.env.local` и в production-окружение:

```bash
JWT_SECRET=«минимум-32-случайных-символа»
```

Сгенерировать можно командой:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Route Handler: логин

Создайте файл `app/api/auth/login/route.ts`. В реальном приложении здесь будет обращение к базе данных и проверка хэша пароля — для примера используем фиктивный поиск.

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { signJwt } from '@/lib/jwt'

const USERS = [
  { id: '1', email: 'admin@example.com', passwordHash: 'demo', role: 'admin' },
  { id: '2', email: 'user@example.com', passwordHash: 'demo', role: 'user' },
]

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const user = USERS.find(
    (u) => u.email === email && u.passwordHash === password
  )

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signJwt({ sub: user.id, email: user.email, role: user.role })

  const response = NextResponse.json({ ok: true })
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 часа
  })

  return response
}
```

Флаг `httpOnly: true` — обязателен: он запрещает JavaScript на клиенте читать куку, что защищает от XSS. `sameSite: 'lax'` защищает от CSRF для большинства сценариев.

## Route Handler: выход

```typescript
// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
```

Передача `maxAge: 0` даёт браузеру инструкцию немедленно удалить куку.

## Middleware: защита маршрутов

Middleware в Next.js App Router выполняется до рендеринга. Создайте `middleware.ts` в корне проекта (рядом с `app/`).

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyJwt } from '@/lib/jwt'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = req.cookies.get('token')?.value
  const payload = token ? await verifyJwt(token) : null

  if (!payload) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/api/protected/:path*'],
}
```

`matcher` ограничивает маршруты, на которых запускается Middleware. Статика, `_next`, иконки — автоматически исключены.

### Проброс данных пользователя через заголовки

Middleware может добавить заголовки в запрос, чтобы Server Components не расшифровывали токен повторно:

```typescript
if (payload) {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-user-id', payload.sub)
  requestHeaders.set('x-user-role', payload.role)

  return NextResponse.next({ request: { headers: requestHeaders } })
}
```

Важно: эти заголовки устанавливает ваш сервер, а не клиент — пользователь не может их подменить.

## Чтение пользователя в Server Components

Для удобства создайте утилиту `lib/auth.ts`:

```typescript
// lib/auth.ts
import { cookies } from 'next/headers'
import { verifyJwt, JwtPayload } from './jwt'

export async function getCurrentUser(): Promise<JwtPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  return verifyJwt(token)
}

export async function requireUser(): Promise<JwtPayload> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}
```

Использование в Server Component:

```typescript
// app/dashboard/page.tsx
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div>
      <h1>Добро пожаловать, {user.email}</h1>
      <p>Роль: {user.role}</p>
    </div>
  )
}
```

Middleware уже проверяет маршрут, поэтому двойная проверка здесь — это защитный слой на случай прямого рендера или будущего изменения matcher.

## Форма входа на клиенте

```typescript
// app/login/page.tsx
'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (res.ok) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setError('Неверный email или пароль')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      {error && <p>{error}</p>}
      <button type="submit">Войти</button>
    </form>
  )
}
```

`router.refresh()` после успешного логина сбрасывает кэш Server Components — без этого страница дашборда может отрисоваться с устаревшими данными.

## Кнопка выхода

```typescript
// components/LogoutButton.tsx
'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return <button onClick={handleLogout}>Выйти</button>
}
```

## Проверка роли

Если нужна ролевая авторизация, добавьте хелпер:

```typescript
// lib/auth.ts
export async function requireRole(role: string): Promise<JwtPayload> {
  const user = await requireUser()
  if (user.role !== role) throw new Error('Forbidden')
  return user
}
```

В защищённом Server Component:

```typescript
// app/admin/page.tsx
import { requireRole } from '@/lib/auth'
import { notFound } from 'next/navigation'

export default async function AdminPage() {
  try {
    const user = await requireRole('admin')
    return <div>Панель администратора: {user.email}</div>
  } catch {
    notFound()
  }
}
```

Использование `notFound()` вместо редиректа скрывает факт существования страницы от посторонних.

## Refresh-токены

Для продакшна одного access-токена недостаточно: при коротком сроке жизни пользователь быстро разлогинивается. Стандартная схема:

- `token` — access JWT, 15 минут, httpOnly.
- `refreshToken` — длинный случайный токен, 30 дней, httpOnly, хранится в базе.

Route Handler `/api/auth/refresh`:

```typescript
// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { signJwt } from '@/lib/jwt'
// предполагаем наличие db-модуля
import { findRefreshToken, rotateRefreshToken } from '@/lib/db'

export async function POST(req: NextRequest) {
  const oldRefresh = req.cookies.get('refreshToken')?.value
  if (!oldRefresh) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const session = await findRefreshToken(oldRefresh)
  if (!session) return NextResponse.json({ error: 'Invalid' }, { status: 401 })

  const newRefresh = await rotateRefreshToken(session.userId)
  const accessToken = await signJwt(
    { sub: session.userId, email: session.email, role: session.role },
    60 * 15
  )

  const res = NextResponse.json({ ok: true })
  res.cookies.set('token', accessToken, { httpOnly: true, maxAge: 60 * 15, path: '/' })
  res.cookies.set('refreshToken', newRefresh, { httpOnly: true, maxAge: 60 * 60 * 24 * 30, path: '/' })
  return res
}
```

Можно вызывать этот эндпоинт из Middleware при получении 401 или заранее — по истечению `exp` из куки.

## Итог

Мы построили полный auth-слой для Next.js App Router без единой внешней зависимости:

- `lib/jwt.ts` — подписывает и верифицирует токены через встроенный Web Crypto API.
- `app/api/auth/login/route.ts` — выдаёт JWT и кладёт его в httpOnly-куку.
- `middleware.ts` — проверяет токен и редиректит неаутентифицированных пользователей.
- `lib/auth.ts` — удобные хелперы `getCurrentUser` и `requireRole` для Server Components.

Подход работает как в Node.js runtime, так и в Edge Runtime, поскольку использует только Web-стандартные API.

Для глубокого изучения Next.js App Router, серверных компонентов и построения production-приложений — курс на PurpleSchool: https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=jwt-authentication-app-router

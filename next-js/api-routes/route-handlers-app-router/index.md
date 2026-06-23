---
metaTitle: "Route Handlers в Next.js App Router — создание API"
metaDescription: "Как создавать Route Handlers в Next.js App Router: HTTP-методы, Request/Response, cookies, заголовки, динамические маршруты и webhooks."
author: "Антон Ларичев"
title: "Route Handlers в Next.js App Router"
preview: "Подробное руководство по созданию серверных HTTP-эндпоинтов с помощью Route Handlers в Next.js App Router."
---

## Что такое Route Handlers

Route Handlers — это механизм Next.js App Router для создания HTTP-эндпоинтов прямо в вашем приложении. Они приходят на смену API Routes из Pages Router и позволяют обрабатывать любые HTTP-запросы: принимать данные форм, отдавать JSON, проксировать запросы к сторонним сервисам, обрабатывать вебхуки и многое другое.

В отличие от Server Components, Route Handlers создают публично доступные URL-адреса, к которым может обратиться любой клиент — браузер, мобильное приложение или сторонний сервис.

Route Handlers используют стандартные Web API: `Request` и `Response`, что делает код переносимым и не привязанным к специфике фреймворка.

## Файловая структура

Route Handler создаётся с помощью специального файла `route.ts` (или `route.js`) внутри директории `app/`.

```
app/
├── page.tsx           # страница /
├── api/
│   ├── users/
│   │   └── route.ts   # эндпоинт /api/users
│   └── posts/
│       ├── route.ts   # эндпоинт /api/posts
│       └── [id]/
│           └── route.ts  # эндпоинт /api/posts/:id
```

**Важное ограничение:** файл `route.ts` и файл `page.tsx` не могут находиться в одной директории. Если вам нужен маршрут `/dashboard`, то `app/dashboard/route.ts` и `app/dashboard/page.tsx` конфликтуют — нужно выбрать что-то одно.

## Поддерживаемые HTTP-методы

Next.js поддерживает следующие методы: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`.

Каждый метод — это отдельная экспортируемая функция в файле `route.ts`:

```typescript
// app/api/products/route.ts

export async function GET(request: Request) {
  const products = await db.products.findAll()
  return Response.json(products)
}

export async function POST(request: Request) {
  const body = await request.json()
  const product = await db.products.create(body)
  return Response.json(product, { status: 201 })
}
```

Если обратиться к эндпоинту с методом, который не определён в файле, Next.js автоматически вернёт `405 Method Not Allowed`.

Метод `OPTIONS` Next.js генерирует автоматически на основе определённых методов, проставляя заголовок `Allow`.

## Объекты Request и Response

Route Handlers работают со стандартными Web API. Функция получает объект `Request` и должна вернуть объект `Response`.

### Чтение данных из запроса

```typescript
// app/api/echo/route.ts

export async function POST(request: Request) {
  // JSON-тело
  const body = await request.json()

  // Текстовое тело
  // const text = await request.text()

  // FormData
  // const formData = await request.formData()

  return Response.json({ received: body })
}
```

Тело запроса можно прочитать только **один раз**. Если нужно прочитать его дважды (например, для логирования и обработки), используйте `request.clone()`:

```typescript
export async function POST(request: Request) {
  const cloned = request.clone()

  const bodyForLog = await cloned.text()
  console.log('Incoming body:', bodyForLog)

  const data = await request.json()
  // обрабатываем data

  return Response.json({ ok: true })
}
```

### Формирование ответа

```typescript
export async function GET() {
  // JSON-ответ
  return Response.json({ message: 'Hello' })

  // Ответ с кастомным статусом и заголовками
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  })

  // Пустой ответ
  return new Response(null, { status: 204 })
}
```

## NextRequest и NextResponse

Next.js предоставляет расширенные версии стандартных объектов — `NextRequest` и `NextResponse`. Они добавляют удобные методы поверх Web API.

`NextRequest` добавляет свойство `nextUrl` — объект с разобранными данными URL:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  const page = searchParams.get('page') ?? '1'
  const limit = searchParams.get('limit') ?? '10'

  return NextResponse.json({
    pathname,
    page: Number(page),
    limit: Number(limit),
  })
}
```

`NextResponse` предоставляет статические методы `json()`, `redirect()` и `rewrite()`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const isLoggedIn = checkAuth(request)

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.json({ user: 'John' })
}
```

## Query-параметры

Чтение параметров строки запроса через `nextUrl.searchParams`:

```typescript
import { NextRequest } from 'next/server'

// GET /api/search?query=typescript&category=tutorials&page=2
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')
  const category = request.nextUrl.searchParams.get('category')
  const page = Number(request.nextUrl.searchParams.get('page') ?? 1)

  if (!query) {
    return Response.json({ error: 'query is required' }, { status: 400 })
  }

  const results = await searchService.find({ query, category, page })
  return Response.json(results)
}
```

## Динамические маршруты

Для эндпоинтов с переменными сегментами используется та же конвенция именования папок, что и для страниц: `[param]`.

```
app/api/users/[id]/route.ts  →  /api/users/:id
app/api/posts/[...slug]/route.ts  →  /api/posts/*
```

Параметры маршрута передаются вторым аргументом функции:

```typescript
// app/api/users/[id]/route.ts

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  const { id } = await params

  const user = await db.users.findById(id)

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  return Response.json(user)
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  const { id } = await params

  await db.users.deleteById(id)
  return new Response(null, { status: 204 })
}
```

Для catch-all маршрутов параметр будет массивом:

```typescript
// app/api/files/[...path]/route.ts
// Обрабатывает /api/files/docs/guide/intro

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const filePath = path.join('/')
  // filePath === 'docs/guide/intro'

  const file = await storage.get(filePath)
  return new Response(file)
}
```

## Работа с заголовками и cookies

### Чтение заголовков

```typescript
import { headers } from 'next/headers'

export async function GET(request: Request) {
  // Через функцию headers() из next/headers
  const headersList = await headers()
  const authorization = headersList.get('authorization')

  // Или через объект request
  const contentType = request.headers.get('content-type')

  return Response.json({ authorization, contentType })
}
```

### Чтение и установка cookies

```typescript
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Чтение
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return Response.json({ authenticated: true })
}

export async function POST(request: Request) {
  const { username, password } = await request.json()
  const token = await authService.login(username, password)

  const response = NextResponse.json({ success: true })

  // Установка cookie через объект ответа
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  return response
}
```

## Обработка FormData

Route Handlers умеют принимать данные форм и файлы:

```typescript
// app/api/upload/route.ts

export async function POST(request: Request) {
  const formData = await request.formData()

  const title = formData.get('title') as string
  const file = formData.get('file') as File

  if (!file || file.size === 0) {
    return Response.json({ error: 'File is required' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await storage.upload(buffer, file.name)

  return Response.json({ title, url }, { status: 201 })
}
```

## Обработка ошибок

Оборачивайте операции, которые могут выбросить исключение, в `try/catch`:

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await processData(body)
    return Response.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    // Не отправляйте клиенту чувствительные детали ошибки
    return new Response('Internal server error', { status: 500 })
  }
}
```

## Вебхуки

Route Handlers — идеальное место для приёма вебхуков от сторонних сервисов. Например, вебхук от платёжной системы:

```typescript
// app/api/webhooks/payment/route.ts
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-webhook-signature')
  const body = await request.text()

  // Верифицируем подпись вебхука
  const isValid = verifyWebhookSignature(
    body,
    signature,
    process.env.WEBHOOK_SECRET!
  )

  if (!isValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)

  switch (event.type) {
    case 'payment.succeeded':
      await ordersService.markAsPaid(event.data.orderId)
      break
    case 'payment.failed':
      await ordersService.markAsFailed(event.data.orderId)
      break
  }

  return new Response(null, { status: 204 })
}
```

## Перенаправления

```typescript
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    redirect('/error?reason=missing_code')
  }

  const token = await exchangeCodeForToken(code)

  // NextResponse.redirect для ответа с установкой cookies
  const response = NextResponse.redirect(new URL('/dashboard', request.url))
  response.cookies.set('session', token, { httpOnly: true })
  return response
}
```

## Когда использовать Route Handlers

Важно понимать, что Route Handlers — не единственный способ выполнить серверный код в Next.js. Выбор зависит от задачи:

**Route Handlers подходят для:**
- Публичных API-эндпоинтов, к которым обращаются сторонние клиенты
- Приёма вебхуков от внешних сервисов
- Отдачи не-HTML контента: JSON, XML, файлов
- Прокси к сторонним API (скрытие ключей от клиента)

**Server Components подходят лучше для:**
- Получения данных при рендеринге страницы — напрямую из базы данных, без лишнего HTTP round-trip

**Server Actions подходят лучше для:**
- Мутаций данных, инициированных пользователем из формы или клиентского компонента

Примечание: не обращайтесь к Route Handlers из Server Components — это создаёт ненужный HTTP round-trip к собственному серверу. Вместо этого вызывайте функции получения данных напрямую.

## Итог

Route Handlers в Next.js App Router — это мощный инструмент для создания серверных HTTP-эндпоинтов. Они строятся на стандартных Web API (`Request`/`Response`), что упрощает переносимость кода. Основные возможности: поддержка всех HTTP-методов, динамические маршруты, работа с cookies и заголовками, обработка JSON и FormData, приём вебхуков.

Освоить Route Handlers и все возможности Next.js App Router вы можете на курсе [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=route-handlers-app-router).
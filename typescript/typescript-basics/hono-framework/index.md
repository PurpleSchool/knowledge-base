---
metaTitle: "TypeScript с Hono фреймворком — полное руководство"
metaDescription: "Как использовать Hono с TypeScript: маршруты, middleware, валидация, типобезопасные запросы и ответы. Примеры кода и лучшие практики."
author: "Антон Ларичев"
title: "TypeScript с Hono: типобезопасный веб-фреймворк"
preview: "Hono — лёгкий и быстрый веб-фреймворк с первоклассной поддержкой TypeScript. Разбираем маршрутизацию, middleware и валидацию с типами."
---

## Что такое Hono

Hono (яп. «пламя») — ультралёгкий веб-фреймворк для TypeScript и JavaScript, изначально созданный для Cloudflare Workers. Сегодня он работает на любой среде выполнения: Node.js, Bun, Deno, Vercel Edge, AWS Lambda и других.

Главное преимущество Hono перед Express или Fastify — это сквозная типобезопасность. Типы параметров маршрута, тела запроса и ответа выводятся автоматически из схем валидации, без ручных аннотаций.

## Установка и начало работы

Для Node.js-проекта:

```bash
npm init -y
npm install hono
npm install -D typescript @types/node tsx
npx tsc --init
```

Минимальный сервер:

```typescript
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello, Hono!')
})

serve({ fetch: app.fetch, port: 3000 })
```

Для Bun установка ещё проще — Bun встроен в среду выполнения Hono:

```bash
bun create hono my-app
cd my-app
bun run dev
```

## Типизированный контекст

Центральный объект в Hono — `Context` (обычно именуется `c`). Он инкапсулирует запрос и ответ, предоставляя строго типизированный интерфейс.

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/hello', (c) => {
  // c.req — типизированный запрос
  const name = c.req.query('name') // string | undefined
  
  // c.json, c.text, c.html — типизированные хелперы ответа
  return c.json({ message: `Hello, ${name ?? 'World'}` })
})
```

## Параметры маршрута с типами

Hono автоматически выводит тип параметров из строки пути:

```typescript
import { Hono } from 'hono'

const app = new Hono()

// TypeScript знает, что c.req.param('id') — string
app.get('/users/:id', (c) => {
  const id = c.req.param('id') // тип: string
  return c.json({ userId: id })
})

// Несколько параметров
app.get('/posts/:postId/comments/:commentId', (c) => {
  const postId = c.req.param('postId')     // string
  const commentId = c.req.param('commentId') // string
  return c.json({ postId, commentId })
})
```

## Переменные окружения и типизация приложения

Hono поддерживает дженерики для типизации переменных окружения, переменных в контексте и входных данных:

```typescript
import { Hono } from 'hono'

// Тип описывает форму переменных окружения и контекста
type Bindings = {
  DB_URL: string
  API_KEY: string
}

type Variables = {
  userId: number
  role: 'admin' | 'user'
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('*', async (c, next) => {
  // c.env.DB_URL и c.env.API_KEY — типизированы
  console.log(c.env.DB_URL)
  
  // Устанавливаем значение в контексте
  c.set('userId', 42)
  c.set('role', 'admin')
  await next()
})

app.get('/profile', (c) => {
  const userId = c.get('userId') // тип: number
  const role = c.get('role')     // тип: 'admin' | 'user'
  return c.json({ userId, role })
})
```

## Валидация с Zod

Hono предоставляет middleware-валидатор `@hono/zod-validator`, который связывает схему Zod с типами запроса. Это главная киллер-фича фреймворка — тело запроса, параметры и query-строка получают точные TypeScript-типы.

```bash
npm install zod @hono/zod-validator
```

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

const userSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().int().min(18).optional(),
})

// Валидация тела запроса
app.post('/users', zValidator('json', userSchema), (c) => {
  // data полностью типизирована по схеме Zod
  const data = c.req.valid('json')
  // data: { name: string; email: string; age?: number }
  
  return c.json({ created: data }, 201)
})

// Валидация query-параметров
const querySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
})

app.get('/users', zValidator('query', querySchema), (c) => {
  const { page, limit } = c.req.valid('query')
  // page: number, limit: number
  
  return c.json({ page, limit, data: [] })
})
```

При невалидных данных Hono автоматически вернёт ответ `400 Bad Request` с описанием ошибок валидации.

## Middleware

Middleware в Hono — это асинхронные функции с доступом к `Context` и функции `next`. Типизация работает сквозь всю цепочку.

```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { bearerAuth } from 'hono/bearer-auth'

const app = new Hono()

// Встроенные middleware
app.use('*', logger())
app.use('/api/*', cors())

// Кастомный middleware для аутентификации
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  // Декодируем токен и сохраняем данные пользователя
  c.set('userId', 123) // тип выводится из Variables
  await next()
})

// Middleware для замера времени
app.use('*', async (c, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  c.res.headers.set('X-Response-Time', `${duration}ms`)
})
```

## Группировка маршрутов

Hono поддерживает вложенные роутеры, что позволяет разбить приложение на модули с полным сохранением типов:

```typescript
import { Hono } from 'hono'

// users.ts
const usersRouter = new Hono()

usersRouter.get('/', (c) => c.json([{ id: 1, name: 'Alice' }]))
usersRouter.get('/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ id, name: 'Alice' })
})
usersRouter.post('/', async (c) => {
  const body = await c.req.json()
  return c.json(body, 201)
})

// posts.ts
const postsRouter = new Hono()

postsRouter.get('/', (c) => c.json([]))
postsRouter.post('/', async (c) => {
  const body = await c.req.json()
  return c.json(body, 201)
})

// app.ts — основное приложение
const app = new Hono()

app.route('/users', usersRouter)
app.route('/posts', postsRouter)

export default app
```

## RPC — типизированный клиент

Одна из уникальных возможностей Hono — генерация типизированного клиента прямо из определения роутера. Серверные и клиентские типы синхронизированы без кодогенерации.

```typescript
// server.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()
  .get('/books', (c) => {
    return c.json([
      { id: 1, title: 'TypeScript Deep Dive' },
      { id: 2, title: 'Clean Code' },
    ])
  })
  .post(
    '/books',
    zValidator('json', z.object({ title: z.string() })),
    async (c) => {
      const { title } = c.req.valid('json')
      return c.json({ id: 3, title }, 201)
    }
  )

export type AppType = typeof app
export default app
```

```typescript
// client.ts
import { hc } from 'hono/client'
import type { AppType } from './server'

const client = hc<AppType>('http://localhost:3000')

async function main() {
  // Полная автодополнение и проверка типов
  const res = await client.books.$get()
  const books = await res.json()
  // books: { id: number; title: string }[]
  
  const newBook = await client.books.$post({
    json: { title: 'Hono in Action' },
  })
  const created = await newBook.json()
  // created: { id: number; title: string }
}

main()
```

Этот паттерн называется RPC (Remote Procedure Call) и устраняет необходимость в отдельных инструментах вроде OpenAPI-кодогенерации или tRPC.

## Обработка ошибок

```typescript
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

// Бросаем типизированные HTTP-исключения
app.get('/users/:id', async (c) => {
  const id = Number(c.req.param('id'))
  
  if (isNaN(id)) {
    throw new HTTPException(400, { message: 'Invalid user ID' })
  }
  
  const user = await getUserById(id)
  
  if (!user) {
    throw new HTTPException(404, { message: 'User not found' })
  }
  
  return c.json(user)
})

// Глобальный обработчик ошибок
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      { error: err.message },
      err.status
    )
  }
  
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

// Обработчик 404
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

async function getUserById(id: number) {
  // Имитация запроса к БД
  return id === 1 ? { id: 1, name: 'Alice' } : null
}
```

## Полный пример REST API

Соберём всё вместе — типизированный REST API с валидацией, аутентификацией и обработкой ошибок:

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { z } from 'zod'

type Variables = {
  currentUserId: number
}

const app = new Hono<{ Variables: Variables }>()

// Глобальное логирование
app.use('*', logger())

// --- Схемы ---

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
})

const updateTaskSchema = createTaskSchema.partial()

const querySchema = z.object({
  priority: z.enum(['low', 'medium', 'high']).optional(),
  page: z.coerce.number().int().positive().default(1),
})

// --- Хранилище (заглушка) ---

type Task = {
  id: number
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}

const tasks: Task[] = [
  { id: 1, title: 'Изучить Hono', priority: 'high', createdAt: new Date().toISOString() },
]
let nextId = 2

// --- Middleware аутентификации ---

app.use('/api/*', async (c, next) => {
  const token = c.req.header('X-User-Id')
  if (!token) {
    throw new HTTPException(401, { message: 'Authentication required' })
  }
  c.set('currentUserId', Number(token))
  await next()
})

// --- Маршруты ---

const api = new Hono<{ Variables: Variables }>()

api.get('/tasks', zValidator('query', querySchema), (c) => {
  const { priority, page } = c.req.valid('query')
  const pageSize = 10
  
  let result = tasks
  if (priority) {
    result = tasks.filter((t) => t.priority === priority)
  }
  
  const paginated = result.slice((page - 1) * pageSize, page * pageSize)
  return c.json({ data: paginated, total: result.length, page })
})

api.post('/tasks', zValidator('json', createTaskSchema), (c) => {
  const input = c.req.valid('json')
  const task: Task = {
    id: nextId++,
    ...input,
    createdAt: new Date().toISOString(),
  }
  tasks.push(task)
  return c.json(task, 201)
})

api.get('/tasks/:id', (c) => {
  const id = Number(c.req.param('id'))
  const task = tasks.find((t) => t.id === id)
  if (!task) {
    throw new HTTPException(404, { message: 'Task not found' })
  }
  return c.json(task)
})

api.patch('/tasks/:id', zValidator('json', updateTaskSchema), (c) => {
  const id = Number(c.req.param('id'))
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx === -1) {
    throw new HTTPException(404, { message: 'Task not found' })
  }
  const updates = c.req.valid('json')
  tasks[idx] = { ...tasks[idx], ...updates }
  return c.json(tasks[idx])
})

api.delete('/tasks/:id', (c) => {
  const id = Number(c.req.param('id'))
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx === -1) {
    throw new HTTPException(404, { message: 'Task not found' })
  }
  tasks.splice(idx, 1)
  return c.body(null, 204)
})

// Подключаем роутер
app.route('/api', api)

// Обработчики ошибок
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  return c.json({ error: 'Internal Server Error' }, 500)
})

app.notFound((c) => c.json({ error: 'Not Found' }, 404))

export default app
```

## Запуск на Node.js

```typescript
import { serve } from '@hono/node-server'
import app from './app'

serve({
  fetch: app.fetch,
  port: 3000,
}, (info) => {
  console.log(`Server running at http://localhost:${info.port}`)
})
```

## Тестирование

Hono предоставляет утилиту `testClient` для юнит-тестирования без поднятия реального сервера:

```typescript
import { testClient } from 'hono/testing'
import app from './app'

test('GET /api/tasks возвращает список', async () => {
  const client = testClient(app)
  
  const res = await client.api.tasks.$get(
    { query: { page: '1' } },
    { headers: { 'X-User-Id': '1' } }
  )
  
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(Array.isArray(body.data)).toBe(true)
})

test('POST /api/tasks создаёт задачу', async () => {
  const client = testClient(app)
  
  const res = await client.api.tasks.$post(
    { json: { title: 'Test task', priority: 'low' } },
    { headers: { 'X-User-Id': '1' } }
  )
  
  expect(res.status).toBe(201)
  const task = await res.json()
  expect(task.title).toBe('Test task')
})
```

## Когда выбирать Hono

Hono особенно хорошо подходит если:

- нужен деплой на edge-платформы (Cloudflare Workers, Vercel Edge)
- важна минимальная задержка и маленький размер бандла
- требуется сквозная типобезопасность без кодогенерации
- проект использует Bun или Deno
- хочется единого API для сервера и клиента через RPC

Для монолитных Node.js-приложений с большой экосистемой плагинов Fastify или NestJS могут быть более подходящим выбором.

---

Чтобы глубоко разобраться в TypeScript и уверенно использовать его в реальных проектах — пройдите курс [TypeScript на PurpleSchool](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-hono).
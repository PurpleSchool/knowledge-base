---
metaTitle: "Drizzle ORM в Next.js: настройка и использование"
metaDescription: "Подключение Drizzle ORM к Next.js: схемы, миграции, CRUD-запросы, работа с PostgreSQL и Server Actions."
author: "Антон Ларичев"
title: "Drizzle ORM — настройка и использование в Next.js"
preview: "Как подключить Drizzle ORM к проекту на Next.js, определить схемы, запустить миграции и использовать типобезопасные запросы в Server Actions и Route Handlers."
---

## Что такое Drizzle ORM

Drizzle ORM — это типобезопасная ORM для TypeScript, которая работает непосредственно поверх SQL. В отличие от Prisma, Drizzle не генерирует отдельный клиент и не запускает отдельный процесс — это просто тонкая обёртка над SQL-запросами со строгой типизацией.

Главные преимущества Drizzle:

- Схема описывается на TypeScript, а не в отдельном DSL-файле
- Запросы пишутся в стиле, близком к SQL, что упрощает отладку
- Нет N+1 проблем по умолчанию — вы контролируете каждый JOIN
- Поддерживает PostgreSQL, MySQL, SQLite
- Минимальный оверхед в рантайме

## Установка

Для работы с PostgreSQL (рекомендуется для продакшена) устанавливаем Drizzle и драйвер `postgres`:

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

Для разработки и прототипов удобен SQLite:

```bash
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3
```

В этой статье используется PostgreSQL как наиболее распространённый выбор для продакшн-проектов на Next.js.

## Настройка подключения к базе данных

Создаём файл подключения `src/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const client = postgres(process.env.DATABASE_URL!)

export const db = drizzle(client, { schema })
```

Переменную окружения прописываем в `.env.local`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
```

### Синглтон-паттерн для development-режима

В Next.js при горячей перезагрузке модули пересоздаются, что приводит к росту числа соединений с базой. Используем глобальный синглтон:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined
}

const client =
  globalForDb.client ?? postgres(process.env.DATABASE_URL!)

if (process.env.NODE_ENV !== 'production') {
  globalForDb.client = client
}

export const db = drizzle(client, { schema })
```

## Определение схемы

Схема в Drizzle — это обычные TypeScript-объекты. Создаём файл `src/db/schema.ts`:

```typescript
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  published: boolean('published').default(false).notNull(),
  authorId: integer('author_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

### Описание связей

Для удобных запросов с JOIN описываем связи отдельно:

```typescript
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}))
```

Отношения в Drizzle используются только для `db.query.*` API и не создают колонок в базе данных.

## Настройка Drizzle Kit для миграций

Создаём файл `drizzle.config.ts` в корне проекта:

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

Добавляем скрипты в `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:push": "drizzle-kit push"
  }
}
```

### Генерация и применение миграций

После изменения схемы генерируем SQL-миграцию:

```bash
npm run db:generate
```

Команда создаёт SQL-файл в папке `drizzle/`. Применяем миграцию:

```bash
npm run db:migrate
```

Для быстрого прототипирования можно использовать `db:push` — она синхронизирует схему с базой без создания файлов миграций. В продакшене используйте только `db:migrate`.

## CRUD-операции

### Создание записей

```typescript
import { db } from '@/db'
import { users, posts } from '@/db/schema'

// Создать одного пользователя
const [newUser] = await db
  .insert(users)
  .values({
    name: 'Иван Петров',
    email: 'ivan@example.com',
  })
  .returning()

// Создать несколько постов сразу
const newPosts = await db
  .insert(posts)
  .values([
    { title: 'Первый пост', authorId: newUser.id },
    { title: 'Второй пост', content: 'Текст', authorId: newUser.id },
  ])
  .returning()
```

### Чтение данных

```typescript
import { eq, and, desc, like, count } from 'drizzle-orm'

// Получить всех пользователей
const allUsers = await db.select().from(users)

// Получить пользователя по id
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.id, 1))

// Выбрать только нужные поля
const userEmails = await db
  .select({ id: users.id, email: users.email })
  .from(users)

// Пагинация
const page = 1
const pageSize = 10
const paginatedUsers = await db
  .select()
  .from(users)
  .orderBy(desc(users.createdAt))
  .limit(pageSize)
  .offset((page - 1) * pageSize)

// Поиск по подстроке
const found = await db
  .select()
  .from(users)
  .where(like(users.name, '%Иван%'))

// Подсчёт записей
const [{ total }] = await db
  .select({ total: count() })
  .from(posts)
  .where(eq(posts.published, true))
```

### JOIN-запросы

```typescript
// Получить посты с данными автора
const postsWithAuthors = await db
  .select({
    postId: posts.id,
    title: posts.title,
    authorName: users.name,
    authorEmail: users.email,
  })
  .from(posts)
  .innerJoin(users, eq(posts.authorId, users.id))
  .where(eq(posts.published, true))
  .orderBy(desc(posts.createdAt))
```

### Relational API — удобная альтернатива JOIN

Eсли описаны relations, можно использовать более читаемый синтаксис:

```typescript
// Получить пользователя со всеми его постами
const userWithPosts = await db.query.users.findFirst({
  where: eq(users.id, 1),
  with: {
    posts: {
      where: eq(posts.published, true),
      orderBy: desc(posts.createdAt),
    },
  },
})

// Получить все посты с автором
const allPosts = await db.query.posts.findMany({
  with: {
    author: true,
  },
})
```

### Обновление записей

```typescript
import { eq } from 'drizzle-orm'

// Обновить одну запись
const [updated] = await db
  .update(users)
  .set({ name: 'Новое имя' })
  .where(eq(users.id, 1))
  .returning()

// Опубликовать все черновики конкретного автора
await db
  .update(posts)
  .set({ published: true })
  .where(
    and(
      eq(posts.authorId, 1),
      eq(posts.published, false)
    )
  )
```

### Удаление записей

```typescript
// Удалить пост по id
const [deleted] = await db
  .delete(posts)
  .where(eq(posts.id, 5))
  .returning()

// Удалить всех пользователей без постов (подзапрос)
import { notInArray } from 'drizzle-orm'

const authorsIds = await db
  .select({ id: posts.authorId })
  .from(posts)

await db
  .delete(users)
  .where(
    notInArray(
      users.id,
      authorsIds.map((r) => r.id)
    )
  )
```

## Использование в Next.js

### Server Actions

Server Actions — рекомендуемый способ работы с базой данных в Next.js App Router. Drizzle идеально вписывается в этот паттерн:

```typescript
// src/app/posts/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { posts } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  if (!title?.trim()) {
    throw new Error('Заголовок обязателен')
  }

  await db.insert(posts).values({
    title,
    content,
    authorId: 1, // в реальном приложении берётся из сессии
  })

  revalidatePath('/posts')
  redirect('/posts')
}

export async function deletePost(id: number) {
  await db.delete(posts).where(eq(posts.id, id))
  revalidatePath('/posts')
}

export async function togglePublished(id: number, published: boolean) {
  await db
    .update(posts)
    .set({ published: !published })
    .where(eq(posts.id, id))

  revalidatePath('/posts')
}
```

### Route Handlers

Для REST API используем Route Handlers:

```typescript
// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { posts, users } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const authorId = searchParams.get('authorId')

  const query = db
    .select({
      id: posts.id,
      title: posts.title,
      published: posts.published,
      authorName: users.name,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .orderBy(desc(posts.createdAt))

  if (authorId) {
    query.where(eq(posts.authorId, Number(authorId)))
  }

  const result = await query
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, content, authorId } = body

  const [post] = await db
    .insert(posts)
    .values({ title, content, authorId })
    .returning()

  return NextResponse.json(post, { status: 201 })
}
```

```typescript
// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { posts } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [deleted] = await db
    .delete(posts)
    .where(eq(posts.id, Number(id)))
    .returning()

  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(deleted)
}
```

### Server Components

В Server Components данные можно запрашивать напрямую:

```typescript
// src/app/posts/page.tsx
import { db } from '@/db'
import { posts, users } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'

export default async function PostsPage() {
  const allPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      authorName: users.name,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.published, true))
    .orderBy(desc(posts.createdAt))

  return (
    <ul>
      {allPosts.map((post) => (
        <li key={post.id}>
          <strong>{post.title}</strong> — {post.authorName}
        </li>
      ))}
    </ul>
  )
}
```

## Транзакции

Для операций, которые должны выполняться атомарно:

```typescript
import { db } from '@/db'
import { users, posts } from '@/db/schema'

async function createUserWithPosts(
  userData: typeof users.$inferInsert,
  postTitles: string[]
) {
  return await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values(userData)
      .returning()

    const newPosts = await tx
      .insert(posts)
      .values(
        postTitles.map((title) => ({ title, authorId: user.id }))
      )
      .returning()

    return { user, posts: newPosts }
  })
}
```

Если внутри транзакции выбрасывается исключение, все изменения автоматически откатываются.

## Типы из схемы

Drizzle автоматически выводит TypeScript-типы из схемы:

```typescript
import { users, posts } from '@/db/schema'

// Тип для вставки (все required-поля обязательны, optional — нет)
type NewUser = typeof users.$inferInsert
// { name: string; email: string; createdAt?: Date }

// Тип выбранной записи (включает все поля с типами из БД)
type User = typeof users.$inferSelect
// { id: number; name: string; email: string; createdAt: Date }

// Удобно для типизации функций
async function getUserById(id: number): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
  return user
}
```

## Drizzle Studio

Drizzle Kit включает встроенный GUI для просмотра и редактирования данных в базе:

```bash
npm run db:studio
```

Открывает браузерный интерфейс на `https://local.drizzle.studio`, где можно просматривать таблицы, выполнять запросы и редактировать данные вручную. Удобно при разработке.

## Итог

Drizzle ORM предоставляет типобезопасный способ работы с SQL-базами данных без лишних абстракций. В экосистеме Next.js он особенно хорошо подходит для Server Actions и Server Components: запросы пишутся прямо в серверном коде, типы выводятся автоматически, а производительность остаётся высокой за счёт минимального рантайма.

Основной поток работы: описываем схему в TypeScript, генерируем миграции через Drizzle Kit, применяем их и используем типобезопасный клиент `db` во всём приложении.

Чтобы освоить Next.js на практике и научиться строить полноценные приложения с базами данных, рекомендуем курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=drizzle-orm).
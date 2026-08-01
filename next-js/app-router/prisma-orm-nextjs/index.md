---
metaTitle: "Prisma ORM в Next.js: полное руководство"
metaDescription: "Как подключить и использовать Prisma ORM в Next.js: схема, миграции, CRUD, Server Actions, транзакции и обработка ошибок."
author: "Антон Ларичев"
title: "Prisma ORM в Next.js"
preview: "Настройка Prisma ORM в Next.js с App Router: схема данных, миграции, Server Components, Server Actions и Route Handlers."
---

## Что такое Prisma ORM

Prisma — современный ORM (Object-Relational Mapping) для Node.js и TypeScript, который упрощает работу с базами данных. В отличие от традиционных ORM, Prisma предлагает декларативный подход к описанию схемы и генерирует типобезопасный клиент для взаимодействия с базой данных.

Prisma поддерживает PostgreSQL, MySQL, SQLite, SQL Server, MongoDB и CockroachDB. В Next.js проектах Prisma является одним из наиболее популярных инструментов благодаря глубокой интеграции с TypeScript и удобному API.

## Установка и настройка

### Инициализация проекта

Устанавливаем Prisma CLI как зависимость разработки и Prisma Client как основную зависимость:

```bash
npm install prisma --save-dev
npm install @prisma/client
```

Инициализируем Prisma в проекте:

```bash
npx prisma init
```

После выполнения команды в проекте появятся:
- файл `prisma/schema.prisma` — схема базы данных
- обновлённый `.env` с переменной `DATABASE_URL`

### Настройка подключения к базе данных

В файле `.env` указываем строку подключения:

```env
# PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/mydb"

# SQLite для локальной разработки
DATABASE_URL="file:./dev.db"
```

## Описание схемы данных

Файл `prisma/schema.prisma` — центральная точка конфигурации. Здесь описываются модели, которые будут преобразованы в таблицы базы данных.

### Пример схемы для блога

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Создание и применение миграций

После описания схемы создаём первую миграцию:

```bash
npx prisma migrate dev --name init
```

Эта команда создаёт файл миграции в директории `prisma/migrations/`, применяет её к базе данных и генерирует обновлённый Prisma Client.

При изменении схемы в будущем процесс повторяется:

```bash
npx prisma migrate dev --name add-tags
```

## Настройка Prisma Client в Next.js

В Next.js существует важная особенность: при горячей перезагрузке в режиме разработки может создаваться множество экземпляров Prisma Client, что приводит к ошибке превышения лимита соединений с базой данных.

Для решения этой проблемы создаём синглтон:

```typescript
// lib/prisma.ts

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

Этот паттерн использует `globalThis` для хранения единственного экземпляра клиента в режиме разработки, предотвращая создание новых соединений при каждой перезагрузке модулей.

## Работа с данными в App Router

### Server Components

В Next.js с App Router можно напрямую обращаться к Prisma из серверных компонентов без промежуточного API слоя:

```typescript
// app/posts/page.tsx

import { prisma } from '@/lib/prisma'

export default async function PostsPage() {
  const posts = await prisma.post.findMany({
    where: {
      published: true,
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <main>
      <h1>Публикации</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <h2>{post.title}</h2>
            <p>Автор: {post.author.name}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

### Route Handlers

Для работы с данными через HTTP API используем Route Handlers:

```typescript
// app/api/posts/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const published = searchParams.get('published')

  const posts = await prisma.post.findMany({
    where: published !== null ? { published: published === 'true' } : undefined,
    include: {
      author: true,
    },
  })

  return NextResponse.json(posts)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, content, authorId } = body

  const post = await prisma.post.create({
    data: {
      title,
      content,
      authorId,
    },
  })

  return NextResponse.json(post, { status: 201 })
}
```

Обработка одиночного ресурса:

```typescript
// app/api/posts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id: parseInt(id) },
    include: { author: true },
  })

  if (!post) {
    return NextResponse.json({ error: 'Пост не найден' }, { status: 404 })
  }

  return NextResponse.json(post)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const post = await prisma.post.update({
    where: { id: parseInt(id) },
    data: body,
  })

  return NextResponse.json(post)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await prisma.post.delete({
    where: { id: parseInt(id) },
  })

  return new NextResponse(null, { status: 204 })
}
```

## Server Actions

Server Actions — функции, которые выполняются на сервере, но могут вызываться из клиентских компонентов. В сочетании с Prisma они позволяют полностью убрать промежуточный API слой для форм и мутаций:

```typescript
// app/actions/posts.ts

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const authorId = parseInt(formData.get('authorId') as string)

  await prisma.post.create({
    data: {
      title,
      content,
      authorId,
    },
  })

  revalidatePath('/posts')
}

export async function publishPost(postId: number) {
  await prisma.post.update({
    where: { id: postId },
    data: { published: true },
  })

  revalidatePath('/posts')
}

export async function deletePost(postId: number) {
  await prisma.post.delete({
    where: { id: postId },
  })

  revalidatePath('/posts')
}
```

Использование Server Actions в компоненте формы:

```typescript
// app/posts/new/page.tsx

import { createPost } from '@/app/actions/posts'

export default function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Заголовок" required />
      <textarea name="content" placeholder="Содержание" />
      <input name="authorId" type="hidden" value="1" />
      <button type="submit">Создать публикацию</button>
    </form>
  )
}
```

## Продвинутые возможности Prisma

### Транзакции

Prisma поддерживает транзакции для выполнения нескольких операций атомарно. Если одна операция завершится с ошибкой, все изменения будут отменены:

```typescript
// app/api/transfer/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const { fromId, toId, amount } = await request.json()

  const [debit, credit] = await prisma.$transaction([
    prisma.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    }),
    prisma.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    }),
  ])

  return NextResponse.json({ debit, credit })
}
```

### Фильтрация и пагинация

```typescript
// app/api/users/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '10')
  const search = searchParams.get('search') ?? ''
  const skip = (page - 1) * limit

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  })
}
```

### Upsert — создание или обновление

Операция `upsert` позволяет создать запись, если она не существует, или обновить существующую:

```typescript
const user = await prisma.user.upsert({
  where: { email: 'user@example.com' },
  update: {
    name: 'Обновлённое имя',
  },
  create: {
    email: 'user@example.com',
    name: 'Новый пользователь',
  },
})
```

## Обработка ошибок Prisma

Prisma предоставляет типизированные классы ошибок, что позволяет обрабатывать разные ситуации отдельно:

```typescript
// app/api/posts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.post.delete({
      where: { id: parseInt(id) },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 })
      }
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Нарушение ограничения внешнего ключа' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
```

Основные коды ошибок Prisma:
- `P2002` — нарушение уникального ограничения (например, дублирование email)
- `P2025` — запись не найдена при попытке обновления или удаления
- `P2003` — нарушение ограничения внешнего ключа

## Сидирование базы данных

Для заполнения базы данных тестовыми данными создаём файл сида:

```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice',
      posts: {
        create: [
          {
            title: 'Введение в Prisma',
            content: 'Prisma — современный ORM для Node.js.',
            published: true,
          },
          {
            title: 'Next.js и базы данных',
            content: 'Интеграция Next.js с различными базами данных.',
            published: false,
          },
        ],
      },
    },
  })

  console.log({ alice })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
```

Добавляем скрипт запуска сида в `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Запускаем сид командой:

```bash
npx prisma db seed
```

## Prisma Studio

Prisma Studio — встроенный визуальный интерфейс для просмотра и редактирования данных:

```bash
npx prisma studio
```

После запуска открывается браузерный интерфейс на `http://localhost:5555`, где можно просматривать, добавлять и редактировать записи во всех таблицах. Это удобный инструмент для отладки во время разработки.

## Итог

Prisma ORM значительно упрощает работу с базами данных в Next.js приложениях. Типобезопасный клиент исключает целый класс ошибок ещё на этапе написания кода, декларативная схема делает структуру данных понятной, а встроенные миграции обеспечивают надёжное управление изменениями схемы. Интеграция с Server Components и Server Actions позволяет работать с данными напрямую без лишнего промежуточного слоя.

Для углублённого изучения Next.js и построения полноценных приложений с базами данных рекомендуем курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=prisma-orm-nextjs).
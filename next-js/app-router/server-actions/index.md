---
metaTitle: "Server Actions в Next.js — мутации без API-роутов"
metaDescription: "Разбираем Server Actions в Next.js: как создавать, вызывать из форм и клиентских компонентов, обрабатывать ошибки и ревалидировать кэш."
author: "Антон Ларичев"
title: "Server Actions в Next.js"
preview: "Server Actions позволяют выполнять серверный код прямо из компонентов без написания отдельных API-роутов — разбираем синтаксис, паттерны и подводные камни."
---

## Что такое Server Actions

Server Actions — это асинхронные функции, которые выполняются на сервере, но могут вызываться как из серверных, так и из клиентских компонентов. Они позволяют мутировать данные (создание, обновление, удаление) без необходимости писать отдельные API-роуты.

Под капотом Next.js генерирует уникальный HTTP POST-эндпоинт для каждого Server Action. При вызове из браузера отправляется POST-запрос на этот эндпоинт, а результат возвращается обратно в компонент.

```typescript
// app/actions/user.ts
'use server'

export async function createUser(name: string, email: string) {
  const user = await db.user.create({
    data: { name, email }
  })
  return user
}
```

Директива `'use server'` в начале файла или функции сообщает Next.js, что этот код должен выполняться исключительно на сервере.

## Способы определения Server Actions

### Файл с директивой на уровне модуля

Самый распространённый подход — вынести все экшены в отдельный файл и поставить `'use server'` в самом начале. Тогда все экспортируемые функции из этого файла автоматически становятся Server Actions.

```typescript
// app/actions/posts.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(title: string, content: string) {
  await db.post.create({ data: { title, content } })
  revalidatePath('/posts')
}

export async function deletePost(id: number) {
  await db.post.delete({ where: { id } })
  revalidatePath('/posts')
  redirect('/posts')
}

export async function updatePost(id: number, data: { title?: string; content?: string }) {
  return db.post.update({ where: { id }, data })
}
```

### Инлайн-определение в серверном компоненте

Внутри серверного компонента можно объявить экшен прямо в теле компонента, поставив `'use server'` внутри функции:

```typescript
// app/posts/new/page.tsx
export default function NewPostPage() {
  async function handleSubmit(formData: FormData) {
    'use server'

    const title = formData.get('title') as string
    const content = formData.get('content') as string

    await db.post.create({ data: { title, content } })
    redirect('/posts')
  }

  return (
    <form action={handleSubmit}>
      <input name="title" placeholder="Заголовок" />
      <textarea name="content" placeholder="Содержание" />
      <button type="submit">Создать</button>
    </form>
  )
}
```

Обратите внимание: инлайн-экшены доступны только внутри серверных компонентов. В клиентских компонентах можно использовать только экшены, импортированные из файлов с `'use server'`.

## Работа с формами

### Нативная HTML-форма

Server Actions идеально интегрируются с HTML-формами через атрибут `action`. Это особенно важно: форма будет работать даже при отключённом JavaScript в браузере (Progressive Enhancement).

```typescript
// app/contact/page.tsx
export default function ContactPage() {
  async function submitContact(formData: FormData) {
    'use server'

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const message = formData.get('message') as string

    if (!name || !email || !message) {
      throw new Error('Все поля обязательны')
    }

    await db.contactMessage.create({
      data: { name, email, message }
    })

    redirect('/contact/success')
  }

  return (
    <form action={submitContact}>
      <input name="name" type="text" required />
      <input name="email" type="email" required />
      <textarea name="message" required />
      <button type="submit">Отправить</button>
    </form>
  )
}
```

### Передача дополнительных данных через bind

Часто нужно передать в экшен данные, которых нет в форме — например, ID записи при редактировании. Для этого используют метод `.bind()`:

```typescript
// app/posts/[id]/edit/page.tsx
import { updatePost } from '@/app/actions/posts'

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const post = await db.post.findUnique({ where: { id: Number(params.id) } })

  const updatePostWithId = updatePost.bind(null, Number(params.id))

  return (
    <form action={updatePostWithId}>
      <input name="title" defaultValue={post?.title} />
      <textarea name="content" defaultValue={post?.content} />
      <button type="submit">Сохранить</button>
    </form>
  )
}
```

```typescript
// app/actions/posts.ts
'use server'

export async function updatePost(id: number, formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  await db.post.update({
    where: { id },
    data: { title, content }
  })

  revalidatePath(`/posts/${id}`)
  redirect(`/posts/${id}`)
}
```

Первый аргумент функции (`id`) будет передан через `bind`, а `formData` Next.js подставит автоматически.

## Вызов из клиентских компонентов

Клиентские компоненты не могут определять Server Actions, но могут их импортировать и вызывать напрямую как обычные асинхронные функции.

```typescript
// app/components/DeleteButton.tsx
'use client'

import { deletePost } from '@/app/actions/posts'
import { useState } from 'react'

export function DeleteButton({ postId }: { postId: number }) {
  const [isPending, setIsPending] = useState(false)

  async function handleDelete() {
    setIsPending(true)
    try {
      await deletePost(postId)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button onClick={handleDelete} disabled={isPending}>
      {isPending ? 'Удаление...' : 'Удалить'}
    </button>
  )
}
```

### Хук useActionState

Для работы с состоянием формы Next.js предоставляет хук `useActionState` (в Next.js 14 он назывался `useFormState`, но был перемещён в React 19):

```typescript
// app/actions/auth.ts
'use server'

export type LoginState = {
  error?: string
  success?: boolean
}

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const user = await db.user.findUnique({ where: { email } })

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: 'Неверный email или пароль' }
  }

  await createSession(user.id)
  return { success: true }
}
```

```typescript
// app/components/LoginForm.tsx
'use client'

import { useActionState } from 'react'
import { loginAction } from '@/app/actions/auth'

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, {})

  return (
    <form action={formAction}>
      {state.error && <p style={{ color: 'red' }}>{state.error}</p>}
      {state.success && <p>Вход выполнен успешно!</p>}

      <input name="email" type="email" required />
      <input name="password" type="password" required />

      <button type="submit" disabled={isPending}>
        {isPending ? 'Вход...' : 'Войти'}
      </button>
    </form>
  )
}
```

Хук `useActionState` принимает экшен и начальное состояние, возвращает текущее состояние, обёрнутый экшен для формы и флаг `isPending`.

## Ревалидация кэша

После мутации данных нужно сбросить кэш, чтобы пользователь увидел актуальные данные. Next.js предоставляет две функции:

```typescript
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

export async function createComment(postId: number, text: string) {
  await db.comment.create({ data: { postId, text } })

  // Инвалидировать по пути — сбросит кэш страницы /posts/[id]
  revalidatePath(`/posts/${postId}`)

  // Инвалидировать по тегу — сбросит все fetch-запросы с этим тегом
  revalidateTag('comments')
}
```

Теги назначаются при fetch-запросах:

```typescript
// При загрузке данных
const comments = await fetch('/api/comments', {
  next: { tags: ['comments'] }
})
```

## Обработка ошибок

Server Actions могут выбрасывать исключения. Важно понимать разницу между двумя сценариями:

```typescript
'use server'

export async function deleteComment(id: number) {
  const comment = await db.comment.findUnique({ where: { id } })

  if (!comment) {
    // Эта ошибка будет поймана error.tsx или try/catch в клиентском коде
    throw new Error('Комментарий не найден')
  }

  await db.comment.delete({ where: { id } })
  revalidatePath('/')
}
```

В клиентском компоненте ошибки нужно ловить через try/catch:

```typescript
'use client'

async function handleDelete(id: number) {
  try {
    await deleteComment(id)
  } catch (error) {
    if (error instanceof Error) {
      setError(error.message)
    }
  }
}
```

В серверных компонентах необработанные ошибки из экшенов перехватывает ближайший `error.tsx`.

## Валидация с Zod

Для надёжной валидации входных данных рекомендуется использовать Zod:

```typescript
'use server'

import { z } from 'zod'

const CreatePostSchema = z.object({
  title: z.string().min(3, 'Минимум 3 символа').max(100, 'Максимум 100 символов'),
  content: z.string().min(10, 'Минимум 10 символов'),
})

export type CreatePostState = {
  errors?: {
    title?: string[]
    content?: string[]
  }
  message?: string
}

export async function createPost(
  prevState: CreatePostState,
  formData: FormData
): Promise<CreatePostState> {
  const validatedFields = CreatePostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Исправьте ошибки в форме',
    }
  }

  const { title, content } = validatedFields.data

  await db.post.create({ data: { title, content } })
  revalidatePath('/posts')

  return { message: 'Пост создан успешно' }
}
```

## Безопасность

Server Actions автоматически создают POST-эндпоинты, доступные из интернета. Несколько важных правил безопасности:

**Всегда проверяйте авторизацию** — не полагайтесь на то, что функция вызывается из защищённой части интерфейса:

```typescript
'use server'

import { getSession } from '@/lib/auth'

export async function deletePost(id: number) {
  const session = await getSession()

  if (!session) {
    throw new Error('Необходима авторизация')
  }

  const post = await db.post.findUnique({ where: { id } })

  // Проверяем, что пользователь владелец поста
  if (post?.authorId !== session.userId) {
    throw new Error('Нет прав для удаления этого поста')
  }

  await db.post.delete({ where: { id } })
  revalidatePath('/posts')
}
```

**Никогда не доверяйте данным из FormData без валидации** — пользователь может отправить любые данные напрямую через POST-запрос, минуя ваш интерфейс.

## Курс по Next.js на PurpleSchool

Чтобы глубже разобраться в Server Actions, App Router и современных паттернах Next.js, приходите на курс — там вы построите реальное приложение с нуля, освоите работу с базами данных, авторизацией и деплоем.

https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=server-actions

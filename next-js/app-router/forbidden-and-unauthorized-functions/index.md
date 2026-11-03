---
metaTitle: "forbidden() и unauthorized() в Next.js App Router"
metaDescription: "Как использовать функции forbidden() и unauthorized() в Next.js 15 для обработки ошибок авторизации 403 и 401 в App Router."
author: "Антон Ларичев"
title: "Функции forbidden() и unauthorized() в Next.js"
preview: "Разбираем экспериментальные функции forbidden() и unauthorized() — как обрабатывать ошибки 403 и 401 в App Router с кастомными страницами."
---

## Зачем нужны forbidden() и unauthorized()

В большинстве приложений есть как минимум два вида «отказа в доступе»:

- Пользователь **не аутентифицирован** — он ещё не вошёл в систему. HTTP-код `401 Unauthorized`.
- Пользователь аутентифицирован, но **не имеет прав** на ресурс — например, обычный пользователь пытается открыть панель администратора. HTTP-код `403 Forbidden`.

До Next.js 15.1 разработчики обходились редиректом на страницу логина или самостоятельно бросали ошибки. Это работало, но не давало стандартизированного способа вернуть корректный HTTP-статус и показать кастомный UI прямо на месте.

Функции `unauthorized()` и `forbidden()` из `next/navigation` решают обе задачи: они прерывают рендер, возвращают нужный статус-код и передают управление специальным файлам-конвенциям `unauthorized.tsx` / `forbidden.tsx`.

## Включение функциональности

Оба метода пока являются экспериментальными. Чтобы их использовать, нужно включить флаг `authInterrupts` в файле конфигурации:

```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
}

export default nextConfig
```

Без этого флага вызов `unauthorized()` или `forbidden()` приведёт к ошибке во время выполнения.

## Функция unauthorized()

### Как работает

`unauthorized()` выбрасывает специальный внутренний error, который Next.js перехватывает и:

1. Прекращает рендеринг текущего компонента.
2. Возвращает HTTP-статус `401`.
3. Рендерит ближайший файл `unauthorized.tsx` (или глобальный `app/unauthorized.tsx`).

Функция импортируется из `next/navigation` и не принимает аргументов:

```typescript
import { unauthorized } from 'next/navigation'
```

### Где можно вызывать

`unauthorized()` доступна в:

- **Server Components** — компонентах-страницах и layout-файлах (кроме корневого `app/layout.tsx`).
- **Server Actions** — серверных функциях с директивой `'use server'`.
- **Route Handlers** — файлах `route.ts`.

В Client Components вызывать нельзя — туда функция не передаётся.

### Пример в Server Component

```typescript
// app/dashboard/page.tsx
import { verifySession } from '@/lib/dal'
import { unauthorized } from 'next/navigation'

export default async function DashboardPage() {
  const session = await verifySession()

  if (!session) {
    unauthorized()
  }

  return (
    <main>
      <h1>Личный кабинет</h1>
      <p>Добро пожаловать, {session.user.name}!</p>
    </main>
  )
}
```

Если `verifySession()` вернул `null` (сессии нет), Next.js немедленно прерывает рендер страницы и показывает страницу `unauthorized.tsx`.

### Пример в Server Action

```typescript
// app/actions/update-profile.ts
'use server'

import { verifySession } from '@/lib/dal'
import { unauthorized } from 'next/navigation'
import { db } from '@/lib/db'

export async function updateProfile(formData: FormData) {
  const session = await verifySession()

  if (!session) {
    unauthorized()
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name: formData.get('name') as string,
    },
  })
}
```

### Пример в Route Handler

```typescript
// app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/dal'
import { unauthorized } from 'next/navigation'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await verifySession()

  if (!session) {
    unauthorized()
  }

  const profile = await fetchUserProfile(session.user.id)
  return NextResponse.json(profile)
}
```

## Файл-конвенция unauthorized.tsx

Чтобы настроить страницу для неаутентифицированных пользователей, создайте файл `app/unauthorized.tsx`. Он работает аналогично `app/not-found.tsx` — является глобальным fallback-ом.

```typescript
// app/unauthorized.tsx
import Link from 'next/link'
import LoginForm from '@/components/LoginForm'

export default function UnauthorizedPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1>Доступ ограничен</h1>
      <p>Войдите в систему, чтобы продолжить.</p>
      <LoginForm />
      <Link href="/">На главную</Link>
    </main>
  )
}
```

Важно: компонент не принимает никаких props. Если нужно передать дополнительный контекст (например, URL для редиректа после логина), используйте search params через middleware или cookies.

Файл можно также создавать на уровне сегмента маршрута — тогда он будет применяться только к этой ветке:

```
app/
  unauthorized.tsx          ← глобальный fallback
  dashboard/
    unauthorized.tsx        ← только для /dashboard и вложенных маршрутов
    page.tsx
```

## Функция forbidden()

### Как работает

`forbidden()` аналогична `unauthorized()`, но предназначена для случаев, когда пользователь **уже вошёл в систему**, но **не имеет нужных прав**. Возвращает HTTP-статус `403` и рендерит файл `forbidden.tsx`.

```typescript
import { forbidden } from 'next/navigation'
```

### Пример: защита страницы по роли

```typescript
// app/admin/page.tsx
import { verifySession } from '@/lib/dal'
import { forbidden } from 'next/navigation'

export default async function AdminPage() {
  const session = await verifySession()

  if (session.role !== 'admin') {
    forbidden()
  }

  return (
    <main>
      <h1>Панель администратора</h1>
      <p>Вы вошли как: {session.user.name}</p>
    </main>
  )
}
```

Здесь сессия уже есть (пользователь аутентифицирован), но роль не совпадает с требуемой — вызов `forbidden()` вернёт 403 и покажет соответствующую страницу.

### Пример в Server Action

```typescript
// app/actions/update-role.ts
'use server'

import { verifySession } from '@/lib/dal'
import { forbidden } from 'next/navigation'
import { db } from '@/lib/db'

export async function updateUserRole(
  userId: string,
  newRole: string
) {
  const session = await verifySession()

  if (session.role !== 'admin') {
    forbidden()
  }

  await db.user.update({
    where: { id: userId },
    data: { role: newRole },
  })
}
```

### Пример с проверкой владения ресурсом

```typescript
// app/posts/[id]/edit/page.tsx
import { verifySession } from '@/lib/dal'
import { forbidden, notFound } from 'next/navigation'
import { db } from '@/lib/db'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params
  const session = await verifySession()

  const post = await db.post.findUnique({ where: { id } })

  if (!post) {
    notFound()
  }

  // Редактировать может только автор или администратор
  if (post.authorId !== session.user.id && session.role !== 'admin') {
    forbidden()
  }

  return <PostEditor post={post} />
}
```

## Файл-конвенция forbidden.tsx

По аналогии с `unauthorized.tsx`, создайте `app/forbidden.tsx` для кастомизации страницы с кодом 403:

```typescript
// app/forbidden.tsx
import Link from 'next/link'

export default function ForbiddenPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1>403 — Доступ запрещён</h1>
      <p>У вас недостаточно прав для просмотра этой страницы.</p>
      <div className="flex gap-4">
        <Link href="/">На главную</Link>
        <Link href="/dashboard">В личный кабинет</Link>
      </div>
    </main>
  )
}
```

Компонент также не принимает props.

## Комбинирование unauthorized() и forbidden()

На практике часто нужно проверить сразу оба условия: сначала убедиться, что пользователь вообще аутентифицирован, затем — что у него есть нужная роль.

```typescript
// app/admin/settings/page.tsx
import { verifySession } from '@/lib/dal'
import { unauthorized, forbidden } from 'next/navigation'

export default async function AdminSettingsPage() {
  const session = await verifySession()

  // Сначала проверяем аутентификацию
  if (!session) {
    unauthorized()
  }

  // Затем авторизацию
  if (session.role !== 'admin') {
    forbidden()
  }

  return <AdminSettings />
}
```

Порядок важен: если сначала проверять роль у неаутентифицированного пользователя, это приведёт к ошибке обращения к `session.role` при `null`-сессии.

## Отличие от redirect() и notFound()

Все четыре функции прерывают рендер и передают управление Next.js — но для разных ситуаций:

| Функция | Статус | Когда использовать |
|---|---|---|
| `notFound()` | 404 | Ресурс не существует |
| `redirect()` | 307/308 | Нужно переадресовать пользователя |
| `unauthorized()` | 401 | Пользователь не аутентифицирован |
| `forbidden()` | 403 | Пользователь аутентифицирован, но нет прав |

Практическое отличие от `redirect()` при отсутствии сессии: `unauthorized()` не меняет URL браузера. Пользователь видит страницу входа прямо по тому адресу, к которому обращался. После успешного логина можно вернуть его обратно, прочитав `pathname` из `headers()`.

## Ограничения

Несколько важных ограничений, которые нужно учитывать:

**Нельзя вызывать в корневом layout.** Файл `app/layout.tsx` является обёрткой для всего приложения — вызов `unauthorized()` или `forbidden()` там приведёт к бесконечному циклу рендера, поскольку сами страницы ошибок тоже рендерятся внутри этого layout.

**Функции экспериментальные.** API может измениться в будущих версиях Next.js. Следите за release notes при обновлении.

**Нет передачи данных в страницу ошибки.** Файлы `unauthorized.tsx` и `forbidden.tsx` не получают props. Если нужно показать пользователю, к какому ресурсу он пытался получить доступ, используйте cookies или передавайте информацию через URL-параметры до вызова функции.

**Только на сервере.** Функции работают исключительно в серверном контексте. В Client Components для аналогичных задач используйте условный рендеринг или `useRouter`.

## Итого

Функции `unauthorized()` и `forbidden()` — это чистый, семантически правильный способ обработки ошибок доступа в Next.js App Router. Они устраняют необходимость в самодельных редиректах для 401/403-сценариев и дают полный контроль над UI и HTTP-статусами.

Алгоритм внедрения:

1. Включить `experimental.authInterrupts: true` в `next.config.ts`.
2. Создать `app/unauthorized.tsx` с формой входа.
3. Создать `app/forbidden.tsx` с сообщением об отсутствии прав.
4. В Server Components, Server Actions и Route Handlers вызывать нужную функцию после проверки сессии.

Для глубокого понимания работы с аутентификацией и авторизацией в Next.js — включая middleware, сессии, Data Access Layer и интеграцию с провайдерами — рекомендуем курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=forbidden-unauthorized-functions).

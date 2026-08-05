---
metaTitle: "Next.js и Supabase: авторизация и база данных"
metaDescription: "Полное руководство по интеграции Supabase с Next.js App Router: настройка авторизации, работа с базой данных и защита маршрутов."
author: "Антон Ларичев"
title: "Next.js с Supabase — авторизация и база данных"
preview: "Как подключить Supabase к Next.js App Router, настроить авторизацию через email и OAuth, работать с базой данных и защищать серверные маршруты."
---

Supabase — это open-source альтернатива Firebase, которая предоставляет PostgreSQL базу данных, авторизацию, хранилище файлов и realtime-подписки через единый API. В связке с Next.js App Router она позволяет строить полноценные fullstack-приложения без отдельного бэкенда.

В этой статье разберём, как подключить Supabase к проекту на Next.js 14+, настроить авторизацию через email и OAuth, работать с базой данных и защищать маршруты на серверной стороне.

## Создание проекта Supabase

Перейдите на [supabase.com](https://supabase.com), создайте аккаунт и новый проект. После инициализации (занимает около минуты) вам понадобятся две переменные из раздела **Settings → API**:

- `Project URL` — адрес вашего проекта
- `anon public` — публичный ключ для клиентского кода

Для серверных операций с повышенными привилегиями также сохраните `service_role` ключ — он даёт полный обход Row Level Security.

## Установка зависимостей

Supabase предоставляет официальный пакет для Next.js, который корректно работает с серверными компонентами и Server Actions:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Пакет `@supabase/ssr` решает проблему работы с cookies в среде Next.js — он умеет читать и писать cookies как на клиенте, так и в Server Components, Route Handlers и Middleware.

## Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Префикс `NEXT_PUBLIC_` делает переменную доступной в браузере. `SUPABASE_SERVICE_ROLE_KEY` без префикса остаётся только на сервере.

## Создание клиентов Supabase

В App Router нужны разные клиенты для разных контекстов. Создайте директорию `lib/supabase/` с тремя файлами.

### Клиент для Server Components

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### Клиент для Client Components

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Клиент для Middleware

```typescript
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Обновляем сессию пользователя
  await supabase.auth.getUser()

  return supabaseResponse
}
```

## Настройка Middleware

Middleware запускается перед каждым запросом и обновляет JWT-токен в cookies. Без него сессия истекает и пользователь будет неожиданно разлогинен:

```typescript
// middleware.ts (в корне проекта)
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## Авторизация через email

### Форма входа

Создадим Server Action для авторизации — это позволяет обрабатывать форму без написания отдельного API-маршрута:

```typescript
// app/auth/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    redirect('/auth/login?error=Неверный email или пароль')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    redirect('/auth/login?error=' + error.message)
  }

  redirect('/auth/confirm')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
```

```typescript
// app/auth/login/page.tsx
import { login, signup } from '../actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <form>
      {searchParams.error && (
        <p style={{ color: 'red' }}>{searchParams.error}</p>
      )}
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Пароль" required />
      <button formAction={login}>Войти</button>
      <button formAction={signup}>Зарегистрироваться</button>
    </form>
  )
}
```

### OAuth авторизация (GitHub, Google)

Для OAuth нужен клиентский компонент, поскольку метод `signInWithOAuth` перенаправляет браузер на страницу провайдера:

```typescript
// app/auth/components/OAuthButtons.tsx
'use client'

import { createClient } from '@/lib/supabase/client'

export function GitHubButton() {
  const supabase = createClient()

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return <button onClick={handleLogin}>Войти через GitHub</button>
}
```

После успешной OAuth-авторизации Supabase перенаправит пользователя на `/auth/callback`. Создайте Route Handler для обработки кода обмена:

```typescript
// app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Ошибка авторизации`)
}
```

## Защита маршрутов

Проверку сессии лучше делать прямо в Server Component, а не только в Middleware. Создайте переиспользуемую утилиту:

```typescript
// lib/auth.ts
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  return user
}
```

Теперь защитить любую страницу можно одной строкой:

```typescript
// app/dashboard/page.tsx
import { requireAuth } from '@/lib/auth'

export default async function DashboardPage() {
  const user = await requireAuth()

  return (
    <div>
      <h1>Добро пожаловать, {user.email}</h1>
    </div>
  )
}
```

## Работа с базой данных

### Создание таблицы

В панели Supabase перейдите в **SQL Editor** и создайте таблицу для постов:

```sql
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Включаем Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Пользователь видит только свои посты
CREATE POLICY "Users can view own posts"
  ON posts FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователь создаёт посты от своего имени
CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Пользователь редактирует только свои посты
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Пользователь удаляет только свои посты
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);
```

Row Level Security (RLS) — это встроенный механизм PostgreSQL, который автоматически фильтрует строки на уровне базы данных в зависимости от текущего пользователя. Даже если в коде забыть добавить `WHERE user_id = ...`, RLS не позволит получить чужие данные.

### Чтение данных в Server Component

```typescript
// app/dashboard/posts/page.tsx
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

interface Post {
  id: string
  title: string
  content: string | null
  created_at: string
}

export default async function PostsPage() {
  await requireAuth()

  const supabase = await createClient()
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <p>Ошибка загрузки постов</p>
  }

  return (
    <ul>
      {posts.map((post: Post) => (
        <li key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </li>
      ))}
    </ul>
  )
}
```

### Создание и удаление через Server Actions

```typescript
// app/dashboard/posts/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export async function createPost(formData: FormData) {
  const user = await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase.from('posts').insert({
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    user_id: user.id,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/posts')
}

export async function deletePost(postId: string) {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/posts')
}
```

```typescript
// app/dashboard/posts/components/CreatePostForm.tsx
'use client'

import { createPost } from '../actions'
import { useTransition } from 'react'

export function CreatePostForm() {
  const [isPending, startTransition] = useTransition()

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        startTransition(() => createPost(formData))
      }}
    >
      <input name="title" placeholder="Заголовок" required />
      <textarea name="content" placeholder="Содержание" />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Сохранение...' : 'Создать пост'}
      </button>
    </form>
  )
}
```

## Типизация с генерацией типов

Supabase умеет генерировать TypeScript-типы из схемы вашей базы данных. Установите CLI и выполните:

```bash
npx supabase gen types typescript --project-id your-project-id > lib/database.types.ts
```

Затем передайте тип в клиент для автодополнения:

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Теперь `.from('posts').select('*')` вернёт типизированный массив — TypeScript будет знать точный набор полей и их типы.

## Получение профиля текущего пользователя

Для хранения дополнительных данных о пользователе (имя, аватар, роль) создайте отдельную таблицу `profiles`, связанную с `auth.users`:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Автоматически создаём профиль при регистрации
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Читать профиль можно вместе с данными пользователя:

```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

const { data: profile } = await supabase
  .from('profiles')
  .select('display_name, avatar_url')
  .eq('id', user!.id)
  .single()
```

## Итог

Supabase и Next.js App Router отлично дополняют друг друга: Server Components делают прямые запросы к базе без промежуточного API, Server Actions обрабатывают мутации, а Middleware поддерживает сессию актуальной на каждом запросе. Row Level Security на стороне PostgreSQL гарантирует безопасность данных независимо от логики приложения.

Чтобы глубже изучить Next.js и научиться строить production-ready приложения с авторизацией, базами данных и деплоем, приходите на курс PurpleSchool: https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-supabase
---
metaTitle: "Аутентификация в Next.js с Better Auth — полное руководство"
metaDescription: "Как настроить аутентификацию в Next.js с библиотекой Better Auth: установка, конфигурация, защита маршрутов, сессии и OAuth-провайдеры."
author: "Антон Ларичев"
title: "Аутентификация в Next.js с Better Auth"
preview: "Полное руководство по настройке аутентификации в Next.js приложении с использованием библиотеки Better Auth — от установки до защиты маршрутов."
---

Better Auth — это TypeScript-first библиотека аутентификации для современных фреймворков, включая Next.js. В отличие от NextAuth (Auth.js), Better Auth предоставляет более предсказуемый API, строгую типизацию и гибкую архитектуру без магии под капотом.

В этой статье разберём полный цикл настройки аутентификации: от установки до защиты приватных маршрутов в App Router.

## Установка и зависимости

Установите Better Auth и необходимые зависимости:

```bash
npm install better-auth
```

Для работы с базой данных установите адаптер. Better Auth поддерживает Prisma, Drizzle, Kysely и другие ORM. Пример с Prisma:

```bash
npm install prisma @prisma/client
npx prisma init
```

Также потребуется создать переменные окружения в файле `.env.local`:

```bash
BETTER_AUTH_SECRET=ваш-секретный-ключ-минимум-32-символа
BETTER_AUTH_URL=http://localhost:3000

# Для базы данных (пример с PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# OAuth провайдеры (опционально)
GITHUB_CLIENT_ID=ваш-github-client-id
GITHUB_CLIENT_SECRET=ваш-github-client-secret
```

Секрет можно сгенерировать командой:

```bash
openssl rand -base64 32
```

## Схема базы данных

Better Auth требует наличия определённых таблиц в базе данных. Для Prisma добавьте в `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]
}

model Session {
  id        String   @id @default(cuid())
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String    @id @default(cuid())
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

model Verification {
  id         String    @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

Примените миграцию:

```bash
npx prisma migrate dev --name init
```

## Конфигурация сервера

Создайте файл `lib/auth.ts` — это центральная конфигурация Better Auth на стороне сервера:

```typescript
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 дней
    updateAge: 60 * 60 * 24,     // обновление каждые 24 часа
  },
});

export type Session = typeof auth.$Infer.Session;
```

### Конфигурация клиента

Создайте файл `lib/auth-client.ts` — это клиентская часть, которая используется в компонентах React:

```typescript
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? 'http://localhost:3000',
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient;
```

## API Route для обработки запросов

Better Auth использует единый обработчик для всех маршрутов аутентификации. Создайте файл `app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

Этот единственный файл обрабатывает все эндпоинты: `/api/auth/sign-in`, `/api/auth/sign-up`, `/api/auth/sign-out`, `/api/auth/session` и другие.

## Форма регистрации

Создайте компонент `app/register/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/auth-client';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signUp.email({
      name,
      email,
      password,
    });

    if (error) {
      setError(error.message ?? 'Ошибка регистрации');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-6">Регистрация</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="name"
          placeholder="Имя"
          required
          className="border rounded px-3 py-2"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          className="border rounded px-3 py-2"
        />
        <input
          type="password"
          name="password"
          placeholder="Пароль"
          minLength={8}
          required
          className="border rounded px-3 py-2"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Зарегистрироваться'}
        </button>
      </form>
    </div>
  );
}
```

## Форма входа

Создайте компонент `app/login/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    const { error } = await signIn.email({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });

    if (error) {
      setError(error.message ?? 'Неверный email или пароль');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  async function handleGithubLogin() {
    await signIn.social({
      provider: 'github',
      callbackURL: '/dashboard',
    });
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-6">Вход</h1>

      <button
        onClick={handleGithubLogin}
        className="w-full border rounded px-4 py-2 mb-6 flex items-center justify-center gap-2"
      >
        Войти через GitHub
      </button>

      <div className="relative mb-6">
        <hr />
        <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-2 text-gray-500 text-sm">
          или
        </span>
      </div>

      <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          className="border rounded px-3 py-2"
        />
        <input
          type="password"
          name="password"
          placeholder="Пароль"
          required
          className="border rounded px-3 py-2"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {loading ? 'Загрузка...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
```

## Получение сессии в компонентах

### Клиентский компонент

Хук `useSession` возвращает текущее состояние сессии и статус загрузки:

```typescript
'use client';

import { useSession, signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export function UserMenu() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) {
    return <div>Загрузка...</div>;
  }

  if (!session) {
    return (
      <a href="/login" className="text-blue-600">
        Войти
      </a>
    );
  }

  async function handleSignOut() {
    await signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <span>{session.user.name}</span>
      <button onClick={handleSignOut} className="text-gray-500">
        Выйти
      </button>
    </div>
  );
}
```

### Серверный компонент

На сервере сессию получают через хелпер `auth.api.getSession`, передавая заголовки запроса:

```typescript
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Добро пожаловать, {session.user.name}!</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

## Защита маршрутов через middleware

Создайте файл `middleware.ts` в корне проекта для глобальной защиты маршрутов:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

const protectedRoutes = ['/dashboard', '/profile', '/settings'];
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = getSessionCookie(request);
  const isAuthenticated = !!sessionCookie;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

`getSessionCookie` — лёгкий способ проверить наличие сессии без обращения к базе данных, что делает middleware максимально быстрым.

## Плагины и расширения

Better Auth поддерживает систему плагинов. Например, плагин `twoFactor` добавляет двухфакторную аутентификацию:

```typescript
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { twoFactor } from 'better-auth/plugins';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    twoFactor({
      issuer: 'MyApp',
    }),
  ],
});
```

Для использования 2FA на клиенте нужно добавить плагин и в клиентскую конфигурацию:

```typescript
import { createAuthClient } from 'better-auth/react';
import { twoFactorClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL!,
  plugins: [
    twoFactorClient({
      twoFactorPage: '/two-factor',
    }),
  ],
});
```

## Получение данных пользователя в Server Actions

Better Auth хорошо интегрируется с Server Actions:

```typescript
'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function updateProfile(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error('Необходима авторизация');
  }

  const name = formData.get('name') as string;

  // Обновление данных пользователя в базе данных
  // ...

  return { success: true };
}
```

## Типизация сессии

Better Auth автоматически выводит типы из конфигурации. Чтобы получить типы сессии и пользователя, используйте утилиту `$Infer`:

```typescript
import type { auth } from '@/lib/auth';

type Session = typeof auth.$Infer.Session;
type User = Session['user'];

// Использование в компонентах
interface Props {
  user: User;
}

export function ProfileCard({ user }: Props) {
  return (
    <div>
      <p>{user.name}</p>
      <p>{user.email}</p>
    </div>
  );
}
```

## Частые ошибки при настройке

### Неверный URL

Переменная `BETTER_AUTH_URL` должна точно совпадать с адресом приложения. В production укажите реальный домен без trailing slash:

```bash
# Неверно
BETTER_AUTH_URL=https://myapp.com/

# Верно
BETTER_AUTH_URL=https://myapp.com
```

### Проблемы с cookies в Safari

Safari строже относится к SameSite политике cookies. Убедитесь, что `BETTER_AUTH_URL` использует HTTPS в production, иначе cookies не будут устанавливаться.

### Рассинхронизация схемы

При добавлении новых плагинов Better Auth может потребовать дополнительные поля в базе данных. После изменения конфигурации проверьте актуальность схемы командой:

```bash
npx @better-auth/cli generate
```

Эта команда генерирует актуальную Prisma-схему на основе текущей конфигурации auth.

## Итог

Better Auth предоставляет предсказуемое и хорошо типизированное решение для аутентификации в Next.js приложениях. Ключевые преимущества:

- Строгая TypeScript-типизация без дополнительных настроек
- Единый API route через catch-all обработчик
- Быстрая проверка сессии в middleware без обращения к базе данных
- Гибкая система плагинов для расширения функциональности
- Поддержка популярных ORM через адаптеры

Для углублённого изучения Next.js и построения полноценных production-приложений рекомендуем курс на PurpleSchool:

[Курс по Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=better-auth-authentication)

---
metaTitle: "Аутентификация в Next.js с NextAuth.js — полное руководство"
metaDescription: "Как настроить аутентификацию в Next.js с помощью NextAuth.js: провайдеры OAuth, защита маршрутов, сессии, middleware и кастомные страницы входа."
author: "Антон Ларичев"
title: "Аутентификация в Next.js с NextAuth.js"
preview: "Разбираем настройку аутентификации в Next.js через NextAuth.js: OAuth-провайдеры, защита страниц, работа с сессиями на сервере и клиенте."
---

## Что такое NextAuth.js

NextAuth.js (в версии 5 переименован в Auth.js) — это библиотека для реализации аутентификации в Next.js-приложениях. Она берёт на себя работу с OAuth-провайдерами (GitHub, Google, Discord и другими), управление сессиями, CSRF-защиту и хранение токенов.

Вместо написания собственного слоя аутентификации с нуля, вы описываете конфигурацию — и NextAuth.js разворачивает готовые API-маршруты, управляет куками и предоставляет хуки для чтения состояния пользователя как на сервере, так и на клиенте.

В этой статье рассматривается NextAuth.js v5 с App Router.

## Установка

```bash
npm install next-auth@beta
```

Для хранения сессий в базе данных дополнительно потребуется адаптер (например, для Prisma или MongoDB). Базовая сессия через JWT не требует базы данных.

## Конфигурация

Создайте файл `auth.ts` в корне проекта (рядом с `app/`):

```typescript
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
});
```

Затем подключите обработчик маршрутов. В App Router создайте файл `app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
```

NextAuth.js автоматически обработает маршруты вида:
- `GET /api/auth/signin` — страница входа
- `GET /api/auth/signout` — выход
- `GET /api/auth/session` — получение текущей сессии
- `GET /api/auth/callback/:provider` — колбэк после OAuth

## Переменные окружения

Создайте файл `.env.local`:

```bash
# Секрет для подписи JWT и куков
AUTH_SECRET=your-random-secret-here

# GitHub OAuth App
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret

# Google OAuth
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

Сгенерировать `AUTH_SECRET` можно командой:

```bash
openssl rand -base64 32
```

Для GitHub OAuth App зайдите в Settings → Developer Settings → OAuth Apps и укажите Callback URL: `http://localhost:3000/api/auth/callback/github`.

## Вход и выход

NextAuth.js экспортирует функции `signIn` и `signOut`, которые работают как в серверных компонентах, так и в клиентских.

### Server Actions

```typescript
// app/components/auth-buttons.tsx
import { signIn, signOut } from '@/auth';

export function SignInButton() {
  return (
    <form
      action={async () => {
        'use server';
        await signIn('github');
      }}
    >
      <button type="submit">Войти через GitHub</button>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form
      action={async () => {
        'use server';
        await signOut();
      }}
    >
      <button type="submit">Выйти</button>
    </form>
  );
}
```

### Клиентский хук

Для клиентских компонентов используйте `useSession`:

```typescript
// app/components/user-menu.tsx
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <span>Загрузка...</span>;
  }

  if (!session) {
    return <button onClick={() => signIn('github')}>Войти</button>;
  }

  return (
    <div>
      <img src={session.user?.image ?? ''} alt="avatar" width={32} />
      <span>{session.user?.name}</span>
      <button onClick={() => signOut()}>Выйти</button>
    </div>
  );
}
```

Чтобы `useSession` работал, оберните приложение в `SessionProvider`. Создайте клиентский провайдер:

```typescript
// app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

И используйте его в корневом layout:

```typescript
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Получение сессии на сервере

В серверных компонентах используйте функцию `auth()` из вашего файла `auth.ts`:

```typescript
// app/dashboard/page.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/signin');
  }

  return (
    <div>
      <h1>Добро пожаловать, {session.user?.name}</h1>
      <p>Email: {session.user?.email}</p>
    </div>
  );
}
```

Запрос к базе данных или стороннему API можно сразу делать в одном компоненте, не опасаясь дополнительных round-trip:

```typescript
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUserOrders } from '@/lib/db';

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const orders = await getUserOrders(session.user.email);

  return (
    <ul>
      {orders.map((order) => (
        <li key={order.id}>{order.title}</li>
      ))}
    </ul>
  );
}
```

## Защита маршрутов через Middleware

Защищать отдельные страницы через `auth()` внутри каждого компонента неудобно. Лучше использовать `middleware.ts` — он выполняется на уровне Edge Runtime до рендера страницы.

Создайте `middleware.ts` в корне проекта:

```typescript
export { auth as middleware } from '@/auth';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
  ],
};
```

Если пользователь не авторизован и пытается открыть `/dashboard`, NextAuth.js автоматически перенаправит его на страницу входа.

Для более тонкой логики можно написать обёртку:

```typescript
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard');

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

## Провайдер Credentials

Помимо OAuth, NextAuth.js поддерживает вход по логину и паролю через `CredentialsProvider`:

```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getUserByEmail, verifyPassword } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await getUserByEmail(credentials.email as string);

        if (!user) {
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
});
```

Функция `authorize` возвращает объект пользователя при успехе или `null` при ошибке — NextAuth.js сам обрабатывает дальнейший редирект.

## Callbacks для расширения сессии

По умолчанию объект сессии содержит только `name`, `email` и `image`. Чтобы добавить, например, `id` пользователя или роль — используйте callbacks:

```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub(...)],
  callbacks: {
    async jwt({ token, user }) {
      // user доступен только при первом входе
      if (user) {
        token.id = user.id;
        token.role = 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
```

Чтобы TypeScript понимал расширенные поля, дополните типы:

```typescript
// types/next-auth.d.ts
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
}
```

## Кастомные страницы входа

Настроить URL кастомных страниц можно через `pages`:

```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [...],
  pages: {
    signIn: '/login',
    error: '/auth/error',
    signOut: '/logout',
  },
});
```

Пример страницы `/app/login/page.tsx`:

```typescript
import { signIn } from '@/auth';

export default function LoginPage() {
  return (
    <main>
      <h1>Войти в аккаунт</h1>

      <form
        action={async (formData: FormData) => {
          'use server';
          await signIn('credentials', {
            email: formData.get('email'),
            password: formData.get('password'),
            redirectTo: '/dashboard',
          });
        }}
      >
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Пароль" required />
        <button type="submit">Войти</button>
      </form>

      <form
        action={async () => {
          'use server';
          await signIn('github', { redirectTo: '/dashboard' });
        }}
      >
        <button type="submit">Войти через GitHub</button>
      </form>
    </main>
  );
}
```

## Адаптеры базы данных

Для хранения пользователей, аккаунтов и сессий в базе данных (а не в JWT) подключите адаптер. Пример с Prisma:

```bash
npm install @auth/prisma-adapter @prisma/client prisma
```

```typescript
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import GitHub from 'next-auth/providers/github';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [GitHub(...)],
  session: { strategy: 'database' },
});
```

С адаптером NextAuth.js автоматически создаёт записи в таблицах `User`, `Account`, `Session` и `VerificationToken` при каждом входе.

## Типичные ошибки

**Не работает `useSession`** — убедитесь, что `SessionProvider` оборачивает клиентские компоненты в `providers.tsx`, помечен директивой `'use client'` и подключён в корневом layout.

**`AUTH_SECRET` не задан** — без этой переменной NextAuth.js не может подписывать токены. В production это приводит к ошибке при старте.

**Callback URL настроен неверно** — в настройках OAuth App у GitHub/Google callback URL должен точно совпадать с `http://localhost:3000/api/auth/callback/github` (или доменом продакшна).

**Расширенные поля не попадают в сессию** — не забудьте добавить поля сначала в callback `jwt`, затем пробросить их в callback `session`. Только тогда они появятся в `useSession()` и `auth()`.

## Итог

NextAuth.js закрывает большую часть задач аутентификации в Next.js-приложении: OAuth через внешних провайдеров, вход по логину и паролю, управление сессиями через JWT или базу данных, защита маршрутов через middleware. Конфигурация сосредоточена в одном файле `auth.ts`, а хуки и серверные функции делают доступ к сессии простым в любом месте приложения.

Чтобы разобраться с Next.js глубже — от основ маршрутизации до деплоя, — приходите на курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextauth-authentication).
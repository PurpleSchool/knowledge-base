---
metaTitle: "Next.js cookies и headers в App Router | Руководство"
metaDescription: "Как работать с cookies и HTTP-заголовками в Next.js App Router: функции cookies() и headers(), Server Actions, Middleware и Route Handlers."
author: "Антон Ларичев"
title: "Next.js cookies и headers в App Router"
preview: "Подробное руководство по работе с cookies() и headers() в Next.js App Router: Server Components, Actions, Route Handlers и Middleware."
---

## Работа с cookies и headers в Next.js App Router

В App Router Next.js появились специальные серверные API для работы с cookies и HTTP-заголовками. Функции `cookies()` и `headers()` из пакета `next/headers` позволяют читать и изменять данные запроса прямо в Server Components, Server Actions и Route Handlers — без написания промежуточных API-эндпоинтов.

## Функция headers()

`headers()` возвращает объект типа `ReadonlyHeaders`. Вызов доступен только в серверном контексте: Server Components, Server Actions и Route Handlers. Начиная с Next.js 15, функция асинхронная — необходим `await`.

```typescript
import { headers } from 'next/headers';

export default async function Page() {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent');
  const acceptLanguage = headersList.get('accept-language');

  return (
    <div>
      <p>User Agent: {userAgent}</p>
      <p>Язык: {acceptLanguage}</p>
    </div>
  );
}
```

### Доступные методы

Объект `ReadonlyHeaders` реализует стандартный Web API `Headers`:

- `get(name)` — получить значение заголовка по имени
- `has(name)` — проверить наличие заголовка
- `getAll(name)` — получить массив значений для заголовков с несколькими значениями
- `keys()`, `values()`, `entries()` — итераторы для перебора всех заголовков
- `forEach(callback)` — перебор всех заголовков с колбэком

```typescript
import { headers } from 'next/headers';

export default async function Page() {
  const headersList = await headers();

  const hasAuth = headersList.has('authorization');

  if (!hasAuth) {
    return <div>Требуется авторизация</div>;
  }

  const token = headersList.get('authorization');
  // дальнейшая логика с токеном
}
```

### Получение IP-адреса клиента

Один из частых сценариев — определение IP-адреса пользователя через проксируемые заголовки:

```typescript
import { headers } from 'next/headers';

export default async function Page() {
  const headersList = await headers();

  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
    headersList.get('x-real-ip') ||
    'unknown';

  return <p>Ваш IP: {ip}</p>;
}
```

## Функция cookies()

`cookies()` возвращает объект для работы с cookies запроса. В Server Components доступно только чтение. В Server Actions и Route Handlers — также запись и удаление.

```typescript
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme');

  return (
    <div>
      <p>Тема: {theme?.value ?? 'default'}</p>
    </div>
  );
}
```

### Чтение cookies

```typescript
import { cookies } from 'next/headers';

export default async function Dashboard() {
  const cookieStore = await cookies();

  // Получить одну cookie
  const sessionToken = cookieStore.get('session-token');

  // Проверить наличие cookie
  const hasSession = cookieStore.has('session-token');

  // Получить все cookies
  const allCookies = cookieStore.getAll();

  return (
    <div>
      {hasSession ? (
        <p>Сессия активна: {sessionToken?.value}</p>
      ) : (
        <p>Нет активной сессии</p>
      )}
    </div>
  );
}
```

### Запись и удаление cookies в Server Actions

Для изменения cookies необходим серверный контекст с возможностью записи ответа. Server Actions подходят для этого идеально:

```typescript
// app/actions/auth.ts
'use server';

import { cookies } from 'next/headers';

export async function setTheme(theme: string) {
  const cookieStore = await cookies();

  cookieStore.set('theme', theme, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 год
    path: '/',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session-token');
}
```

Использование в компоненте через `form` и `formAction`:

```typescript
import { setTheme } from './actions/auth';

export default function ThemeSwitcher() {
  return (
    <div>
      <form>
        <button formAction={async () => {
          'use server';
          await setTheme('dark');
        }}>
          Тёмная тема
        </button>
      </form>
      <form>
        <button formAction={async () => {
          'use server';
          await setTheme('light');
        }}>
          Светлая тема
        </button>
      </form>
    </div>
  );
}
```

### Параметры cookie

Полный список доступных параметров при установке cookie:

```typescript
cookieStore.set('name', 'value', {
  httpOnly: true,           // недоступна из JavaScript на клиенте
  secure: true,             // передаётся только по HTTPS
  sameSite: 'strict',       // 'strict' | 'lax' | 'none'
  maxAge: 3600,             // время жизни в секундах
  expires: new Date(),      // конкретная дата истечения
  path: '/',                // путь, для которого действует cookie
  domain: '.example.com',  // домен, включая поддомены
});
```

## Работа с cookies в Route Handlers

Route Handlers дают полный доступ к cookies — чтение, запись и удаление. Это удобно при построении REST-подобных эндпоинтов для авторизации:

```typescript
// app/api/auth/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  const user = await authenticateUser(username, password);

  if (!user) {
    return NextResponse.json(
      { error: 'Неверные данные' },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();

  cookieStore.set('session-token', user.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 дней
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('session-token');

  return NextResponse.json({ success: true });
}
```

## Middleware для cookies и headers

Middleware запускается на Edge Runtime до обработки запроса и имеет доступ к cookies и заголовкам через объект `NextRequest`:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Чтение cookie из входящего запроса
  const theme = request.cookies.get('theme')?.value || 'light';

  // Установка cookie в исходящий ответ
  response.cookies.set('last-visit', new Date().toISOString(), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
  });

  // Чтение заголовка запроса
  const acceptLanguage = request.headers.get('accept-language');

  // Добавление кастомного заголовка в ответ
  response.headers.set('x-custom-header', 'processed');

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Редирект с защитой маршрутов

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session-token');

  if (!sessionToken && request.nextUrl.pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
```

## Передача данных из Middleware в Server Components

Middleware не может напрямую передать данные в Server Component, но это решается через кастомные заголовки запроса:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  // Добавляем данные для использования в Server Components
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  requestHeaders.set('x-user-id', extractUserIdFromToken(request));

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}
```

```typescript
// app/layout.tsx
import { headers } from 'next/headers';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname');
  const userId = headersList.get('x-user-id');

  return (
    <html>
      <body>
        <nav data-active-path={pathname}>
          {userId ? `Пользователь: ${userId}` : 'Гость'}
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
```

## Динамическое поведение и кэширование

Вызов `cookies()` или `headers()` переводит маршрут в режим динамического рендеринга — страница будет рендериться при каждом запросе и не будет кэшироваться статически. Если нужно смешать статический и динамический контент, изолируйте динамические части через `<Suspense>`:

```typescript
// app/page.tsx — статическая обёртка
import { Suspense } from 'react';
import { UserGreeting } from './components/UserGreeting';

export default function Page() {
  return (
    <main>
      <h1>Добро пожаловать</h1>
      <Suspense fallback={<p>Загрузка...</p>}>
        <UserGreeting />
      </Suspense>
    </main>
  );
}
```

```typescript
// app/components/UserGreeting.tsx — динамический компонент
import { cookies } from 'next/headers';

export async function UserGreeting() {
  const cookieStore = await cookies();
  const name = cookieStore.get('user-name')?.value;

  return <p>Привет, {name ?? 'гость'}!</p>;
}
```

## Практический пример: система тем

Рассмотрим полноценную реализацию переключателя тем с сохранением выбора в cookie:

```typescript
// app/actions/theme.ts
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export type Theme = 'light' | 'dark' | 'system';

export async function setTheme(theme: Theme) {
  const cookieStore = await cookies();

  cookieStore.set('theme', theme, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });

  revalidatePath('/', 'layout');
}
```

```typescript
// app/components/ThemeSwitcher.tsx
import { cookies } from 'next/headers';
import { setTheme, Theme } from '../actions/theme';

export async function ThemeSwitcher() {
  const cookieStore = await cookies();
  const currentTheme = (cookieStore.get('theme')?.value as Theme) ?? 'system';

  const themes: { value: Theme; label: string }[] = [
    { value: 'light', label: 'Светлая' },
    { value: 'dark', label: 'Тёмная' },
    { value: 'system', label: 'Системная' },
  ];

  return (
    <div>
      {themes.map((theme) => (
        <form key={theme.value}>
          <button
            formAction={async () => {
              'use server';
              await setTheme(theme.value);
            }}
            aria-pressed={currentTheme === theme.value}
          >
            {theme.label}
          </button>
        </form>
      ))}
    </div>
  );
}
```

```typescript
// app/layout.tsx
import { cookies } from 'next/headers';
import { ThemeSwitcher } from './components/ThemeSwitcher';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value ?? 'system';

  return (
    <html data-theme={theme}>
      <body>
        <ThemeSwitcher />
        {children}
      </body>
    </html>
  );
}
```

## Частые ошибки

**Попытка изменить cookies в Server Component.** В Server Component объект cookies доступен только на чтение:

```typescript
// Ошибка — изменение cookies в Server Component невозможно
export default async function Page() {
  const cookieStore = await cookies();
  cookieStore.set('key', 'value'); // TypeError!
}
```

Решение — перенесите логику записи в Server Action или Route Handler.

**Импорт `next/headers` в Client Component.** Функции `cookies()` и `headers()` работают только на сервере:

```typescript
// Ошибка — next/headers нельзя использовать в Client Component
'use client';
import { cookies } from 'next/headers'; // Ошибка импорта!
```

Для работы с cookies на клиенте используйте `document.cookie` или библиотеку `js-cookie`.

**Забытый `await`.** Начиная с Next.js 15, `cookies()` и `headers()` — асинхронные функции:

```typescript
// Ошибка — пропущен await
const cookieStore = cookies();

// Правильно
const cookieStore = await cookies();
```

**Установка cookies после начала стриминга ответа.** Cookies можно устанавливать только до начала отправки тела ответа. Если попытаться установить cookie после того, как началась стриминговая передача, изменение будет проигнорировано.

Для углублённого изучения Next.js App Router, включая архитектуру, кэширование, аутентификацию и деплой, смотрите курс на PurpleSchool: https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-cookies-headers
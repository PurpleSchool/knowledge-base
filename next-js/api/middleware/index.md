---
metaTitle: Middleware в Next.js — файл middleware.ts, матчеры и редиректы
metaDescription: Разбираем Middleware в Next.js — файл middleware.ts, конфигурация матчеров, перехват запросов, редиректы, авторизация, работа с заголовками и куками.
author: Антон Ларичев
title: Middleware в Next.js — как работает, матчеры, редиректы и авторизация
preview: Подробный разбор Middleware в Next.js — создание файла middleware.ts, настройка matcher, перехват запросов для авторизации, редиректов и работы с заголовками.
---

## Введение

Middleware в Next.js — это функция, которая выполняется **перед обработкой каждого запроса**. Она перехватывает входящий HTTP-запрос и может изменить ответ: выполнить редирект, переписать URL, добавить заголовки или вернуть ответ напрямую, не доходя до страницы или API-роута.

Middleware работает на уровне Edge Runtime — лёгком серверном окружении на основе V8, которое запускается максимально близко к пользователю (на CDN-узлах Vercel). Это делает middleware невероятно быстрым, но с ограниченным набором Node.js API.

Файл middleware создаётся в корне проекта: `middleware.ts` (рядом с `pages/` или `app/`).

## Создание middleware

### Базовый пример

```typescript
// middleware.ts (в корне проекта, рядом с app/ или pages/)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Логируем каждый запрос
  console.log(`[Middleware] ${request.method} ${request.nextUrl.pathname}`);

  // Передаём запрос дальше без изменений
  return NextResponse.next();
}
```

### Конфигурация matcher

По умолчанию middleware выполняется для всех маршрутов. Это неэффективно — для статических файлов (изображений, CSS, JS) middleware не нужен. Параметр `config.matcher` ограничивает, для каких путей работает middleware:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Применять middleware ко всем путям, КРОМЕ:
     * - _next/static (статические файлы)
     * - _next/image (оптимизация изображений)
     * - favicon.ico
     * - публичных файлов из папки public/
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

Можно использовать массив конкретных путей:

```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',  // Все пути, начинающиеся с /dashboard
    '/api/:path*',        // Все API-роуты
    '/admin',             // Конкретный путь
  ],
};
```

## Авторизация и защита маршрутов

Самый распространённый сценарий middleware — проверка авторизации и редирект неавторизованных пользователей:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Список защищённых маршрутов
const PROTECTED_PATHS = ['/dashboard', '/profile', '/orders', '/admin'];

// Список публичных маршрутов авторизации
const AUTH_PATHS = ['/login', '/register', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Читаем токен из куки
  const token = request.cookies.get('auth-token')?.value;

  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  const isAuthPath = AUTH_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  // Если пользователь авторизован и заходит на страницу входа — редирект на дашборд
  if (token && isAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Если пользователь не авторизован и пытается попасть на защищённый маршрут
  if (!token && isProtectedPath) {
    const loginUrl = new URL('/login', request.url);
    // Сохраняем исходный URL для редиректа после входа
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/public).*)'],
};
```

Если хотите глубоко изучить Next.js, включая middleware, авторизацию и fullstack-разработку — приходите на наш курс [Next.js](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=article&utm_campaign=middleware). На курсе 120 уроков и 30 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Редиректы и rewrite

### Редиректы

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Редирект со старых URL на новые (301 постоянный)
  if (pathname === '/old-blog') {
    return NextResponse.redirect(new URL('/blog', request.url), {
      status: 301,
    });
  }

  // Редирект с http на https
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') === 'http'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${pathname}`,
      { status: 301 }
    );
  }

  return NextResponse.next();
}
```

### URL Rewrite (перезапись без редиректа)

Rewrite меняет, какая страница обслуживает запрос, но URL в браузере остаётся прежним:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A/B тестирование: 50% пользователей видят новую версию страницы
  if (pathname === '/landing') {
    const isNewVariant = Math.random() > 0.5;

    if (isNewVariant) {
      // URL остаётся /landing, но отдаётся страница /landing-v2
      return NextResponse.rewrite(new URL('/landing-v2', request.url));
    }
  }

  // Мультиязычность: определяем язык из заголовка
  if (pathname === '/') {
    const acceptLanguage = request.headers.get('accept-language') ?? '';
    const lang = acceptLanguage.startsWith('ru') ? 'ru' : 'en';
    return NextResponse.rewrite(new URL(`/${lang}`, request.url));
  }

  return NextResponse.next();
}
```

## Работа с заголовками запроса и ответа

Middleware может добавлять, изменять или читать HTTP-заголовки:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Клонируем заголовки запроса для модификации
  const requestHeaders = new Headers(request.headers);

  // Добавляем заголовок с текущим pathname (доступен в Server Components)
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  requestHeaders.set('x-request-id', crypto.randomUUID());

  // Создаём ответ с изменёнными заголовками запроса
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Добавляем заголовки безопасности в ответ
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  return response;
}
```

Получение заголовка в Server Component:

```typescript
// app/page.tsx
import { headers } from 'next/headers';

export default function Page() {
  const headersList = headers();
  // Читаем заголовок, установленный middleware
  const pathname = headersList.get('x-pathname');
  const requestId = headersList.get('x-request-id');

  return (
    <div>
      <p>Путь: {pathname}</p>
      <p>ID запроса: {requestId}</p>
    </div>
  );
}
```

## Работа с куками в middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Читаем куку
  const theme = request.cookies.get('theme')?.value;

  // Устанавливаем куку по умолчанию если не задана
  if (!theme) {
    response.cookies.set('theme', 'light', {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365, // 1 год
      path: '/',
    });
  }

  // Удаляем куку
  // response.cookies.delete('old-cookie');

  return response;
}
```

## Ограничения Edge Runtime

Middleware работает в Edge Runtime и имеет ограниченный API по сравнению с Node.js:

| Доступно | Недоступно |
|----------|-----------|
| `fetch`, Web Crypto API | `fs` (файловая система) |
| `Headers`, `Request`, `Response` | Большинство npm-пакетов с Node.js API |
| `URLSearchParams`, `URL` | `child_process`, `net`, `tls` |
| `TextEncoder`, `TextDecoder` | `Buffer` (используйте `Uint8Array`) |
| `crypto.randomUUID()` | Нативные Node.js-модули |

Для работы с JWT в middleware используйте только Web Crypto API или библиотеки с поддержкой Edge (например `jose`):

```typescript
// middleware.ts
import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // jose работает в Edge Runtime
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    // Токен невалиден — редирект на вход
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

## Частые ошибки

* **Использование Node.js API в middleware.** `fs`, `path`, `crypto` из Node.js недоступны. Middleware работает в Edge Runtime. Используйте только Web API.

* **Тяжёлая логика в middleware.** Edge Runtime имеет ограничения по времени выполнения. Не делайте запросы к медленным API или сложные вычисления в middleware.

* **Забыть настроить matcher.** Без `config.matcher` middleware запустится для каждого запроса, включая `_next/static` файлы, что негативно скажется на производительности.

* **Бесконечный редирект.** Если в middleware стоит редирект на `/login`, а `/login` тоже попадает под matcher — будет бесконечный цикл. Всегда исключайте страницы авторизации из matcher или добавляйте проверку пути.

## Часто задаваемые вопросы

**Можно ли использовать несколько файлов middleware?**

Нет. Next.js поддерживает только один файл `middleware.ts` в корне проекта. Для разделения логики используйте вспомогательные функции внутри этого файла.

**Выполняется ли middleware для статических файлов?**

По умолчанию — нет. Next.js оптимизирует запросы к `_next/static`, `_next/image` и файлам из `public/`, пропуская middleware. Дополнительно настройте `matcher` для явного исключения ненужных путей.

**Как отладить middleware?**

Используйте `console.log` — вывод будет в терминале сервера. В production на Vercel логи middleware доступны в разделе Functions Log. Для локальной разработки — `next dev`.

## Заключение

Middleware в Next.js — универсальный инструмент для перехвата и модификации HTTP-запросов на уровне Edge. Авторизация, редиректы, мультиязычность, A/B-тесты, добавление заголовков безопасности — всё это эффективно решается в одном файле `middleware.ts`.

Для закрепления навыков работы с middleware, API Routes и fullstack-разработки на Next.js рекомендуем курс [Next.js](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=article&utm_campaign=middleware). В первых модулях доступно бесплатное содержание — можно изучить основы и понять структуру курса до покупки полного доступа.

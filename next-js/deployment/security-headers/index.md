---
metaTitle: "Security Headers в Next.js — настройка заголовков безопасности"
metaDescription: "Как настроить заголовки безопасности в Next.js: CSP, HSTS, X-Frame-Options, Permissions-Policy и другие. Примеры конфигурации next.config.js и Middleware."
author: "Антон Ларичев"
title: "Заголовки безопасности (Security Headers) в Next.js"
preview: "Настройка HTTP-заголовков безопасности в Next.js через next.config.js и Middleware: CSP, HSTS, X-Frame-Options, Referrer-Policy и Permissions-Policy."
---

## Что такое заголовки безопасности и зачем они нужны

Заголовки безопасности (Security Headers) — это HTTP-заголовки, которые браузер получает вместе с ответом сервера и использует для ограничения потенциально опасного поведения страницы. Они не заменяют другие меры защиты, но создают дополнительный барьер против распространённых атак: XSS, clickjacking, MIME-sniffing, перехвата трафика.

Отсутствие заголовков безопасности — одна из наиболее часто встречающихся проблем в аудитах безопасности веб-приложений. Инструменты вроде [securityheaders.com](https://securityheaders.com) позволяют проверить наличие и корректность этих заголовков на любом сайте.

Next.js предоставляет два способа добавить заголовки:

- через `next.config.js` — для статических маршрутов;
- через `Middleware` — для динамической логики на основе запроса.

## Настройка через next.config.js

Основной способ задания заголовков безопасности — конфигурационный файл `next.config.js`. Здесь используется поле `headers`, которое возвращает массив правил.

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
```

Паттерн `source: '/(.*)'` применяет заголовки ко всем маршрутам. Вы можете ограничить область действия, задав конкретный путь, например `source: '/api/(.*)'`.

## Основные заголовки безопасности

### Strict-Transport-Security (HSTS)

Заставляет браузер всегда обращаться к сайту по HTTPS, даже если пользователь ввёл `http://`.

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

- `max-age` — время в секундах, в течение которого браузер запоминает правило (63072000 = 2 года).
- `includeSubDomains` — распространяет правило на все поддомены.
- `preload` — разрешает включение домена в браузерный preload-список.

Не добавляйте `preload` на этапе разработки или если сайт ещё доступен по HTTP — это сложно отменить.

### X-Frame-Options

Защищает от clickjacking — встраивания страницы в `<iframe>` на стороннем сайте.

```
X-Frame-Options: SAMEORIGIN
```

Допустимые значения:

- `DENY` — полный запрет на встраивание;
- `SAMEORIGIN` — разрешено встраивание только с того же домена.

Если вам нужна более тонкая настройка (например, разрешить конкретный домен), используйте `Content-Security-Policy: frame-ancestors` вместо этого заголовка.

### X-Content-Type-Options

Запрещает браузеру угадывать MIME-тип ресурса (MIME-sniffing). Браузер должен использовать только тот тип, который указан в заголовке `Content-Type`.

```
X-Content-Type-Options: nosniff
```

Это единственное допустимое значение. Заголовок особенно важен для защиты от атак, при которых злоумышленник загружает файл с безобидным расширением, но исполняемым содержимым.

### Referrer-Policy

Управляет тем, какую информацию браузер передаёт в заголовке `Referer` при переходе по ссылкам.

```
Referrer-Policy: strict-origin-when-cross-origin
```

Значения и их поведение:

```
no-referrer                  — заголовок не отправляется никогда
no-referrer-when-downgrade   — не отправлять при переходе с HTTPS на HTTP
origin                       — только домен, без пути
origin-when-cross-origin     — домен при переходе на другой сайт, полный URL внутри
strict-origin-when-cross-origin — рекомендуемый баланс приватности и аналитики
same-origin                  — только для запросов к тому же домену
unsafe-url                   — всегда полный URL (небезопасно)
```

### Permissions-Policy

Ограничивает доступ страницы к браузерным API: камере, микрофону, геолокации и другим возможностям.

```
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Пустые скобки `()` означают полный запрет. Чтобы разрешить только текущему источнику:

```
Permissions-Policy: camera=(self), geolocation=(self)
```

Полный список директив охватывает несколько десятков API — от `payment` до `usb` и `fullscreen`.

### X-DNS-Prefetch-Control

Управляет предварительным DNS-резолвингом ссылок на странице.

```
X-DNS-Prefetch-Control: on
```

Значение `on` ускоряет загрузку связанных ресурсов. Значение `off` отключает prefetch для сайтов с повышенными требованиями к приватности.

## Content-Security-Policy

CSP — наиболее мощный и сложный заголовок безопасности. Он описывает, откуда браузер имеет право загружать ресурсы: скрипты, стили, изображения, шрифты и т.д.

```javascript
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src * blob: data:;
  media-src 'none';
  connect-src *;
  font-src 'self';
`;

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ''),
  },
];
```

Основные директивы CSP:

| Директива | Описание |
|---|---|
| `default-src` | Значение по умолчанию для всех типов ресурсов |
| `script-src` | Источники JavaScript |
| `style-src` | Источники CSS |
| `img-src` | Источники изображений |
| `font-src` | Источники шрифтов |
| `connect-src` | Источники для fetch, XHR, WebSocket |
| `frame-ancestors` | Кто может встраивать страницу в iframe |
| `base-uri` | Ограничение на тег `<base>` |

Значения источников:

```
'self'           — только текущий домен
'none'           — полный запрет
'unsafe-inline'  — разрешить inline-скрипты/стили
'unsafe-eval'    — разрешить eval()
https:           — любой HTTPS-источник
https://cdn.example.com  — конкретный домен
```

### CSP с nonce для Next.js App Router

Прямое использование `'unsafe-inline'` снижает защиту от XSS. Более строгий подход — использовать nonce (одноразовый токен), который генерируется для каждого запроса.

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  );

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

Получение nonce в серверном компоненте:

```typescript
// app/layout.tsx
import { headers } from 'next/headers';
import Script from 'next/script';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get('x-nonce') ?? '';

  return (
    <html lang="ru">
      <body>
        {children}
        <Script
          src="https://example.com/analytics.js"
          strategy="afterInteractive"
          nonce={nonce}
        />
      </body>
    </html>
  );
}
```

## Динамические заголовки через Middleware

Middleware позволяет задавать заголовки на основе условий: пути, куки, авторизации.

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Разные политики для API и страниц
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Cache-Control', 'no-store');
  } else {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains'
    );
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

## Полная конфигурация для продакшена

Вот рабочий шаблон, пригодный для большинства Next.js-приложений:

```javascript
// next.config.js
const isDev = process.env.NODE_ENV === 'development';

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' ${isDev ? "'unsafe-eval' 'unsafe-inline'" : "'strict-dynamic'"};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self';
  connect-src 'self' ${isDev ? 'ws: wss:' : ''};
  media-src 'none';
  object-src 'none';
  form-action 'self';
  base-uri 'self';
  frame-ancestors 'none';
  ${isDev ? '' : 'upgrade-insecure-requests;'}
`;

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, '').replace(/\s+/g, ' ').trim(),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
```

В режиме разработки добавлены `'unsafe-eval'` и `'unsafe-inline'` для работы Hot Module Replacement, а также разрешены WebSocket-соединения (`ws:`, `wss:`) — они нужны для Fast Refresh.

## Проверка заголовков

После деплоя проверьте заголовки несколькими способами.

Через DevTools браузера:

1. Откройте вкладку Network.
2. Выберите любой HTML-документ.
3. Посмотрите раздел Response Headers.

Через curl:

```bash
curl -I https://your-site.com
```

Через специализированные сервисы:

- [securityheaders.com](https://securityheaders.com) — выставляет оценку A–F и показывает, каких заголовков не хватает.
- [observatory.mozilla.org](https://observatory.mozilla.org) — более широкий аудит от Mozilla.

## Типичные ошибки при настройке

**Ошибка 1. HSTS на сайте с HTTP-маршрутами.**
Если часть сайта ещё работает по HTTP, добавление `Strict-Transport-Security` с `includeSubDomains` заблокирует доступ к HTTP-ресурсам. Убедитесь, что весь сайт доступен по HTTPS, прежде чем включать этот заголовок.

**Ошибка 2. Слишком строгий CSP в продакшене.**
CSP легко сломать: один запрос к CDN без явного разрешения — и скрипт не загрузится. Рекомендуется сначала задеплоить CSP в режиме `Content-Security-Policy-Report-Only` с параметром `report-uri`, чтобы собирать нарушения без блокировки.

```
Content-Security-Policy-Report-Only: default-src 'self'; report-uri /api/csp-report
```

**Ошибка 3. Заголовки только на HTML-страницах.**
Заголовки вроде `X-Content-Type-Options` важны не только для HTML, но и для JSON-ответов API. Применяйте их ко всем маршрутам, а не только к `/*.html`.

**Ошибка 4. Конфликт заголовков из `next.config.js` и Middleware.**
Если один и тот же заголовок задан в обоих местах, значение из Middleware перезапишет значение из `next.config.js`. Используйте одно место для каждого заголовка.

## Итог

Заголовки безопасности — это быстрый и эффективный способ повысить защиту Next.js-приложения без изменений в бизнес-логике. Минимальный набор для любого проекта:

- `Strict-Transport-Security` — принудительный HTTPS;
- `X-Frame-Options` — защита от clickjacking;
- `X-Content-Type-Options` — защита от MIME-sniffing;
- `Referrer-Policy` — контроль утечки URL;
- `Permissions-Policy` — ограничение браузерных API;
- `Content-Security-Policy` — контроль источников ресурсов.

Для CSP начните с `Content-Security-Policy-Report-Only`, соберите реальные нарушения и только затем переходите к блокирующему режиму.

Подробнее об архитектуре и деплое Next.js-приложений вы можете узнать на курсе [Next.js от PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-security-headers).
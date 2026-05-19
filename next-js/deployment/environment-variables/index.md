---
metaTitle: "Переменные окружения в Next.js (.env файлы)"
metaDescription: "Как использовать переменные окружения в Next.js: .env файлы, NEXT_PUBLIC_ префикс, серверные и клиентские переменные, безопасность."
author: "Антон Ларичев"
title: "Next.js переменные окружения (.env)"
preview: "Полный разбор работы с переменными окружения в Next.js: типы .env файлов, публичные и приватные переменные, App Router и лучшие практики."
---

## Что такое переменные окружения

Переменные окружения — это значения, которые задаются вне кода приложения и могут меняться в зависимости от среды запуска: локальная разработка, тестирование, продакшен. Типичные примеры — строки подключения к базе данных, API-ключи сторонних сервисов, URL бэкенда.

Next.js поддерживает переменные окружения из коробки через `.env`-файлы и предоставляет механизм для безопасного разделения переменных между серверным и клиентским кодом.

## Типы .env файлов

Next.js загружает несколько видов `.env`-файлов в зависимости от среды и порядка приоритетов.

| Файл | Когда загружается |
|---|---|
| `.env` | Всегда |
| `.env.local` | Всегда, кроме тестов |
| `.env.development` | `next dev` |
| `.env.production` | `next build` / `next start` |
| `.env.test` | Тестовая среда |
| `.env.development.local` | `next dev`, локально |
| `.env.production.local` | `next build` / `next start`, локально |

Порядок приоритета (от высшего к низшему): `.env.{environment}.local` > `.env.{environment}` > `.env.local` > `.env`.

Файлы с суффиксом `.local` предназначены для локальных секретов и не должны попадать в систему контроля версий. Добавьте их в `.gitignore`:

```bash
# .gitignore
.env*.local
```

Файлы без суффикса `.local` обычно коммитятся в репозиторий с безопасными дефолтными значениями или заглушками.

## Публичные и приватные переменные

Главное правило Next.js: переменная попадает в браузерный бандл только если её имя начинается с `NEXT_PUBLIC_`. Все остальные переменные доступны исключительно на сервере.

```bash
# .env.local

# Только для сервера — база данных, никогда не попадёт в браузер
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
JWT_SECRET=super-secret-key-32-chars-minimum

# Публичная — попадёт в браузерный бандл
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_ANALYTICS_ID=GA-XXXXXXXX
```

Если случайно обратиться к серверной переменной в клиентском коде, Next.js вернёт `undefined` — значение не будет передано, и никакой ошибки времени сборки не возникнет. Это нужно учитывать при отладке.

## Серверные переменные окружения

В App Router серверный код выполняется в Server Components, Route Handlers и Server Actions. Все три имеют доступ к серверным переменным через `process.env`.

### Server Component

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const response = await fetch(`${process.env.INTERNAL_API_URL}/stats`, {
    headers: {
      Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
    },
  });

  const data = await response.json();

  return <div>{data.totalUsers} пользователей</div>;
}
```

### Route Handler

```typescript
// app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-webhook-signature');

  if (signature !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json();
  // обработка вебхука

  return NextResponse.json({ received: true });
}
```

### Server Action

```typescript
// app/actions/send-email.ts
'use server';

export async function sendEmail(formData: FormData) {
  const email = formData.get('email') as string;

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: [{ email }],
      from: { email: process.env.EMAIL_FROM },
      subject: 'Подтверждение',
    }),
  });
}
```

## Публичные переменные на клиенте

Переменные с префиксом `NEXT_PUBLIC_` встраиваются в JavaScript-бандл на этапе сборки. Это означает, что значение фиксируется в момент `next build`, а не при запуске сервера.

```typescript
// components/analytics.tsx
'use client';

import { useEffect } from 'react';

export function Analytics() {
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_ANALYTICS_ID;
    if (!id) return;

    // инициализация аналитики
    window.gtag?.('config', id);
  }, []);

  return null;
}
```

```typescript
// lib/api-client.ts — используется и на сервере, и на клиенте
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchProduct(id: string) {
  const res = await fetch(`${BASE_URL}/products/${id}`);
  if (!res.ok) throw new Error('Продукт не найден');
  return res.json();
}
```

Важный нюанс: поскольку значения встраиваются статически, динамическое обращение через вычисляемый ключ не сработает:

```typescript
// Так не работает — Next.js не может статически разрешить ключ
const key = 'NEXT_PUBLIC_API_URL';
const value = process.env[key]; // undefined

// Так работает — ключ известен статически
const value = process.env.NEXT_PUBLIC_API_URL; // 'https://api.example.com'
```

## Валидация переменных окружения

Отсутствие переменной окружения в продакшене — распространённая причина трудноуловимых багов. Рекомендуется валидировать переменные при старте приложения.

Популярный подход — использовать библиотеку `zod`:

```typescript
// lib/env.ts
import { z } from 'zod';

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  SENDGRID_API_KEY: z.string().startsWith('SG.'),
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_ANALYTICS_ID: z.string().optional(),
});

// Валидируем серверные переменные только на сервере
export const serverEnv = serverEnvSchema.parse(process.env);

// Клиентские переменные доступны везде
export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
});
```

Теперь вместо прямого обращения к `process.env` используем типизированный объект:

```typescript
// app/api/users/route.ts
import { serverEnv } from '@/lib/env';

export async function GET() {
  // serverEnv.DATABASE_URL — строго типизировано, валидировано при старте
  const users = await db.query(`SELECT * FROM users`);
  return Response.json(users);
}
```

Если переменная отсутствует или не соответствует схеме, приложение упадёт сразу при запуске с понятным сообщением об ошибке, а не в момент выполнения запроса.

## Переменные окружения и Docker

При деплое через Docker серверные переменные передаются через флаг `--env-file` или секции `environment` в `docker-compose.yml`. Публичные переменные (`NEXT_PUBLIC_`) должны быть доступны на этапе сборки образа, так как встраиваются в бандл:

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_ нужны при сборке
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ANALYTICS_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ANALYTICS_ID=$NEXT_PUBLIC_ANALYTICS_ID

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Серверные переменные передаются при запуске контейнера, не при сборке
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
services:
  web:
    build:
      context: .
      args:
        NEXT_PUBLIC_API_URL: https://api.example.com
        NEXT_PUBLIC_ANALYTICS_ID: GA-XXXXXXXX
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/mydb
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3000:3000"
```

## Встроенные переменные Next.js

Next.js автоматически предоставляет несколько переменных:

```typescript
// NODE_ENV — автоматически 'development', 'production' или 'test'
if (process.env.NODE_ENV === 'development') {
  console.log('Режим разработки');
}

// VERCEL_URL — на Vercel содержит URL деплоя
const siteUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';
```

`NODE_ENV` нельзя переопределить вручную — Next.js управляет ею автоматически.

## Структура .env файлов проекта

Рекомендуемая структура для реального проекта:

```bash
# .env — коммитится, содержит заглушки и документацию
DATABASE_URL=
JWT_SECRET=
SENDGRID_API_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3000

# .env.development — коммитится, значения для разработки
NEXT_PUBLIC_API_URL=http://localhost:3001

# .env.local — не коммитится, реальные секреты для локальной разработки
DATABASE_URL=postgresql://postgres:password@localhost:5432/mydb_dev
JWT_SECRET=dev-secret-key-minimum-32-characters
SENDGRID_API_KEY=SG.xxxxxxxxxx
```

Файл `.env` с пустыми значениями служит документацией: любой разработчик, клонировавший репозиторий, сразу видит, какие переменные нужно задать.

## Лучшие практики

**Никогда не коммитьте секреты.** Добавьте `.env*.local` в `.gitignore` и проверяйте это правило в CI через `git-secrets` или аналоги.

**Валидируйте при старте.** Используйте zod или аналогичный инструмент, чтобы падать быстро и с понятным сообщением.

**Разделяйте серверные и клиентские переменные.** Следите за тем, чтобы API-ключи и строки подключения не имели префикса `NEXT_PUBLIC_`.

**Документируйте через `.env`.** Пустой `.env` с комментариями — лучшая документация для онбординга.

**Используйте разные значения для разных сред.** Не используйте продакшен-базу данных для разработки и тестов.

```bash
# .env — пример с комментариями-документацией

# Строка подключения к PostgreSQL
# Формат: postgresql://user:password@host:port/database
DATABASE_URL=

# Секрет для подписи JWT, минимум 32 символа
JWT_SECRET=

# API ключ SendGrid для отправки email
# Получить на: https://app.sendgrid.com/settings/api_keys
SENDGRID_API_KEY=

# Базовый URL публичного API (доступен в браузере)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Правильная работа с переменными окружения — фундамент безопасного и предсказуемого деплоя Next.js приложений.

Чтобы глубже разобраться с разработкой и деплоем Next.js приложений, записывайтесь на курс [Next.js на PurpleSchool](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=text&utm_campaign=nextjs-env-variables).
---
metaTitle: "Безопасные env переменные в TypeScript"
metaDescription: "Как типизировать и валидировать переменные окружения в TypeScript с помощью Zod, envalid и собственных решений. Примеры с process.env."
author: "Антон Ларичев"
title: "Безопасные env переменные в TypeScript"
preview: "Разбираем способы типизации и валидации переменных окружения в TypeScript: от ручного подхода до Zod и готовых библиотек."
---

## Проблема: process.env возвращает string | undefined

Каждый разработчик на TypeScript сталкивался с такой ситуацией: обращаешься к `process.env.DATABASE_URL`, а TypeScript сообщает, что тип этого значения — `string | undefined`. Приходится либо добавлять ненужные проверки по всему коду, либо использовать оператор `!` (non-null assertion), что убивает смысл строгой типизации.

```typescript
// Проблема: TypeScript не знает, определена ли переменная
const dbUrl = process.env.DATABASE_URL; // string | undefined

// Плохое решение — оператор !
const dbUrl = process.env.DATABASE_URL!; // убираем undefined насильно

// Неудобное решение — проверка в каждом месте использования
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}
const dbUrl = process.env.DATABASE_URL; // string
```

Эти подходы работают, но плохо масштабируются. Когда переменных окружения десятки, проверки разбросаны по всему проекту, а об отсутствии нужной переменной узнаешь только в рантайме — часто уже в продакшене.

Правильный подход — централизованная валидация env переменных при старте приложения с полной типизацией результата.

## Ручной подход: централизованная конфигурация

Самый простой способ без сторонних зависимостей — создать отдельный модуль конфигурации, который валидирует переменные при инициализации.

```typescript
// src/config/env.ts

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  PORT: parseInt(optionalEnv('PORT', '3000'), 10),
  NODE_ENV: optionalEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  JWT_SECRET: requireEnv('JWT_SECRET'),
  REDIS_URL: process.env.REDIS_URL, // опционально, string | undefined
} as const;
```

Теперь во всём проекте используется только `env` из этого модуля:

```typescript
// src/database/connection.ts
import { env } from '../config/env';

// TypeScript знает точный тип — string, не string | undefined
console.log(env.DATABASE_URL.toUpperCase()); // OK

// TypeScript знает, что PORT — number
const server = app.listen(env.PORT);
```

Если какая-то обязательная переменная не задана, приложение немедленно падает при старте с понятным сообщением об ошибке. Это гораздо лучше, чем таинственный сбой где-то в глубине кода.

### Приведение типов для числовых и булевых значений

Переменные окружения всегда строки, поэтому нужно явно приводить типы:

```typescript
// src/config/env.ts

function parseNumber(name: string, defaultValue?: number): number {
  const raw = process.env[name];
  if (raw === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  const parsed = Number(raw);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number, got: "${raw}"`);
  }
  return parsed;
}

function parseBoolean(name: string, defaultValue?: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  throw new Error(`Environment variable ${name} must be true/false, got: "${raw}"`);
}

export const env = {
  PORT: parseNumber('PORT', 3000),
  DB_POOL_SIZE: parseNumber('DB_POOL_SIZE', 10),
  DEBUG: parseBoolean('DEBUG', false),
  ENABLE_CACHE: parseBoolean('ENABLE_CACHE', true),
} as const;
```

## Валидация через Zod

Zod — популярная библиотека для схемной валидации, которая отлично интегрируется с TypeScript. Она позволяет описать схему переменных окружения декларативно и получить типы автоматически.

```bash
npm install zod
```

```typescript
// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET должен быть не менее 32 символов'),
  REDIS_URL: z.string().url().optional(),
  DEBUG: z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .default('false'),
  API_RATE_LIMIT: z.coerce.number().int().min(1).max(10000).default(100),
});

// Тип выводится автоматически из схемы
export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:');
    result.error.issues.forEach((issue) => {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
```

Особенности этого подхода:

- `z.coerce.number()` автоматически конвертирует строку в число
- `.default()` задаёт значение по умолчанию
- `.safeParse()` не бросает исключение, а возвращает объект с результатом
- При ошибках выводятся все проблемы сразу, а не только первая
- Тип `Env` выводится из схемы — никакого дублирования

### Пример вывода ошибок

Если переменные заданы неверно, вы увидите:

```
Invalid environment variables:
  DATABASE_URL: Invalid url
  JWT_SECRET: JWT_SECRET должен быть не менее 32 символов
  PORT: Expected number, received nan
```

Приложение завершится с кодом 1 — никакого продолжения работы с неполной конфигурацией.

### Расширенная схема с кастомными проверками

```typescript
import { z } from 'zod';

const envSchema = z
  .object({
    DATABASE_URL: z.string().url(),
    DATABASE_SSL: z
      .string()
      .transform((val) => val === 'true')
      .default('false'),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),
    EMAIL_FROM: z.string().email().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().optional(),
  })
  .refine(
    (data) => {
      // Если задан S3_BUCKET, то S3_REGION обязателен
      if (data.S3_BUCKET && !data.S3_REGION) return false;
      return true;
    },
    {
      message: 'S3_REGION обязателен при наличии S3_BUCKET',
      path: ['S3_REGION'],
    }
  )
  .refine(
    (data) => {
      // Если задан EMAIL_FROM, нужны SMTP настройки
      if (data.EMAIL_FROM && (!data.SMTP_HOST || !data.SMTP_PORT)) return false;
      return true;
    },
    {
      message: 'SMTP_HOST и SMTP_PORT обязательны при наличии EMAIL_FROM',
      path: ['SMTP_HOST'],
    }
  );
```

Метод `.refine()` позволяет добавлять перекрёстные проверки между полями — это невозможно при простом ручном подходе.

## Библиотека envalid

Другой популярный вариант — библиотека `envalid`, разработанная специально для валидации переменных окружения.

```bash
npm install envalid
```

```typescript
// src/config/env.ts
import { cleanEnv, str, num, bool, url, email, port } from 'envalid';

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
  PORT: port({ default: 3000 }),
  DATABASE_URL: url(),
  JWT_SECRET: str({ docs: 'https://your-docs.com/jwt-setup' }),
  ADMIN_EMAIL: email({ devDefault: 'admin@localhost' }),
  ENABLE_FEATURE_X: bool({ default: false }),
  MAX_CONNECTIONS: num({ default: 10 }),
});

// Полная типизация: env.DATABASE_URL — string, env.PORT — number
console.log(env.DATABASE_URL); // string
console.log(env.PORT);         // number
console.log(env.isProd);       // встроенное свойство: boolean
console.log(env.isDev);        // встроенное свойство: boolean
```

`envalid` имеет встроенные валидаторы для распространённых типов: `url`, `email`, `port`, `host`, `json`. Встроенные свойства `isProd`, `isDev`, `isTest` — удобный бонус.

Параметр `devDefault` позволяет задать значение, используемое только в разработке, — так не нужно держать секреты в `.env` при онбординге новых разработчиков.

## Подход с namespace: разделение конфигурации по доменам

По мере роста проекта удобно разделять конфигурацию на логические группы:

```typescript
// src/config/env.ts
import { z } from 'zod';

const databaseSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_MAX_CONNECTIONS: z.coerce.number().int().positive().default(10),
  DATABASE_SSL: z.string().transform((v) => v === 'true').default('false'),
});

const authSchema = z.object({
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_SECRET: z.string().min(32),
});

const appSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().url().optional(),
});

function parseSchema<T>(schema: z.ZodSchema<T>, label: string): T {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    console.error(`Config error in ${label}:`);
    result.error.issues.forEach((issue) => {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }
  return result.data;
}

export const env = {
  db: parseSchema(databaseSchema, 'database'),
  auth: parseSchema(authSchema, 'auth'),
  app: parseSchema(appSchema, 'app'),
} as const;
```

Использование:

```typescript
import { env } from './config/env';

// Ясно, откуда берётся конфигурация
const pool = createPool(env.db.DATABASE_URL, {
  max: env.db.DATABASE_MAX_CONNECTIONS,
  ssl: env.db.DATABASE_SSL,
});

const token = signJwt(payload, env.auth.JWT_SECRET, {
  expiresIn: env.auth.JWT_EXPIRES_IN,
});

app.listen(env.app.PORT);
```

## Типизация process.env через Declaration Merging

Если хочется сохранить привычный синтаксис `process.env`, можно расширить тип через declaration merging:

```typescript
// src/types/env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NODE_ENV: 'development' | 'production' | 'test';
      readonly DATABASE_URL: string;
      readonly JWT_SECRET: string;
      readonly PORT?: string;
      readonly REDIS_URL?: string;
    }
  }
}

export {};
```

Теперь `process.env.DATABASE_URL` имеет тип `string` (не `string | undefined`), а `process.env.UNKNOWN_VAR` вызывает ошибку компиляции.

Однако этот подход имеет ограничение: TypeScript лишь проверяет типы на этапе компиляции, но не гарантирует наличие переменных в рантайме. Его стоит комбинировать с валидацией при старте:

```typescript
// src/config/validateEnv.ts
const required: Array<keyof NodeJS.ProcessEnv> = [
  'DATABASE_URL',
  'JWT_SECRET',
];

export function validateEnv(): void {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
```

## Работа с .env файлами через dotenv

В большинстве проектов переменные окружения хранятся в `.env` файлах. Библиотека `dotenv` загружает их в `process.env`:

```bash
npm install dotenv
```

```typescript
// src/config/env.ts — ПЕРВЫЙ импортируемый модуль в приложении
import 'dotenv/config'; // Загружает .env до всего остального
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
});

export const env = (() => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid env:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
})();
```

```typescript
// src/index.ts — env импортируется первым
import './config/env'; // Гарантирует загрузку и валидацию при старте
import { env } from './config/env';
import express from 'express';

const app = express();
app.listen(env.PORT);
```

### Разные .env файлы для разных окружений

```typescript
import * as dotenv from 'dotenv';
import * as path from 'path';

const envFile = process.env.NODE_ENV === 'test'
  ? '.env.test'
  : process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });
```

Типичная структура файлов:

```
.env                 # локальная разработка, в .gitignore
.env.example         # шаблон, коммитится в репозиторий
.env.test            # для тестов, можно коммитить без секретов
.env.production      # продакшн, никогда не коммитится
```

## Тестирование с подменой переменных окружения

Валидация env при старте создаёт проблему для тестов: нужно либо задавать все переменные, либо мокировать модуль.

```typescript
// tests/setup.ts
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://localhost:5432/testdb';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

// Сбрасываем кеш модуля, чтобы env пересчитался
jest.resetModules();
```

Лучший подход — ленивая инициализация через функцию:

```typescript
// src/config/env.ts
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

let _env: z.infer<typeof schema> | null = null;

export function getEnv(): z.infer<typeof schema> {
  if (!_env) {
    const result = schema.safeParse(process.env);
    if (!result.success) {
      throw new Error(`Invalid env: ${JSON.stringify(result.error.flatten().fieldErrors)}`);
    }
    _env = result.data;
  }
  return _env;
}

// Для тестов — сброс кеша
export function resetEnvCache(): void {
  _env = null;
}
```

```typescript
// tests/example.test.ts
import { getEnv, resetEnvCache } from '../src/config/env';

beforeEach(() => {
  resetEnvCache();
});

it('throws when DATABASE_URL is missing', () => {
  const original = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  expect(() => getEnv()).toThrow('Invalid env');

  process.env.DATABASE_URL = original;
});
```

## Сравнение подходов

| Подход | Зависимости | Рантайм-валидация | Удобство | Подходит для |
|---|---|---|---|---|
| Ручной | Нет | Базовая | Среднее | Небольших проектов |
| Declaration merging | Нет | Нет | Высокое | Простых случаев |
| Zod | zod | Полная | Высокое | Большинства проектов |
| envalid | envalid | Полная | Высокое | Проектов с dotenv |

Для большинства современных TypeScript-проектов рекомендуется подход с Zod: он даёт полную валидацию, автоматический вывод типов, кросс-поля проверки через `.refine()` и понятные сообщения об ошибках.

## Итог

Безопасная работа с переменными окружения в TypeScript строится на трёх принципах:

1. **Централизация** — все переменные окружения обрабатываются в одном месте, а не разбросаны по коду.
2. **Ранняя валидация** — проверка происходит при старте приложения, а не в момент использования переменной.
3. **Строгая типизация** — весь остальной код работает с уже провалидированными типизированными значениями, без `string | undefined`.

Это защищает от целого класса ошибок конфигурации и делает код чище — никаких защитных проверок и операторов `!` по всей кодовой базе.

Чтобы глубже разобраться с системой типов TypeScript и научиться писать надёжный, строго типизированный код, изучите курс по TypeScript на PurpleSchool: https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-safe-env-variables
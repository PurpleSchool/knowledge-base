---
metaTitle: "TypeScript типизация в Node.js проекте — настройка и примеры"
metaDescription: "Как настроить TypeScript в Node.js проекте: tsconfig, типы для Express, переменные окружения, middleware и кастомные интерфейсы."
author: "Антон Ларичев"
title: "TypeScript типизация в Node.js проекте"
preview: "Полное руководство по настройке TypeScript в Node.js: установка, конфигурация tsconfig.json, типизация Express, middleware и переменных окружения."
---

## Зачем TypeScript в Node.js проекте

Node.js — это JavaScript-среда, и по умолчанию в ней нет статической типизации. Это значит, что ошибки в типах данных обнаруживаются только в момент выполнения кода, часто уже в продакшне. TypeScript решает эту проблему: он добавляет статическую типизацию, улучшает автодополнение в редакторе и делает рефакторинг безопасным.

В этой статье разберём, как с нуля настроить TypeScript в Node.js проекте, правильно сконфигурировать `tsconfig.json`, типизировать HTTP-запросы, middleware, переменные окружения и создавать кастомные типы для доменной логики.

## Установка и начальная настройка

Создадим новый проект и установим все необходимые зависимости:

```bash
mkdir node-ts-project && cd node-ts-project
npm init -y
npm install --save-dev typescript ts-node @types/node
```

Пакет `@types/node` содержит определения типов для встроенных модулей Node.js: `fs`, `path`, `http`, `process` и других. Без него TypeScript не будет знать о типах `Buffer`, `EventEmitter` или `process.env`.

Сгенерируем базовый `tsconfig.json`:

```bash
npx tsc --init
```

## Конфигурация tsconfig.json для Node.js

Дефолтный `tsconfig.json` содержит много закомментированных опций. Для Node.js проекта оптимальная конфигурация выглядит так:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Разберём ключевые параметры:

- `target: "ES2020"` — целевая версия JavaScript. Node.js 14+ полностью поддерживает ES2020, поэтому нет нужды компилировать в ES5.
- `module: "commonjs"` — Node.js по умолчанию использует CommonJS модули (`require`/`module.exports`).
- `strict: true` — включает набор строгих проверок: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes` и другие. Рекомендуется всегда включать.
- `esModuleInterop: true` — позволяет импортировать CommonJS модули через синтаксис `import x from 'module'`.
- `resolveJsonModule: true` — разрешает импортировать `.json` файлы с полной типизацией.
- `sourceMap: true` — генерирует source maps для отладки скомпилированного кода.

## Скрипты в package.json

Добавим удобные скрипты для разработки и сборки:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "dev:watch": "ts-node --watch src/index.ts"
  }
}
```

## Типизация встроенных модулей Node.js

Благодаря пакету `@types/node` все встроенные модули уже типизированы. Посмотрим, как это работает на практике:

```typescript
import * as fs from 'fs';
import * as path from 'path';

// TypeScript знает, что readFileSync возвращает Buffer или string
const content: string = fs.readFileSync(
  path.join(__dirname, 'config.json'),
  'utf-8'
);

// Типизированная работа с EventEmitter
import { EventEmitter } from 'events';

interface AppEvents {
  userCreated: (userId: string) => void;
  orderPlaced: (orderId: number, total: number) => void;
}

class TypedEmitter extends EventEmitter {
  emit<K extends keyof AppEvents>(event: K, ...args: Parameters<AppEvents[K]>): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof AppEvents>(event: K, listener: AppEvents[K]): this {
    return super.on(event, listener);
  }
}

const emitter = new TypedEmitter();
emitter.on('userCreated', (userId) => {
  // userId здесь string — TypeScript это знает
  console.log(`Создан пользователь: ${userId}`);
});
```

## Установка и типизация Express

Express — самый популярный HTTP-фреймворк для Node.js. Установим его вместе с типами:

```bash
npm install express
npm install --save-dev @types/express
```

Базовый типизированный сервер:

```typescript
import express, { Application, Request, Response, NextFunction } from 'express';

const app: Application = express();

app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});
```

## Типизация параметров запросов

Express предоставляет generic-типы для типизации параметров запроса:

```typescript
import { Request, Response } from 'express';

// Типизация параметров маршрута
interface UserParams {
  id: string;
}

// Типизация тела запроса
interface CreateUserBody {
  name: string;
  email: string;
  age?: number;
}

// Типизация query-параметров
interface UserQueryParams {
  page?: string;
  limit?: string;
  search?: string;
}

// Типизация ответа
interface UserResponse {
  id: string;
  name: string;
  email: string;
}

// Request<Params, ResBody, ReqBody, Query>
app.get<UserParams, UserResponse>(
  '/users/:id',
  (req: Request<UserParams>, res: Response<UserResponse>) => {
    const { id } = req.params; // string — типизировано
    
    // Имитация получения пользователя
    const user: UserResponse = {
      id,
      name: 'Иван Иванов',
      email: 'ivan@example.com',
    };
    
    res.json(user);
  }
);

app.post<{}, UserResponse, CreateUserBody>(
  '/users',
  (req: Request<{}, UserResponse, CreateUserBody>, res: Response<UserResponse>) => {
    const { name, email, age } = req.body; // Полностью типизировано
    
    const newUser: UserResponse = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
    };
    
    res.status(201).json(newUser);
  }
);

app.get<{}, UserResponse[], {}, UserQueryParams>(
  '/users',
  (req: Request<{}, UserResponse[], {}, UserQueryParams>, res: Response<UserResponse[]>) => {
    const { page = '1', limit = '10', search } = req.query; // типизировано
    
    // page и limit — string (URL-параметры всегда строки)
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    res.json([]);
  }
);
```

## Типизация middleware

Middleware-функции в Express принимают `req`, `res` и `next`. Покажем, как правильно их типизировать, в том числе с расширением объекта запроса:

```typescript
import { Request, Response, NextFunction } from 'express';

// Расширяем интерфейс Request для добавления кастомных свойств
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      startTime?: number;
    }
  }
}

// Middleware аутентификации
const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    res.status(401).json({ error: 'Токен не предоставлен' });
    return;
  }
  
  // Декодируем токен и добавляем userId в запрос
  req.userId = 'user-123'; // В реальном проекте здесь декодирование JWT
  next();
};

// Middleware логирования с замером времени
const timingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime ?? 0);
    console.log(`${req.method} ${req.path} — ${duration}ms`);
  });
  
  next();
};

// Middleware обработки ошибок
interface AppError extends Error {
  statusCode?: number;
}

const errorMiddleware = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode ?? 500;
  res.status(statusCode).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

app.use(timingMiddleware);
app.use('/api', authMiddleware);
app.use(errorMiddleware);
```

## Типизация переменных окружения

Переменные окружения (`process.env`) имеют тип `string | undefined`. Это часто неудобно и приводит к многочисленным проверкам. Есть несколько подходов к решению этой проблемы.

### Подход 1: Обёртка с валидацией

```typescript
// src/config/env.ts
function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Переменная окружения ${key} не задана`);
  }
  return value;
}

function getEnvVarAsNumber(key: string): number {
  const value = getEnvVar(key);
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Переменная окружения ${key} должна быть числом`);
  }
  return num;
}

export const config = {
  port: getEnvVarAsNumber('PORT'),
  databaseUrl: getEnvVar('DATABASE_URL'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
} as const;

// Используем в приложении
import { config } from './config/env';

app.listen(config.port, () => {
  console.log(`Сервер запущен на порту ${config.port}`);
});
```

### Подход 2: Расширение типов process.env

```typescript
// src/types/environment.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      DATABASE_URL: string;
      JWT_SECRET: string;
      REDIS_URL?: string;
    }
  }
}

export {};
```

Теперь `process.env.PORT` имеет тип `string`, а не `string | undefined`, и IDE будет подсказывать доступные переменные.

## Типизация работы с базой данных

Покажем типизацию на примере работы с PostgreSQL через `pg`:

```bash
npm install pg
npm install --save-dev @types/pg
```

```typescript
import { Pool, QueryResult } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

interface CreateUserDto {
  name: string;
  email: string;
}

// Типизированная функция запроса
async function getUserById(id: number): Promise<User | null> {
  const result: QueryResult<User> = await pool.query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [id]
  );
  
  return result.rows[0] ?? null;
}

async function createUser(dto: CreateUserDto): Promise<User> {
  const result: QueryResult<User> = await pool.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    [dto.name, dto.email]
  );
  
  return result.rows[0];
}

async function getAllUsers(): Promise<User[]> {
  const result: QueryResult<User> = await pool.query(
    'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC'
  );
  
  return result.rows;
}
```

## Утилитарные типы в контексте Node.js

TypeScript предоставляет встроенные утилитарные типы, которые особенно полезны при работе с API:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// Тип для ответа API — без пароля
type PublicUser = Omit<User, 'password'>;

// Тип для создания пользователя — без id и createdAt
type CreateUserDto = Omit<User, 'id' | 'createdAt'>;

// Тип для обновления — все поля опциональны
type UpdateUserDto = Partial<Omit<User, 'id' | 'createdAt'>>;

// Тип для поиска пользователей
type UserFilter = Pick<User, 'role' | 'email'>;

// Функции с правильными типами
async function getUser(id: number): Promise<PublicUser> {
  // Имплементация
  return { id, name: 'Иван', email: 'ivan@example.com', role: 'user', createdAt: new Date() };
}

async function updateUser(id: number, dto: UpdateUserDto): Promise<PublicUser> {
  // dto.password может быть undefined или string — всё типизировано
  return getUser(id);
}
```

## Организация типов в проекте

Для среднего и крупного проекта рекомендуется выделить типы в отдельные файлы:

```
src/
  types/
    user.types.ts      # Типы для сущности User
    order.types.ts     # Типы для сущности Order
    common.types.ts    # Общие утилитарные типы
    environment.d.ts   # Расширение типов окружения
    express.d.ts       # Расширение типов Express
  routes/
    user.routes.ts
  controllers/
    user.controller.ts
  services/
    user.service.ts
```

Пример `common.types.ts`:

```typescript
// Обёртка для пагинации
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Стандартный ответ API
export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Тип для идентификаторов
export type ID = string | number;

// Тип для сортировки
export interface SortOptions<T> {
  field: keyof T;
  direction: 'asc' | 'desc';
}
```

## Итог

TypeScript в Node.js проекте — это не просто синтаксическое удобство. Это инструмент, который:

- Выявляет ошибки типов на этапе компиляции, а не в рантайме
- Делает код самодокументирующимся через интерфейсы и типы
- Ускоряет разработку за счёт автодополнения в IDE
- Упрощает рефакторинг в больших проектах

Ключевые шаги при настройке: установить `typescript` и `@types/node`, настроить `tsconfig.json` с `strict: true`, добавить типы для всех используемых библиотек (`@types/express`, `@types/pg` и т.д.), выделить переменные окружения в типизированный конфиг и организовать типы в отдельные файлы.

Чтобы освоить TypeScript глубже и научиться применять его в реальных проектах, записывайтесь на курс по TypeScript на PurpleSchool: https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-in-nodejs
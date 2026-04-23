---
metaTitle: API Routes в Next.js — создание серверных обработчиков запросов
metaDescription: Полный разбор API Routes в Next.js — Pages Router API handlers и App Router Route Handlers, работа с Request/Response, middleware, примеры на TypeScript.
author: Антон Ларичев
title: API Routes в Next.js — как создавать серверные обработчики запросов
preview: Разбираем API Routes в Next.js — создание обработчиков в Pages Router и Route Handlers в App Router, работа с методами HTTP, валидация данных и обработка ошибок.
---

## Введение

API Routes — встроенная возможность Next.js создавать серверные HTTP-обработчики прямо внутри проекта, без отдельного бэкенд-сервера. Это позволяет строить полноценный fullstack-проект в одном репозитории: React-компоненты на фронтенде и серверная логика рядом.

В **Pages Router** API Routes живут в папке `pages/api/`. В **App Router** это называется **Route Handlers** и размещается в файлах `route.ts` внутри папки `app/`. В этой статье рассмотрим оба подхода с практическими примерами на TypeScript.

## API Routes в Pages Router

### Базовый обработчик

Каждый файл в `pages/api/` становится HTTP-эндпоинтом. Обработчик по умолчанию экспортирует функцию, принимающую объекты `NextApiRequest` и `NextApiResponse`:

```typescript
// pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from 'next';

interface ResponseData {
  message: string;
  timestamp: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  res.status(200).json({
    message: 'Привет от Next.js API!',
    timestamp: new Date().toISOString(),
  });
}
```

После запуска этот эндпоинт доступен по адресу `/api/hello`.

### Обработка разных HTTP-методов

Один файл обрабатывает все методы (GET, POST, PUT, DELETE). Метод определяется через `req.method`:

```typescript
// pages/api/users.ts
import type { NextApiRequest, NextApiResponse } from 'next';

interface User {
  id: number;
  name: string;
  email: string;
}

// Имитируем базу данных (в реальном проекте — ORM или БД)
const users: User[] = [
  { id: 1, name: 'Алиса', email: 'alice@example.com' },
  { id: 2, name: 'Боб', email: 'bob@example.com' },
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      // Возвращаем список пользователей
      return res.status(200).json(users);

    case 'POST': {
      // Создаём нового пользователя
      const { name, email } = req.body as Omit<User, 'id'>;

      if (!name || !email) {
        return res.status(400).json({ error: 'Поля name и email обязательны' });
      }

      const newUser: User = {
        id: users.length + 1,
        name,
        email,
      };

      users.push(newUser);
      return res.status(201).json(newUser);
    }

    default:
      // Метод не поддерживается
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Метод ${req.method} не поддерживается` });
  }
}
```

Если хотите детальнее изучить разработку fullstack-приложений на Next.js — приходите на наш курс [Next.js](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=article&utm_campaign=api-routes). На курсе 120 уроков и 30 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Динамические API Routes

Как и страницы, API Routes поддерживают динамические параметры через квадратные скобки:

```typescript
// pages/api/users/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';

interface User {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [
  { id: 1, name: 'Алиса', email: 'alice@example.com' },
  { id: 2, name: 'Боб', email: 'bob@example.com' },
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Параметр id приходит из URL: /api/users/1
  const { id } = req.query as { id: string };
  const userId = Number(id);

  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  switch (req.method) {
    case 'GET':
      return res.status(200).json(user);

    case 'DELETE': {
      const index = users.findIndex((u) => u.id === userId);
      users.splice(index, 1);
      return res.status(200).json({ deleted: true, id: userId });
    }

    default:
      res.setHeader('Allow', ['GET', 'DELETE']);
      return res.status(405).end();
  }
}
```

### Работа с заголовками и куками

```typescript
// pages/api/auth/me.ts
import type { NextApiRequest, NextApiResponse } from 'next';

interface UserInfo {
  id: string;
  role: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  // Читаем заголовок авторизации
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен авторизации не предоставлен' });
  }

  const token = authHeader.substring(7);

  // Читаем куку
  const sessionId = req.cookies['session-id'];

  // Устанавливаем заголовки ответа
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');

  // В реальном проекте здесь верификация JWT или проверка сессии
  const user: UserInfo = {
    id: '123',
    role: 'admin',
  };

  return res.status(200).json({ user, sessionId });
}
```

## Route Handlers в App Router

В App Router API Routes заменены на **Route Handlers** — файлы `route.ts` внутри папки `app/`. Они используют стандартный Web API (`Request`, `Response`, `NextRequest`, `NextResponse`).

### Базовый Route Handler

```typescript
// app/api/hello/route.ts
import { NextResponse } from 'next/server';

// GET /api/hello
export async function GET() {
  return NextResponse.json({
    message: 'Привет от Route Handler!',
    timestamp: new Date().toISOString(),
  });
}

// POST /api/hello
export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json(
    { received: body, status: 'ok' },
    { status: 201 }
  );
}
```

### CRUD-пример с NextRequest

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface Product {
  id: number;
  name: string;
  price: number;
}

const products: Product[] = [
  { id: 1, name: 'Ноутбук', price: 80000 },
  { id: 2, name: 'Мышь', price: 1500 },
];

export async function GET(request: NextRequest) {
  // Читаем query-параметры
  const searchParams = request.nextUrl.searchParams;
  const minPrice = searchParams.get('minPrice');

  let filtered = products;

  if (minPrice) {
    filtered = products.filter((p) => p.price >= Number(minPrice));
  }

  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, price } = body as Omit<Product, 'id'>;

  if (!name || price === undefined) {
    return NextResponse.json(
      { error: 'Поля name и price обязательны' },
      { status: 400 }
    );
  }

  const newProduct: Product = {
    id: products.length + 1,
    name,
    price,
  };

  products.push(newProduct);

  return NextResponse.json(newProduct, { status: 201 });
}
```

### Динамические Route Handlers

```typescript
// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface Product {
  id: number;
  name: string;
  price: number;
}

const products: Product[] = [
  { id: 1, name: 'Ноутбук', price: 80000 },
  { id: 2, name: 'Мышь', price: 1500 },
];

// GET /api/products/1
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const product = products.find((p) => p.id === Number(params.id));

  if (!product) {
    return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
  }

  return NextResponse.json(product);
}

// PUT /api/products/1
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const index = products.findIndex((p) => p.id === Number(params.id));

  if (index === -1) {
    return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
  }

  const body = await request.json();
  const updated: Product = { ...products[index], ...body, id: products[index].id };
  products[index] = updated;

  return NextResponse.json(updated);
}
```

## Частые ошибки

* **Парсинг body в GET-запросах.** GET-запросы не имеют тела. Не пытайтесь вызывать `req.body` или `request.json()` в GET-обработчиках.

* **Отсутствие проверки метода в Pages Router.** В Pages Router все методы попадают в один обработчик. Без проверки `req.method` ваш DELETE-обработчик отработает на GET-запрос.

* **CORS-проблемы.** По умолчанию API Routes доступны только с того же домена. Для публичного API добавляйте CORS-заголовки вручную или используйте middleware.

* **Утечка серверных данных.** Код в `pages/api/` и `app/api/` выполняется только на сервере и никогда не попадает в браузер. Можно безопасно использовать секреты из переменных окружения.

## Часто задаваемые вопросы

**Когда использовать API Routes вместо отдельного бэкенда?**

API Routes идеальны для небольших проектов, BFF (Backend for Frontend) и прокирования запросов к внешним сервисам. Для больших систем с высокой нагрузкой или микросервисной архитектурой лучше выделить отдельный бэкенд.

**Можно ли использовать middleware в Pages Router API?**

Да, можно создать HOF (функцию высшего порядка) для оборачивания обработчиков. В App Router для этого используется файл `middleware.ts` или вынесенная логика в отдельный хелпер.

**Можно ли вызывать API Routes напрямую из getServerSideProps?**

Технически можно, но это неэффективно — запрос делает лишний сетевой hop. Лучше вызывать общую функцию получения данных напрямую, без HTTP.

## Заключение

API Routes и Route Handlers в Next.js — мощный инструмент для fullstack-разработки. Они позволяют строить серверную логику без отдельного сервера, работать с базами данных, авторизацией и внешними API прямо внутри Next.js-проекта.

Для углублённого изучения разработки fullstack-приложений на Next.js рекомендуем курс [Next.js](https://purpleschool.ru/course/nextjs?utm_source=knowledgebase&utm_medium=article&utm_campaign=api-routes). В первых модулях доступно бесплатное содержание — познакомьтесь с форматом обучения до покупки полного доступа.

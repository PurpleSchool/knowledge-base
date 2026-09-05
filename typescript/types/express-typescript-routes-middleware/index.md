---
metaTitle: "TypeScript с Express.js: типизация маршрутов и middleware"
metaDescription: "Как типизировать маршруты, параметры, тело запроса и middleware в Express.js с помощью TypeScript. Практические примеры и паттерны."
author: "Антон Ларичев"
title: "TypeScript с Express.js: типизация маршрутов и middleware"
preview: "Разбираем типизацию Request, Response, маршрутных параметров, query-строк, тела запроса и middleware в Express.js с TypeScript."
---

TypeScript превращает Express-приложение из набора функций с `any` в строго типизированную систему, где ошибки ловятся на этапе компиляции, а IDE даёт точные подсказки. В этой статье разберём все ключевые аспекты типизации: параметры маршрутов, тело запроса, query-строки, кастомные middleware и обработку ошибок.

## Настройка проекта

Для начала установим необходимые зависимости:

```bash
npm install express
npm install -D typescript @types/express @types/node ts-node
```

Минимальный `tsconfig.json` для Express-проекта:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

Флаг `strict: true` критически важен — он включает `strictNullChecks`, `noImplicitAny` и другие проверки, которые делают типизацию полезной, а не декоративной.

## Дженерики Request и Response

Пакет `@types/express` предоставляет интерфейс `Request` с четырьмя дженерик-параметрами:

```typescript
interface Request<
  P = ParamsDictionary,   // параметры маршрута (:id, :slug)
  ResBody = any,           // тип тела ответа
  ReqBody = any,           // тип тела запроса
  ReqQuery = ParsedQs      // параметры query-строки
> {}
```

Интерфейс `Response` принимает один параметр — тип тела ответа:

```typescript
interface Response<ResBody = any> {}
```

Зная эту сигнатуру, можно точно описать каждый обработчик.

## Типизация параметров маршрута

Параметры маршрута (`:id`, `:slug`) всегда приходят как строки. Описываем их через интерфейс и передаём первым дженериком:

```typescript
import { Request, Response, Router } from 'express';

interface UserParams {
  id: string;
}

const router = Router();

router.get('/users/:id', (req: Request<UserParams>, res: Response) => {
  const { id } = req.params; // string — TypeScript знает тип
  res.json({ userId: id });
});
```

Если нужно число, явно преобразуем:

```typescript
router.get('/users/:id', (req: Request<UserParams>, res: Response) => {
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId)) {
    res.status(400).json({ error: 'Invalid user ID' });
    return;
  }

  res.json({ userId });
});
```

## Типизация тела запроса

Тело запроса передаётся третьим дженериком `ReqBody`. Описываем структуру через интерфейс:

```typescript
interface CreateUserBody {
  name: string;
  email: string;
  age?: number;
}

interface UserResponse {
  id: number;
  name: string;
  email: string;
}

router.post(
  '/users',
  (req: Request<{}, UserResponse, CreateUserBody>, res: Response<UserResponse>) => {
    const { name, email, age } = req.body;
    // name: string, email: string, age: number | undefined

    const newUser: UserResponse = {
      id: Date.now(),
      name,
      email,
    };

    res.status(201).json(newUser);
  }
);
```

Важный нюанс: TypeScript верит вашим типам, но не проверяет данные в рантайме. Для реальной валидации используйте библиотеки вроде `zod` или `class-validator`.

## Типизация query-строки

Query-параметры (`.../users?page=2&limit=10`) типизируются четвёртым дженериком. Пакет `@types/express` ожидает тип, совместимый с `ParsedQs`, где все значения могут быть `string | string[] | ParsedQs | undefined`:

```typescript
import { ParsedQs } from 'qs';

interface UsersQuery extends ParsedQs {
  page?: string;
  limit?: string;
  search?: string;
}

router.get(
  '/users',
  (req: Request<{}, UserResponse[], {}, UsersQuery>, res: Response<UserResponse[]>) => {
    const page = parseInt(req.query.page ?? '1', 10);
    const limit = parseInt(req.query.limit ?? '10', 10);
    const search = req.query.search ?? '';

    // Логика поиска и пагинации...
    res.json([]);
  }
);
```

Поскольку query-параметры всегда строки, преобразование к числу делается вручную.

## Создание типизированных middleware

Middleware — функции с сигнатурой `(req, res, next)`. TypeScript позволяет точно описать, что они делают с объектом запроса.

### Middleware аутентификации

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
  email: string;
  role: 'admin' | 'user';
}

// Расширяем интерфейс Request глобально
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

Ключ здесь — расширение глобального пространства имён `Express.Request`. После этого свойство `req.user` доступно с типом `JwtPayload | undefined` во всех обработчиках, подключённых после данного middleware.

### Middleware логирования

```typescript
import { Request, Response, NextFunction } from 'express';

interface RequestWithStartTime extends Request {
  startTime?: number;
}

export function loggerMiddleware(
  req: RequestWithStartTime,
  res: Response,
  next: NextFunction
): void {
  req.startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - (req.startTime ?? 0);
    console.log(`${req.method} ${req.path} ${res.statusCode} — ${duration}ms`);
  });

  next();
}
```

Здесь мы создаём локальный интерфейс вместо расширения глобального — подходит когда свойство нужно только внутри одного модуля.

### Middleware валидации

Паттерн фабрики middleware: функция принимает схему и возвращает middleware:

```typescript
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

// Использование:
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(0).optional(),
});

router.post('/users', validateBody(createUserSchema), (req, res) => {
  // req.body теперь провалидирован, но TypeScript не знает это автоматически
  // Для полной типобезопасности используйте z.infer
  const body = req.body as z.infer<typeof createUserSchema>;
  res.status(201).json(body);
});
```

## Типизированный обработчик ошибок

Express распознаёт обработчик ошибок по наличию четырёх параметров. TypeScript требует явно указать тип ошибки:

```typescript
import { Request, Response, NextFunction } from 'express';

class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

// Подключается последним
app.use(errorHandler);
```

Параметр `next` обязателен в сигнатуре — Express определяет обработчик ошибок именно по четырём параметрам, иначе он не будет вызываться при ошибках.

## Типизированный Router с паттерном Controller

Для крупных приложений удобно выделять контроллеры как классы или объекты с типизированными методами:

```typescript
import { Request, Response, NextFunction } from 'express';

interface UserController {
  getAll(req: Request, res: Response): Promise<void>;
  getById(req: Request<{ id: string }>, res: Response): Promise<void>;
  create(req: Request<{}, {}, CreateUserBody>, res: Response): Promise<void>;
  update(
    req: Request<{ id: string }, {}, Partial<CreateUserBody>>,
    res: Response
  ): Promise<void>;
  remove(req: Request<{ id: string }>, res: Response): Promise<void>;
}

const userController: UserController = {
  async getAll(req, res) {
    res.json([]);
  },

  async getById(req, res) {
    const { id } = req.params;
    res.json({ id });
  },

  async create(req, res) {
    const { name, email } = req.body;
    res.status(201).json({ id: 1, name, email });
  },

  async update(req, res) {
    const { id } = req.params;
    const updates = req.body;
    res.json({ id, ...updates });
  },

  async remove(req, res) {
    res.status(204).send();
  },
};

// Роутер
const usersRouter = Router();
usersRouter.get('/', userController.getAll);
usersRouter.get('/:id', userController.getById);
usersRouter.post('/', authMiddleware, validateBody(createUserSchema), userController.create);
usersRouter.put('/:id', authMiddleware, userController.update);
usersRouter.delete('/:id', authMiddleware, userController.remove);
```

## Обёртка для async-обработчиков

Async-обработчики не передают ошибки в Express автоматически — нужен явный `try/catch` или утилита:

```typescript
import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler<
  P = {},
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs
> = (
  req: Request<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<void>;

export function asyncHandler<P = {}, ResBody = any, ReqBody = any, ReqQuery = ParsedQs>(
  fn: AsyncRequestHandler<P, ResBody, ReqBody, ReqQuery>
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

// Использование:
router.get(
  '/users/:id',
  asyncHandler<{ id: string }, UserResponse>(async (req, res) => {
    const user = await userService.findById(req.params.id);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json(user);
  })
);
```

Ошибка, брошенная в async-функции, попадёт в `errorHandler` через `next`.

## Итог

Типизация Express с TypeScript строится на нескольких ключевых приёмах:

- Дженерики `Request<Params, ResBody, ReqBody, ReqQuery>` и `Response<ResBody>` описывают контракт каждого маршрута
- Расширение `Express.Request` через `declare global` добавляет свойства, которые middleware пишут в объект запроса
- Фабрики middleware (функции, возвращающие middleware) сохраняют типобезопасность и переиспользование
- Обёртка `asyncHandler` исключает дублирование `try/catch` и гарантирует, что async-ошибки доходят до error middleware
- Кастомный класс ошибки `AppError` позволяет централизованно обрабатывать HTTP-ответы об ошибках

Эти паттерны применимы как в небольших API, так и в крупных сервисах — TypeScript делает маршруты самодокументируемыми и защищает от регрессий при рефакторинге.

Чтобы глубже разобраться с TypeScript и его применением в реальных проектах, приходите на курс [TypeScript на PurpleSchool](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=express-typescript-routes-middleware).

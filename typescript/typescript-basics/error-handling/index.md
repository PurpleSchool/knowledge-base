---
metaTitle: "Типизация ошибок в TypeScript — обработка исключений"
metaDescription: "Как правильно типизировать ошибки в TypeScript: unknown в catch, кастомные классы, паттерн Result и exhaustive check через never."
author: "Антон Ларичев"
title: "Типизация ошибок и обработка исключений в TypeScript"
preview: "Разбираем, как TypeScript помогает безопасно работать с ошибками: тип unknown в catch, type guards, кастомные классы и паттерн Result."
---

## Почему типизация ошибок важна

В большинстве языков со статической типизацией ошибки строго типизированы. TypeScript исторически был исключением: в блоке `catch` переменная имела тип `any`, что лишало всех преимуществ типизации. С версии 4.0 ситуация изменилась — появилась опция `useUnknownInCatchVariables`, а в TypeScript 4.4 она вошла в строгий режим (`strict: true`).

Правильная типизация ошибок даёт три важных преимущества: компилятор не даст обратиться к несуществующим свойствам, IDE подсказывает доступные поля, а полное покрытие всех вариантов ошибок проверяется статически.

## Тип unknown в catch-блоках

До TypeScript 4.0 переменная ошибки в `catch` всегда имела тип `any`:

```typescript
try {
  // ...
} catch (error) {
  console.log(error.message); // TypeScript молчал, даже если message отсутствует
}
```

Начиная с TypeScript 4.4 при включённом `strict: true` переменная получает тип `unknown`:

```typescript
try {
  // ...
} catch (error) {
  // error: unknown
  console.log(error.message); // Ошибка компилятора: Object is of type 'unknown'
}
```

Это правильное поведение — TypeScript не знает, что именно будет выброшено. В JavaScript можно бросить что угодно: `throw "string"`, `throw 42`, `throw { code: 500 }`. Чтобы получить доступ к свойствам, нужно сначала сузить тип.

## Сужение типа ошибки

### Проверка instanceof

Самый распространённый способ — использование `instanceof`:

```typescript
try {
  await fetchData();
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message);
    console.log(error.stack);
  }
}
```

После проверки `instanceof Error` TypeScript знает, что `error` имеет тип `Error` со свойствами `message`, `name`, `stack`.

### Обработка разных типов броска

Иногда бросают не объекты `Error`, а примитивы:

```typescript
function riskyOperation() {
  if (Math.random() > 0.5) {
    throw "Something went wrong"; // строка
  }
  if (Math.random() > 0.5) {
    throw 42; // числовой код ошибки
  }
  throw new Error("Standard error");
}

try {
  riskyOperation();
} catch (error) {
  if (typeof error === "string") {
    console.log("Текстовая ошибка:", error.toUpperCase());
  } else if (typeof error === "number") {
    console.log("Код ошибки:", error);
  } else if (error instanceof Error) {
    console.log("Объект Error:", error.message);
  } else {
    console.log("Неизвестное исключение:", String(error));
  }
}
```

### Пользовательский type guard

Для проверки произвольных объектов пишут type guard-функции:

```typescript
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

function hasMessage(value: unknown): value is { message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as Record<string, unknown>).message === "string"
  );
}

try {
  // ...
} catch (error) {
  if (isError(error)) {
    console.log(error.message);
  } else if (hasMessage(error)) {
    console.log(error.message);
  } else {
    console.log("Неизвестная ошибка:", String(error));
  }
}
```

## Пользовательские классы ошибок

Собственные классы ошибок добавляют контекст и позволяют различать типы ошибок через `instanceof`.

### Создание иерархии

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "AppError";
    // Нужно для корректной работы instanceof при компиляции в ES5
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

class NetworkError extends AppError {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message, "NETWORK_ERROR");
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field: string
  ) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
```

### Использование в сервисе

```typescript
async function createUser(data: unknown): Promise<User> {
  if (!isValidUserData(data)) {
    throw new ValidationError("Некорректные данные пользователя", "email");
  }

  const response = await fetch("/api/users", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new NetworkError("Ошибка создания пользователя", response.status);
  }

  return response.json();
}

// В точке вызова
try {
  const user = await createUser(formData);
} catch (error) {
  if (error instanceof ValidationError) {
    showFieldError(error.field, error.message);
  } else if (error instanceof NetworkError) {
    if (error.statusCode === 401) {
      redirectToLogin();
    } else {
      showNotification(error.message);
    }
  } else if (error instanceof AppError) {
    logError(error.code, error.message);
  }
}
```

## Паттерн Result

Иногда выбрасывать исключения неудобно — лучше вернуть результат явно. Этот подход позволяет типизировать ошибки в сигнатуре функции, не прибегая к `try/catch` на каждом уровне.

### Реализация Result

```typescript
type Success<T> = {
  ok: true;
  value: T;
};

type Failure<E> = {
  ok: false;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

function ok<T>(value: T): Success<T> {
  return { ok: true, value };
}

function fail<E>(error: E): Failure<E> {
  return { ok: false, error };
}
```

### Функция с Result

```typescript
async function fetchUser(id: string): Promise<Result<User, NetworkError>> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      return fail(new NetworkError("Пользователь не найден", response.status));
    }
    const user = await response.json();
    return ok(user);
  } catch {
    return fail(new NetworkError("Ошибка сети", 0));
  }
}

// Вызов без try/catch — явная проверка
const result = await fetchUser("123");

if (result.ok) {
  renderUser(result.value); // TypeScript знает: это User
} else {
  showError(result.error.message); // TypeScript знает: это NetworkError
}
```

### Дискриминированные объединения для ошибок

Можно описать все возможные ошибки через дискриминированные объединения:

```typescript
type ApiError =
  | { type: "not_found"; id: string }
  | { type: "unauthorized" }
  | { type: "validation"; fields: Record<string, string> }
  | { type: "server"; message: string };

type ApiResult<T> = Result<T, ApiError>;

async function getProfile(userId: string): Promise<ApiResult<UserProfile>> {
  // ...
}

const result = await getProfile("42");

if (!result.ok) {
  switch (result.error.type) {
    case "not_found":
      console.log(`Пользователь ${result.error.id} не найден`);
      break;
    case "unauthorized":
      redirectToLogin();
      break;
    case "validation":
      showValidationErrors(result.error.fields);
      break;
    case "server":
      logServerError(result.error.message);
      break;
  }
}
```

TypeScript проверит, что все варианты обработаны.

## Тип never для исчерпывающей проверки

Для гарантии полного покрытия всех вариантов используют `assertNever`:

```typescript
function assertNever(value: never): never {
  throw new Error(`Необработанный случай: ${JSON.stringify(value)}`);
}

function handleApiError(error: ApiError): string {
  switch (error.type) {
    case "not_found":
      return `Не найдено: ${error.id}`;
    case "unauthorized":
      return "Требуется авторизация";
    case "validation":
      return "Ошибки валидации";
    case "server":
      return error.message;
    default:
      return assertNever(error); // ошибка компиляции, если добавить новый тип без обработки
  }
}
```

Если добавить новый тип в `ApiError` без обработки в `switch` — TypeScript выдаст ошибку компиляции. Это особенно ценно в командной разработке: новый тип ошибки нельзя «забыть» обработать.

## Утилита tryCatch

Полезная обёртка для конвертации промисов в `Result`:

```typescript
async function tryCatch<T>(
  promise: Promise<T>
): Promise<Result<T, Error>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (error) {
    if (error instanceof Error) {
      return fail(error);
    }
    return fail(new Error(String(error)));
  }
}

// Использование — никакого try/catch в бизнес-коде
const result = await tryCatch(fetch("/api/data").then(r => r.json()));

if (result.ok) {
  processData(result.value);
} else {
  logger.error(result.error.message);
}
```

## Практический пример: слой сервиса

Посмотрим, как собрать всё вместе в реальном приложении:

```typescript
// errors.ts
export class BaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string, id: string) {
    super(`${resource} с id="${id}" не найден`, "NOT_FOUND", { resource, id });
  }
}

export class ConflictError extends BaseError {
  constructor(message: string) {
    super(message, "CONFLICT");
  }
}

// user-service.ts
type UserServiceError = NotFoundError | ConflictError | BaseError;

class UserService {
  async findById(id: string): Promise<Result<User, NotFoundError>> {
    const user = await db.users.findOne({ id });
    if (!user) {
      return fail(new NotFoundError("User", id));
    }
    return ok(user);
  }

  async create(data: CreateUserDto): Promise<Result<User, UserServiceError>> {
    const existing = await db.users.findOne({ email: data.email });
    if (existing) {
      return fail(new ConflictError(`Email ${data.email} уже используется`));
    }

    try {
      const user = await db.users.create(data);
      return ok(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Неизвестная ошибка";
      return fail(new BaseError(message, "DB_ERROR", { originalError: error }));
    }
  }
}

// controller.ts
const userService = new UserService();

app.get("/users/:id", async (req, res) => {
  const result = await userService.findById(req.params.id);

  if (!result.ok) {
    if (result.error instanceof NotFoundError) {
      return res.status(404).json({ error: result.error.message });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }

  res.json(result.value);
});
```

## Лучшие практики

**Включайте `strict: true` в tsconfig.** Это активирует `useUnknownInCatchVariables` и заставляет правильно типизировать ошибки в catch-блоках.

**Всегда сужайте тип в catch.** Никогда не обращайтесь к свойствам `error` без проверки через `instanceof` или type guard.

**Используйте `Object.setPrototypeOf` в кастомных ошибках.** Это нужно для корректной работы `instanceof` при компиляции в ES5.

**Предпочитайте Result для предсказуемых ошибок.** Если функция может вернуть ошибку в рамках нормального потока — `Result<T, E>` делает это явным в типе. Исключения оставьте для непредвиденных ситуаций.

**Используйте `assertNever` в switch.** Это даёт гарантию исчерпывающей проверки на уровне компилятора при добавлении новых вариантов ошибок.

**Создавайте иерархии ошибок.** Базовый класс + специализированные подклассы позволяют добавлять контекст и гибко обрабатывать разные типы сбоев на разных уровнях приложения.

Для углублённого изучения TypeScript и отработки этих паттернов на практических задачах — пройдите курс TypeScript на PurpleSchool: https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-error-handling
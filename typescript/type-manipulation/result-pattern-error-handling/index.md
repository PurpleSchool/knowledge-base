---
metaTitle: "TypeScript: паттерн Result для обработки ошибок"
metaDescription: "Паттерн Result в TypeScript — типобезопасная обработка ошибок без try/catch. Примеры реализации, map, flatMap и async Result."
author: "Антон Ларичев"
title: "Паттерн Result для обработки ошибок без исключений"
preview: "Как избавиться от неконтролируемых исключений в TypeScript с помощью паттерна Result и union-типов."
---

## Проблема с исключениями в TypeScript

Типичный TypeScript-код использует `try/catch` для обработки ошибок. На первый взгляд это удобно, но у подхода есть фундаментальный изъян: сигнатура функции не сообщает вызывающей стороне, что та может выбросить исключение.

```typescript
// Ничего не говорит о том, что здесь может произойти ошибка
function parseUser(json: string): User {
  return JSON.parse(json); // может выбросить SyntaxError
}

// Компилятор не заставит вас обрабатывать ошибку
const user = parseUser(rawInput); // потенциальный краш
console.log(user.name);
```

Типы TypeScript описывают путь успеха, но молчат о пути ошибки. Это нарушает контракт функции и делает код хрупким.

Паттерн **Result** решает эту проблему: ошибка становится частью возвращаемого типа, и компилятор заставляет вас её обработать.

## Что такое паттерн Result

Result — это тип-объединение (discriminated union), который представляет либо успешный результат (`Ok`), либо ошибку (`Err`). Такой подход пришёл из функциональных языков — Rust, Haskell, F# — и отлично ложится на систему типов TypeScript.

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Функция, возвращающая `Result<User, ParseError>`, явно сигнализирует: «я могу вернуть либо пользователя, либо ошибку разбора». Вызывающая сторона **обязана** обработать оба варианта.

## Базовая реализация

Начнём с минимального набора: тип и два конструктора.

```typescript
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
```

Теперь перепишем функцию разбора JSON:

```typescript
type ParseError = { message: string; raw: string };

function parseUser(json: string): Result<User, ParseError> {
  try {
    const data = JSON.parse(json);
    return Ok({ name: data.name, age: data.age });
  } catch {
    return Err({ message: 'Invalid JSON', raw: json });
  }
}

// Теперь TypeScript требует обработки обоих случаев
const result = parseUser(rawInput);

if (result.ok) {
  console.log(result.value.name); // TypeScript знает тип здесь
} else {
  console.error(result.error.message); // и здесь
}
```

Обратите внимание: внутри ветки `if (result.ok)` TypeScript автоматически сужает тип до `{ ok: true; value: User }`, а в ветке `else` — до `{ ok: false; error: ParseError }`. Это работает благодаря discriminated union.

## Типизация ошибок

Одно из главных преимуществ паттерна — возможность точно описать, какие ошибки может вернуть функция.

```typescript
type ValidationError = {
  kind: 'validation';
  field: string;
  message: string;
};

type NotFoundError = {
  kind: 'not_found';
  id: string;
};

type DatabaseError = {
  kind: 'database';
  message: string;
};

type UserServiceError = ValidationError | NotFoundError | DatabaseError;

async function getUser(id: string): Promise<Result<User, UserServiceError>> {
  if (!id.match(/^[a-z0-9-]+$/)) {
    return Err({ kind: 'validation', field: 'id', message: 'Invalid format' });
  }

  const user = await db.findById(id);

  if (!user) {
    return Err({ kind: 'not_found', id });
  }

  return Ok(user);
}
```

Теперь на месте вызова можно исчерпывающе обработать все варианты ошибок:

```typescript
const result = await getUser(userId);

if (!result.ok) {
  switch (result.error.kind) {
    case 'validation':
      return res.status(400).json({ error: result.error.message });
    case 'not_found':
      return res.status(404).json({ error: 'User not found' });
    case 'database':
      logger.error(result.error.message);
      return res.status(500).json({ error: 'Internal error' });
  }
}

return res.json(result.value);
```

Если добавить новый тип ошибки в `UserServiceError` и забыть его обработать — TypeScript сообщит об ошибке компиляции.

## Цепочки операций: map и flatMap

Одна функция, возвращающая Result, — это хорошо. Но в реальных задачах нужно последовательно применять несколько операций, каждая из которых может завершиться ошибкой. Без вспомогательных методов код превращается в лесенку `if`:

```typescript
const parseResult = parseJson(raw);
if (!parseResult.ok) return parseResult;

const validateResult = validateSchema(parseResult.value);
if (!validateResult.ok) return validateResult;

const saveResult = await saveToDb(validateResult.value);
if (!saveResult.ok) return saveResult;
```

Методы `map` и `flatMap` позволяют выстроить цепочку читаемо.

### map — преобразование успешного значения

`map` применяет функцию к значению внутри `Ok`, не трогая `Err`:

```typescript
function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.ok) {
    return Ok(fn(result.value));
  }
  return result;
}

// Пример
const lengthResult = map(parseUser(raw), (user) => user.name.length);
// Result<number, ParseError>
```

### flatMap — цепочка операций, возвращающих Result

`flatMap` применяет функцию, которая сама возвращает `Result`, и разворачивает вложенность:

```typescript
function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}
```

Сложим цепочку из начала раздела:

```typescript
const result = flatMap(
  flatMap(parseJson(raw), validateSchema),
  (data) => saveToDb(data)
);
```

Ещё чище — через класс с fluent API:

```typescript
class ResultWrapper<T, E> {
  constructor(private readonly inner: Result<T, E>) {}

  map<U>(fn: (value: T) => U): ResultWrapper<U, E> {
    return new ResultWrapper(map(this.inner, fn));
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): ResultWrapper<U, E> {
    return new ResultWrapper(flatMap(this.inner, fn));
  }

  unwrap(): Result<T, E> {
    return this.inner;
  }
}

function result<T, E>(r: Result<T, E>) {
  return new ResultWrapper(r);
}

// Использование
const final = result(parseJson(raw))
  .flatMap(validateSchema)
  .flatMap(enrichWithDefaults)
  .map((data) => ({ ...data, processedAt: new Date() }))
  .unwrap();
```

## Асинхронный Result

В большинстве реальных задач операции асинхронные. `Promise<Result<T, E>>` — рабочая комбинация, но цепочки становятся неудобными. Можно ввести псевдоним и вспомогательную функцию:

```typescript
type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

async function tryCatch<T, E = Error>(
  fn: () => Promise<T>,
  mapError: (error: unknown) => E
): AsyncResult<T, E> {
  try {
    return Ok(await fn());
  } catch (error) {
    return Err(mapError(error));
  }
}
```

Теперь любую async-функцию можно безопасно обернуть:

```typescript
const result = await tryCatch(
  () => fetch('/api/users').then((r) => r.json()),
  (err) => ({ kind: 'network' as const, message: String(err) })
);

if (result.ok) {
  console.log(result.value);
}
```

Для асинхронных цепочек удобна функция `andThen`:

```typescript
async function andThen<T, U, E>(
  result: AsyncResult<T, E>,
  fn: (value: T) => AsyncResult<U, E>
): AsyncResult<U, E> {
  const r = await result;
  if (r.ok) {
    return fn(r.value);
  }
  return r;
}

// Использование
const response = await andThen(
  andThen(
    fetchUserData(userId),
    (data) => validateUserData(data)
  ),
  (user) => saveUser(user)
);
```

## Практический пример: валидация формы

Паттерн Result хорошо подходит для валидации входных данных:

```typescript
type FieldError = { field: string; message: string };

function validateEmail(email: string): Result<string, FieldError> {
  if (!email.includes('@')) {
    return Err({ field: 'email', message: 'Некорректный email' });
  }
  return Ok(email.toLowerCase());
}

function validateAge(age: number): Result<number, FieldError> {
  if (age < 18 || age > 120) {
    return Err({ field: 'age', message: 'Возраст должен быть от 18 до 120' });
  }
  return Ok(age);
}

type RegistrationData = { email: string; age: number };

function validateRegistration(
  input: Record<string, unknown>
): Result<RegistrationData, FieldError> {
  const emailResult = validateEmail(String(input.email ?? ''));
  if (!emailResult.ok) return emailResult;

  const ageResult = validateAge(Number(input.age));
  if (!ageResult.ok) return ageResult;

  return Ok({ email: emailResult.value, age: ageResult.value });
}

// На месте вызова
const validation = validateRegistration(formData);

if (!validation.ok) {
  showFieldError(validation.error.field, validation.error.message);
} else {
  submitRegistration(validation.value);
}
```

## Сравнение с try/catch

| Критерий | try/catch | Result |
|---|---|---|
| Видимость в типах | Нет | Да |
| Принудительная обработка | Нет | Да (через narrowing) |
| Читаемость цепочек | Низкая | Высокая (с map/flatMap) |
| Производительность | Лучше | Незначительно хуже |
| Совместимость с legacy | Да | Требует адаптации |

Исключения остаются уместными для **действительно непредвиденных** ситуаций: ошибок программирования, выхода за пределы массива, нехватки памяти. Result подходит для **ожидаемых** исходов бизнес-логики: «пользователь не найден», «невалидные данные», «сетевой таймаут».

## Паттерн unwrapOr для значений по умолчанию

Иногда нужно получить значение или запасной вариант, не разворачивая Result вручную:

```typescript
function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}

function unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
  return result.ok ? result.value : fn(result.error);
}

// Примеры
const config = unwrapOr(loadConfig('./config.json'), defaultConfig);

const user = unwrapOrElse(
  parseUser(raw),
  (err) => { logger.warn(err.message); return guestUser; }
);
```

## Когда использовать паттерн Result

Result оправдан, когда:

- Ошибка является частью бизнес-логики (не найдено, не авторизовано, невалидно)
- Функция вызывается в цепочке, и каждый шаг может прервать её
- Важно, чтобы вызывающий код не мог «забыть» обработать ошибку
- Вы работаете в функциональном стиле и хотите составлять операции

Оставьте `try/catch` для:

- Третьесторонних библиотек, которые выбрасывают исключения
- Глобальных обработчиков на верхнем уровне
- Ошибок программирования (TypeError, RangeError)

На практике оба подхода сосуществуют: `try/catch` внутри функции адаптирует исключение в `Result`, который возвращается наружу.

---

Чтобы глубже разобраться с системой типов TypeScript, дискриминированными объединениями и продвинутыми паттернами разработки — изучите курс [TypeScript на PurpleSchool](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-result-pattern).
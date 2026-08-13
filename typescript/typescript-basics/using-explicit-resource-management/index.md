---
metaTitle: "TypeScript using и Explicit Resource Management"
metaDescription: "Ключевое слово using в TypeScript 5.2: Symbol.dispose, await using, DisposableStack — управление ресурсами без утечек памяти"
author: "Антон Ларичев"
title: "TypeScript: ключевое слово using и Explicit Resource Management"
preview: "Разбираем ключевое слово using в TypeScript 5.2: как автоматически освобождать ресурсы через Symbol.dispose и избежать утечек памяти"
---

## Проблема управления ресурсами

Любое серьёзное приложение работает с внешними ресурсами: файловые дескрипторы, соединения с базой данных, сетевые сокеты, мьютексы, временные файлы. Все они требуют явного освобождения после использования. Если забыть закрыть соединение или файл — получим утечку ресурсов, которая со временем приведёт к деградации производительности или краху приложения.

До TypeScript 5.2 разработчики решали эту проблему вручную через `try/finally`:

```typescript
import * as fs from 'fs';

function processFile(path: string): void {
  const fd = fs.openSync(path, 'r');
  try {
    // работаем с файлом
    const buffer = Buffer.alloc(1024);
    fs.readSync(fd, buffer, 0, buffer.length, 0);
    console.log(buffer.toString());
  } finally {
    fs.closeSync(fd); // обязательно закрываем
  }
}
```

Код рабочий, но громоздкий. При вложенных ресурсах читаемость резко падает, а риск ошибки растёт: достаточно забыть `finally` или добавить ранний `return` — и ресурс утечёт.

TypeScript 5.2 принёс встроенное решение — ключевое слово `using`, реализующее стандарт TC39 «Explicit Resource Management».

## Что такое Explicit Resource Management

Explicit Resource Management (явное управление ресурсами) — это предложение для ECMAScript, которое добавляет в язык механизм детерминированного освобождения ресурсов, аналогичный `using` в C#, `with` в Python или try-with-resources в Java.

Основа механизма — два новых символа:

- `Symbol.dispose` — для синхронного освобождения ресурсов
- `Symbol.asyncDispose` — для асинхронного освобождения

Объект, реализующий один из этих методов, называется *disposable* (удаляемым). Ключевые слова `using` и `await using` гарантируют вызов метода очистки в конце блока, даже если произошло исключение.

## Symbol.dispose и интерфейс Disposable

Чтобы объект стал disposable, нужно добавить метод `[Symbol.dispose]()`:

```typescript
interface DatabaseConnection {
  query(sql: string): unknown[];
  [Symbol.dispose](): void;
}

class PostgresConnection implements DatabaseConnection {
  private connection: unknown;

  constructor(connectionString: string) {
    // открываем соединение
    this.connection = { connectionString, active: true };
    console.log('Соединение открыто');
  }

  query(sql: string): unknown[] {
    console.log(`Выполняем запрос: ${sql}`);
    return [];
  }

  [Symbol.dispose](): void {
    // закрываем соединение
    this.connection = null;
    console.log('Соединение закрыто');
  }
}
```

TypeScript предоставляет встроенные интерфейсы для disposable-объектов:

```typescript
// Встроенные интерфейсы TypeScript 5.2+
interface Disposable {
  [Symbol.dispose](): void;
}

interface AsyncDisposable {
  [Symbol.asyncDispose](): Promise<void>;
}
```

## Ключевое слово using

Когда класс реализует `Symbol.dispose`, его можно использовать с ключевым словом `using` вместо `const`:

```typescript
function processData(): void {
  using conn = new PostgresConnection('postgresql://localhost/mydb');
  //     ^^^^  using вместо const

  const results = conn.query('SELECT * FROM users');
  console.log(results);
  // После выхода из блока — conn[Symbol.dispose]() вызывается автоматически
}

// Вывод:
// Соединение открыто
// Выполняем запрос: SELECT * FROM users
// Соединение закрыто  <-- вызывается автоматически!
```

Метод `[Symbol.dispose]()` вызывается в конце области видимости блока — будь то нормальное завершение или исключение. Это эквивалентно:

```typescript
// Что делает using под капотом
function processData(): void {
  const conn = new PostgresConnection('postgresql://localhost/mydb');
  try {
    const results = conn.query('SELECT * FROM users');
    console.log(results);
  } finally {
    conn[Symbol.dispose]();
  }
}
```

### Порядок очистки нескольких ресурсов

При нескольких `using` в одном блоке ресурсы освобождаются в порядке, обратном объявлению (LIFO — last in, first out):

```typescript
function multipleResources(): void {
  using fileHandle = openFile('./data.txt');
  using dbConn = new PostgresConnection('postgresql://localhost/db');
  using cache = connectToRedis('redis://localhost:6379');

  // ... работаем с ресурсами ...

  // Порядок очистки:
  // 1. cache[Symbol.dispose]()
  // 2. dbConn[Symbol.dispose]()
  // 3. fileHandle[Symbol.dispose]()
}
```

Такой порядок важен: если ресурс B зависит от ресурса A, то B создаётся после A и закрывается раньше.

### Обработка исключений

Если одновременно выбрасывается исключение из основного кода и из `dispose`, оба исключения объединяются в `SuppressedError`:

```typescript
class BrokenResource implements Disposable {
  [Symbol.dispose](): void {
    throw new Error('Ошибка при очистке');
  }
}

try {
  using res = new BrokenResource();
  throw new Error('Основная ошибка');
} catch (e) {
  if (e instanceof SuppressedError) {
    console.log('Основная ошибка:', e.error.message);
    // 'Основная ошибка'
    console.log('Подавленная ошибка:', e.suppressed.message);
    // 'Ошибка при очистке'
  }
}
```

## Symbol.asyncDispose и await using

Многие операции очистки асинхронны: закрытие соединения с БД, отправка финального пакета через сокет, сброс буфера на диск. Для них предназначены `Symbol.asyncDispose` и `await using`:

```typescript
class AsyncDatabaseConnection implements AsyncDisposable {
  private isOpen = true;

  async query(sql: string): Promise<unknown[]> {
    if (!this.isOpen) throw new Error('Соединение закрыто');
    // имитируем async запрос
    await new Promise(resolve => setTimeout(resolve, 100));
    return [];
  }

  async [Symbol.asyncDispose](): Promise<void> {
    // асинхронное закрытие — например, ждём flush буфера
    await new Promise(resolve => setTimeout(resolve, 50));
    this.isOpen = false;
    console.log('Асинхронное соединение закрыто');
  }
}

async function processAsync(): Promise<void> {
  await using conn = new AsyncDatabaseConnection();
  //  ^^^^^ await using для async disposable

  const results = await conn.query('SELECT 1');
  console.log(results);
  // conn[Symbol.asyncDispose]() вызывается и ожидается автоматически
}
```

`await using` можно использовать только внутри `async`-функций. Он гарантирует, что Promise, возвращённый из `[Symbol.asyncDispose]()`, будет дождан перед продолжением.

### Смешивание using и await using

В одной функции можно комбинировать оба варианта:

```typescript
async function mixedResources(): Promise<void> {
  using syncLock = acquireMutex();
  await using dbConn = new AsyncDatabaseConnection();
  await using fileWriter = new AsyncFileWriter('./output.log');

  await dbConn.query('INSERT INTO logs VALUES (?)', ['event']);
  await fileWriter.write('Запись в лог');

  // Порядок очистки (LIFO):
  // 1. await fileWriter[Symbol.asyncDispose]()
  // 2. await dbConn[Symbol.asyncDispose]()
  // 3. syncLock[Symbol.dispose]()
}
```

## DisposableStack и AsyncDisposableStack

Иногда нужно управлять динамически создаваемой коллекцией ресурсов — например, в цикле или при условной инициализации. Для этого есть `DisposableStack` и `AsyncDisposableStack`:

```typescript
function createResources(count: number): void {
  using stack = new DisposableStack();

  for (let i = 0; i < count; i++) {
    const conn = new PostgresConnection(`connection-${i}`);
    stack.use(conn); // регистрируем ресурс в стеке
  }

  // или через defer для произвольной функции очистки:
  stack.defer(() => {
    console.log('Финальная очистка');
  });

  // ... работаем ...
  // При выходе из блока stack[Symbol.dispose]() вызовет dispose
  // для всех зарегистрированных ресурсов в обратном порядке
}
```

Методы `DisposableStack`:

```typescript
const stack = new DisposableStack();

// use — регистрирует Disposable-объект
const conn = stack.use(new PostgresConnection('...'));

// adopt — регистрирует не-disposable объект с функцией очистки
const fd = stack.adopt(fs.openSync('./file.txt', 'r'), (fd) => {
  fs.closeSync(fd);
});

// defer — регистрирует произвольный callback
stack.defer(() => console.log('cleanup'));

// move — передаёт владение другому стеку
const newStack = stack.move();

// dispose — немедленно вызывает очистку всех ресурсов
stack.dispose();
```

Асинхронная версия аналогична, но принимает async-функции и вызывается через `await using`:

```typescript
async function dynamicAsyncResources(): Promise<void> {
  await using stack = new AsyncDisposableStack();

  for (const config of connectionConfigs) {
    if (config.enabled) {
      stack.use(new AsyncDatabaseConnection(config.url));
    }
  }

  stack.defer(async () => {
    await notifyShutdown();
  });

  // ...
}
```

## Практические примеры

### Обёртка для файлового дескриптора

```typescript
import * as fs from 'fs';

class FileHandle implements Disposable {
  private fd: number;

  constructor(path: string, flags: string = 'r') {
    this.fd = fs.openSync(path, flags);
  }

  read(size: number = 1024): Buffer {
    const buffer = Buffer.alloc(size);
    fs.readSync(this.fd, buffer, 0, size, null);
    return buffer;
  }

  write(data: string): void {
    fs.writeSync(this.fd, data);
  }

  [Symbol.dispose](): void {
    fs.closeSync(this.fd);
  }
}

// Использование:
function parseConfig(configPath: string): Record<string, string> {
  using file = new FileHandle(configPath);
  const content = file.read().toString('utf-8').trim();

  return Object.fromEntries(
    content.split('\n').map(line => line.split('='))
  );
  // file автоматически закрывается здесь
}
```

### Транзакции базы данных

```typescript
import { Pool, PoolClient } from 'pg';

class Transaction implements AsyncDisposable {
  private committed = false;

  constructor(private client: PoolClient) {}

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.client.query(sql, params);
    return result.rows as T[];
  }

  async commit(): Promise<void> {
    await this.client.query('COMMIT');
    this.committed = true;
  }

  async [Symbol.asyncDispose](): Promise<void> {
    if (!this.committed) {
      await this.client.query('ROLLBACK');
    }
    this.client.release();
  }
}

async function transferFunds(
  pool: Pool,
  fromId: number,
  toId: number,
  amount: number
): Promise<void> {
  const client = await pool.connect();
  await client.query('BEGIN');

  await using tx = new Transaction(client);

  await tx.query(
    'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
    [amount, fromId]
  );
  await tx.query(
    'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
    [amount, toId]
  );

  await tx.commit();
  // Если commit не вызван (исключение), rollback произойдёт автоматически
}
```

### Таймер с измерением производительности

```typescript
class PerformanceTimer implements Disposable {
  private start: number;

  constructor(private label: string) {
    this.start = performance.now();
    console.log(`[${label}] Начало`);
  }

  [Symbol.dispose](): void {
    const elapsed = (performance.now() - this.start).toFixed(2);
    console.log(`[${this.label}] Завершено за ${elapsed}ms`);
  }
}

async function heavyOperation(): Promise<void> {
  using _timer = new PerformanceTimer('heavyOperation');

  await fetchDataFromApi();
  await processResults();
  await saveToDatabase();
  // Время автоматически выведется при выходе из функции
}
```

## Настройка TypeScript

Для использования `using` и `await using` требуется TypeScript 5.2+ и настройка `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "ESNext.Disposable"],
    "moduleResolution": "bundler"
  }
}
```

Ключевой момент — добавить `"ESNext.Disposable"` в `lib`. Без этого TypeScript не знает о `Symbol.dispose`, `Symbol.asyncDispose`, `DisposableStack` и `AsyncDisposableStack`.

### Полифилл для Symbol.dispose

Если целевая среда выполнения не поддерживает `Symbol.dispose` нативно, добавьте полифилл в точку входа приложения:

```typescript
// polyfills.ts
(Symbol as Record<string | symbol, unknown>).dispose ??= Symbol('Symbol.dispose');
(Symbol as Record<string | symbol, unknown>).asyncDispose ??= Symbol('Symbol.asyncDispose');
```

Node.js поддерживает `Symbol.dispose` начиная с версии 20 (с флагом `--harmony-explicit-resource-management`) и нативно с Node.js 22.

## Совместимость с существующим кодом

`using` не требует менять всю кодовую базу разом. Можно адаптировать отдельные классы, добавив `[Symbol.dispose]()`:

```typescript
// Старый класс без изменений
class LegacyConnection {
  close(): void {
    console.log('Закрываем старое соединение');
  }
}

// Адаптер для using
class DisposableLegacyConnection
  extends LegacyConnection
  implements Disposable {

  [Symbol.dispose](): void {
    this.close();
  }
}

// Или через DisposableStack.adopt без создания подкласса
function useLegacy(): void {
  using stack = new DisposableStack();
  const conn = new LegacyConnection();
  stack.adopt(conn, c => c.close());

  // работаем с conn...
}
```

## Когда использовать using

`using` имеет смысл применять, когда:

- Ресурс требует явного закрытия/освобождения
- Ресурс используется в рамках одного блока (функции, условия, цикла)
- Важна гарантия очистки даже при исключениях
- Код с `try/finally` ухудшает читаемость

Не стоит использовать `using` для:

- Объектов без внешних ресурсов (обычные DTO, конфигурации)
- Ресурсов с неопределённым временем жизни (кэши, пулы, синглтоны)
- Случаев, когда очистка зависит от результата работы (используйте явный `commit()`/`rollback()` вместо этого)

---

Механизм `using` и Explicit Resource Management — одно из самых практичных дополнений в TypeScript 5.2. Он устраняет целый класс ошибок, связанных с утечками ресурсов, делает намерения кода явными и значительно упрощает код по сравнению с `try/finally`.

Хотите систематически освоить TypeScript, включая последние возможности языка? Подробный курс с практическими проектами доступен на [PurpleSchool](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=using-explicit-resource-management).
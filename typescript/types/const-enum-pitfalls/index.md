---
metaTitle: "TypeScript const enum: подводные камни и альтернативы"
metaDescription: "Как работает const enum в TypeScript, почему он опасен с Babel и isolatedModules, и когда лучше использовать обычный enum или as const."
author: "Антон Ларичев"
title: "const enum в TypeScript и его подводные камни"
preview: "Разбираем механику const enum, его преимущества по сравнению с обычным enum и скрытые проблемы при работе с современными сборщиками."
---

## Что такое const enum

В TypeScript существует два вида перечислений: обычный `enum` и `const enum`. На первый взгляд разница минимальна — добавляется ключевое слово `const`. Но под капотом они работают принципиально по-разному, и это различие порождает целый класс трудноотлаживаемых проблем.

Обычный `enum` компилируется в JavaScript-объект:

```typescript
enum Direction {
  Up,
  Down,
  Left,
  Right,
}
```

После компиляции это превращается в:

```javascript
var Direction;
(function (Direction) {
  Direction[Direction["Up"] = 0] = "Up";
  Direction[Direction["Down"] = 1] = "Down";
  Direction[Direction["Left"] = 2] = "Left";
  Direction[Direction["Right"] = 3] = "Right";
})(Direction || (Direction = {}));
```

Объект `Direction` реально существует в рантайме и позволяет делать обратный маппинг: `Direction[0] === "Up"`.

`const enum` ведёт себя иначе:

```typescript
const enum Direction {
  Up,
  Down,
  Left,
  Right,
}

const move = Direction.Up;
```

Компилятор TypeScript полностью убирает объявление enum и подставляет числовые значения прямо в места использования:

```javascript
const move = 0; /* Direction.Up */
```

Никакого объекта `Direction` в скомпилированном коде нет. Значения инлайнятся на этапе компиляции.

## Преимущества const enum

### Меньше кода в бандле

Главный аргумент в пользу `const enum` — отсутствие рантаймового объекта. Для больших перечислений это ощутимо уменьшает размер финального бандла.

```typescript
const enum HttpStatus {
  Ok = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  InternalServerError = 500,
}

function handleResponse(status: HttpStatus): string {
  switch (status) {
    case HttpStatus.Ok:
      return 'success';
    case HttpStatus.NotFound:
      return 'not found';
    default:
      return 'error';
  }
}
```

После компиляции `tsc` превращает это в:

```javascript
function handleResponse(status) {
  switch (status) {
    case 200 /* HttpStatus.Ok */:
      return 'success';
    case 404 /* HttpStatus.NotFound */:
      return 'not found';
    default:
      return 'error';
  }
}
```

Объекта `HttpStatus` в выходном файле нет вообще.

### Прозрачность для движка JavaScript

Поскольку вместо обращения к свойству объекта подставляется литерал, V8 и другие движки получают прямые числа или строки, что теоретически упрощает оптимизацию горячих путей.

## Подводные камни

### Проблема 1: incompatibility с isolatedModules

Флаг `--isolatedModules` (обязательный при использовании Babel, esbuild или swc вместо `tsc`) требует, чтобы каждый файл компилировался независимо. Инлайнинг `const enum` требует знания значений из других файлов — а при изолированной компиляции этих знаний нет.

Если вы импортируете `const enum` из другого модуля при включённом `isolatedModules`, TypeScript выдаст ошибку:

```typescript
// constants.ts
export const enum Color {
  Red = 'RED',
  Green = 'GREEN',
  Blue = 'BLUE',
}
```

```typescript
// app.ts
import { Color } from './constants';

const bg = Color.Red; // Ошибка: Cannot access ambient const enums when 'isolatedModules' is enabled.
```

Это делает `const enum` несовместимым с большинством современных сборщиков по умолчанию.

```json
// tsconfig.json — такая настройка заблокирует использование const enum из внешних модулей
{
  "compilerOptions": {
    "isolatedModules": true
  }
}
```

Решение: либо не использовать `const enum` вообще, либо определять перечисления только внутри того же файла, где они используются.

### Проблема 2: Babel, esbuild и SWC не понимают const enum

Большинство современных тулчейнов (Vite, Next.js, ts-jest с настройками по умолчанию) используют Babel или esbuild для транспиляции TypeScript. Эти инструменты отрезают типы, но **не выполняют анализ типов**. Они не знают значений `const enum` из других файлов и просто не могут выполнить инлайнинг.

Результат: код либо падает с ошибкой при компиляции, либо (в некоторых конфигурациях Babel с плагином `@babel/plugin-transform-typescript`) `const enum` молча трактуется как обычный `enum` — и вы теряете все предполагаемые преимущества.

```typescript
// Babel скомпилирует это как обычный enum или выдаст ошибку
const enum Permission {
  Read = 1,
  Write = 2,
  Admin = 4,
}

export function hasPermission(userPerms: number, required: Permission): boolean {
  return (userPerms & required) === required;
}
```

Проверьте конфигурацию Babel:

```json
// babel.config.json
{
  "plugins": [
    ["@babel/plugin-transform-typescript", {
      "optimizeConstEnums": true
    }]
  ]
}
```

Флаг `optimizeConstEnums: true` включает поддержку инлайнинга в Babel, но только для `const enum` из того же файла.

### Проблема 3: Ambient const enum в .d.ts файлах

Если вы публикуете библиотеку и экспортируете `const enum` через файлы деклараций `.d.ts`, пользователи вашей библиотеки столкнутся с проблемой. Когда `tsc` читает `.d.ts`, он видит `const enum` и пытается инлайнить значения. Но если пользователь компилирует с `isolatedModules`, это невозможно.

```typescript
// lib/index.d.ts — так делать нельзя при публикации в npm
export declare const enum Status {
  Active = 'active',
  Inactive = 'inactive',
}
```

Флаг компилятора `--preserveConstEnums` меняет поведение: `const enum` компилируется как обычный `enum` (объект сохраняется), но инлайнинг всё равно происходит в местах использования. Это позволяет работать с `.d.ts`, но устраняет ключевое преимущество — уменьшение размера.

```json
{
  "compilerOptions": {
    "preserveConstEnums": true
  }
}
```

### Проблема 4: Нельзя итерироваться по значениям

Обычный `enum` поддерживает обратный маппинг и итерацию:

```typescript
enum Role {
  Admin,
  Editor,
  Viewer,
}

// Работает с обычным enum
const roles = Object.values(Role).filter(v => typeof v === 'string');
console.log(roles); // ['Admin', 'Editor', 'Viewer']
```

С `const enum` такое невозможно — объект не существует в рантайме:

```typescript
const enum Role {
  Admin,
  Editor,
  Viewer,
}

// Ошибка компиляции или рантайм-ошибка:
// 'const' enums can only be used in property or index access expressions
// or the left hand side of an indexed access type when '--isolatedModules' is not set.
const roles = Object.values(Role); // не работает
```

### Проблема 5: Только константные выражения в значениях

`const enum` не поддерживает вычисляемые члены:

```typescript
function getValue() { return 42; }

const enum Config {
  MaxRetries = 3,       // OK
  Timeout = 1000 * 60,  // OK — вычисляется статически
  DynamicValue = getValue(), // Ошибка: const enum member initializers can only contain literal values and other computed enum values.
}
```

Обычный `enum` в этом плане гибче и позволяет использовать вызовы функций.

## Альтернативы const enum

### as const объект

Самая популярная современная альтернатива — объект с утверждением `as const`:

```typescript
const Direction = {
  Up: 0,
  Down: 1,
  Left: 2,
  Right: 3,
} as const;

type Direction = typeof Direction[keyof typeof Direction];

// Использование:
function move(dir: Direction): void {
  console.log(dir);
}

move(Direction.Up);  // OK
move(5);             // Ошибка типа
```

Преимущества:
- Работает со всеми сборщиками без исключений
- Поддерживает итерацию: `Object.values(Direction)`
- Нет никаких сюрпризов при компиляции
- Объект существует в рантайме и доступен для интроспекции

```typescript
// Получение всех допустимых значений
const allDirections = Object.values(Direction);
console.log(allDirections); // [0, 1, 2, 3]

// Проверка принадлежности значения
function isValidDirection(val: number): val is Direction {
  return Object.values(Direction).includes(val as Direction);
}
```

### Обычный enum

Если нужны строковые значения с самодокументированием, обычный `enum` часто является лучшим выбором:

```typescript
enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
}

function log(level: LogLevel, message: string): void {
  console.log(`[${level.toUpperCase()}] ${message}`);
}

log(LogLevel.Error, 'Something went wrong');
// [ERROR] Something went wrong
```

Строковые enum не имеют обратного маппинга, компилируются в простой объект, и работают везде.

### Template literal types для строковых констант

Для наборов строковых значений можно обойтись без enum вообще:

```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

function request(method: HttpMethod, url: string): Promise<Response> {
  return fetch(url, { method });
}

request('GET', '/api/users');    // OK
request('DELETE', '/api/users'); // OK
request('SEND', '/api/users');   // Ошибка типа
```

## Когда const enum всё-таки оправдан

Несмотря на все ограничения, `const enum` имеет смысл в узком наборе сценариев:

1. **Монорепозиторий без внешних потребителей** — если перечисление используется только внутри одного пакета и компиляция идёт через `tsc` без `isolatedModules`.

2. **Критичные к размеру участки** — числовые флаги в hot path, где буквально каждый байт имеет значение.

3. **Файл целиком компилируется `tsc`** — без Babel, esbuild или swc в цепочке.

Во всех остальных случаях `as const` объект или обычный `enum` будут безопаснее и предсказуемее.

## Итоговое сравнение

```typescript
// 1. const enum — инлайнинг, нет рантайм-объекта, проблемы с isolatedModules
const enum Fruit {
  Apple = 'apple',
  Banana = 'banana',
}

// 2. Обычный enum — рантайм-объект, работает везде, обратный маппинг для числовых
enum Fruit {
  Apple = 'apple',
  Banana = 'banana',
}

// 3. as const — рантайм-объект, максимальная совместимость, нет специального синтаксиса
const Fruit = {
  Apple: 'apple',
  Banana: 'banana',
} as const;
type Fruit = typeof Fruit[keyof typeof Fruit];
```

| Критерий | const enum | enum | as const |
|---|---|---|---|
| Рантайм-объект | Нет | Да | Да |
| Работает с Babel/esbuild | Нет* | Да | Да |
| Работает с isolatedModules | Нет | Да | Да |
| Итерация по значениям | Нет | Да | Да |
| Вычисляемые члены | Нет | Да | Да |
| Инлайнинг значений | Да | Нет | Нет |

*С `optimizeConstEnums: true` в Babel — частично, только в рамках одного файла.

## Рекомендации

Практическое правило для современных проектов: **не используйте `const enum` по умолчанию**. Начните с `as const` объекта или строкового `enum`. Переходите к `const enum` только если:

- Вы точно знаете, что вся компиляция идёт через `tsc`
- В `tsconfig.json` нет `"isolatedModules": true`
- Вы не публикуете код как библиотеку
- У вас есть измеримая проблема с размером бандла, которую `const enum` решает

Если вы работаете в проекте с Vite, Next.js, Create React App или любым инструментом, использующим Babel или esbuild — считайте `const enum` запрещённым к использованию в кросс-файловых импортах.

Чтобы защитить команду от случайного использования `const enum`, можно добавить правило ESLint:

```json
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/prefer-enum-initializers": "error",
    "no-restricted-syntax": [
      "error",
      {
        "selector": "TSEnumDeclaration[const=true]",
        "message": "const enum запрещён — используйте as const объект или обычный enum"
      }
    ]
  }
}
```

Подробнее о системе типов TypeScript, enum, дженериках и других продвинутых возможностях языка — на курсе [TypeScript с нуля до профи](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=const-enum-pitfalls).
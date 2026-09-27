---
metaTitle: "Enums vs Union Types в TypeScript: когда что использовать"
metaDescription: "Подробное сравнение enum и union types в TypeScript: синтаксис, производительность, совместимость и практические рекомендации по выбору."
author: "Антон Ларичев"
title: "Enums vs Union Types в TypeScript: сравнение и выбор"
preview: "Разбираем отличия enum и union types в TypeScript, их плюсы и минусы, и учимся выбирать правильный инструмент для каждой задачи."
---

## Введение

Один из самых частых вопросов при написании TypeScript-кода — как лучше задать ограниченный набор допустимых значений для переменной или параметра функции. TypeScript предлагает два основных инструмента: `enum` (перечисление) и union types (объединение типов). На первый взгляд они решают одну задачу, но различаются по поведению, влиянию на компилируемый JavaScript и удобству использования.

В этой статье мы детально разберём оба подхода, сравним их по ключевым критериям и выработаем практические рекомендации по выбору.

## Что такое Enum

`enum` — это специальная конструкция TypeScript, которая компилируется в реальный JavaScript-объект. Она позволяет задать набор именованных констант.

### Числовой enum

```typescript
enum Direction {
  Up,
  Down,
  Left,
  Right
}

const move = (dir: Direction): void => {
  console.log(dir);
};

move(Direction.Up); // 0
move(Direction.Left); // 2
```

По умолчанию значения начинаются с `0` и инкрементируются. Можно задать начальное значение вручную:

```typescript
enum StatusCode {
  OK = 200,
  NotFound = 404,
  InternalError = 500
}
```

### Строковый enum

```typescript
enum UserRole {
  Admin = 'ADMIN',
  Editor = 'EDITOR',
  Viewer = 'VIEWER'
}

const checkAccess = (role: UserRole): boolean => {
  return role === UserRole.Admin;
};

checkAccess(UserRole.Admin); // true
```

Строковые enum более читаемы при отладке — в рантайме видно осмысленное строковое значение, а не число.

### Const enum

```typescript
const enum Platform {
  Web = 'WEB',
  Mobile = 'MOBILE',
  Desktop = 'DESKTOP'
}

const currentPlatform: Platform = Platform.Web;
```

`const enum` не компилируется в объект — компилятор просто подставляет значения на этапе сборки. Это уменьшает размер итогового кода, но накладывает ограничения (нельзя использовать в динамических контекстах).

## Что такое Union Types

Union types — это исключительно TypeScript-конструкция: она существует только во время компиляции и полностью исчезает в JavaScript. Позволяет описать тип как «одно из нескольких значений».

### Базовый синтаксис

```typescript
type Direction = 'Up' | 'Down' | 'Left' | 'Right';

const move = (dir: Direction): void => {
  console.log(dir);
};

move('Up');   // OK
move('Left'); // OK
move('Fly');  // Error: Argument of type '"Fly"' is not assignable to parameter of type 'Direction'
```

### Union из объектных типов

Union types работают не только со строками — можно объединять любые типы:

```typescript
type ApiResponse =
  | { status: 'success'; data: string[] }
  | { status: 'error'; message: string }
  | { status: 'loading' };

const handleResponse = (response: ApiResponse): void => {
  if (response.status === 'success') {
    console.log(response.data); // TypeScript знает, что data существует
  } else if (response.status === 'error') {
    console.log(response.message); // TypeScript знает, что message существует
  }
};
```

Это discriminated union — мощный паттерн, недоступный для обычных enum.

## Сравнение по ключевым критериям

### Компилируемый JavaScript

Главное техническое отличие: enum компилируется в реальный объект, union type — нет.

Исходный TypeScript:

```typescript
enum Color {
  Red = 'RED',
  Green = 'GREEN',
  Blue = 'BLUE'
}

type ColorUnion = 'RED' | 'GREEN' | 'BLUE';
```

Скомпилированный JavaScript:

```javascript
// enum — превращается в объект
var Color;
(function (Color) {
  Color["Red"] = "RED";
  Color["Green"] = "GREEN";
  Color["Blue"] = "BLUE";
})(Color || (Color = {}));

// union type — полностью исчезает
// (нет ни одной строки кода)
```

Для числовых enum компиляция ещё объёмнее — добавляется обратное отображение (reverse mapping):

```javascript
var Direction;
(function (Direction) {
  Direction[Direction["Up"] = 0] = "Up";
  Direction[Direction["Down"] = 1] = "Down";
})(Direction || (Direction = {}));

// Direction[0] === 'Up'
// Direction['Up'] === 0
```

Это позволяет получать имя по значению, но увеличивает размер бандла и может удивить разработчика.

### Удобство рефакторинга

Union types легче рефакторить — все значения видны прямо в определении типа:

```typescript
// Добавить новое значение — просто дописать
type Status = 'pending' | 'active' | 'archived' | 'deleted';
```

С enum нужно открывать определение и добавлять новый элемент в другом месте кода. При использовании строки компилятор сразу укажет, где нужно обновить switch-выражение.

### Строгость присваивания

Enum строже: нельзя случайно передать «голое» строковое значение:

```typescript
enum Role {
  Admin = 'ADMIN',
  User = 'USER'
}

const setRole = (role: Role): void => {};

setRole('ADMIN');      // Error
setRole(Role.Admin);   // OK

type RoleUnion = 'ADMIN' | 'USER';
const setRoleUnion = (role: RoleUnion): void => {};

setRoleUnion('ADMIN'); // OK — строка принимается напрямую
setRoleUnion(Role.Admin); // OK — тоже работает
```

Это может быть преимуществом или недостатком в зависимости от контекста. Если API принимает строки из внешнего источника — union type удобнее. Если нужно гарантировать, что значение прошло через именованную константу — enum надёжнее.

### Итерация по значениям

Enum позволяет итерироваться по значениям в рантайме — это невозможно с union type:

```typescript
enum Permission {
  Read = 'READ',
  Write = 'WRITE',
  Execute = 'EXECUTE'
}

// Получить все значения enum в рантайме
const allPermissions = Object.values(Permission);
console.log(allPermissions); // ['READ', 'WRITE', 'EXECUTE']

// С union type так не получится — тип исчезает при компиляции
type PermissionUnion = 'READ' | 'WRITE' | 'EXECUTE';
// Object.values(PermissionUnion) — это не работает
```

Если нужно получить список допустимых значений в рантайме (например, для валидации входящих данных), enum — очевидный выбор. Для union types нужно дублировать значения в массив:

```typescript
const PERMISSIONS = ['READ', 'WRITE', 'EXECUTE'] as const;
type PermissionUnion = typeof PERMISSIONS[number]; // 'READ' | 'WRITE' | 'EXECUTE'

// Валидация
const isValidPermission = (value: string): value is PermissionUnion => {
  return (PERMISSIONS as readonly string[]).includes(value);
};
```

### Tree-shaking и размер бандла

Union types полностью исчезают при компиляции — они ничего не добавляют в итоговый бандл. Enum же компилируется в объект, который попадает в JavaScript-код.

Для `const enum` размер бандла будет таким же, как с union type — значения подставляются инлайн. Но `const enum` не работает в некоторых инструментах (например, Babel и esbuild обрабатывают их с ограничениями).

### Совместимость с JSON и API

При сериализации в JSON enum не даёт дополнительных преимуществ — в JSON всегда передаётся примитивное значение. Если API возвращает строку `"ADMIN"`, с union type работать проще:

```typescript
type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

const response = await fetch('/api/user');
const user: { role: UserRole } = await response.json();
// Тип сразу совместим — строка 'ADMIN' присваивается UserRole

enum UserRoleEnum {
  Admin = 'ADMIN',
  Editor = 'EDITOR'
}

const user2: { role: UserRoleEnum } = await response.json();
// Будет работать, но TypeScript может предупредить о несовместимости типов
// при строгих настройках
```

## Паттерн: as const объект

Существует третий вариант, который сочетает преимущества обоих подходов:

```typescript
const HttpMethod = {
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Delete: 'DELETE'
} as const;

type HttpMethod = typeof HttpMethod[keyof typeof HttpMethod];
// Тип: 'GET' | 'POST' | 'PUT' | 'DELETE'

const request = (method: HttpMethod, url: string): void => {
  console.log(`${method} ${url}`);
};

request(HttpMethod.Get, '/api/users'); // OK — через именованную константу
request('GET', '/api/users');          // OK — напрямую строкой

// Итерация доступна в рантайме
const methods = Object.values(HttpMethod); // ['GET', 'POST', 'PUT', 'DELETE']
```

Этот паттерн:
- даёт именованные константы (как enum)
- позволяет итерироваться в рантайме (как enum)
- принимает строки напрямую (как union type)
- не добавляет лишнего кода при `as const`
- хорошо работает с Babel, esbuild и другими инструментами

## Когда использовать enum

Enum оправдан в следующих сценариях:

**1. Числовые флаги и битовые маски**

```typescript
enum FilePermission {
  None = 0,
  Read = 1 << 0,  // 1
  Write = 1 << 1, // 2
  Execute = 1 << 2 // 4
}

const permissions = FilePermission.Read | FilePermission.Write; // 3
const canRead = (permissions & FilePermission.Read) !== 0;      // true
```

**2. Когда нужно reverse mapping для числовых значений**

```typescript
enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3
}

const levelName = LogLevel[2]; // 'Warn'
```

**3. Зрелые кодовые базы с устоявшимся использованием enum**

Если проект уже активно использует enum, последовательность важнее теоретических преимуществ union types.

## Когда использовать Union Types

Union types предпочтительны в большинстве современных TypeScript-проектов:

**1. Discriminated unions для моделирования состояний**

```typescript
type RequestState<T> =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; data: T }
  | { kind: 'error'; error: Error };

const render = <T>(state: RequestState<T>): string => {
  switch (state.kind) {
    case 'idle':    return 'Ожидание';
    case 'loading': return 'Загрузка...';
    case 'success': return `Данных: ${state.data}`; // data доступна
    case 'error':   return `Ошибка: ${state.error.message}`; // error доступна
  }
};
```

**2. Типы из внешних источников (API, JSON)**

```typescript
type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  status: OrderStatus;
}
```

**3. Небольшие наборы значений без необходимости итерации**

```typescript
type Alignment = 'left' | 'center' | 'right';
type Size = 'sm' | 'md' | 'lg' | 'xl';
type Variant = 'primary' | 'secondary' | 'danger';
```

**4. Публичные API библиотек и SDK**

Union types проще использовать — не нужно импортировать enum, достаточно передать строку.

## Итоговое сравнение

| Критерий | Enum | Union Type | as const объект |
|---|---|---|---|
| Компиляция в JS | Да (объект) | Нет | Да (объект) |
| Размер бандла | Больше | Нет влияния | Минимальное |
| Итерация в рантайме | Да | Нет | Да |
| Принимает строки напрямую | Нет (строгий) | Да | Да |
| Discriminated unions | Нет | Да | Нет |
| Работа с Babel/esbuild | Да | Да | Да |
| Читаемость в отладчике | Зависит от типа | Хорошая | Хорошая |

## Рекомендации

Общее правило: **используйте union types или `as const` объект по умолчанию**, переходите к enum только при наличии явной причины.

Выбирайте **union type**, если:
- работаете с данными из API или JSON
- нужны discriminated unions для моделирования сложных состояний
- важен минимальный размер бандла
- API библиотеки должен быть удобен для вызова без импорта enum

Выбирайте **`as const` объект**, если:
- нужны именованные константы и возможность итерации
- хотите избежать проблем совместимости с Babel/esbuild
- нужна гибкость: принимать и строки напрямую, и именованные константы

Выбирайте **enum**, если:
- работаете с числовыми флагами или битовыми масками
- нужен reverse mapping (получение имени по числовому значению)
- в проекте уже сложилось соглашение использовать enum

Избегайте числовых enum без явных значений — неявные `0, 1, 2` хрупки при рефакторинге и нечитаемы в рантайме.

---

Хотите глубже освоить систему типов TypeScript и научиться писать надёжный, читаемый код? Пройдите курс [TypeScript на PurpleSchool](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=enums-vs-union-types) — от основ до продвинутых паттернов типизации.
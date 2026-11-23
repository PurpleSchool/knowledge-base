---
metaTitle: "import type в TypeScript: изоляция типов и оптимизация"
metaDescription: "Как работает import type в TypeScript, зачем нужна изоляция типов, флаги isolatedModules и verbatimModuleSyntax с практическими примерами."
author: "Антон Ларичев"
title: "import type и изоляция типов в TypeScript"
preview: "Разбираем import type: зачем отделять типы от значений, как это влияет на сборку и производительность, и что такое isolatedModules."
---

## Что такое import type

Конструкция `import type` появилась в TypeScript 3.8 и решает конкретную проблему: при компиляции TypeScript стирает все типы, но обычный `import` может оставить следы в JavaScript-коде даже если импортировалось только типовое значение.

Сравним два варианта:

```typescript
// Обычный импорт
import { User } from './types';

// Импорт только типа
import type { User } from './types';
```

В рантайме `User` — это тип, у него нет значения. Но обычный `import` без `type` может привести к тому, что в скомпилированном JS останется `require('./types')` или пустой `import`, что создаёт лишние зависимости и замедляет загрузку.

`import type` гарантирует, что строка импорта полностью исчезнет из итогового JavaScript — TypeScript знает, что ничего из этого модуля не нужно в рантайме.

## Почему это важно на практике

Рассмотрим реальный сценарий. У вас есть модуль с типами:

```typescript
// models/user.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export class UserService {
  getUser(id: number): User {
    // ...
    return { id, name: 'Test', email: 'test@test.com' };
  }
}
```

Если вам нужен только тип `User`, используйте `import type`:

```typescript
// components/Profile.ts
import type { User } from './models/user';

function renderProfile(user: User): string {
  return `${user.name} (${user.email})`;
}
```

Скомпилированный JS не будет содержать ничего про `./models/user` — импорт исчезнет полностью.

Если же нужен и тип, и класс:

```typescript
import type { User } from './models/user';
import { UserService } from './models/user';

const service = new UserService();
const user: User = service.getUser(1);
```

Либо смешанный синтаксис через inline `type`:

```typescript
import { UserService, type User } from './models/user';
```

## Inline import type

TypeScript 4.5 добавил возможность указывать `type` прямо внутри фигурных скобок, не делая весь импорт типовым:

```typescript
import { UserService, type User, type UserRole } from './models/user';

// UserService — значение, будет в JS
// User и UserRole — только типы, исчезнут из JS
const service = new UserService();

function checkRole(user: User, role: UserRole): boolean {
  return true; // заглушка
}
```

Это удобно: один импорт, но TypeScript точно знает, что именно нужно в рантайме.

## Флаг isolatedModules

Флаг `isolatedModules: true` в `tsconfig.json` включает режим, при котором каждый файл компилируется независимо от остальных. Именно так работают Babel, esbuild, SWC и другие транспиляторы — они не читают весь проект целиком, а обрабатывают файлы по одному.

```json
{
  "compilerOptions": {
    "isolatedModules": true,
    "module": "ESNext",
    "target": "ES2020"
  }
}
```

При `isolatedModules: true` TypeScript будет ругаться на конструкции, которые невозможно безопасно транспилировать без знания всего проекта.

### Проблема с обычным импортом типов

Представьте: Babel транспилирует файл и видит:

```typescript
import { User } from './models/user';

export { User };
```

Он не знает — `User` это тип или значение. Если это тип, строку `export { User }` нужно удалить. Если значение — оставить. Без анализа всего проекта решить невозможно.

С `isolatedModules: true` TypeScript выдаст ошибку:

```
error TS1205: Re-exporting a type when the '--isolatedModules' flag is provided 
requires using 'export type'.
```

Решение — явно указать `type`:

```typescript
import type { User } from './models/user';

export type { User };
```

Теперь любой транспилятор знает, что эти строки нужно полностью удалить.

### Что ещё запрещает isolatedModules

Константные enum нельзя использовать в отдельных модулях, потому что их значения подставляются на этапе компиляции всего проекта:

```typescript
// enums.ts
export const enum Direction {
  Up = 'UP',
  Down = 'DOWN',
}

// component.ts
import { Direction } from './enums';
// Ошибка при isolatedModules: true!
// Cannot access ambient const enums when '--isolatedModules' flag is provided.
console.log(Direction.Up);
```

Используйте обычный `enum` или объект:

```typescript
export enum Direction {
  Up = 'UP',
  Down = 'DOWN',
}

// или
export const Direction = {
  Up: 'UP',
  Down: 'DOWN',
} as const;
```

Также запрещены реэкспорты неймспейсов из `.d.ts`-файлов без явного `type`.

## Флаг verbatimModuleSyntax

В TypeScript 5.0 появился флаг `verbatimModuleSyntax`, который делает правила ещё строже и одновременно проще:

```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true
  }
}
```

Правило одно: если что-то используется только как тип — должен быть `import type`. Если написан обычный `import`, хотя бы одна именованная сущность должна использоваться как значение в рантайме.

```typescript
// Ошибка: User используется только как тип
import { User } from './models/user';
const user: User = { id: 1, name: 'Test', email: 'a@b.com' };

// Правильно:
import type { User } from './models/user';
const user: User = { id: 1, name: 'Test', email: 'a@b.com' };
```

```typescript
// Правильно: UserService используется как значение
import { UserService, type User } from './models/user';
const service = new UserService();
const user: User = service.getUser(1);
```

`verbatimModuleSyntax` предполагает, что TypeScript выведет в JS ровно то, что написано в исходнике, только удалив строки с `type`. Это устраняет любую магию и делает поведение предсказуемым.

### verbatimModuleSyntax vs isolatedModules

Эти флаги решают похожую задачу, но `verbatimModuleSyntax` более строгий и современный. Если ваш проект новый — используйте `verbatimModuleSyntax`. Если работаете с существующим проектом под Babel/esbuild — `isolatedModules: true` достаточно.

Их нельзя использовать вместе: `verbatimModuleSyntax` включает в себя логику `isolatedModules`.

## Практические паттерны

### Barrel-файлы

Часто в проектах есть `index.ts`, реэкспортирующий из дочерних модулей. При `isolatedModules` или `verbatimModuleSyntax` важно явно разделять реэкспорты:

```typescript
// models/index.ts

// Значения:
export { UserService } from './user';
export { PostService } from './post';

// Типы:
export type { User, UserRole } from './user';
export type { Post, PostStatus } from './post';
```

Либо смешанный синтаксис:

```typescript
export { UserService, type User, type UserRole } from './user';
export { PostService, type Post, type PostStatus } from './post';
```

### Декларации функций с типами из других модулей

```typescript
import type { Request, Response } from 'express';

export function healthCheck(req: Request, res: Response): void {
  res.json({ status: 'ok' });
}
```

Express устанавливается как зависимость, но `import type` гарантирует: в скомпилированном JS не будет `require('express')` от этого файла. Значит меньше неожиданных side-эффектов.

### Circular dependencies

`import type` помогает разрывать циклические зависимости. Если модуль A использует тип из модуля B, а модуль B использует значение из модуля A — типовой импорт не создаёт рантаймовую циклическую зависимость:

```typescript
// a.ts
import type { BConfig } from './b';

export function createA(config: BConfig) {
  return { type: 'A', config };
}

// b.ts
import { createA } from './a'; // Значение — рантаймовая зависимость

export interface BConfig {
  name: string;
}

export function createB() {
  return createA({ name: 'test' });
}
```

Циклическая зависимость на уровне типов есть, но в рантайме её нет — `a.ts` не делает `require('./b')`.

## Влияние на производительность сборки

Инструменты вроде esbuild и Vite работают значительно быстрее TypeScript-компилятора, потому что не делают полный анализ типов. Они просто стирают аннотации. При `verbatimModuleSyntax: true` вы явно помечаете, что нужно удалить — это ускоряет работу таких инструментов.

Пример конфига для проекта с Vite:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true,
    "strict": true,
    "noEmit": true
  }
}
```

`noEmit: true` означает, что TypeScript используется только для проверки типов, а компиляцией занимается Vite. `verbatimModuleSyntax` при этом гарантирует, что ваш код совместим с таким подходом.

## Ошибки и как их исправлять

### «Re-exporting a type when the isolatedModules flag is provided»

```typescript
// Ошибка
import { User } from './user';
export { User };

// Исправление
import type { User } from './user';
export type { User };
// или
export type { User } from './user';
```

### «This import is never used as a value and must use import type»

Ошибка `verbatimModuleSyntax`:

```typescript
// Ошибка
import { User } from './user'; // используется только как тип

function greet(user: User) {}

// Исправление
import type { User } from './user';

function greet(user: User) {}
```

### «Cannot access ambient const enums when isolatedModules flag is provided»

```typescript
// Ошибка
import { Direction } from './enums';
// Direction — const enum из другого файла

// Исправление 1: обычный enum
export enum Direction { Up = 'UP' }

// Исправление 2: объект as const
export const Direction = { Up: 'UP' } as const;
export type Direction = typeof Direction[keyof typeof Direction];
```

## Итог

`import type` — не просто синтаксический сахар, а инструмент с конкретным смыслом: явно разделить то, что нужно в рантайме, от того, что нужно только компилятору.

Ключевые правила:

- Используйте `import type` всегда, когда импортируете только типы и интерфейсы
- Включайте `verbatimModuleSyntax: true` для новых проектов — TypeScript сам подскажет, где нужен `import type`
- Включайте `isolatedModules: true`, если используете Babel, esbuild или SWC
- В barrel-файлах явно разделяйте `export` и `export type`
- Избегайте `const enum` при `isolatedModules` — замените на обычный `enum` или `as const`

Чёткое разделение типов и значений делает код предсказуемым, ускоряет сборку и устраняет целый класс трудноуловимых ошибок при работе с современными инструментами.

Чтобы углублённо изучить систему типов TypeScript и научиться писать надёжный, хорошо типизированный код — смотрите курс [TypeScript на PurpleSchool](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=import-type-isolation).
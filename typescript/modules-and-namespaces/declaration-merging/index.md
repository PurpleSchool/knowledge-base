---
metaTitle: Declaration Merging в TypeScript — слияние деклараций
metaDescription: Разбираем Declaration Merging в TypeScript: слияние интерфейсов, расширение модулей, module augmentation и дополнение глобального namespace с примерами.
author: Антон Ларичев
title: Declaration Merging в TypeScript
preview: Изучаем Declaration Merging в TypeScript — как TypeScript объединяет одноимённые декларации, слияние интерфейсов, расширение модулей и глобальных пространств имён.
---

## Введение

Declaration Merging (слияние деклараций) — уникальная возможность TypeScript, позволяющая объявлять одно и то же имя несколько раз, при этом компилятор автоматически объединяет эти объявления в одно. Это не баг и не странная особенность — это намеренно спроектированный механизм, который открывает ряд мощных паттернов.

Понимание Declaration Merging особенно важно при работе с библиотеками сторонних разработчиков, расширении существующих типов, добавлении методов к глобальным объектам и создании модульных типизированных плагин-систем.

## Слияние интерфейсов

Самый распространённый вид Declaration Merging — слияние интерфейсов. Если объявить интерфейс с одним и тем же именем дважды, TypeScript объединит все свойства в один интерфейс:

```typescript
// Первое объявление интерфейса
interface User {
  id: number;
  name: string;
}

// Второе объявление — TypeScript объединит их
interface User {
  email: string;
  role: "admin" | "editor" | "viewer";
}

// Результирующий интерфейс как будто содержит все четыре поля:
// interface User {
//   id: number;
//   name: string;
//   email: string;
//   role: "admin" | "editor" | "viewer";
// }

const user: User = {
  id: 1,
  name: "Иван",
  email: "ivan@example.com",
  role: "admin",
  // Все четыре поля обязательны
};
```

### Важное правило: совместимость функциональных перегрузок

Для методов/функций в объединяемых интерфейсах применяется особое правило: методы из более поздних объявлений оказываются в начале списка перегрузок. Исключение — если сигнатура содержит строковый литерал, он получает приоритет:

```typescript
interface Document {
  createElement(tagName: "canvas"): HTMLCanvasElement;
  createElement(tagName: "div"): HTMLDivElement;
  createElement(tagName: string): HTMLElement;
}

interface Document {
  createElement(tagName: "span"): HTMLSpanElement;
}

// После слияния порядок:
// createElement(tagName: "span"): HTMLSpanElement;  <- из второго (последнего)
// createElement(tagName: "canvas"): HTMLCanvasElement;
// createElement(tagName: "div"): HTMLDivElement;
// createElement(tagName: string): HTMLElement;
```

## Module Augmentation — расширение модулей

Module Augmentation позволяет добавлять новые типы и свойства к уже существующим модулям. Это особенно полезно для расширения сторонних библиотек без изменения их исходного кода:

```typescript
// Файл: express-extensions.d.ts
import "express";

// Расширяем интерфейс Request из Express
declare module "express" {
  interface Request {
    // Добавляем поле для авторизованного пользователя
    user?: {
      id: number;
      email: string;
      role: string;
    };
    // Добавляем поле для трекинга запроса
    requestId?: string;
  }
}
```

```typescript
// Теперь в роутах Express TypeScript знает о поле user
import { Router, Request, Response } from "express";

const router = Router();

router.get("/profile", (req: Request, res: Response) => {
  // TypeScript знает о req.user благодаря augmentation
  if (!req.user) {
    return res.status(401).json({ error: "Не авторизован" });
  }

  res.json({
    id: req.user.id,
    email: req.user.email,
  });
});
```

Если вы хотите детально изучить TypeScript для работы с реальными фреймворками — приходите на наш большой курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=declaration-merging).
На курсе 192 урока и 17 упражнений, AI-тренажёры для практики 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Дополнение глобального пространства имён

Иногда нужно добавить типы к глобальным объектам JavaScript — `window`, `process`, `globalThis`. Для этого используется `declare global`:

```typescript
// Файл: global.d.ts

// Расширяем глобальный объект Window
declare global {
  interface Window {
    // Добавляем аналитику в глобальный объект
    analytics: {
      track(event: string, properties?: Record<string, unknown>): void;
      identify(userId: string): void;
    };
    // Добавляем конфигурацию приложения
    APP_CONFIG: {
      apiUrl: string;
      version: string;
      environment: "development" | "staging" | "production";
    };
  }

  // Добавляем глобальную переменную
  const __DEV__: boolean;
}

export {}; // Важно! Без этого файл не будет модулем
```

```typescript
// Использование расширенных глобальных типов
window.analytics.track("page_view", { page: "/home" });

if (window.APP_CONFIG.environment === "development") {
  console.log("Режим разработки");
}

if (__DEV__) {
  console.log("Разработческая сборка");
}
```

## Слияние пространств имён

Пространства имён (namespaces) также поддерживают слияние — это удобно для расширения в нескольких файлах:

```typescript
// Файл: validation.ts
namespace Validation {
  export interface StringValidator {
    isAcceptable(s: string): boolean;
  }
}

// Файл: email-validator.ts
namespace Validation {
  // Добавляем реализацию в тот же namespace
  export class EmailValidator implements StringValidator {
    isAcceptable(s: string): boolean {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    }
  }
}

// Файл: phone-validator.ts
namespace Validation {
  export class PhoneValidator implements StringValidator {
    isAcceptable(s: string): boolean {
      return /^\+?[1-9]\d{10,14}$/.test(s);
    }
  }
}

// После слияния: все классы доступны через Validation
const emailVal = new Validation.EmailValidator();
const phoneVal = new Validation.PhoneValidator();
```

## Слияние namespace с enum и class

TypeScript позволяет объединять namespace с enum и классами, добавляя к ним статические свойства и методы:

```typescript
// Расширение enum через namespace
enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
}

namespace Direction {
  // Добавляем вспомогательные функции к enum
  export function isVertical(d: Direction): boolean {
    return d === Direction.Up || d === Direction.Down;
  }

  export function isHorizontal(d: Direction): boolean {
    return d === Direction.Left || d === Direction.Right;
  }

  export const all: Direction[] = [
    Direction.Up,
    Direction.Down,
    Direction.Left,
    Direction.Right,
  ];
}

// Использование
console.log(Direction.isVertical(Direction.Up));    // true
console.log(Direction.isHorizontal(Direction.Left)); // true
console.log(Direction.all.length);                   // 4
```

```typescript
// Расширение класса через namespace (добавление фабричных методов)
class Color {
  constructor(
    public r: number,
    public g: number,
    public b: number,
  ) {}

  toString(): string {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
  }
}

namespace Color {
  // Добавляем предопределённые цвета как статические свойства
  export const Red = new Color(255, 0, 0);
  export const Green = new Color(0, 255, 0);
  export const Blue = new Color(0, 0, 255);

  // Добавляем фабричный метод
  export function fromHex(hex: string): Color {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return new Color(r, g, b);
  }
}

// Использование
console.log(Color.Red.toString()); // "rgb(255, 0, 0)"
const custom = Color.fromHex("#ff8800");
console.log(custom.toString());    // "rgb(255, 136, 0)"
```

## Частые ошибки

* **Конфликт типов при слиянии** — если два интерфейса объявляют одно и то же свойство с разными несовместимыми типами, TypeScript выдаст ошибку; типы должны быть идентичны или совместимы
* **Забытый `export {}`** — в файлах с `declare global` без `export {}` TypeScript обработает файл не как модуль, а как глобальные объявления, что может вызвать неожиданное поведение
* **Попытка слить type alias** — в отличие от `interface`, `type` не поддерживает слияние; повторное объявление `type User = ...` — это ошибка компиляции
* **Неправильный путь к модулю** — в `declare module "express"` имя модуля должно точно совпадать с тем, что используется в `import`; опечатка означает создание нового модуля вместо расширения
* **Отсутствие `.d.ts` файла** — файлы с `declare module` должны быть подключены в `tsconfig.json` через `include` или `types`/`typeRoots`; иначе TypeScript не увидит расширения

## Заключение

Declaration Merging — это элегантный механизм, который позволяет TypeScript оставаться совместимым с JavaScript-миром, где один объект может быть одновременно и функцией, и конструктором, и пространством имён. В практике разработки это прежде всего инструмент для расширения сторонних типов без форков и патчей.

Module Augmentation особенно востребован в экосистеме Express, NestJS, Vue и других фреймворков, где разработчики расширяют базовые типы под нужды конкретного проекта. Для углублённого изучения TypeScript и работы с реальными проектами рекомендуем курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=article&utm_campaign=declaration-merging).
В первых 3 модулях курса доступно бесплатное содержание, что позволяет изучить основы и понять, как TypeScript применяется в реальных проектах, до покупки полного доступа.

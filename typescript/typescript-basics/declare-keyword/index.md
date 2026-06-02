---
metaTitle: "Ключевое слово declare в TypeScript — полное руководство"
metaDescription: "Разбираем ключевое слово declare в TypeScript: ambient-объявления, .d.ts файлы, declare global, declare module с примерами кода."
author: "Антон Ларичев"
title: "TypeScript ключевое слово declare"
preview: "Ключевое слово declare позволяет описывать типы для кода, который существует вне TypeScript — глобальные переменные, сторонние библиотеки и встроенные API."
---

## Что такое declare и зачем он нужен

Ключевое слово `declare` сообщает компилятору TypeScript: «эта переменная, функция или класс существует в рантайме, но объявлена не здесь — не генерируй для неё никакого JavaScript-кода, просто знай её тип».

Такие объявления называют **ambient** (внешними). Они нужны в трёх основных ситуациях:

1. Вы подключаете стороннюю библиотеку через `<script>` без npm-пакета — её глобальная переменная есть в `window`, но TypeScript о ней не знает.
2. Вы пишете типы для JavaScript-кода, который не собираетесь переписывать на TypeScript.
3. Вы расширяете глобальный объект или уже существующий модуль новыми свойствами.

```typescript
// Без declare — ошибка TS2304: Cannot find name 'grecaptcha'
console.log(grecaptcha.execute());

// С declare — компилятор доволен, JS не генерируется
declare const grecaptcha: {
  execute(siteKey: string, options: { action: string }): Promise<string>;
};
console.log(grecaptcha.execute('key', { action: 'submit' }));
```

## Базовые формы объявления

### declare var, let, const

Объявляют типы глобальных переменных. `var`, `let` и `const` здесь не определяют семантику изменяемости — в ambient-контексте они эквивалентны. Принято использовать `const` для значений, которые не переназначаются.

```typescript
declare var __DEV__: boolean;
declare let currentUser: { id: number; name: string };
declare const API_BASE_URL: string;

// В коде используем как обычные переменные
if (__DEV__) {
  console.log('Debug mode');
}
```

### declare function

Описывает типы функций, доступных глобально — например, встроенных браузерных API или функций, добавленных через глобальный скрипт.

```typescript
declare function trackEvent(name: string, payload?: Record<string, unknown>): void;
declare function formatCurrency(amount: number, currency: string): string;

trackEvent('page_view', { path: '/home' });
```

### declare class

Описывает класс, реализованный в JavaScript. Можно объявлять конструктор, методы и свойства.

```typescript
declare class EventEmitter {
  on(event: string, listener: (...args: unknown[]) => void): this;
  off(event: string, listener: (...args: unknown[]) => void): this;
  emit(event: string, ...args: unknown[]): boolean;
}

const emitter = new EventEmitter();
emitter.on('data', (chunk) => console.log(chunk));
```

### declare enum

Описывает перечисление, значения которого определены в другом файле или сгенерированы инструментом сборки.

```typescript
declare enum Direction {
  Up,
  Down,
  Left,
  Right,
}

function move(dir: Direction) {
  // ...
}

move(Direction.Up);
```

## declare namespace

`namespace` в ambient-контексте описывает объект с вложенными свойствами. Часто встречается в типах старых библиотек, которые добавляют объект в `window`.

```typescript
declare namespace MyLib {
  interface Config {
    apiKey: string;
    timeout?: number;
  }

  function init(config: Config): void;
  function destroy(): void;

  const version: string;
}

MyLib.init({ apiKey: 'abc123' });
console.log(MyLib.version);
```

Можно вкладывать namespace в namespace:

```typescript
declare namespace Analytics {
  namespace Events {
    function track(name: string): void;
  }

  namespace User {
    function identify(id: string): void;
  }
}

Analytics.Events.track('click');
Analytics.User.identify('u_42');
```

## Файлы объявлений .d.ts

Ambient-объявления принято выносить в файлы с расширением `.d.ts`. Такие файлы содержат только типы и не компилируются в JavaScript.

Типичная структура проекта:

```
src/
  index.ts
  api.ts
types/
  globals.d.ts       ← глобальные переменные
  third-party.d.ts   ← типы для JS-библиотек без @types
```

Пример `types/globals.d.ts`:

```typescript
// Переменные, проброшенные webpack DefinePlugin или Vite define
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;

// Тип, добавленный сторонним SDK через script-тег
declare const Stripe: import('@stripe/stripe-js').Stripe;
```

Чтобы TypeScript видел файлы в `types/`, добавьте путь в `tsconfig.json`:

```json
{
  "compilerOptions": {
    "typeRoots": ["./types", "./node_modules/@types"]
  }
}
```

Или явно включите файлы:

```json
{
  "include": ["src/**/*", "types/**/*"]
}
```

## declare global — расширение глобального пространства

Если файл является модулем (содержит `import` или `export`), ambient-объявления на верхнем уровне относятся только к этому модулю. Чтобы расширить глобальное пространство из модуля, используйте `declare global`.

```typescript
import { User } from './types';

declare global {
  interface Window {
    currentUser: User;
    featureFlags: Record<string, boolean>;
  }

  // Глобальная функция, добавленная полифиллом
  function queueMicrotask(callback: () => void): void;
}

// Теперь TypeScript знает о window.currentUser
console.log(window.currentUser.name);
```

Пример с расширением встроенных интерфейсов. Допустим, вы добавляете метод к `Array.prototype` (не рекомендуется в продакшне, но полезно знать как работает):

```typescript
export {}; // делаем файл модулем

declare global {
  interface Array<T> {
    last(): T | undefined;
  }
}

Array.prototype.last = function () {
  return this[this.length - 1];
};

const nums = [1, 2, 3];
console.log(nums.last()); // 3
```

## declare module — расширение и описание модулей

### Описание модуля без типов

Если вы устанавливаете npm-пакет, у которого нет файлов типов и нет пакета `@types`, TypeScript выдаст ошибку `TS7016: Could not find a declaration file`. Решение — создать ambient module:

```typescript
// types/third-party.d.ts
declare module 'legacy-chart-lib' {
  interface ChartOptions {
    width: number;
    height: number;
    data: number[];
  }

  export function render(container: HTMLElement, options: ChartOptions): void;
  export function destroy(container: HTMLElement): void;
}
```

Если не хочется описывать типы подробно, можно объявить модуль как `any` — это заглушит ошибку, но лишит вас автодополнения:

```typescript
declare module 'some-untyped-package';
```

### Module augmentation — добавление свойств к существующему модулю

Позволяет добавлять новые экспорты к уже типизированному модулю. Часто используется для расширения типов фреймворков.

Пример: добавляем пользовательские свойства к `express.Request`:

```typescript
// types/express.d.ts
import { User } from '../src/models/user';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    requestId: string;
  }
}
```

Теперь в обработчиках Express TypeScript знает о `req.user` и `req.requestId`:

```typescript
import { Request, Response } from 'express';

export function getProfile(req: Request, res: Response) {
  // req.user типизирован как User | undefined
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ id: req.user.id, name: req.user.name });
}
```

### Типы для нестандартных импортов

Vite, webpack и другие сборщики позволяют импортировать CSS, SVG, изображения. TypeScript об этом не знает:

```typescript
// types/assets.d.ts
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const classes: Record<string, string>;
  export default classes;
}
```

После этого импорты работают без ошибок:

```typescript
import logo from './logo.svg';
import styles from './button.css';

console.log(logo);           // string — URL или data URI
console.log(styles.button);  // string — CSS-класс
```

## declare в классах

Внутри классов `declare` используется для объявления свойств, которые существуют в рантайме, но не инициализируются в TypeScript-коде. Это нужно при работе с декораторами или при наследовании от JavaScript-классов.

```typescript
function Column(target: object, key: string) {
  // декоратор добавляет метаданные
}

class UserEntity {
  declare id: number;       // TypeScript знает о свойстве, не генерирует код инициализации
  declare createdAt: Date;

  @Column
  name: string = '';
}
```

Без `declare` TypeScript сгенерировал бы `this.id = undefined` в конструкторе, что могло бы сломать логику декоратора.

Другой случай — `useDefineForClassFields: false` в tsconfig. При этой настройке поля класса не используют `Object.defineProperty`, и `declare` нужен чтобы явно указать: «это поле есть, но инициализировать его не нужно».

## Разница между declare и interface/type

Лёгкая точка путаницы: `interface` и `type` тоже не генерируют JavaScript-код. В чём разница?

- `interface` и `type` описывают **форму данных** — структуры, которые можно использовать для аннотации переменных.
- `declare` описывает **конкретные сущности** — переменные, функции, классы, которые существуют в рантайме под конкретными именами.

```typescript
// Это описание формы — можно использовать как тип, но нет переменной с именем Config
interface Config {
  apiKey: string;
}

// Это объявление конкретной переменной — TypeScript знает, что config существует в рантайме
declare const config: Config;

// Теперь можно использовать config.apiKey без ошибки
console.log(config.apiKey);
```

## Практический пример: типизация SDK

Предположим, вы подключаете через `<script>` аналитический SDK, который добавляет `window.analytics`.

```html
<script src="https://cdn.example.com/analytics.js"></script>
```

Создаём `types/analytics.d.ts`:

```typescript
declare namespace analytics {
  interface EventProperties {
    [key: string]: string | number | boolean | null;
  }

  interface UserTraits {
    email?: string;
    name?: string;
    plan?: 'free' | 'pro' | 'enterprise';
  }

  function track(event: string, properties?: EventProperties): void;
  function identify(userId: string, traits?: UserTraits): void;
  function page(name?: string, properties?: EventProperties): void;
  function reset(): void;
}

declare global {
  interface Window {
    analytics: typeof analytics;
  }
}
```

Теперь TypeScript даёт полное автодополнение:

```typescript
// Прямой вызов через глобальное имя
analytics.track('Signup Completed', {
  method: 'google',
  plan: 'pro',
});

analytics.identify('user_123', {
  email: 'user@example.com',
  plan: 'pro',
});

// Или через window
window.analytics.page('Pricing');
```

## Частые ошибки

**Ошибка 1: declare в обычном .ts файле вместо .d.ts**

Ambient-объявления можно писать в обычных `.ts` файлах, но это создаёт путаницу. Принято держать их в `.d.ts`, чтобы было ясно: здесь только типы.

**Ошибка 2: забыть export {} при использовании declare global**

Если файл не содержит `import`/`export`, он считается скриптом, и `declare global` не нужен — объявления и так глобальные. Если файл является модулем, без `export {}` или реального экспорта `declare global` не сработает.

```typescript
// Неправильно — файл без import/export, declare global избыточен
declare global {
  const MY_VAR: string; // работает, но это антипаттерн
}

// Правильно для файла-модуля
export {};

declare global {
  const MY_VAR: string;
}
```

**Ошибка 3: дублирование declare и реального объявления**

Если переменная уже объявлена через `const`/`let`/`function`, добавлять `declare` не нужно — TypeScript выдаст ошибку о дублировании.

```typescript
const API_URL = 'https://api.example.com';
declare const API_URL: string; // TS2300: Duplicate identifier
```

## Итоговая шпаргалка

| Конструкция | Назначение |
|---|---|
| `declare const/let/var` | Глобальная переменная из внешнего кода |
| `declare function` | Глобальная функция |
| `declare class` | Класс из JavaScript |
| `declare namespace` | Объект с вложенными свойствами |
| `declare module 'pkg'` | Типы для пакета без типов |
| `declare module 'pkg'` (augmentation) | Добавление типов к существующему пакету |
| `declare global` | Расширение глобального пространства из модуля |
| `declare` в классе | Свойство без инициализации в TypeScript |

Понимание `declare` особенно важно при интеграции TypeScript в существующие JavaScript-проекты, при работе с CDN-библиотеками и при создании собственных пакетов с публичными типами.

Чтобы научиться уверенно работать с системой типов TypeScript — от базовых аннотаций до сложных ambient-объявлений — приходите на курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-declare-keyword).
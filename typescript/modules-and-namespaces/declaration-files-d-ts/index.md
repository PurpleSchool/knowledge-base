---
metaTitle: "Файлы деклараций TypeScript .d.ts — полное руководство"
metaDescription: "Что такое .d.ts файлы в TypeScript, как их создавать, использовать и подключать типы для JavaScript-библиотек через DefinitelyTyped."
author: "Антон Ларичев"
title: "Файлы деклараций TypeScript .d.ts"
preview: "Разбираемся, что такое файлы деклараций .d.ts, зачем они нужны и как правильно их создавать и использовать в TypeScript-проектах."
---

## Что такое файлы деклараций .d.ts

Файлы деклараций с расширением `.d.ts` — это специальные файлы TypeScript, которые содержат исключительно информацию о типах. Они не компилируются в JavaScript и не содержат исполняемого кода. Их единственная задача — описать форму существующего JavaScript-кода так, чтобы TypeScript мог проверять типы при его использовании.

Представьте ситуацию: вы подключаете JavaScript-библиотеку, написанную без TypeScript. Компилятор ничего не знает о её API — какие функции она экспортирует, какие параметры они принимают, что возвращают. Именно для решения этой проблемы и существуют файлы деклараций.

```typescript
// Без .d.ts файла TypeScript видит библиотеку так:
import { formatDate } from 'some-js-lib';
formatDate('2024-01-01'); // Ошибка: тип 'any', нет подсказок

// После подключения .d.ts TypeScript знает всё о функции:
import { formatDate } from 'some-js-lib';
formatDate('2024-01-01', 'DD.MM.YYYY'); // Автодополнение работает, типы проверяются
```

## Как TypeScript находит файлы деклараций

ТипScйript ищет файлы деклараций в нескольких местах, причём в строго определённом порядке.

Для пакета, импортируемого из `node_modules`, поиск происходит так:

1. Поле `types` или `typings` в `package.json` пакета
2. Файл `index.d.ts` в корне пакета
3. Директория `@types/имя-пакета` в `node_modules`

```json
// package.json библиотеки с явно указанными типами
{
  "name": "my-library",
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

Для собственных модулей проекта TypeScript ищет `.d.ts` рядом с `.js` файлами или в директориях, указанных в `typeRoots` в `tsconfig.json`.

```json
// tsconfig.json
{
  "compilerOptions": {
    "typeRoots": ["./node_modules/@types", "./src/types"],
    "types": ["node", "jest"]
  }
}
```

Поле `types` ограничивает набор автоматически подключаемых пакетов из `@types`. Если оно указано, только перечисленные пакеты будут подключены глобально.

## DefinitelyTyped и пакеты @types

Большинство популярных JavaScript-библиотек имеют готовые файлы деклараций в репозитории [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped). Эти типы публикуются в npm под скоупом `@types`.

```bash
# Установка типов для популярных библиотек
npm install --save-dev @types/node
npm install --save-dev @types/lodash
npm install --save-dev @types/express
npm install --save-dev @types/react @types/react-dom
```

После установки TypeScript автоматически подхватывает эти типы — никакой дополнительной настройки не требуется.

```typescript
// После npm install --save-dev @types/lodash
import _ from 'lodash';

const result = _.chunk([1, 2, 3, 4, 5], 2);
// result имеет тип number[][], TypeScript всё проверил

const name = _.camelCase('hello world');
// name имеет тип string
```

## Создание собственных файлов деклараций

### Автоматическая генерация компилятором

Если вы пишете библиотеку на TypeScript, компилятор может автоматически сгенерировать `.d.ts` файлы из вашего кода.

```json
// tsconfig.json
{
  "compilerOptions": {
    "declaration": true,
    "declarationDir": "./dist/types",
    "outDir": "./dist"
  }
}
```

После компиляции рядом с каждым `.js` файлом появится соответствующий `.d.ts`:

```typescript
// src/utils.ts — исходный файл
export function add(a: number, b: number): number {
  return a + b;
}

export interface Config {
  timeout: number;
  retries: number;
}
```

```typescript
// dist/utils.d.ts — автоматически сгенерированный файл деклараций
export declare function add(a: number, b: number): number;

export declare interface Config {
  timeout: number;
  retries: number;
}
```

### Ручное написание деклараций

Иногда нужно написать декларации вручную — например, для JavaScript-модуля, который нельзя или нецелесообразно переписывать на TypeScript.

```typescript
// src/types/legacy-api.d.ts
declare module 'legacy-api' {
  export interface User {
    id: number;
    name: string;
    email: string;
  }

  export interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
  }

  export function getUser(id: number): Promise<ApiResponse<User>>;
  export function updateUser(id: number, data: Partial<User>): Promise<ApiResponse<User>>;
  export function deleteUser(id: number): Promise<ApiResponse<null>>;
}
```

### Объявление глобальных переменных

Для переменных, доступных глобально (например, внедрённых через `<script>` теги), используется синтаксис `declare`:

```typescript
// src/types/globals.d.ts
declare const API_BASE_URL: string;
declare const APP_VERSION: string;

declare interface Window {
  analytics: {
    track(event: string, properties?: Record<string, unknown>): void;
    identify(userId: string): void;
  };
  __APP_CONFIG__: {
    featureFlags: Record<string, boolean>;
    environment: 'development' | 'staging' | 'production';
  };
}
```

```typescript
// Теперь TypeScript знает об этих глобальных переменных
console.log(API_BASE_URL); // string, без ошибок
window.analytics.track('button_click', { button: 'submit' }); // типы проверяются
```

## Ambient-декларации и модули

Ключевое слово `declare` обозначает так называемые ambient-декларации — описания того, что существует во внешней среде.

```typescript
// Описание модуля целиком
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const styles: Record<string, string>;
  export default styles;
}
```

Это особенно полезно при работе с webpack или Vite, где нестандартные типы файлов импортируются как модули.

```typescript
// После добавления деклараций выше это работает без ошибок
import logo from './logo.svg';
import styles from './App.module.css';

console.log(logo); // string
console.log(styles.container); // string
```

### Декларации пространств имён

Для библиотек, использующих глобальное пространство имён (старый стиль UMD-библиотек):

```typescript
// src/types/jquery.d.ts (упрощённый пример)
declare namespace JQuery {
  interface AjaxSettings {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: unknown;
    success?: (data: unknown) => void;
    error?: (error: Error) => void;
  }
}

declare function $(selector: string): {
  on(event: string, handler: (event: Event) => void): void;
  addClass(className: string): void;
  removeClass(className: string): void;
  html(content?: string): string;
};

declare function $.ajax(settings: JQuery.AjaxSettings): void;
```

## Расширение существующих типов

Одна из мощных возможностей `.d.ts` файлов — расширение типов из сторонних библиотек через механизм declaration merging.

```typescript
// src/types/express-extensions.d.ts
import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
      correlationId: string;
    }
  }
}

export {}; // Делает файл модулем, а не скриптом
```

```typescript
// Теперь в обработчиках Express доступны расширенные типы
import { Request, Response } from 'express';

function authMiddleware(req: Request, res: Response, next: Function) {
  // TypeScript знает о поле req.user без ошибок
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
```

То же самое работает для расширения встроенных типов:

```typescript
// src/types/array-extensions.d.ts
interface Array<T> {
  last(): T | undefined;
  first(): T | undefined;
  groupBy<K extends string>(keyFn: (item: T) => K): Record<K, T[]>;
}

export {};
```

## Файлы деклараций и тройные слеш-директивы

Тройные слеш-директивы (`/// <reference .../>`) — это специальные комментарии, которые указывают компилятору на зависимости между файлами деклараций.

```typescript
// Ссылка на другой файл деклараций
/// <reference path="./legacy-types.d.ts" />

// Ссылка на пакет @types
/// <reference types="node" />

// Ссылка на lib
/// <reference lib="dom" />
```

В современных проектах с настроенным `tsconfig.json` тройные слеш-директивы используются редко — компилятор находит все нужные типы самостоятельно. Они актуальны при написании файлов деклараций для публикации библиотек.

## Практический пример: типизация конфигурационного модуля

Рассмотрим реальный сценарий: у вас есть JavaScript-модуль конфигурации, который нужно типизировать.

```javascript
// config.js — существующий JavaScript файл
module.exports = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'myapp',
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    cors: {
      origins: (process.env.CORS_ORIGINS || '').split(','),
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',
  },
};
```

```typescript
// config.d.ts — файл деклараций рядом с config.js
declare module './config' {
  interface DatabaseConfig {
    host: string;
    port: number;
    name: string;
  }

  interface CorsConfig {
    origins: string[];
  }

  interface ServerConfig {
    port: number;
    cors: CorsConfig;
  }

  interface JwtConfig {
    secret: string | undefined;
    expiresIn: string;
  }

  interface AppConfig {
    database: DatabaseConfig;
    server: ServerConfig;
    jwt: JwtConfig;
  }

  const config: AppConfig;
  export = config;
}
```

```typescript
// app.ts — использование с полной типизацией
import config from './config';

const port = config.server.port; // number
const dbHost = config.database.host; // string
const origins = config.server.cors.origins; // string[]

// TypeScript покажет ошибку:
// config.database.nonExistent; // Свойство не существует
```

## Когда писать декларации, а когда переходить на TypeScript

Писать `.d.ts` файлы вручную имеет смысл в следующих ситуациях:

- Библиотека существует только как JavaScript и не имеет типов в DefinitelyTyped
- Нужно быстро добавить минимальные типы для небольшого утилитарного скрипта
- Библиотека используется через глобальные переменные (CDN, легаси)
- Типы из DefinitelyTyped устарели или неточны для вашего случая

Если же JavaScript-файл активно развивается и является частью вашей кодовой базы — лучше конвертировать его в TypeScript напрямую, а не поддерживать параллельный `.d.ts` файл.

## Проверка деклараций

Компилятор TypeScript позволяет проверить корректность файлов деклараций с помощью флага `--checkJs` в сочетании с `--allowJs`, либо через специальный инструмент `dtslint` для более строгих проверок.

```bash
# Проверка типов без компиляции
npx tsc --noEmit

# Генерация деклараций и проверка
npx tsc --declaration --emitDeclarationOnly
```

Полезная настройка в `tsconfig.json` для строгой проверки деклараций:

```json
{
  "compilerOptions": {
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "stripInternal": true
  }
}
```

Флаг `declarationMap: true` генерирует source maps для `.d.ts` файлов, что позволяет IDE переходить к исходному TypeScript коду вместо скомпилированных деклараций при нажатии «перейти к определению».

## Итог

Файлы деклараций `.d.ts` — это мост между миром JavaScript и системой типов TypeScript. Они позволяют:

- Использовать JavaScript-библиотеки с полной типовой безопасностью
- Публиковать TypeScript-библиотеки так, чтобы потребители получали типы автоматически
- Расширять типы сторонних модулей под нужды конкретного проекта
- Описывать глобальные переменные и нестандартные импорты

Понимание файлов деклараций необходимо для уверенной работы с TypeScript в реальных проектах, особенно при интеграции легаси-кода или внешних зависимостей.

Для глубокого погружения в TypeScript и освоения всех возможностей системы типов рекомендуем курс [TypeScript с нуля](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-declaration-files) на PurpleSchool.

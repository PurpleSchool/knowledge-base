---
metaTitle: "TypeScript Project References — сборка монорепозитория"
metaDescription: "Как использовать TypeScript project references для разбивки монорепозитория на независимо компилируемые части с инкрементальной сборкой."
author: "Антон Ларичев"
title: "TypeScript Project References"
preview: "Разбиваем большой TypeScript-проект на независимые части с помощью project references и ускоряем сборку через инкрементальную компиляцию."
---

## Что такое project references

TypeScript project references — механизм, появившийся в TypeScript 3.0, который позволяет разбить большой проект на несколько меньших, независимо компилируемых частей. При этом TypeScript отслеживает зависимости между частями и пересобирает только то, что изменилось.

Без project references весь код компилируется как единое целое. Когда проект разрастается, время сборки увеличивается, а TypeScript Language Service начинает работать медленнее. Project references решают эту проблему через инкрементальную сборку и явное декларирование зависимостей между подпроектами.

Основные преимущества:

- Сборка только изменившихся частей проекта
- Явный граф зависимостей между пакетами
- Лучшая изоляция кода и типов
- Ускорение работы редактора в больших монорепозиториях

## Структура проекта

Рассмотрим типичный монорепозиторий с общей библиотекой и двумя приложениями:

```
monorepo/
  tsconfig.json
  packages/
    shared/
      src/
        index.ts
      tsconfig.json
    server/
      src/
        index.ts
      tsconfig.json
    client/
      src/
        index.ts
      tsconfig.json
```

## Настройка tsconfig

### Корневой tsconfig.json

Корневой конфиг определяет список всех подпроектов через поле `references` и сам не компилирует файлы:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/server" },
    { "path": "./packages/client" }
  ]
}
```

Поле `"files": []` гарантирует, что корневой tsconfig не будет компилировать никакие файлы напрямую.

### tsconfig для библиотеки shared

Подпроект, на который ссылаются другие, должен включать опцию `composite: true`:

```json
{
  "compilerOptions": {
    "composite": true,
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "strict": true,
    "target": "ES2020",
    "module": "CommonJS"
  },
  "include": ["src/**/*"]
}
```

Опция `composite: true` накладывает несколько требований:

- Все входные файлы должны быть включены через `include`, `exclude` или `files`
- `declaration: true` обязательна — TypeScript генерирует `.d.ts` файлы
- TypeScript создаёт `.tsbuildinfo` для инкрементальной сборки

Опция `declarationMap: true` позволяет IDE переходить к исходному `.ts`-коду вместо сгенерированных `.d.ts` деклараций.

### tsconfig для server

Подпроект, зависящий от `shared`, объявляет зависимость через `references`:

```json
{
  "compilerOptions": {
    "composite": true,
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "target": "ES2020",
    "module": "CommonJS"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

### tsconfig для client

```json
{
  "compilerOptions": {
    "composite": true,
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"]
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

## Написание кода

### Библиотека shared

```typescript
// packages/shared/src/index.ts

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

export function formatUserName(user: User): string {
  return `${user.name} <${user.email}>`;
}

export const DEFAULT_PAGE_SIZE = 20;
```

### Использование shared в server

После сборки `shared` импортируем типы и функции из собранных деклараций:

```typescript
// packages/server/src/index.ts
import { User, ApiResponse, formatUserName } from '@myapp/shared';

function getUser(id: number): ApiResponse<User> {
  const user: User = {
    id,
    name: 'Иван Иванов',
    email: 'ivan@example.com'
  };

  console.log(formatUserName(user));

  return {
    data: user,
    status: 200,
    message: 'OK'
  };
}

console.log(getUser(1));
```

### Использование shared в client

```typescript
// packages/client/src/index.ts
import { User, ApiResponse, DEFAULT_PAGE_SIZE } from '@myapp/shared';

async function fetchUsers(page: number): Promise<ApiResponse<User[]>> {
  const offset = page * DEFAULT_PAGE_SIZE;
  const response = await fetch(`/api/users?offset=${offset}&limit=${DEFAULT_PAGE_SIZE}`);
  return response.json() as Promise<ApiResponse<User[]>>;
}

fetchUsers(0).then(result => {
  console.log(`Получено ${result.data.length} пользователей`);
});
```

## Сборка с tsc --build

Project references используют специальный режим сборки через флаг `--build` (сокращённо `-b`):

```bash
# Сборка всего проекта из корневого tsconfig
tsc --build

# Сборка конкретного подпроекта
tsc --build packages/server

# Режим наблюдения — пересборка при изменениях
tsc --build --watch

# Принудительная пересборка всех проектов
tsc --build --force

# Очистка артефактов сборки
tsc --build --clean
```

Команда `tsc --build` анализирует граф зависимостей и собирает проекты в правильном порядке: сначала `shared`, затем `server` и `client` — независимо друг от друга, при наличии нескольких CPU параллельно.

### Инкрементальная сборка

При повторном запуске `tsc --build` TypeScript проверяет файлы `.tsbuildinfo` и пересобирает только изменившиеся проекты:

```bash
# Первая сборка — компилируются все три пакета
$ tsc --build
[12:00:00] Building packages/shared...
[12:00:02] Building packages/server...
[12:00:02] Building packages/client...

# После изменения только packages/server/src/index.ts
$ tsc --build
[12:01:00] Building packages/server...
# shared и client не пересобираются
```

## Настройка путей для импортов

Чтобы использовать красивые алиасы вместо относительных путей, настройте `paths` в tsconfig или используйте `package.json` с полем `exports`.

### Через package.json каждого пакета

```json
{
  "name": "@myapp/shared",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js",
      "import": "./dist/index.mjs"
    }
  }
}
```

### Через paths в корневом tsconfig

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@myapp/shared": ["./packages/shared/dist"],
      "@myapp/shared/*": ["./packages/shared/dist/*"]
    }
  },
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/server" },
    { "path": "./packages/client" }
  ]
}
```

## Интеграция с workspaces

Project references хорошо сочетаются с npm/yarn/pnpm workspaces:

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "tsc --build",
    "build:watch": "tsc --build --watch",
    "clean": "tsc --build --clean",
    "typecheck": "tsc --build --dry"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

При установке зависимостей через `npm install` в корне, npm создаёт символические ссылки в `node_modules` для каждого workspace-пакета. Это позволяет импортировать `@myapp/shared` без дополнительных настроек.

## Отдельный tsconfig для тестов

Для тестов часто нужны другие настройки — другие типы, другие глобальные переменные. Решение — отдельный tsconfig:

```json
// packages/server/tsconfig.test.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "./dist-test",
    "rootDir": ".",
    "strict": true,
    "target": "ES2020",
    "module": "CommonJS",
    "types": ["jest"]
  },
  "include": ["src/**/*", "tests/**/*"],
  "references": [
    { "path": "./tsconfig.json" },
    { "path": "../shared" }
  ]
}
```

В корневом tsconfig добавляем ссылку на тестовый конфиг:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/server" },
    { "path": "./packages/server/tsconfig.test.json" },
    { "path": "./packages/client" }
  ]
}
```

## Совместимость с современными бандлерами

Vite, esbuild и другие современные сборщики используют собственный механизм транспиляции и не вызывают `tsc` для сборки. В этом случае project references применяются только для проверки типов, а сборку выполняет бандлер.

Типичная связка: `tsc` для проверки типов + Vite для сборки:

```json
{
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "build": "vite build",
    "build:all": "npm run typecheck && npm run build"
  }
}
```

При таком подходе можно убрать `composite: true` из конфигов — он нужен только для `tsc --build`. Для чистой проверки типов достаточно обычных `tsconfig.json` с полем `references`.

## Распространённые ошибки

### Циклические зависимости

TypeScript запрещает циклические зависимости между проектами. Если `shared` зависит от `server`, а `server` зависит от `shared`, компилятор выдаст ошибку:

```
error TS6202: Project references may not form a circular graph.
```

Решение — вынести общую логику в третий пакет без зависимостей.

### Отсутствие composite в зависимости

Если подпроект объявлен в `references`, но не имеет `composite: true`, TypeScript выдаст:

```
error TS6306: Referenced project must have setting
"composite": true.
```

Добавьте `"composite": true` в `compilerOptions` зависимого проекта.

### Устаревшие декларации после изменений

При изменении типа в `shared` необходимо пересобрать пакет командой `tsc --build`, чтобы обновить `.d.ts` файлы. До пересборки `server` и `client` будут использовать старые декларации. Опция `declarationMap: true` помогает IDE показывать исходный `.ts`-код, но не решает проблему устаревших типов без пересборки.

## Итог

TypeScript project references — правильный инструмент для организации больших TypeScript-проектов и монорепозиториев. Ключевые шаги для настройки:

1. Добавить `composite: true`, `declaration: true` и `declarationMap: true` в каждый подпроект
2. Объявить зависимости между подпроектами через поле `references`
3. Создать корневой `tsconfig.json` с `"files": []` и списком всех подпроектов
4. Использовать `tsc --build` вместо обычного `tsc` для сборки

Сочетание project references с npm workspaces и инкрементальной сборкой позволяет масштабировать TypeScript-проект без потери скорости компиляции и удобства навигации в IDE.

Для глубокого изучения TypeScript, включая настройку проектов и работу с типами, рекомендуем курс [TypeScript от PurpleSchool](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-project-references).

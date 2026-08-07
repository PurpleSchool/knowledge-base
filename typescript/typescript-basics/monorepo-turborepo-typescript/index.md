---
metaTitle: "Monorepo с Turborepo и TypeScript — настройка и примеры"
metaDescription: "Как организовать monorepo с Turborepo и TypeScript: общие пакеты, настройка tsconfig, кэширование сборки и пайплайны задач."
author: "Антон Ларичев"
title: "Monorepo с Turborepo и TypeScript"
preview: "Разбираем, как настроить monorepo с Turborepo и TypeScript: от структуры проекта до общих пакетов и быстрой сборки с кэшированием."
---

## Что такое monorepo и зачем нужен Turborepo

Monorepo — это подход к организации кода, при котором несколько приложений и библиотек хранятся в одном репозитории. Вместо десятков отдельных репозиториев с независимыми зависимостями вы получаете единое пространство, где приложения могут переиспользовать общий код напрямую, без публикации в npm.

Преимущества monorepo:

- Единая версия зависимостей — не нужно синхронизировать версии одной библиотеки между репозиториями
- Атомарные изменения — один коммит меняет и пакет, и все приложения, которые его используют
- Переиспользование кода без публикации в npm — общие утилиты, типы, UI-компоненты
- Упрощённый рефакторинг — TypeScript видит все пакеты в одном проекте

Но у monorepo есть слабое место — производительность. Когда репозиторий растёт, запуск `tsc`, линтера или тестов для всего репозитория становится медленным. Именно здесь помогает Turborepo.

Turborepo — инструмент для orchestration задач в monorepo. Он понимает граф зависимостей между пакетами и запускает задачи параллельно там, где это возможно, а результаты кэширует локально и в облаке. Пересборка пакета происходит только если изменились его файлы или зависимости.

## Создание структуры проекта

Инициализируем новый monorepo с помощью официального шаблона:

```bash
npx create-turbo@latest my-monorepo
cd my-monorepo
```

Или настраиваем вручную:

```bash
mkdir my-monorepo && cd my-monorepo
npm init -y
```

Устанавливаем Turborepo как dev-зависимость в корень:

```bash
npm install turbo --save-dev
```

Структура типичного monorepo с Turborepo:

```
my-monorepo/
├── apps/
│   ├── web/          # Next.js приложение
│   └── api/          # Express или Fastify сервер
├── packages/
│   ├── ui/           # Общие UI-компоненты
│   ├── config/       # Общие конфиги (tsconfig, eslint)
│   └── shared/       # Общие утилиты и типы
├── turbo.json
├── package.json
└── tsconfig.json
```

Настраиваем workspaces в корневом `package.json`:

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.0.0"
  },
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "type-check": "turbo type-check"
  }
}
```

## Настройка TypeScript в monorepo

Ключевой принцип — один базовый `tsconfig.json` в корне, который наследуют все пакеты. Это гарантирует единые настройки компилятора.

Корневой `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

Лучшая практика — вынести tsconfig-пресеты в отдельный пакет `packages/config`.

Создаём `packages/config/tsconfig.base.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

Для Node.js пакетов — `packages/config/tsconfig.node.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "dist"
  }
}
```

Для React/браузерных пакетов — `packages/config/tsconfig.react.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "esnext",
    "moduleResolution": "bundler"
  }
}
```

`packages/config/package.json`:

```json
{
  "name": "@my-monorepo/config",
  "version": "0.0.1",
  "private": true,
  "exports": {
    "./tsconfig.base.json": "./tsconfig.base.json",
    "./tsconfig.node.json": "./tsconfig.node.json",
    "./tsconfig.react.json": "./tsconfig.react.json"
  }
}
```

## Создание общего пакета

Создадим пакет `packages/shared` с общими типами и утилитами, которые будут использоваться в нескольких приложениях.

`packages/shared/package.json`:

```json
{
  "name": "@my-monorepo/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "@my-monorepo/config": "*",
    "typescript": "*"
  }
}
```

`packages/shared/tsconfig.json`:

```json
{
  "extends": "@my-monorepo/config/tsconfig.node.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

`packages/shared/src/index.ts` — точка входа пакета:

```typescript
export * from './types';
export * from './utils';
```

`packages/shared/src/types.ts`:

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  error: string | null;
  timestamp: number;
}

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  total: number;
  page: number;
  limit: number;
}>;
```

`packages/shared/src/utils.ts`:

```typescript
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function createApiResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    error: null,
    timestamp: Date.now(),
  };
}
```

## Использование общего пакета в приложении

Подключаем `@my-monorepo/shared` к приложению `apps/api`.

`apps/api/package.json`:

```json
{
  "name": "@my-monorepo/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@my-monorepo/shared": "*"
  },
  "devDependencies": {
    "@my-monorepo/config": "*",
    "typescript": "*",
    "ts-node": "^10.0.0"
  }
}
```

Знак `"*"` в версии означает «любая версия из workspace» — npm/pnpm/yarn подставят локальный пакет вместо загрузки из npm.

`apps/api/tsconfig.json`:

```json
{
  "extends": "@my-monorepo/config/tsconfig.node.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

`apps/api/src/index.ts`:

```typescript
import { User, ApiResponse, createApiResponse, isValidEmail } from '@my-monorepo/shared';

const users: User[] = [
  {
    id: '1',
    email: 'user@example.com',
    name: 'Иван Иванов',
    createdAt: new Date('2024-01-01'),
  },
];

function getUserById(id: string): ApiResponse<User | null> {
  const user = users.find((u) => u.id === id) ?? null;
  return createApiResponse(user);
}

function createUser(email: string, name: string): ApiResponse<User> | ApiResponse<null> {
  if (!isValidEmail(email)) {
    return { data: null, error: 'Некорректный email', timestamp: Date.now() };
  }

  const user: User = {
    id: String(users.length + 1),
    email,
    name,
    createdAt: new Date(),
  };

  users.push(user);
  return createApiResponse(user);
}

console.log(getUserById('1'));
console.log(createUser('new@example.com', 'Пётр Петров'));
```

TypeScript в `apps/api` полностью видит типы из `packages/shared` — автодополнение, проверка типов и навигация работают как в одном проекте.

## Конфигурация Turborepo

Файл `turbo.json` — главный конфигурационный файл, описывающий задачи и их зависимости.

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "persistent": true,
      "cache": false
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

Понимание ключевых полей:

- `dependsOn: ["^build"]` — символ `^` означает «сначала выполни `build` во всех зависимостях этого пакета». Если `apps/api` зависит от `packages/shared`, то `shared` соберётся первым.
- `outputs` — файлы и папки, которые Turborepo кэширует. При следующем запуске, если входные файлы не изменились, Turborepo восстановит выходные файлы из кэша мгновенно.
- `persistent: true` — для задач вроде `dev`, которые не завершаются.
- `cache: false` — отключает кэш для задач, результат которых не нужно сохранять.

## Кэширование и ускорение сборки

Кэширование — главная фича Turborepo. Turbo вычисляет хэш входных данных для каждого пакета:

- Исходные файлы пакета
- Зависимости пакета и их версии
- Переменные окружения, указанные в конфиге
- Версия Node.js

Если хэш совпадает с предыдущим запуском, Turborepo восстанавливает вывод из кэша:

```bash
$ turbo build

• Packages in scope: @my-monorepo/shared, @my-monorepo/api, @my-monorepo/web
• Running build in 3 packages

@my-monorepo/shared:build: cache hit, replaying output 3ms
@my-monorepo/api:build: cache miss, executing
@my-monorepo/web:build: cache miss, executing
```

Для настройки Remote Cache (общий кэш для всей команды):

```bash
npx turbo login
npx turbo link
```

После этого кэш синхронизируется с Vercel Remote Cache — каждый разработчик и CI-сервер получат доступ к закэшированным артефактам.

Добавить переменные окружения в хэш кэша можно в `turbo.json`:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "env": ["NODE_ENV", "API_URL"]
    }
  }
}
```

## Project References в TypeScript

Для больших monorepo имеет смысл использовать TypeScript Project References. Они позволяют TypeScript компилировать только изменившиеся пакеты, не перекомпилируя весь граф.

Обновляем `packages/shared/tsconfig.json`:

```json
{
  "extends": "@my-monorepo/config/tsconfig.node.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true
  },
  "include": ["src"]
}
```

Обновляем `apps/api/tsconfig.json` с указанием references:

```json
{
  "extends": "@my-monorepo/config/tsconfig.node.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src"],
  "references": [
    { "path": "../../packages/shared" }
  ]
}
```

Теперь `tsc --build` сам определит порядок компиляции по графу зависимостей.

## Запуск команд

Запуск задачи для всего monorepo:

```bash
turbo build
turbo type-check
turbo lint
```

Запуск только для конкретного пакета:

```bash
turbo build --filter=@my-monorepo/api
```

Запуск для пакета и всех его зависимостей:

```bash
turbo build --filter=@my-monorepo/api...
```

Запуск для изменившихся с момента ветки `main` пакетов:

```bash
turbo build --filter=[main...HEAD]
```

Последний вариант особенно удобен в CI — пересобираются только затронутые пакеты, что значительно ускоряет пайплайн.

## Практический пример: добавление UI-пакета

Добавим `packages/ui` с компонентом-кнопкой для React-приложений.

`packages/ui/package.json`:

```json
{
  "name": "@my-monorepo/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  },
  "devDependencies": {
    "@my-monorepo/config": "*",
    "@types/react": "^18.0.0",
    "typescript": "*"
  }
}
```

`packages/ui/tsconfig.json`:

```json
{
  "extends": "@my-monorepo/config/tsconfig.react.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": true
  },
  "include": ["src"]
}
```

`packages/ui/src/Button.tsx`:

```typescript
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const sizeClasses = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
} as const;

const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
} as const;

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`rounded font-medium transition-colors ${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      {loading ? 'Загрузка...' : children}
    </button>
  );
}
```

`packages/ui/src/index.ts`:

```typescript
export { Button } from './Button';
export type { };
```

В `apps/web` подключаем компонент:

```typescript
import { Button } from '@my-monorepo/ui';
import { User } from '@my-monorepo/shared';

function UserCard({ user }: { user: User }) {
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <Button variant="primary" onClick={() => console.log(user.id)}>
        Открыть профиль
      </Button>
    </div>
  );
}
```

## Итог

Turborepo с TypeScript даёт monorepo серьёзное преимущество: параллельное выполнение задач, кэширование результатов и единая система типов через весь граф зависимостей. Общие пакеты обновляются атомарно — изменение типа в `packages/shared` сразу же проверяется TypeScript во всех приложениях, использующих этот пакет.

Ключевые шаги при организации monorepo с Turborepo:

- Базовый `tsconfig.json` в отдельном пакете `packages/config`
- Все пакеты наследуют конфиг через `extends`
- В `turbo.json` прописаны зависимости задач через `dependsOn: ["^build"]`
- Поле `outputs` включает только финальные артефакты сборки
- Для CI используется `--filter=[main...HEAD]` для пересборки только изменившихся пакетов

Чтобы глубоко освоить TypeScript и применять его в реальных проектах, включая монорепозитории и сложные типы, смотрите курс на PurpleSchool: https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=turborepo-typescript

---
metaTitle: "TypeScript path aliases: настройка tsconfig paths"
metaDescription: "Как настроить path aliases в TypeScript через tsconfig paths, избавиться от длинных относительных импортов и интегрировать алиасы с Vite, webpack и Jest."
author: "Антон Ларичев"
title: "TypeScript path aliases — настройка tsconfig paths"
preview: "Настраиваем path aliases в TypeScript: конфигурация tsconfig paths, интеграция с Vite, webpack и Jest, типичные ошибки и способы их исправления."
---

## Что такое path aliases и зачем они нужны

По мере роста проекта импорты превращаются в длинные цепочки относительных путей:

```typescript
import { UserService } from '../../../services/user/UserService';
import { formatDate } from '../../../../utils/date/formatDate';
import { API_URL } from '../../../constants/api';
```

Такой код трудно читать и поддерживать: при перемещении файла все относительные пути приходится пересчитывать вручную. Path aliases решают эту проблему, позволяя писать импорты через короткие псевдонимы:

```typescript
import { UserService } from '@services/UserService';
import { formatDate } from '@utils/date/formatDate';
import { API_URL } from '@constants/api';
```

Path aliases настраиваются в `tsconfig.json` через опцию `paths` и при правильной интеграции с бандлером работают как в TypeScript-компиляторе, так и во время выполнения.

## Базовая настройка в tsconfig.json

Для работы path aliases необходимы две опции: `baseUrl` и `paths`. Опция `baseUrl` задаёт корневую директорию, относительно которой разрешаются пути. Опция `paths` определяет сами алиасы.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@services/*": ["./src/services/*"],
      "@utils/*": ["./src/utils/*"],
      "@constants/*": ["./src/constants/*"],
      "@types/*": ["./src/types/*"]
    }
  }
}
```

Значения в `paths` — это массивы, что позволяет указывать несколько вариантов резолвинга для одного алиаса. TypeScript будет перебирать их по порядку.

### Структура проекта

Предположим, что проект организован следующим образом:

```
project/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   └── Button.tsx
│   │   └── Modal/
│   │       └── Modal.tsx
│   ├── services/
│   │   └── UserService.ts
│   ├── utils/
│   │   └── formatDate.ts
│   ├── constants/
│   │   └── api.ts
│   └── types/
│       └── User.ts
├── tsconfig.json
└── package.json
```

С конфигурацией выше алиас `@components/Button/Button` разрешится в `./src/components/Button/Button`.

## Примеры использования

### Импорт компонентов

До применения алиасов компонент, находящийся глубоко в иерархии, импортировался бы так:

```typescript
// src/pages/dashboard/widgets/StatsWidget.tsx
import { Button } from '../../../components/Button/Button';
import { Modal } from '../../../components/Modal/Modal';
import { UserService } from '../../../services/UserService';
```

После настройки алиасов:

```typescript
// src/pages/dashboard/widgets/StatsWidget.tsx
import { Button } from '@components/Button/Button';
import { Modal } from '@components/Modal/Modal';
import { UserService } from '@services/UserService';
```

### Импорт типов

Алиасы работают и для импорта типов:

```typescript
import type { User, UserRole } from '@types/User';

function getUserRole(user: User): UserRole {
  return user.role;
}
```

### Абсолютный алиас для всего src

Очень распространённый паттерн — единственный алиас `@/*`, который указывает на всю директорию `src`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Это даёт максимальную гибкость, так как структуру папок внутри `src` можно менять без изменения конфигурации алиасов:

```typescript
import { Button } from '@/components/Button/Button';
import { UserService } from '@/services/UserService';
import { formatDate } from '@/utils/formatDate';
```

## Важное ограничение: TypeScript не преобразует пути при компиляции

Это ключевой момент, который многие упускают. TypeScript использует `paths` только для **проверки типов** и **автодополнения в редакторе**. При компиляции в JavaScript алиасы не заменяются реальными путями.

Если скомпилировать файл:

```typescript
import { UserService } from '@services/UserService';
```

...то в выходном `.js` файле будет то же самое:

```javascript
import { UserService } from '@services/UserService';
```

Node.js или браузер не знают, что такое `@services`, и выдадут ошибку. Поэтому настройка алиасов в `tsconfig.json` — это только половина работы. Вторая половина — настройка бандлера или среды выполнения.

## Интеграция с Vite

Vite использует Rollup под капотом и требует отдельной настройки алиасов в `vite.config.ts`:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
});
```

Чтобы не дублировать алиасы в двух файлах, можно использовать пакет `vite-tsconfig-paths`:

```bash
npm install -D vite-tsconfig-paths
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
});
```

Теперь Vite будет автоматически читать `paths` из `tsconfig.json`.

## Интеграция с webpack

Для webpack алиасы настраиваются в `webpack.config.js` через поле `resolve.alias`:

```javascript
// webpack.config.js
const path = require('path');

module.exports = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
};
```

Аналогично Vite, можно использовать пакет `tsconfig-paths-webpack-plugin` для автоматического чтения из `tsconfig.json`:

```bash
npm install -D tsconfig-paths-webpack-plugin
```

```javascript
// webpack.config.js
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  resolve: {
    plugins: [new TsconfigPathsPlugin()],
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
};
```

## Интеграция с Jest

Jest запускает тесты напрямую через Node.js и тоже не понимает алиасы без дополнительной настройки. В `jest.config.js` нужно добавить поле `moduleNameMapper`:

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
  },
};
```

Альтернатива — пакет `ts-jest` в сочетании с `pathsToModuleNameMapper` для автоматического преобразования:

```javascript
// jest.config.js
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
};
```

## Интеграция с Node.js без бандлера

Если TypeScript компилируется через `tsc` и код запускается напрямую в Node.js, нужен пакет `tsconfig-paths`:

```bash
npm install -D tsconfig-paths
```

Добавьте его в команду запуска через флаг `-r`:

```json
{
  "scripts": {
    "start": "node -r tsconfig-paths/register dist/index.js",
    "dev": "ts-node -r tsconfig-paths/register src/index.ts"
  }
}
```

Либо используйте `tsx`, который поддерживает алиасы из коробки при наличии `tsconfig.json`:

```bash
npm install -D tsx
```

```json
{
  "scripts": {
    "dev": "tsx src/index.ts"
  }
}
```

## Несколько tsconfig файлов

В проектах часто используют несколько конфигурационных файлов для разных контекстов. Алиасы нужно определить в базовом файле и расширять при необходимости:

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

```json
// tsconfig.json — для редактора и проверки типов
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext"
  },
  "include": ["src"]
}
```

```json
// tsconfig.build.json — для компиляции
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declaration": true
  },
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}
```

## Типичные ошибки и способы их исправления

### Ошибка: Cannot find module '@services/UserService'

Эта ошибка во время выполнения означает, что бандлер или среда выполнения не знает об алиасе. Проверьте:

1. Настроены ли алиасы в конфигурации бандлера (Vite, webpack).
2. Установлен ли `tsconfig-paths` для Node.js.
3. Совпадают ли паттерны в `tsconfig.json` и конфигурации бандлера.

### Ошибка: Cannot find module '@services/UserService' в TypeScript

Если ошибка появляется в IDE или при `tsc`, проверьте:

1. Указан ли `baseUrl` — без него `paths` не работают.
2. Правильно ли указан путь в `paths` — он должен начинаться с `./`.
3. Указана ли директория в `include` или `files` в `tsconfig.json`.

```json
// Неправильно — путь без ./
{
  "paths": {
    "@services/*": ["src/services/*"]
  }
}

// Правильно
{
  "paths": {
    "@services/*": ["./src/services/*"]
  }
}
```

### Алиасы не работают в монорепозитории

В монорепозитории каждый пакет имеет свой `tsconfig.json`. Убедитесь, что `baseUrl` в каждом файле указывает на корень именно этого пакета, а не на корень всего монорепозитория:

```json
// packages/api/tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Соглашения об именовании алиасов

Существует два распространённых подхода к именованию:

**Подход с символом `@`** — наиболее популярный, используется в большинстве современных проектов:

```json
"paths": {
  "@/*": ["./src/*"]
}
```

**Подход с `~`** — альтернатива, часто встречается в проектах на Vue:

```json
"paths": {
  "~/*": ["./src/*"]
}
```

Оба подхода равнозначны технически. Выбор зависит от соглашений команды. Символ `@` предпочтителен, так как он стал де-факто стандартом в экосистеме TypeScript и поддерживается большинством IDE без дополнительной настройки.

Важно избегать использования алиаса `@имя`, совпадающего с именем пакета из npm. Например, если использовать `@utils`, это не создаст конфликт, так как такого пакета в `node_modules` нет. Но если в проекте есть зависимость `@company/utils`, то создавать алиас `@company/utils` нельзя — это нарушит импорт пакета.

## Проверка корректности настройки

Для проверки того, что TypeScript правильно резолвит алиасы, можно использовать флаг `--traceResolution`:

```bash
npx tsc --traceResolution 2>&1 | grep "@services"
```

Вывод покажет, как компилятор разрешает каждый алиасный импорт:

```
======== Resolving module '@services/UserService' from 'src/pages/Dashboard.ts'. ========
ModuleResolution: Bundler
'paths' option is specified, looking for a pattern to match module name '@services/UserService'.
Module name '@services/UserService', matched pattern '@services/*'.
Trying substitution './src/services/*', candidate module location: 'src/services/UserService'.
File 'src/services/UserService.ts' exists - use it.
```

На курсе по TypeScript на PurpleSchool вы найдёте подробный разбор модульной системы TypeScript, настройки tsconfig и работы с современными инструментами сборки — [TypeScript с нуля до профессионала](https://purpleschool.ru/course/typescript?utm_source=knowledgebase&utm_medium=text&utm_campaign=typescript-path-aliases).
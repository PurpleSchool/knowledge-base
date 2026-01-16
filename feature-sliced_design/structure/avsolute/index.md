---
metaTitle: Правило absolute-imports в JavaScript и TypeScript
metaDescription: Разбираем правило absolute-imports - как настраивать абсолютные импорты в фронтенд и Node.js проектах и избавляться от относительных путей вида ../../
author: Олег Марков
title: Правило абсолютных импортов - absolute-imports в современных проектах
preview: Узнайте как включить и настроить absolute-imports в React Next.js TypeScript и Node.js чтобы писать короткие и понятные пути импортов вместо длинных относительных
---

## Введение

В современных JavaScript и TypeScript проектах довольно быстро появляется проблема "лесенки" из относительных импортов. Вы, скорее всего, уже видели такое:

```ts
import Button from '../../../../components/ui/Button'
import { formatPrice } from '../../../utils/formatters'
```

Чем больше растет проект, тем сложнее понимать, откуда реально импортируются модули. Любое перемещение файла может легко сломать половину импортов.

Правило абсолютных импортов (часто называют просто absolute-imports) — это подход к организации импортов, при котором вы указываете путь к модулю не относительно текущего файла, а относительно некоторой корневой директории проекта или заранее определенных алиасов. В результате импорты становятся короче и стабильнее при рефакторинге.

Смотрите, я покажу вам, как это выглядит в более удобном виде:

```ts
import Button from 'components/ui/Button'
import { formatPrice } from 'utils/formatters'
```

В этой статье мы разберем:

- что такое абсолютные импорты и чем они отличаются от относительных;
- какие есть варианты настройки в TypeScript, Webpack, Next.js, Vite, Create React App, Node.js;
- как использовать алиасы путей (например, `@/components`);
- как согласовать конфигурации TypeScript, бандлера и ESLint;
- какие типичные ошибки и подводные камни возникают, и как их избежать.

## Что такое абсолютные импорты

### Относительные vs абсолютные импорты

Начнем с базового сравнения.

**Относительные импорты**:

```ts
// Файл src/pages/shop/ProductPage.tsx
import ProductCard from '../../components/ProductCard'
import { fetchProduct } from '../../api/products'
```

Здесь:

- путь отсчитывается от текущей директории файла;
- при переносе файла в другую директорию путь ломается;
- по количеству `../` трудно понять, где реально лежит модуль.

**Абсолютные импорты**:

```ts
// Тот же файл
import ProductCard from 'components/ProductCard'
import { fetchProduct } from 'api/products'
```

Здесь:

- путь идет от выбранной "корневой" точки (например, `src`);
- перенос файла внутри `src` не ломает импортов;
- путь легче читать — видно, что модуль лежит в папке `components`.

### Абсолютные импорты и алиасы

Абсолютный импорт может быть просто от корня проекта:

```ts
import { log } from 'src/logger'
```

Но на практике чаще используют **алиасы**:

```ts
import { log } from '@/logger'
import ProductCard from '@components/ProductCard'
import { fetchUser } from '@api/user'
```

Здесь `@`, `@components`, `@api` — это "ярлыки", которые указывают на конкретные директории в проекте. Они настраиваются в сборщике (Webpack, Vite и т. п.) и/или в TypeScript.

Теперь давайте посмотрим, как это реализовать в разных стэках.

## Абсолютные импорты в TypeScript

TypeScript дает два ключевых механизма для absolute-imports:

- `baseUrl` — "корневая" папка, от которой разрешаются импорты;
- `paths` — набор алиасов, которые указывают на конкретные директории.

### Настройка baseUrl

Если вы хотите писать импорты относительно папки `src`, можно настроить `baseUrl`.

Структура проекта:

```text
project/
  src/
    api/
      products.ts
    components/
      ProductCard.tsx
    pages/
      ProductPage.tsx
  tsconfig.json
```

Теперь настраиваем `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    // Указываем корень для модулей
    "baseUrl": "src",
    "module": "ESNext",
    "target": "ESNext",
    "moduleResolution": "Node"
  }
}
```

Теперь вы можете импортировать так:

```ts
// src/pages/ProductPage.tsx

// Импорт из src/api/products.ts
import { fetchProduct } from 'api/products'

// Импорт из src/components/ProductCard.tsx
import ProductCard from 'components/ProductCard'
```

Комментарии к конфигурации:

- `baseUrl: "src"` — говорит компилятору TypeScript считать `src` корнем модулей;
- относительные пути по-прежнему работают, но больше не нужны для модулей внутри `src`.

### Настройка paths (алиасы)

Если вы хотите более "говорящие" алиасы, например `@components`, `@api`, используйте `paths`.

Давайте разберемся на примере. Дополняем `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@components/*": ["components/*"],  // Алиас для src/components
      "@api/*": ["api/*"],                // Алиас для src/api
      "@utils/*": ["utils/*"]             // Алиас для src/utils
    }
  }
}
```

Теперь вы увидите, как это выглядит в коде:

```ts
// src/pages/ProductPage.tsx

// Импорт компонента карточки товара
import ProductCard from '@components/ProductCard'

// Импорт функций для работы с API
import { fetchProduct } from '@api/products'

// Импорт утилиты
import { formatPrice } from '@utils/formatPrice'
```

Комментарии:

- `@components/*` — маска. Все, что после `@components/`, будет подменяться на `components/` внутри `src`;
- `["components/*"]` — относительный путь **относительно `baseUrl`**, а не относительно `tsconfig.json`;
- алиасы работают и для `.ts`, и для `.tsx` (и `.js`, если включить `allowJs`).

### Несколько tsconfig файлов

В реальных проектах часто есть `tsconfig.json` и, например, `tsconfig.build.json` или `tsconfig.app.json`. Важно, чтобы настройки `baseUrl` и `paths` были согласованы.

Обычная схема:

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@components/*": ["components/*"],
      "@api/*": ["api/*"]
    }
  }
}
```

```jsonc
// tsconfig.json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "target": "ESNext"
  },
  "include": ["src"]
}
```

Так вы избегаете дублирования конфигурации.

## Абсолютные импорты в Webpack

TypeScript-конфигурации недостаточно для корректной работы проекта. Бандлер тоже должен понимать алиасы.

### Простая настройка с baseUrl

Если вы не используете алиасы, а только `baseUrl`, можно указать Webpack, где искать модули:

```js
// webpack.config.js

const path = require('path')

module.exports = {
  // ...
  resolve: {
    // Здесь мы указываем, где искать модули
    modules: [
      path.resolve(__dirname, 'src'), // сначала ищем в src
      'node_modules'                  // затем в node_modules
    ],
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  }
}
```

Теперь `import 'components/Button'` будет работать, даже если TypeScript не используется.

### Настройка алиасов

Теперь давайте посмотрим на настройку с алиасами. Здесь я размещаю пример, чтобы вам было проще понять:

```js
// webpack.config.js

const path = require('path')

module.exports = {
  // ...
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@api': path.resolve(__dirname, 'src/api'),
      '@utils': path.resolve(__dirname, 'src/utils')
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  }
}
```

Теперь в коде:

```ts
import Button from '@components/Button'
import { fetchUser } from '@api/user'
```

Обратите внимание:

- пути в алиасах должны совпадать с тем, что вы указали в `tsconfig.json`, иначе IDE и сборка будут "видеть" разные вещи;
- лучше вынести алиасы в отдельный объект и переиспользовать его в разных конфигурациях (например, для Webpack и Jest).

## Абсолютные импорты в Vite

Vite тоже поддерживает алиасы путей, и его настройка довольно проста.

Пример `vite.config.ts`:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@api': path.resolve(__dirname, 'src/api')
    }
  }
})
```

Теперь давайте разберемся на примере использования:

```tsx
// src/pages/HomePage.tsx
import Header from '@components/Header'
import { fetchProducts } from '@api/products'
import Layout from '@/layout/Layout'
// Здесь @ указывает прямо на src
```

Если вы используете TypeScript, не забудьте синхронизировать `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "@components/*": ["components/*"],
      "@api/*": ["api/*"]
    }
  }
}
```

## Абсолютные импорты в Next.js

Next.js из коробки поддерживает absolute-imports и алиасы через `jsconfig.json` или `tsconfig.json`.

### Абсолютные импорты относительно `src`

Если у вас структура:

```text
project/
  src/
    components/
    pages/
    lib/
  tsconfig.json
```

Настройка:

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@components/*": ["components/*"],
      "@lib/*": ["lib/*"]
    }
  }
}
```

Теперь:

```tsx
// src/pages/index.tsx

import Header from '@components/Header'
import { getFeaturedPosts } from '@lib/posts'
```

Next.js сам подхватит эти настройки как для сборки, так и для IDE.

### Абсолютные импорты без `src`

Если вы храните код прямо в корне (`pages`, `components` рядом с `tsconfig.json`), можно сделать так:

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@components/*": ["components/*"],
      "@lib/*": ["lib/*"]
    }
  }
}
```

Смотрите, здесь важно:

- `baseUrl: "."` означает корень проекта;
- `paths` указывают на папки относительно корня.

## Абсолютные импорты в Create React App

Если вы используете классический Create React App (CRA), есть два пути:

1. `NODE_PATH` (старый способ, устарел и не рекомендуется в новых версиях CRA);
2. `jsconfig.json` / `tsconfig.json` (рекомендуемый способ).

### Настройка через jsconfig/tsconfig

Структура проекта:

```text
src/
  components/
  pages/
  utils/
tsconfig.json
```

Пример `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@components/*": ["components/*"],
      "@pages/*": ["pages/*"],
      "@utils/*": ["utils/*"]
    }
  }
}
```

Теперь можно писать:

```tsx
import HomePage from '@pages/HomePage'
import { formatDate } from '@utils/date'
```

Важно: дополнительные настройки Webpack вручную не нужны — CRA подтянет их автоматически из `tsconfig.json` или `jsconfig.json`.

## Абсолютные импорты в Node.js

В Node.js ситуация немного отличается, потому что среда выполнения тоже должна понимать алиасы, а не только сборщик.

Смотрите, есть несколько подходов:

- использование loader-алиасов (например, `module-alias`);
- использование `NODE_OPTIONS` с экспериментальными фичами;
- для TypeScript — использование `ts-node` и утилит, которые умеют читать `tsconfig.paths`.

### Вариант с module-alias

Давайте посмотрим, как это реализовано на практике.

1. Устанавливаем пакет:

```bash
npm install module-alias --save
```

2. Настраиваем алиасы в `package.json`:

```json
{
  "_moduleAliases": {
    "@root": ".",
    "@models": "src/models",
    "@services": "src/services"
  }
}
```

3. Подключаем `module-alias` при старте приложения:

```js
// index.js
require('module-alias/register')

// Теперь можно использовать алиасы
const User = require('@models/User')
const userService = require('@services/userService')
```

Комментарии:

- `module-alias` переписывает пути на лету при выполнении Node.js;
- очень важно, чтобы пути в `package.json` были указаны **относительно корня проекта**.

### Согласование с TypeScript

Если вы используете TypeScript в Node-проекте, дополнительно нужно настроить `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@root/*": ["*"],
      "@models/*": ["src/models/*"],
      "@services/*": ["src/services/*"]
    }
  }
}
```

И затем либо:

- использовать сборку через `tsc` + запуск с Node.js и `module-alias`;  
- либо использовать `ts-node` с плагином `tsconfig-paths` (поддержка алиасов из `tsconfig`):

```bash
npm install ts-node tsconfig-paths --save-dev
```

Старт через CLI:

```bash
node -r ts-node/register -r tsconfig-paths/register src/index.ts
```

Комментарии в терминах процесса:

- `ts-node/register` — позволяет выполнять TypeScript-файлы прямо в Node.js;
- `tsconfig-paths/register` — добавляет поддержку `baseUrl` и `paths` из `tsconfig.json`.

## Абсолютные импорты и ESLint

ESLint анализирует импорты и тоже должен понимать алиасы. Иначе вы можете увидеть ошибки вроде "Unable to resolve path to module '@components/Button'".

### Настройка eslint-plugin-import

Наиболее распространенный случай — использование `eslint-plugin-import` и `eslint-import-resolver-typescript` или `eslint-import-resolver-alias`.

#### Вариант 1 - через TypeScript

Устанавливаем:

```bash
npm install -D eslint-plugin-import eslint-import-resolver-typescript
```

Настройка `.eslintrc`:

```jsonc
{
  "plugins": ["import"],
  "settings": {
    "import/resolver": {
      "typescript": {
        // Плагин сам прочитает tsconfig.json и paths
        "alwaysTryTypes": true
      }
    }
  }
}
```

Теперь ESLint использует `tsconfig.json` и понимает `@components/*`, `@api/*` и другие алиасы.

#### Вариант 2 - через alias

Если вы не используете TypeScript или хотите задать алиасы отдельно:

```bash
npm install -D eslint-import-resolver-alias
```

Настройка:

```jsonc
{
  "settings": {
    "import/resolver": {
      "alias": {
        "map": [
          ["@components", "./src/components"],
          ["@api", "./src/api"]
        ],
        "extensions": [".js", ".jsx", ".ts", ".tsx"]
      }
    }
  }
}
```

Теперь ESLint будет резолвить импорты по тем же правилам, что и Webpack/Vite.

## Организация структуры проекта под absolute-imports

Абсолютные импорты раскрывают свой полный потенциал, когда структура проекта продумана.

### Типичная структура с src

Давайте посмотрим на пример:

```text
src/
  api/
    index.ts
    user.ts
    products.ts
  components/
    ui/
      Button.tsx
      Input.tsx
    layout/
      Header.tsx
      Footer.tsx
  features/
    auth/
      components/
      hooks/
      services/
    cart/
      components/
      hooks/
      services/
  pages/
    HomePage.tsx
    ProductPage.tsx
  utils/
    date.ts
    format.ts
```

И алиасы:

```jsonc
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@api/*": ["api/*"],
      "@components/*": ["components/*"],
      "@features/*": ["features/*"],
      "@utils/*": ["utils/*"]
    }
  }
}
```

Теперь импорты становятся логичными:

```ts
import { fetchUser } from '@api/user'
import Button from '@components/ui/Button'
import { formatDate } from '@utils/date'
import { useAuth } from '@features/auth/hooks/useAuth'
```

### Когда не стоит злоупотреблять алиасами

Абсолютные импорты удобны, но они могут запутать структуру, если:

- у вас слишком много алиасов (например, по одному на каждую поддиректорию);
- алиасы пересекаются или дублируют друг друга;
- названия слишком абстрактные (`@lib`, `@common`, `@core`) без четкой договоренности в команде.

Рекомендация:

- использовать несколько "главных" алиасов: `@components`, `@features`, `@api`, `@utils`, `@shared`;
- избегать алиасов для очень мелких папок (`@hooks`, `@types` внутри каждой фичи);
- поддерживать соглашение по именованию и не менять его от проекта к проекту без необходимости.

## Типичные проблемы и их решение

Теперь давайте посмотрим, что чаще всего ломается при настройке absolute-imports, и как это починить.

### Проблема - TypeScript видит алиасы, а Webpack нет

Симптом:

- В IDE ошибок нет — переход по импортам работает;
- При сборке Webpack выдает `Module not found: Error: Can't resolve '@components/Button'`.

Причина:

- алиасы настроены только в `tsconfig.json`;
- Webpack не знает о них.

Решение:

1. Синхронизировать `webpack.config.js` с `tsconfig.json`;
2. Добавить секцию `resolve.alias` в Webpack, как мы делали выше.

Пример:

```js
// webpack.config.js
const path = require('path')

module.exports = {
  // ...
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@api': path.resolve(__dirname, 'src/api')
    }
  }
}
```

### Проблема - ESLint ругается на алиасы

Симптом:

- `TS` и сборка работают;
- ESLint выдает "Unable to resolve path to module".

Причина:

- `eslint-plugin-import` не знает, как резолвить алиасы.

Решение:

- подключить `eslint-import-resolver-typescript` или `eslint-import-resolver-alias` и настроить `settings.import/resolver`.

Мы уже смотрели, как это сделать. Главное — не забыть поставить зависимости и перезапустить ESLint, если он работает в watch-режиме.

### Проблема - Jest не понимает алиасы

Если вы тестируете код через Jest, он тоже должен понимать алиасы.

Симптом:

- Тесты падают с ошибкой "Cannot find module '@components/Button'".

Решение — добавить `moduleNameMapper`:

```js
// jest.config.js
module.exports = {
  // ...
  moduleNameMapper: {
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  }
}
```

Комментарии:

- синтаксис `^@components/(.*)$` — это регулярное выражение, где `(.*)` — любая часть пути;
- `<rootDir>/src/components/$1` — то, во что подставляется совпавшая часть пути.

### Проблема - Несоответствие путей в разных конфигурациях

Иногда в проекте накапливаются разные конфиги:

- `tsconfig.json`;
- `webpack.config.js` / `vite.config.ts`;
- `.eslintrc`;
- `jest.config.js`.

Если в каждом месте алиасы прописаны по-разному, начинаются трудноуловимые баги: где-то импорт работает, где-то нет.

Хорошая практика:

- вынести карту алиасов в отдельный модуль на JS/TS;
- переиспользовать ее в конфигурациях.

Например:

```js
// paths.js
const path = require('path')

const SRC = path.resolve(__dirname, 'src')

const aliases = {
  '@components': path.join(SRC, 'components'),
  '@api': path.join(SRC, 'api'),
  '@utils': path.join(SRC, 'utils')
}

module.exports = { SRC, aliases }
```

Используем в Webpack:

```js
// webpack.config.js
const { aliases } = require('./paths')

module.exports = {
  // ...
  resolve: {
    alias: aliases
  }
}
```

И в Jest:

```js
// jest.config.js
const { SRC } = require('./paths')

module.exports = {
  moduleNameMapper: {
    '^@components/(.*)$': `${SRC}/components/$1`,
    '^@api/(.*)$': `${SRC}/api/$1`,
    '^@utils/(.*)$': `${SRC}/utils/$1`
  }
}
```

TypeScript все равно нужно настраивать отдельно в `tsconfig.json`, но логика алиасов останется той же.

## Заключение

Абсолютные импорты — это не столько "магия" сборщика, сколько способ ввести в проект четкую, предсказуемую систему ссылок на модули. Вы избавляетесь от длинных относительных путей, снижаете количество ошибок при рефакторинге и улучшаете читаемость кода.

Ключевые моменты, которые важно помнить:

- `baseUrl` и `paths` в TypeScript задают правила для IDE и компилятора, но сами по себе не настраивают бандлер;
- сборщик (Webpack, Vite, Next.js, CRA) и тестовый раннер (Jest) тоже должны знать об алиасах;
- ESLint нужно отдельно научить понимать алиасы через `eslint-import-resolver-*`;
- лучше ограничиться небольшим, понятным набором алиасов, а не создавать по алиасу на каждую папку.

Теперь у вас есть общий набор практик и конфигураций, на которые можно опираться при настройке absolute-imports практически в любом JavaScript/TypeScript-проекте.

## Частозадаваемые технические вопросы

### Как настроить абсолютные импорты только для тестов без изменения основного кода

Иногда вы хотите в тестах использовать короткие пути, но не хотите менять конфигурацию всего проекта. В Jest можно настроить `moduleNameMapper` только для тестов:

```js
// jest.config.js
module.exports = {
  moduleNameMapper: {
    '^@test-utils/(.*)$': '<rootDir>/tests/utils/$1'
  }
}
```

В коде приложения эти алиасы не будут использоваться.

### Как использовать разные алиасы для фронтенда и бэкенда в монорепозитории

В монорепо часто есть `packages/frontend` и `packages/backend`. Удобно завести отдельные `tsconfig.json` в каждом пакете и не смешивать алиасы. Для сборки используйте отдельные конфиги Webpack/Vite для каждого пакета и не делайте глобальные алиасы на корень монорепо, если это не требуется.

### Как включить абсолютные импорты в чистом JavaScript без TypeScript и без сборщика

В "голом" браузерном JavaScript без бандлера абсолютные импорты в привычном виде недоступны. Можно:

- использовать import maps в современных браузерах;
- или подключить простой бандлер (Vite, Parcel), который добавит поддержку алиасов.

Import maps настраиваются в HTML, но их поддержка пока ограничена и чаще используются бандлеры.

### Можно ли использовать относительные и абсолютные импорты одновременно

Да, это нормально. Рекомендуется:

- использовать абсолютные импорты для "глобальных" модулей (компоненты, фичи, утилиты);
- относительные — для локальных модулей внутри одной небольшой области (например, внутри папки конкретной фичи). Главное — сохранять последовательность и договориться в команде, где применять каждый подход.

### Как быстро заменить все относительные импорты на абсолютные в существующем проекте

Алгоритм:

1. Настроить алиасы и убедиться, что сборка и тесты проходят.
2. Использовать возможности IDE: большинство редакторов умеют автоматически пересчитывать импорты при перемещении файлов и поддерживают рефакторинг "Convert to absolute import".
3. При отсутствии таких функций — написать небольшой скрипт на Node.js, который заменит префиксы `../../` на нужные алиасы, но обязательно запускать его поэтапно и каждый шаг проверять через тесты и линтер.
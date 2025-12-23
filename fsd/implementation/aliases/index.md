---
metaTitle: Настройка псевдонимов aliases-config в JavaScript проектах
metaDescription: Подробное руководство по настройке псевдонимов путей с помощью aliases-config - как упростить импорты и сделать архитектуру проекта понятнее
author: Олег Марков
title: Настройка псевдонимов в проекте с помощью aliases-config
preview: Разберитесь как правильно настраивать aliases-config - чтобы использовать удобные псевдонимы путей вместо длинных относительных импортов в вашем проекте
---

## Введение

Настройка псевдонимов (aliases-config) помогает избавиться от длинных относительных путей вида `../../../components/Button` и заменить их на понятные и стабильные конструкции вроде `@components/Button` или `@shared/ui/Button`.

Смотрите, я покажу вам, как это работает на практике. Когда в проекте растет вложенность директорий, относительные импорты начинают мешать:

```ts
// Было
import { Button } from "../../../shared/ui/Button";

// Стало
import { Button } from "@shared/ui/Button";
```

Псевдонимы:

- упрощают навигацию по коду;
- уменьшают количество ошибок при рефакторинге структуры папок;
- делают импорт более "семантическим" — по названию сразу видно слой или модуль.

В этой статье мы разберем, как настраивать aliases-config в типичном стекe: TypeScript / JavaScript, Webpack, Vite, Babel, ESLint, Jest. При этом вы сможете адаптировать те же принципы к любому похожему инструменту сборки.

---

## Что такое aliases-config и зачем он нужен

### Основная идея псевдонимов

Под псевдонимом понимается короткое имя, которое указывает на конкретную директорию или файл в проекте.

Простыми словами:

- **без псевдонима**: вы указываете путь к файлу относительно текущего файла;
- **с псевдонимом**: вы указываете путь относительно логического корня (alias), который однажды привязали к физическому пути.

Например, вы говорите конфигу:

```js
// Псевдоним @shared указывает на src/shared
"@shared/*" -> "src/shared/*"
```

И после этого во всем проекте используете:

```ts
import { Button } from "@shared/ui/Button";
```

### Плюсы использования псевдонимов

Давайте перечислим основные преимущества:

1. **Читаемость**  
   Вы сразу понимаете, к какому уровню архитектуры относится модуль: `@entities`, `@features`, `@widgets`, `@shared` и т.д.

2. **Устойчивость к рефакторингу**  
   Если вы переносите файл на другой уровень вложенности, абсолютные импорты с псевдонимами не ломаются, в отличие от относительных.

3. **Единый контракт для всех инструментов**  
   Когда aliases-config настроен последовательно, TypeScript, Webpack, ESLint, тестовый раннер — все понимают одни и те же пути.

4. **Ускорение навигации в IDE**  
   IDE проще "прыгать" по коду, а вам проще сразу понять, где физически лежит модуль по его псевдониму.

---

## Общие принципы настройки aliases-config

### Концепция "единого источника правды"

Основная проблема при настройке псевдонимов — рассинхронизация:

- TypeScript думает, что `@shared` указывает на одну папку,
- Webpack — на другую,
- Jest — не понимает этот путь вообще.

Хорошая практика — выбрать один главный конфиг (обычно `tsconfig.json` или отдельный `aliases.config.mjs`) и от него "кормить" остальные инструменты.

Чаще всего:

- для TypeScript корневым считается `tsconfig.json`;
- для JavaScript без TypeScript корнем становится файл сборщика (например, `vite.config.ts` или `webpack.config.js`).

### Базовая архитектура alias-ов

Разберем типичный пример структуры проекта:

```
project/
  src/
    app/
    pages/
    widgets/
    features/
    entities/
    shared/
  tsconfig.json
  webpack.config.js
  jest.config.cjs
  .eslintrc.cjs
```

Здесь удобно завести такие псевдонимы:

- `@app` → `src/app`
- `@pages` → `src/pages`
- `@widgets` → `src/widgets`
- `@features` → `src/features`
- `@entities` → `src/entities`
- `@shared` → `src/shared`

---

## Настройка aliases-config в TypeScript

### Базовый пример tsconfig.json

Давайте разберемся на примере типового `tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    // Указываем базовую директорию для относительных путей
    "baseUrl": "./src",
    // Описываем псевдонимы
    "paths": {
      "@app/*": ["app/*"],
      "@pages/*": ["pages/*"],
      "@widgets/*": ["widgets/*"],
      "@features/*": ["features/*"],
      "@entities/*": ["entities/*"],
      "@shared/*": ["shared/*"]
    }
  },
  "include": [
    "src"
  ]
}
```

Комментарии к примеру:

- `"baseUrl": "./src"` — теперь все пути в `paths` считаются относительно `src`.
- `"@shared/*": ["shared/*"]` — эта запись говорит компилятору, что импорт `@shared/ui/Button` нужно искать по пути `src/shared/ui/Button`.

Теперь вы увидите, как это выглядит в коде:

```ts
// src/app/index.ts

// Импорт компонента c использованием псевдонима
import { Button } from "@shared/ui/Button";

// Импорт модуля из слоя features
import { LoginForm } from "@features/auth/login-form";
```

### Особенности сборки TypeScript без бандлера

Если вы компилируете TypeScript в JavaScript без Webpack/Vite (например, через `tsc` и запускаете Node.js), простая настройка `paths` недостаточна. TypeScript умеет "понимать" псевдонимы при компиляции типов, но Node.js по умолчанию о них не знает.

Есть два распространенных варианта решения:

1. Преобразовывать алиасы на этапе сборки с помощью Babel / ts-node / ts-node-dev с плагинами;
2. Использовать дополнительный пакет для маппинга alias-ов в рантайме (например, `module-alias`).

Здесь мы не будем углубляться в Node-only конфигурации, но важно помнить: **одного `tsconfig.json` для рантайма недостаточно**.

---

## Настройка псевдонимов в Webpack

### Пример webpack.config.js

Теперь давайте перейдем к настройке сборки. Webpack использует раздел `resolve.alias`:

```js
// webpack.config.js
const path = require("path");

module.exports = {
  // Остальной конфиг опущен для краткости

  resolve: {
    // Расширения, которые будет подставлять Webpack при импорте без указания расширения
    extensions: [".ts", ".tsx", ".js", ".jsx"],

    // Здесь мы задаем псевдонимы
    alias: {
      // Псевдоним @app указывает на папку src/app
      "@app": path.resolve(__dirname, "src/app"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@widgets": path.resolve(__dirname, "src/widgets"),
      "@features": path.resolve(__dirname, "src/features"),
      "@entities": path.resolve(__dirname, "src/entities"),
      "@shared": path.resolve(__dirname, "src/shared")
    }
  }
};
```

Как видите, этот код выполняет ровно ту же задачу, что `paths` в TypeScript, только уже на уровне сборки.

### Синхронизация Webpack с tsconfig.json

Чтобы не дублировать пути руками, многие делают так:

1. Описывают alias-ы в `tsconfig.json`.
2. Подтягивают их в Webpack автоматически через пакет `tsconfig-paths-webpack-plugin`.

Пример:

```js
// webpack.config.js
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    plugins: [
      // Плагин читает tsconfig.json и настраивает alias-ы автоматически
      new TsconfigPathsPlugin({
        configFile: "./tsconfig.json"
      })
    ]
  }
};
```

Комментарии:

- Плагин ищет поле `compilerOptions.paths` и превращает их в alias-ы Webpack.
- Это уменьшает шанс, что вы забудете обновить Webpack после изменения alias-а.

---

## Настройка псевдонимов в Vite

### Простой пример vite.config.ts

В Vite настройка делается через `resolve.alias` (очень похоже на Webpack).

Давайте посмотрим, что происходит в следующем примере:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    // Подключаем плагин React (если используется React)
    react()
  ],
  resolve: {
    alias: {
      // Псевдоним @app -> src/app
      "@app": path.resolve(__dirname, "src/app"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@widgets": path.resolve(__dirname, "src/widgets"),
      "@features": path.resolve(__dirname, "src/features"),
      "@entities": path.resolve(__dirname, "src/entities"),
      "@shared": path.resolve(__dirname, "src/shared")
    }
  }
});
```

Vite также поддерживает использование плагинов для считывания alias-ов из `tsconfig.json`, например `vite-tsconfig-paths`:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    // Плагин автоматически подтягивает alias-ы из tsconfig.json
    tsconfigPaths()
  ]
});
```

В этом случае вам не нужно дублировать конфигурацию: вы один раз настраиваете `paths` в TypeScript, и Vite сам подстраивается под них.

---

## Настройка псевдонимов в Babel

### Использование плагина module-resolver

Если вы используете Babel (например, в старых проектах или вместе с Jest), удобно подключить плагин `babel-plugin-module-resolver`.

Пример конфигурации `.babelrc`:

```jsonc
{
  "presets": [
    "@babel/preset-env",
    "@babel/preset-react",
    "@babel/preset-typescript"
  ],
  "plugins": [
    [
      "module-resolver",
      {
        // Указываем корень проекта
        "root": ["./src"],
        // Описываем alias-ы
        "alias": {
          "@app": "./src/app",
          "@pages": "./src/pages",
          "@widgets": "./src/widgets",
          "@features": "./src/features",
          "@entities": "./src/entities",
          "@shared": "./src/shared"
        }
      }
    ]
  ]
}
```

Обратите внимание, как этот фрагмент кода решает задачу:

- Babel во время трансформации кода заменит импорты вида `@shared/ui/Button` на реальные относительные пути;
- это особенно полезно, если Jest использует Babel для трансформации тестов.

---

## ESLint и псевдонимы

### Проблема "import/no-unresolved"

Частая ситуация: вы настроили alias-ы в TypeScript и Webpack, а ESLint продолжает ругаться на импорты:

```ts
import { Button } from "@shared/ui/Button";
// ESLint: Unable to resolve path to module '@shared/ui/Button'
```

Чтобы исправить это, нужно объяснить ESLint, как резолвить модули. Для этого используется плагин `eslint-import-resolver-typescript` или `eslint-import-resolver-alias`.

### Пример конфигурации c eslint-import-resolver-typescript

Смотрите, я покажу вам, как это работает с TypeScript:

```js
// .eslintrc.cjs
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "import"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript"
  ],
  settings: {
    "import/resolver": {
      // Резолвер для TypeScript
      typescript: {
        // Указываем путь к tsconfig, откуда брать paths
        project: "./tsconfig.json"
      }
    }
  }
};
```

Комментарии:

- Резолвер читает `paths` из `tsconfig.json` и использует их для проверки импортов.
- Важно, чтобы `project` указывал на тот же `tsconfig.json`, где настроены alias-ы.

### Альтернатива: eslint-import-resolver-alias

Если у вас чистый JS-проект без TypeScript, можно использовать `eslint-import-resolver-alias`:

```js
// .eslintrc.cjs
module.exports = {
  settings: {
    "import/resolver": {
      alias: {
        // Описываем псевдонимы
        map: [
          ["@app", "./src/app"],
          ["@pages", "./src/pages"],
          ["@widgets", "./src/widgets"],
          ["@features", "./src/features"],
          ["@entities", "./src/entities"],
          ["@shared", "./src/shared"]
        ],
        // Расширения файлов
        extensions: [".js", ".jsx", ".ts", ".tsx"]
      }
    }
  }
};
```

---

## Настройка alias-ов в Jest

### Проблема с тестами и псевдонимами

При запуске тестов через Jest импорты с псевдонимами часто не работают "из коробки". Jest не знает о ваших alias-ах и поэтому выдает ошибку `Cannot find module '@shared/ui/Button'`.

Чтобы это поправить, нужно использовать опцию `moduleNameMapper`.

### Пример jest.config.cjs

Покажу вам, как это реализовано на практике:

```js
// jest.config.cjs
/** @type {import('jest').Config} */
module.exports = {
  // Указываем, какие файлы считаем модулями
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],
  // Используем ts-jest или babel-jest для трансформации
  transform: {
    // Здесь обрабатываем TypeScript файлы
    "^.+\\.tsx?$": "ts-jest"
  },
  moduleNameMapper: {
    // Псевдонимы должны совпадать с вашими alias-ами в tsconfig / webpack / vite
    "^@app/(.*)$": "<rootDir>/src/app/$1",
    "^@pages/(.*)$": "<rootDir>/src/pages/$1",
    "^@widgets/(.*)$": "<rootDir>/src/widgets/$1",
    "^@features/(.*)$": "<rootDir>/src/features/$1",
    "^@entities/(.*)$": "<rootDir>/src/entities/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1"
  }
};
```

Обратите внимание:

- Здесь используются регулярные выражения `^@shared/(.*)$`, чтобы подставить хвост пути `$1`.
- `<rootDir>` — корень проекта (обычно папка, где лежит сам `jest.config.cjs`).

---

## Единый aliases-config как отдельный модуль

Иногда удобно вынести alias-ы в отдельный модуль и переиспользовать его в разных конфигурациях. Например, создать файл `aliases.config.mjs`, в котором вы опишете все маппинги, а затем будете подключать его в Webpack, Jest, ESLint и других местах.

### Пример aliases.config.mjs

Давайте посмотрим, как это может выглядеть:

```js
// aliases.config.mjs
import path from "path";
import { fileURLToPath } from "url";

// Здесь мы получаем __dirname в ESM окружении
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Базовая директория src
const srcPath = path.resolve(__dirname, "src");

// Общий объект с alias-ами
export const aliases = {
  "@app": path.join(srcPath, "app"),
  "@pages": path.join(srcPath, "pages"),
  "@widgets": path.join(srcPath, "widgets"),
  "@features": path.join(srcPath, "features"),
  "@entities": path.join(srcPath, "entities"),
  "@shared": path.join(srcPath, "shared")
};

// Вспомогательная функция для Jest (возвращает объект с паттернами)
export const jestModuleNameMapper = Object.fromEntries(
  Object.entries(aliases).map(([key, value]) => {
    // Преобразуем @shared -> ^@shared/(.*)$ : <rootDir>/src/shared/$1
    const pattern = `^${key}/(.*)$`;
    const target = `<rootDir>/${path.relative(__dirname, value)}/$1`;
    return [pattern, target];
  })
);
```

Теперь вы можете переиспользовать эту конфигурацию.

### Использование aliases.config.mjs в Webpack

```js
// webpack.config.cjs
const path = require("path");
const { aliases } = require("./aliases.config.cjs"); 
// Если у вас CommonJS, создайте cjs-версию или используйте динамический import

module.exports = {
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: {
      // Здесь удобно использовать уже готовый объект
      ...aliases
    }
  }
};
```

### Использование в Jest

```js
// jest.config.cjs
const { jestModuleNameMapper } = require("./aliases.config.cjs");
/** @type {import('jest').Config} */
module.exports = {
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  moduleNameMapper: {
    // Расширяем mapper из общего конфига
    ...jestModuleNameMapper
  }
};
```

Такой подход уменьшает вероятность ошибок: вы меняете псевдоним в одном месте, и все инструменты автоматически получают обновление.

---

## Практические рекомендации по выбору псевдонимов

### Используйте устойчивые именования

Частая ошибка — завязываться на конкретную структуру директорий, которая быстро меняется. Например, вводить псевдонимы вида `@components`, `@containers`, `@hooks`, когда вы еще не уверены в архитектуре.

Более устойчивый подход:

- основывать псевдонимы на архитектурных слоях (`@shared`, `@entities`, `@features`, `@widgets`, `@pages`, `@app`);
- или на крупных доменных областях (`@auth`, `@profile`, `@orders`) — если слойная архитектура еще не определена.

### Не смешивайте относительные пути и alias-ы хаотично

Рекомендуемый подход:

- для **внутримодульных** импортов (в пределах одной "маленькой" директории) — использовать относительные пути (`./Button`, `../model/hooks`);
- для **межслойных** и **межмодульных** импортов — использовать псевдонимы (`@shared/ui/Button`, `@features/auth/login-form`).

Так вы избегаете ситуации, когда всё в проекте импортируется только через alias-ы, и при этом у вас появляются "циклы" или слишком сильное сцепление.

### Следите за циклами импортов

Псевдонимы облегчают код, но одновременно маскируют циклические зависимости. Важно:

- настроить ESLint-правила (`import/no-cycle`);
- либо использовать дополнительные утилиты для поиска циклов.

Когда импорты выглядят как `@features/a/...` и `@features/b/...`, циклы трудно заметить визуально, поэтому автоматическая проверка особенно полезна.

---

## Типичные ошибки при настройке aliases-config

### Ошибка 1. Псевдоним есть в tsconfig, но нет в сборщике

Симптомы:

- IDE видит модуль и подсвечивает все корректно;
- но при запуске сборки Webpack или Vite вы получаете ошибку `Module not found`.

Причина:

- alias настроен в `tsconfig.json`, но не настроен в Webpack/Vite.

Решение:

1. Добавить соответствующий alias в `resolve.alias` Webpack/Vite;
2. Или подключить плагин, который автоматически читает `tsconfig.json`.

### Ошибка 2. Jest не понимает alias-ы

Симптомы:

- приложение собирается, но тесты падают с ошибкой `Cannot find module`.

Причина:

- не настроен `moduleNameMapper` в Jest.

Решение:

- добавить регулярные выражения для alias-ов в `jest.config`.

### Ошибка 3. ESLint ругается на импорты с alias-ами

Симптомы:

- в IDE на каждом импорте с псевдонимом висят предупреждения `import/no-unresolved`.

Причина:

- ESLint использует дефолтный резолвер, который не знает о `tsconfig.paths` или других настройках.

Решение:

- настроить `eslint-import-resolver-typescript` или `eslint-import-resolver-alias` в `settings.import/resolver`.

### Ошибка 4. Неправильный baseUrl в tsconfig.json

Симптомы:

- TypeScript не может найти модуль, даже если alias настроен.

Причина:

- `baseUrl` указывает не на тот каталог, относительно которого вы определяете alias-ы.

Решение:

- проверить, что `baseUrl` соответствует корню исходников (обычно `"./src"`);
- убедиться, что `paths` написаны относительно `baseUrl`.

---

Теперь давайте подведем итог.

Псевдонимы (aliases-config) — это способ дать более понятные и устойчивые имена путям в вашем проекте. Ключевые моменты:

- описывайте alias-ы **однократно** и дальше старайтесь переиспользовать их во всех инструментах;
- синхронизируйте настройки TypeScript, сборщика, тестов и линтера;
- выбирайте псевдонимы, основанные на архитектурных слоях или доменных областях;
- контролируйте качество импортов через ESLint и тесты.

Если вы выстроите единый aliases-config, дальнейшая поддержка и развитие проекта станет заметно проще.

---

## Частозадаваемые технические вопросы

### Как настроить псевдонимы, если у меня монорепозиторий с несколькими пакетами?

В монорепо (например, с Yarn Workspaces или PNPM) удобно организовать alias-ы так:

1. В корне каждому пакету дать "имя" через `package.json` (`"name": "@my-org/ui"`).
2. Использовать это имя как импорт: `import { Button } from "@my-org/ui";`.
3. Для локальной разработки:
   - настроить `paths` в корневом `tsconfig.json`, например `"@my-org/ui": ["packages/ui/src"]`;
   - в сборщике каждого приложения добавить alias `@my-org/ui` → `../ui/src` или использовать сборку ui-пакета отдельно.

Такой подход позволяет использовать один и тот же импорт и локально, и после публикации пакета.

### Как сделать, чтобы IDE (VS Code) корректно переходила по alias-ам?

Для VS Code важно:

1. Чтобы в проекте был корректно настроен `tsconfig.json` с `baseUrl` и `paths`.
2. Чтобы вы открывали именно корневую папку проекта, где лежит `tsconfig.json`.
3. Если вы используете несколько tsconfig (например, `tsconfig.base.json` и `tsconfig.app.json`), убедитесь, что:
   - IDE знает, какой из них основной (обычно это `tsconfig.json` в корне);
   - alias-ы описаны в базовом или общем конфиге, который расширяется в остальных.

### Как поступать с alias-ами при сборке библиотеки (npm-пакет)?

Для библиотек удобнее:

1. Внутри библиотеки использовать **относительные пути** или alias-ы, которые потом "разворачиваются" до относительных при сборке.
2. Не оставлять в собранном пакете alias-импорты (`@shared/...`), если вы не публикуете вместе с ним и конфигурацию сборки/рантайма.
3. В практической схеме:
   - Настроить alias-ы в исходниках.
   - Собирать библиотеку через Rollup/Webpack/Vite, которые раскроют alias-ы до относительных путей.
   - Публиковать уже собранный код.

### Можно ли использовать один и тот же alias для разных платформ (web, node, mobile) с разными реализациями?

Да, это делается через "conditional exports" или разное разрешение модулей:

1. В Node.js можно использовать поле `exports` в `package.json`, указывая разные файлы для разных сред.
2. В бандлерах можно настроить `resolve.alias` так, чтобы:
   - для web-версии `@platform` указывал на `src/platform/web`;
   - для node-версии — на `src/platform/node`.

Главное — не путать эти конфигурации и четко понимать, где какой конфиг используется.

### Как временно отключить alias-ы для отладки конкретной проблемы?

Самый простой подход:

1. Временно заменить импорт с alias-а на относительный путь там, где вы отлаживаете проблему.
2. Если хотите изменить поведение глобально:
   - закомментировать соответствующие alias-ы в конфиге сборщика;
   - запустить сборку и посмотреть, какие модули теперь не находятся;
   - после отладки вернуть конфигурацию обратно.

Важно не забыть вернуть alias-ы и не закоммитить временные изменения в основную ветку.
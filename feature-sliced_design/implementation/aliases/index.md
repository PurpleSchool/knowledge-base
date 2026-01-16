---
metaTitle: Настройка псевдонимов aliases-config в фронтенд проектах
metaDescription: Подробное руководство по настройке псевдонимов aliases-config в JavaScript и TypeScript проектах - разбираем конфигурацию Webpack TypeScript Node и тестовых сред
author: Олег Марков
title: Настройка псевдонимов aliases-config в JavaScript и TypeScript проектах
preview: Разберитесь как настроить aliases-config и использовать псевдонимы импортов в современном фронтенд стеке - от Webpack и TypeScript до Jest и ESLint
---

## Введение

Настройка псевдонимов (aliases-config) позволяет вам обращаться к файлам и модулям не по длинным относительным путям, а по коротким логическим именам. Вместо повторяющихся конструкций вроде:

../../components/Button/Button

вы можете написать:

@components/Button

Смотрите, я покажу вам, как это упрощает структуру проекта и уменьшает количество ошибок при рефакторинге. Псевдонимы делают код более читаемым, снижают связанные зависимости между модулями и помогают выстроить понятную архитектуру.

В этой статье мы разберем, как настроить aliases-config в типичном JavaScript/TypeScript проекте:

- в сборщиках (Webpack, Vite, esbuild, Rollup);
- в Node.js и TypeScript (tsconfig paths);
- в инструментах разработки (Jest, ESLint, Babel);
- в IDE (VS Code), чтобы автодополнение и переход к определению работали корректно.

Я буду ориентироваться на распространенную практику: использовать префиксы вида @app, @core, @components. Но вы можете адаптировать структуру под свой проект.

---

## Что такое aliases-config и зачем он нужен

### Проблема относительных путей

В типичном фронтенд проекте структура часто выглядит так:

- src/
  - components/
    - Button/
      - index.tsx
  - pages/
    - Home/
      - index.tsx
  - utils/
    - formatDate.ts

Чтобы импортировать компонент Button на странице Home, вы часто видите что-то подобное:

import Button from "../../components/Button"

Когда проект разрастается, относительные пути:

- становятся длинными;
- легко ломаются при переносе файлов;
- усложняют навигацию по коду;
- затрудняют реорганизацию структуры.

### Что дают псевдонимы

Псевдонимы позволяют привязать короткое имя к определенной директории. Например, вы настраиваете:

- @components → src/components
- @pages → src/pages
- @utils → src/utils
- @app → src

И уже можете писать:

import Button from "@components/Button"
import HomePage from "@pages/Home"
import { formatDate } from "@utils/formatDate"

Как видите, путь сразу становится короче и понятнее. Если вы позже измените структуру папок, вам достаточно будет поправить конфигурацию псевдонимов, а не сотни импортов по всему проекту.

---

## Базовые принципы aliases-config

### Логическая и физическая структура проекта

Давайте разберемся на примере. Физически файлы лежат на диске:

- src/components/...
- src/pages/...
- src/utils/...

Логически вы хотите мыслить модулями:

- @components – все UI-компоненты;
- @pages – все страницы;
- @utils – утилиты и функции общего назначения.

aliases-config как раз и связывает логические имена с физическими путями. Важно помнить:

- псевдоним – это только конфигурация сборщика/инструмента;
- JavaScript "из коробки" не понимает эти префиксы;
- каждый инструмент (Webpack, TypeScript, Jest и т.д.) нужно настроить отдельно, чтобы они одинаково разрешали эти псевдонимы.

### Основные элементы настройки

Почти везде настройка псевдонимов сводится к трем шагам:

1. Определить базовую директорию (обычно src).
2. Назначить логические имена (например, @app, @components).
3. Убедиться, что все инструменты разработки и сборки используют эти же правила.

Теперь давайте перейдем к конкретным конфигурациям.

---

## Настройка aliases-config в Webpack

### Пример структуры проекта

Допустим, у вас есть проект на React + TypeScript с Webpack:

- webpack.config.js
- tsconfig.json
- src/
  - index.tsx
  - components/
  - pages/
  - shared/

Мы хотим настроить псевдонимы:

- @app → src
- @components → src/components
- @pages → src/pages
- @shared → src/shared

### Конфигурация Webpack resolve.alias

Здесь я размещаю пример конфигурации webpack.config.js, чтобы вам было проще понять:

```js
// webpack.config.js
const path = require("path")

module.exports = {
  // Точка входа в приложение
  entry: "./src/index.tsx",

  resolve: {
    // Расширения файлов которые можно не указывать при импорте
    extensions: [".ts", ".tsx", ".js", ".jsx"],

    // Настройка псевдонимов
    alias: {
      // @app будет указывать на папку src
      "@app": path.resolve(__dirname, "src"),
      // @components - на src/components
      "@components": path.resolve(__dirname, "src/components"),
      // @pages - на src/pages
      "@pages": path.resolve(__dirname, "src/pages"),
      // @shared - на src/shared
      "@shared": path.resolve(__dirname, "src/shared")
    }
  },

  // Остальная конфигурация Webpack...
}
```

Теперь вы увидите, как это выглядит в коде:

```ts
// src/pages/Home/index.tsx
// Импорт компонента из папки components
import Button from "@components/Button"
// Импорт общей логики из shared
import { useAuth } from "@shared/hooks/useAuth"
```

Комментарии в конфиге помогают вспомнить, что к чему относится. Важно, чтобы путь в path.resolve был абсолютным, поэтому мы используем __dirname.

---

## Настройка псевдонимов в TypeScript (tsconfig paths)

### Зачем нужны paths в tsconfig

TypeScript тоже должен понимать, откуда брать модули по псевдонимам. Если вы настроите только Webpack, компилятор TypeScript (и IDE) всё равно не сможет разрешить эти импорты.

Для этого используется секция paths в tsconfig.json. Она описывает, как логические пути маппятся на физические каталоги исходников.

### Пример tsconfig.json с paths

Давайте посмотрим, как это настраивается:

```json
{
  "compilerOptions": {
    // Базовая директория для компиляции
    "baseUrl": "src",
    // Псевдонимы путей
    "paths": {
      "@app/*": ["*"],
      "@components/*": ["components/*"],
      "@pages/*": ["pages/*"],
      "@shared/*": ["shared/*"]
    },
    "jsx": "react-jsx",
    "module": "esnext",
    "target": "es6",
    "moduleResolution": "node",
    "strict": true
  },
  "include": ["src"]
}
```

Обратите внимание:

- baseUrl: "src" – теперь все пути внутри paths считаются от src;
- "@components/*": ["components/*"] – значит, что импорт:

  import Button from "@components/Button"

  превратится для компилятора в:

  import Button from "components/Button"

  а затем через baseUrl → src/components/Button.

Важно: звёздочка * нужна для того, чтобы TypeScript умел подставлять любую вложенность (Button, form/Button, inputs/TextInput и т.д.).

---

## aliases-config в Node.js (без сборщиков)

Если у вас серверный проект на Node.js и TypeScript, или монорепозиторий, вам может понадобиться использовать псевдонимы без Webpack.

### Подход с ts-node или ts-node-dev

При использовании ts-node можно опираться на те же paths из tsconfig.json, но для runtime понадобится дополнительная библиотека:

- tsconfig-paths – перехватывает require/импорты и разворачивает их по правилам из tsconfig.

Покажу вам, как это реализовано на практике.

Устанавливаем:

```bash
npm install --save-dev ts-node tsconfig-paths
```

Добавляем в package.json:

```json
{
  "scripts": {
    "dev": "ts-node -r tsconfig-paths/register src/index.ts"
  }
}
```

Комментарий:

- -r tsconfig-paths/register – подключает хук, который читает tsconfig.json и разрешает алиасы при выполнении кода.

Теперь вы можете использовать те же псевдонимы, что и в фронтенд-части.

### Подход с чистым Node.js и ESM

Если вы работаете с современными модулями (type: "module"), то псевдонимы придется настраивать через:

- либо замену путей на этапе сборки (esbuild, Rollup);
- либо через сторонние решения (например, module-alias для CommonJS).

Пример с module-alias:

```bash
npm install module-alias
```

В package.json:

```json
{
  "_moduleAliases": {
    "@app": "dist",
    "@services": "dist/services",
    "@models": "dist/models"
  }
}
```

И в коде инициализации:

```js
// dist/index.js
// Здесь мы подключаем module-alias перед всеми остальными импортами
require("module-alias/register")

// Теперь можно использовать псевдонимы
const userService = require("@services/userService")
```

Комментарии помогают не забыть, что module-alias нужно подключать до других require.

---

## aliases-config в Vite

Vite уже использует под капотом esbuild, поэтому настройка псевдонимов делается через resolve.alias.

Пример vite.config.ts:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // @app - корневая папка src
      "@app": path.resolve(__dirname, "src"),
      // @components - компоненты
      "@components": path.resolve(__dirname, "src/components"),
      // @features - функциональные модули
      "@features": path.resolve(__dirname, "src/features")
    }
  }
})
```

Теперь давайте перейдем к следующему шагу и согласуем это с TypeScript. Обычно в tsconfig.base.json или tsconfig.json вы прописываете те же paths, что мы разбирали выше. Главное – не забыть, что TypeScript и Vite должны "договариваться" об одинаковых псевдонимах.

---

## aliases-config в esbuild

esbuild поддерживает псевдонимы через опцию alias (в программном API) или через форматную строку в CLI.

Пример программной конфигурации:

```js
// build.js
const esbuild = require("esbuild")
const path = require("path")

esbuild.build({
  entryPoints: ["src/index.tsx"],
  bundle: true,
  outdir: "dist",
  // Здесь мы настраиваем псевдонимы
  alias: {
    "@app": path.resolve(__dirname, "src"),
    "@components": path.resolve(__dirname, "src/components"),
    "@lib": path.resolve(__dirname, "src/lib")
  },
  platform: "browser",
  format: "esm"
})
  .then(() => {
    // Сборка завершилась успешно
    console.log("Build completed")
  })
  .catch((error) => {
    // Если произошла ошибка - логируем и завершаем процесс
    console.error(error)
    process.exit(1)
  })
```

Здесь esbuild будет заменять @components/Button на абсолютный путь до src/components/Button, после чего применит обычную логику разрешения модулей.

---

## aliases-config в Rollup

Для Rollup чаще всего используется плагин @rollup/plugin-alias.

Устанавливаем:

```bash
npm install --save-dev @rollup/plugin-alias
```

Пример rollup.config.js:

```js
// rollup.config.js
import alias from "@rollup/plugin-alias"
import path from "path"

export default {
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "esm"
  },
  plugins: [
    alias({
      // В root указываем корень проекта
      entries: [
        // Каждый псевдоним описываем как объект
        { find: "@app", replacement: path.resolve(__dirname, "src") },
        { find: "@components", replacement: path.resolve(__dirname, "src/components") },
        { find: "@store", replacement: path.resolve(__dirname, "src/store") }
      ]
    })
  ]
}
```

Обратите внимание, что find – это то, что вы пишете в импортах, а replacement – абсолютный путь к директории.

---

## aliases-config в Jest (тестирование)

Для юнит-тестов нужно, чтобы тестовый раннер понимал те же псевдонимы, иначе импорты вида @components/Button в тестах просто не найдут модуль.

Jest использует конфигурацию moduleNameMapper.

Предположим, у вас уже настроены paths в tsconfig.json. Теперь добавляем jest.config.js:

```js
// jest.config.js
const path = require("path")

module.exports = {
  // Базовая директория для поиска модулей
  roots: ["<rootDir>/src"],

  // Преобразование TypeScript в JavaScript
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },

  // Настройка псевдонимов для Jest
  moduleNameMapper: {
    // Псевдоним @components будет указывать на src/components
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    // @pages - на src/pages
    "^@pages/(.*)$": "<rootDir>/src/pages/$1",
    // @shared - на src/shared
    "^@shared/(.*)$": "<rootDir>/src/shared/$1"
  }
}
```

Комментарий к регулярным выражениям:

- ^@components/(.*)$ – ищет строку, которая начинается с @components/ и дальше идет любой путь;
- $1 – подстановка захваченной части пути (то, что после слэша);
- <rootDir> – корень проекта в понимании Jest.

Теперь вы можете писать в тестах:

```ts
// src/components/Button/Button.test.tsx
// Импортируем компонент по псевдониму
import Button from "@components/Button"
// Импортируем утилиту
import { renderWithTheme } from "@shared/tests/renderWithTheme"
```

---

## aliases-config в Babel

Если вы используете Babel (например, с React Native, старым Webpack конфигом или Next.js с кастомным .babelrc), удобно настроить псевдонимы через плагин module-resolver.

Устанавливаем:

```bash
npm install --save-dev babel-plugin-module-resolver
```

Пример .babelrc:

```json
{
  "presets": ["@babel/preset-env", "@babel/preset-react"],
  "plugins": [
    [
      "module-resolver",
      {
        "root": ["./src"],
        "alias": {
          "@app": "./src",
          "@components": "./src/components",
          "@assets": "./src/assets"
        }
      }
    ]
  ]
}
```

Комментарии к настройке:

- root: ["./src"] – базовая директория для импорта без относительных путей;
- alias – объект с псевдонимами и относительными путями от корня проекта.

После этого Babel при трансформации кода заменит пути с псевдонимами на соответствующие относительные пути.

---

## aliases-config и ESLint

Частая проблема: вы настроили Webpack, TypeScript и Jest, но ESLint по-прежнему ругается "Unable to resolve path to module '@components/Button'". Чтобы линтер понимал ваши псевдонимы, нужно настроить резолвер.

Самый распространенный вариант – eslint-import-resolver-typescript или eslint-import-resolver-alias.

### Вариант 1: eslint-import-resolver-typescript

Если вы уже настроили paths в tsconfig.json, удобнее всего подключить typescript резолвер. Устанавливаем:

```bash
npm install --save-dev eslint-import-resolver-typescript
```

В вашем .eslintrc.js:

```js
// .eslintrc.js
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "import"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript"
  ],
  settings: {
    // Здесь мы говорим ESLint использовать резолвер TypeScript
    "import/resolver": {
      typescript: {
        // Указываем путь к tsconfig если он не в корне
        project: "./tsconfig.json"
      }
    }
  }
}
```

Теперь ESLint возьмет информацию о псевдонимах из tsconfig.json и перестанет считать такие импорты ошибкой.

### Вариант 2: eslint-import-resolver-alias

Если вы не используете TypeScript, можно явно задать aliases для ESLint:

```bash
npm install --save-dev eslint-import-resolver-alias
```

.eslintrc.js:

```js
module.exports = {
  settings: {
    "import/resolver": {
      alias: {
        // Здесь описываем те же псевдонимы что и в Webpack
        map: [
          ["@app", "./src"],
          ["@components", "./src/components"]
        ],
        // Расширения файлов которые нужно учитывать
        extensions: [".js", ".jsx", ".ts", ".tsx"]
      }
    }
  }
}
```

---

## Согласование aliases-config во всех инструментах

### Почему важно синхронизировать псевдонимы

Если псевдоним @components настроен только в Webpack, но:

- не прописан в tsconfig.json;
- не учтен в Jest;
- про него не знает ESLint и Babel;

вы получите разные ошибки на разных этапах:

- код собирается, но IDE подсвечивает ошибки;
- тесты падают, потому что не понимают импорт;
- линтер выводит "импорт недоступен";
- автодополнение в редакторе не работает.

Давайте посмотрим, как организовать единый источник правды.

### Стратегия единого источника

На практике удобно:

- для TypeScript проектов – считать tsconfig.json центральным местом конфигурации алиасов;
- для JavaScript проектов – завести отдельный файл alias.config.js или paths.json, откуда будете импортировать значения в разные конфиги.

#### Вариант для TypeScript

Вы:

1. Настраиваете paths в tsconfig.json;
2. В Webpack/Vite/ESLint/Jest включаете резолвер, который читает tsconfig.

Например, для Jest можно использовать jest-module-name-mapper из tsconfig, но чаще удобнее продублировать настройки явно, особенно если их немного.

#### Вариант для JavaScript

Создаете файл:

```js
// alias.config.js
const path = require("path")

// Базовая функция для преобразования короткого пути в абсолютный
const fromRoot = (p) => path.resolve(__dirname, p)

module.exports = {
  aliases: {
    "@app": fromRoot("src"),
    "@components": fromRoot("src/components"),
    "@pages": fromRoot("src/pages"),
    "@utils": fromRoot("src/utils")
  }
}
```

И уже в webpack.config.js:

```js
const { aliases } = require("./alias.config")

module.exports = {
  // ...
  resolve: {
    alias: aliases
  }
}
```

А в .eslintrc.js можно подключить те же пути, преобразовав в нужный формат для резолвера. Так вы избегаете расхождений между конфигурациями.

---

## Типичные ошибки при настройке aliases-config

### Ошибка: забыли про baseUrl в tsconfig.json

Без baseUrl TypeScript не сможет корректно разрешать aliases с относительными путями.

Неправильно:

```json
{
  "compilerOptions": {
    "paths": {
      "@components/*": ["src/components/*"]
    }
  }
}
```

Правильно:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@components/*": ["src/components/*"]
    }
  }
}
```

Или:

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@components/*": ["components/*"]
    }
  }
}
```

### Ошибка: несогласованность псевдонимов

Например, в Webpack:

- "@components": path.resolve(__dirname, "src/components"),

А в tsconfig:

- "@components/*": ["components/*"], но baseUrl: ".".

В этом случае TypeScript будет искать src/components относительно корня, а Webpack – относительно src. В результате одни импорты будут работать, другие – нет.

Лучше всего держать рядом с конфигом список псевдонимов и проверять, что везде они совпадают.

### Ошибка: регулярные выражения в Jest

Частая проблема – забыли добавить /(.*) в moduleNameMapper и в итоге Jest не понимает вложенные пути.

Неправильно:

```js
moduleNameMapper: {
  "^@components$": "<rootDir>/src/components"
}
```

Так Jest поймет только импорт вида:

import Components from "@components"

Но не поймет:

import Button from "@components/Button"

Правильно:

```js
moduleNameMapper: {
  "^@components/(.*)$": "<rootDir>/src/components/$1"
}
```

### Ошибка: IDE не видит псевдонимы

Даже если все конфиги сборки настроены, иногда VS Code не понимает алиасы. Для TypeScript проектов почти всегда достаточно корректного tsconfig.json в корне. Для JavaScript иногда помогает файл jsconfig.json с аналогичными полями baseUrl и paths.

Пример jsconfig.json:

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@components/*": ["components/*"],
      "@utils/*": ["utils/*"]
    }
  },
  "include": ["src"]
}
```

---

## Пример комплексной конфигурации aliases-config

Чтобы у вас сложилась целостная картина, покажу пример проекта на React + TypeScript + Webpack + Jest + ESLint, где настроены одинаковые псевдонимы.

Структура:

- src/
  - components/
  - pages/
  - shared/
- webpack.config.js
- tsconfig.json
- jest.config.js
- .eslintrc.js

tsconfig.json:

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@app/*": ["*"],
      "@components/*": ["components/*"],
      "@pages/*": ["pages/*"],
      "@shared/*": ["shared/*"]
    },
    "jsx": "react-jsx",
    "module": "esnext",
    "target": "es6",
    "moduleResolution": "node",
    "strict": true
  },
  "include": ["src"]
}
```

webpack.config.js:

```js
const path = require("path")

module.exports = {
  entry: "./src/index.tsx",
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: {
      "@app": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@shared": path.resolve(__dirname, "src/shared")
    }
  },
  // Остальной конфиг Webpack опущен для краткости
}
```

jest.config.js:

```js
module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
  moduleNameMapper: {
    "^@app/(.*)$": "<rootDir>/src/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@pages/(.*)$": "<rootDir>/src/pages/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1"
  }
}
```

.eslintrc.js:

```js
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "import"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript"
  ],
  settings: {
    "import/resolver": {
      // Используем резолвер TypeScript чтобы он читал paths из tsconfig.json
      typescript: {
        project: "./tsconfig.json"
      }
    }
  }
}
```

Теперь посмотрите на пример файла:

```ts
// src/pages/Home/HomePage.tsx
// Импорт компонента из папки components
import Button from "@components/Button"
// Импорт общей логики авторизации
import { useAuth } from "@shared/hooks/useAuth"
// Импорт глобальных типов из корня src
import type { User } from "@app/types/user"

export const HomePage = () => {
  // Здесь мы используем хук авторизации
  const { user } = useAuth()

  // Рендерим кнопку и имя пользователя
  return (
    <div>
      <p>{user.name}</p>
      <Button>Logout</Button>
    </div>
  )
}
```

Как видите, код выглядит аккуратно, а изменения в структуре (перемещение src/shared в src/core/shared, например) потребуют правок в конфигурации, а не во всех файлах.

---

## Заключение

aliases-config – это не одна конкретная технология, а общий подход к работе с путями в проекте. Вы настраиваете логические псевдонимы и убеждаетесь, что все инструменты в цепочке разработки:

- сборщик (Webpack, Vite, esbuild, Rollup);
- компилятор (TypeScript / Babel);
- тестовый раннер (Jest);
- линтер (ESLint);
- IDE (VS Code);

понимают эти псевдонимы одинаково.

Ключевые моменты, которые стоит держать в голове:

- базовую директорию и paths в tsconfig.json лучше считать основным источником правды;
- псевдонимы должны быть согласованы во всех конфигурационных файлах;
- относитесь к псевдонимам как к части архитектуры: они отражают модули и слои приложения (features, entities, shared и т.п.).

Если вы аккуратно настроите aliases-config один раз, дальнейшая разработка станет значительно удобнее: проще навигация, меньше ошибок при рефакторинге, более понятная структура проекта.

---

## Частозадаваемые технические вопросы по теме aliases-config

### Как использовать один и тот же aliases-config в монорепозитории с несколькими пакетами

В монорепо удобно вынести общую конфигурацию в корневой tsconfig.base.json и общие алиасы описать там. В каждом пакете создайте свой tsconfig.json с "extends": "../tsconfig.base.json" и при необходимости добавьте локальные paths. Для Webpack/Vite можно создать общий файл alias.config.js в корне и переиспользовать его в конфигурациях пакетов.

### Как сделать так чтобы aliases-config работал и в Storybook

В Storybook нужно настроить webpackFinal в .storybook/main.(js|ts). Там вы можете дополнить config.resolve.alias теми же псевдонимами что и в основном Webpack/Vite конфиге. Если Storybook на Vite используйте поле viteFinal и объединяйте resolve.alias с основной конфигурацией.

### Как настроить aliases-config в Next.js

В Next.js псевдонимы чаще всего задают через jsconfig.json или tsconfig.json с baseUrl и paths. Webpack конфигурацию Next автоматически подхватывает из этих файлов, поэтому отдельно настраивать resolve.alias обычно не требуется. Главное – чтобы jsconfig/tsconfig лежал в корне проекта.

### Как настроить автодополнение псевдонимов в VS Code для JavaScript без TypeScript

Создайте jsconfig.json с полями baseUrl и paths по аналогии с tsconfig. VS Code использует эти настройки для навигации по проекту, даже если вы пишете на чистом JavaScript. После добавления файла перезапустите редактор чтобы обновить индекс.

### Как быстро найти неиспользуемые или устаревшие псевдонимы

Самый простой способ – поиск по конфигурациям. Сначала соберите список всех алиасов из tsconfig, Webpack, Jest и ESLint. Затем с помощью глобального поиска по проекту (например, в VS Code) проверьте используются ли эти префиксы в реальных импортов. Неиспользуемые алиасы можно удалить из конфигов, чтобы не плодить "мертвые" настройки и путаницу.
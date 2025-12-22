---
metaTitle: Правило absolute-imports в JavaScript и TypeScript
metaDescription: Разбираем правило absolute-imports - что это такое - как настроить абсолютные импорты и упростить структуру проекта
author: Олег Марков
title: Правило абсолютных импортов - absolute-imports
preview: Пошагово настраиваем absolute-imports в проектах на JavaScript и TypeScript - от теории до практических примеров с React и Node
---

## Введение

Правило абсолютных импортов (часто его называют просто absolute-imports) помогает избавиться от громоздких относительных путей в импортах и сделать структуру проекта чище и понятнее.

Вместо длинных цепочек вроде:

```ts
import { Button } from "../../components/ui/Button"
```

вы переходите к короткой и стабильной записи:

```ts
import { Button } from "components/ui/Button"
```

или даже:

```ts
import { Button } from "@/components/ui/Button"
```

Смотрите, я покажу вам, как это правило работает, на что оно влияет и как его грамотно настроить в разных окружениях:

- чистый TypeScript и Node
- React (Create React App, Vite, Next.js)
- ESLint и Webpack

Мы разберем, зачем нужны абсолютные импорты, какие проблемы они решают, какие подводные камни бывают и как избежать типичных ошибок при настройке.

## Что такое абсолютные и относительные импорты

### Относительные импорты

Относительный импорт описывает путь к модулю относительно текущего файла.

```ts
// файл src/pages/home/index.tsx
import { Button } from "../../components/ui/Button"
import { getUser } from "../shared/api/user"
```

Комментарии:

```ts
// "../../components/ui/Button"
// ".." поднимает нас на уровень выше
// "../../" поднимает на два уровня выше
// дальше идет путь до файла внутри папки components
```

Проблема становится заметной, когда структура усложняется:

- меняются уровни вложенности
- вы переносите файлы в другие директории
- количество "../" растет и читать становится неудобно

### Абсолютные импорты

Абсолютный импорт задает путь не от текущего файла, а от некоторой корневой точки проекта.

```ts
// тот же файл src/pages/home/index.tsx
import { Button } from "components/ui/Button"  // путь от условного "корня"
import { getUser } from "shared/api/user"
```

Или с псевдонимом:

```ts
import { Button } from "@/components/ui/Button"
import { getUser } from "@/shared/api/user"
```

Здесь вы описываете модули как бы "от системы модулей" проекта, а не от конкретного файла. Именно это и называют правилом абсолютных импортов.

## Зачем нужны абсолютные импорты

### Упрощение чтения кода

Когда вы видите:

```ts
import { Button } from "components/ui/Button"
```

вам сразу понятно, что Button лежит где-то в общей зоне компонентов. Вы не думаете, где находится текущий файл и сколько раз надо подняться ".." вверх.

При относительных импортов приходится мысленно восстанавливать дерево директорий:

```ts
import { Button } from "../../../components/ui/Button"
// а где вообще находится этот файл?
```

### Упрощение рефакторинга структуры

Представьте, что вы переносите файл из одной директории в другую.

С относительными импортами:

```ts
// было
import { Button } from "../../components/ui/Button"

// стало после переноса файла глубже
import { Button } from "../../../../components/ui/Button"
```

Каждый перенос требует ручной правки всех путей.

С абсолютными импортами:

```ts
// и до, и после переноса
import { Button } from "components/ui/Button"
```

Путь к модулю не меняется, пока остается прежняя логическая структура модулей.

### Четкое разделение слоев

Абсолютные импорты помогают явно выделить "слои" или "зоны" проекта:

- app
- entities
- features
- shared
- widgets

Например, в подходе Feature-Sliced Design часто используют такие базовые алиасы. Тогда импорт выглядит осмысленно:

```ts
import { UserCard } from "entities/user"
import { loginByEmail } from "features/auth"
import { Button } from "shared/ui/Button"
```

### Меньше ошибок с ".."

Относительные пути легко перепутать:

```ts
import { something } from "../module"
import { other } from "..//module" // одна лишняя "/" и вы получили другую цель
```

При большом количестве "../" ошибки становятся сложнее заметить.

Абсолютные импорты устраняют эту категорию ошибок: вы работаете с логическими путями, а не со "стрелочками вверх-вниз".

## Настройка абсолютных импортов в TypeScript

Начнем с базовой настройки через tsconfig.json, так как именно TypeScript чаще всего является отправной точкой для правила absolute-imports.

### Основные поля baseUrl и paths

В TypeScript за абсолютные импорты отвечают два ключевых параметра в tsconfig.json:

- `baseUrl` — базовая директория, относительно которой будут работать импорты без "./" и "../"
- `paths` — карта псевдонимов (alias) к реальным путям

Посмотрите пример:

```jsonc
{
  "compilerOptions": {
    // baseUrl задает "корень" для абсолютных путей
    "baseUrl": "src",

    // paths позволяет создавать псевдонимы
    "paths": {
      "@/*": ["*"],                   // "@/" указывает на src
      "components/*": ["components/*"],
      "shared/*": ["shared/*"]
    }
  }
}
```

Комментарии к примеру:

- `"baseUrl": "src"` — значит, что импорт `"components/Button"` ищется в папке src/components/Button
- `"@/*": ["*"]` — псевдоним "@/" соответствует корню src
- `"components/*": ["components/*"]` — импорт "components/..." будет соответствовать "src/components/..."

Теперь вы можете писать:

```ts
import { Button } from "components/ui/Button"
// TypeScript смотрит в src/components/ui/Button

import { formatDate } from "@/shared/lib/date"
// TypeScript понимает - @/ указывает на src
// поэтому ищет в src/shared/lib/date
```

### Важно понимать ограничение TypeScript

TypeScript настраивает только разрешение модулей для компилятора и IDE. Этого недостаточно:

- для браузера (через bundler)
- для Node.js (в runtime)

Поэтому одного tsconfig.json мало. Вам нужно дополнительно:

- настроить bundler (Webpack, Vite, esbuild и т.п.)
- настроить Node.js (для server-side кода)
- при необходимости — ESLint

Чуть ниже мы разберем это по отдельности, а пока завершим с TypeScript.

### Пример полного tsconfig с абсолютными импортами

Давайте соберем типовой tsconfig для фронтенд проекта:

```jsonc
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",

    // Включаем абсолютные импорты от папки src
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "app/*": ["app/*"],
      "entities/*": ["entities/*"],
      "features/*": ["features/*"],
      "shared/*": ["shared/*"],
      "widgets/*": ["widgets/*"]
    },

    "moduleResolution": "Node",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

Здесь вы задаете алиасы сразу по слоям (по аналогии с Feature-Sliced Design). Теперь импорты по всему приложению могут быть консистентными и читабельными.

## Абсолютные импорты в Node.js (без сборщика)

Если у вас Node.js приложение без Webpack/Vite и вы хотите использовать абсолютные импорты, есть несколько вариантов.

### Вариант 1 — ts-node/ts-node-dev с respect tsconfig paths

Некоторые инструменты (например, ts-node) умеют читать paths из tsconfig, но это не всегда удобно и не всегда работает "из коробки" без флагов и плагинов.

Для стабильной работы я рекомендую явно подключать поддержку paths.

### Вариант 2 — модуль tsconfig-paths

Популярный подход: использовать пакет tsconfig-paths, который поднимает алиасы на этапе запуска.

Установка:

```bash
npm install tsconfig-paths ts-node --save-dev
```

Настройка скрипта запуска:

```jsonc
{
  "scripts": {
    "dev": "ts-node -r tsconfig-paths/register src/index.ts"
  }
}
```

Комментарии:

- `-r tsconfig-paths/register` — регистрирует обработчик, который читает paths из tsconfig.json
- теперь алиасы, прописанные в tsconfig, будут работать и в runtime Node.js

В коде вы сможете писать:

```ts
// src/index.ts
import { startServer } from "@/app/server"
// tsconfig-paths подставит реальный путь из tsconfig
```

### Вариант 3 — использовать ESM и импорт по URL (реже)

Node.js в ESM режиме (type:"module") поддерживает импорт с полными URL или с помощью флагов и loaders. Это более продвинутая конфигурация, и для новичков нередко избыточна. В большинстве случаев вариант с tsconfig-paths проще и нагляднее.

## Абсолютные импорты в React проектах

Теперь давайте посмотрим, как правило absolute-imports применяется на практике в популярных React стекax.

### Create React App (CRA)

В Create React App долгое время использовался простой механизм через NODE_PATH, но он признан устаревшим. Сейчас более корректный путь — использовать jsconfig.json/tsconfig.json.

#### Для JavaScript (jsconfig.json)

Создайте jsconfig.json в корне проекта:

```jsonc
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "components/*": ["components/*"]
    }
  },
  "include": ["src"]
}
```

Теперь вы можете импортировать:

```js
// было
import Button from "../../components/ui/Button"

// стало
import Button from "components/ui/Button"
// или
import Button from "@/components/ui/Button"
```

#### Для TypeScript (tsconfig.json)

Если CRA был создан с TypeScript, настройка очень похожа, только в tsconfig.json:

```jsonc
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "components/*": ["components/*"]
    },
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

CRA под капотом подхватывает эти настройки для IDE и сборки, так что отдельно Webpack трогать не требуется.

### Vite + React

Vite поддерживает алиасы через конфиг vite.config.ts.

Установим алиас "@":

```ts
// vite.config.ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Здесь мы объявляем псевдоним "@"
      // path.resolve(__dirname, "src") указывает на папку src
      "@": path.resolve(__dirname, "src"),
      "shared": path.resolve(__dirname, "src/shared")
    }
  }
})
```

Чтобы TypeScript тоже понимал эти пути, добавьте в tsconfig.json:

```jsonc
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "shared/*": ["shared/*"]
    }
  }
}
```

Теперь в коде:

```tsx
import { AppRouter } from "@/app/router"
import { Spinner } from "shared/ui/Spinner"
```

Vite использует свои alias, TypeScript — paths, и все работает согласованно.

### Next.js

В Next.js настроить абсолютные импорты особенно просто.

#### Для TypeScript

Создайте или обновите tsconfig.json:

```jsonc
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"],
      "entities/*": ["entities/*"],
      "shared/*": ["shared/*"]
    }
  }
}
```

Если вы используете структуру с папкой src, убедитесь, что Next настроен на нее (по умолчанию он просто считает src корнем приложения, если такая папка есть).

Теперь импорты:

```tsx
import { Layout } from "@/shared/ui/Layout"
import { UserProfile } from "entities/user/ui/UserProfile"
```

Next.js автоматически подхватывает эти алиасы и в dev, и в build.

#### Для JavaScript

Можно вместо tsconfig.json использовать jsconfig.json с теми же полями baseUrl и paths. Next.js читает оба файла.

## Абсолютные импорты и Webpack

Если у вас конфигурация Webpack на руках (CRA без eject не рассматриваем), правило absolute-imports можно задать через resolve.alias и resolve.modules.

### Алиасы через resolve.alias

Давайте разберемся на примере.

```js
// webpack.config.js
const path = require("path")

module.exports = {
  // ...

  resolve: {
    // Какие расширения файлов можно импортировать без указания расширения
    extensions: [".ts", ".tsx", ".js", ".jsx"],

    // Настраиваем папки поиска модулей
    modules: [
      path.resolve(__dirname, "src"), // теперь "src" считается корнем
      "node_modules"
    ],

    // Задаем псевдонимы
    alias: {
      "@": path.resolve(__dirname, "src"),
      "shared": path.resolve(__dirname, "src/shared"),
      "components": path.resolve(__dirname, "src/components")
    }
  }
}
```

Комментарии:

- `modules` позволяет не писать относительные пути до src
- `alias` задает удобные шорткаты
- для TypeScript важно дополнительно настроить paths в tsconfig, чтобы IDE и компилятор понимали те же псевдонимы

После этого вы можете писать:

```ts
import { Button } from "components/ui/Button"
import { formatDate } from "@/shared/lib/date"
```

### Согласованность с TypeScript

Чтобы избежать "расхождения реальностей", стоит всегда придерживаться правила:

- все alias и baseUrl описываем одновременно в tsconfig.json и в конфиге сборщика
- используем одинаковые имена псевдонимов в обоих местах

Это уменьшает риск, что код будет работать в IDE, но ломаться при сборке, или наоборот.

## ESLint и правило absolute-imports

Само по себе ESLint не вводит абсолютные импорты, но от него часто ожидают:

- проверка корректности путей
- запрет определенных типов импортов
- сортировка по группам (absolute, relative и т.д.)

### Настройка парсера импорта

Чтобы ESLint понимал алиасы, нужно настроить resolver.

Обычно используется плагин eslint-import-resolver-typescript или eslint-import-resolver-webpack.

Пример настройки с TypeScript:

```bash
npm install eslint-import-resolver-typescript --save-dev
```

В .eslintrc.js:

```js
module.exports = {
  // ...
  settings: {
    "import/resolver": {
      // Здесь мы говорим ESLint, что пути нужно читать из tsconfig
      typescript: {
        // можно явно указать путь к tsconfig, если он не в корне
        // project: "./tsconfig.json"
      }
    }
  }
}
```

Теперь ESLint будет понимать импорты вида:

```ts
import { Button } from "@/shared/ui/Button"
```

и не будет считать их "unresolved".

### Запрет относительных импортов из корня

Часто хочешь ввести правило: "из верхних слоев проекта импортируем только абсолютными, никакого ../..". Для этого можно использовать модульные правила и инструменты вроде eslint-plugin-boundaries или eslint-plugin-import.

Например, в eslint-plugin-import есть правило no-restricted-paths и no-relative-parent-imports, которые помогают контролировать нежелательные относительные импорты.

Упрощенный пример:

```js
module.exports = {
  rules: {
    "import/no-relative-parent-imports": "error"
    // теперь любые импорты вида "../" будут ошибкой
  }
}
```

Это хороший способ жестко внедрить правило absolute-imports в команду, чтобы никто случайно не вернулся к длинным относительным путям.

## Паттерны использования абсолютных импортов в архитектуре проекта

Абсолютные импорты особенно полезны, когда у вас есть четкая архитектура.

### Слои и домены

Вы можете разбить проект на слои (app, widgets, features, entities, shared) и дать каждому алиас:

```jsonc
"paths": {
  "app/*": ["app/*"],
  "widgets/*": ["widgets/*"],
  "features/*": ["features/*"],
  "entities/*": ["entities/*"],
  "shared/*": ["shared/*"]
}
```

Теперь импорты выглядят как логический "ландшафт" проекта:

```ts
import { AppRouter } from "app/router"
import { UserProfile } from "entities/user"
import { LoginForm } from "features/auth/login"
import { Button } from "shared/ui/Button"
```

Смотрите, это помогает сразу понять, к какому слою относится модуль, который вы подтягиваете.

### Локальные импортные корни

Иногда полезно настраивать дополнительный "корень" в пределах одного модуля или домена. Например, у вас есть папка src/entities/user, и вы хотите внутри нее импортировать что-то без ../../.

Вы можете внутри этого домена завести index.ts, который переэкспортирует нужные элементы из внутренних файлов. Тогда локальные импорты станут проще:

```ts
// src/entities/user/index.ts
export * from "./model"
export * from "./ui/UserCard"
```

Теперь в других местах достаточно:

```ts
import { UserCard } from "entities/user"
```

Это не отменяет абсолютные импорты, а дополняет их — вы создаете "публичный API" модуля, а не лазите по его внутренним файлам.

## Типичные ошибки и подводные камни

Давайте посмотрим, с какими проблемами чаще всего сталкиваются разработчики, когда начинают использовать absolute-imports.

### Настроен только TypeScript или только сборщик

Одна из самых частых ситуаций:

- в tsconfig прописали baseUrl и paths
- в Webpack/Vite/Node ничего не настроили

Результат:

- VS Code и TypeScript успешно находят модули
- при сборке или запуске приложение падает с ошибкой "module not found"

Как избежать:

1. Всегда дублируйте алиасы в сборщике и в tsconfig.
2. Либо используйте инструменты, которые умеют читать tsconfig напрямую (tsconfig-paths, eslint-import-resolver-typescript и т.д.).

### Конфликт имен модулей с node_modules

Если вы создаете алиас, который пересекается с именем пакета из node_modules, возможны конфликтные ситуации.

Например:

```jsonc
"paths": {
  "react/*": ["shared/react/*"]
}
```

В этом случае импорт react/* может вести себя непредсказуемо.

Лучше вводить алиасы с префиксами:

- @
- app-
- internal-

Например:

```jsonc
"paths": {
  "@app/*": ["*"],
  "@shared/*": ["shared/*"]
}
```

### Несогласованный стиль импортов в команде

Если часть команды использует абсолютные импорты, а часть — относительные, возникает смесь двух стилей:

```ts
import { Button } from "../../shared/ui/Button"
import { formatDate } from "@/shared/lib/date"
```

Чтобы этого не было:

- договоритесь о правилах в команде
- зафиксируйте их в документации проекта
- добавьте ESLint правило на запрет относительных импортов из корня или на обязательное использование алиасов

### Глубокие абсолютные пути вместо публичного API

Абсолютный импорт сам по себе не решает проблему "сляпанной архитектуры", если вы все равно лазите во внутренности модулей:

```ts
// плохой пример
import { something } from "entities/user/model/internal/some-deep-file"
```

Лучше:

- сделать index.ts на уровне модуля, который экспортирует нужные элементы
- импортировать только из публичного API:

```ts
// src/entities/user/index.ts
export { UserCard } from "./ui/UserCard"
export { getUser } from "./model/selectors"
// ...

// использование
import { UserCard, getUser } from "entities/user"
```

Абсолютные импорты в этом случае подчеркивают границы модулей и помогают их не нарушать.

## Краткое резюме

Правило абсолютных импортов — это договоренность и настройка системы модулей, при которой:

- вы импортируете модули не через ../../, а от корневой точки проекта или через алиасы
- импорты становятся короче, читабельнее и стабильнее при рефакторинге
- архитектура проекта лучше отражается в коде (через осмысленные алиасы)

Чтобы absolute-imports работало корректно:

1. Настройте TypeScript или jsconfig:

   - baseUrl (обычно src)
   - paths (алиасы по слоям/зонам)

2. Настройте сборщик (Webpack, Vite, Next):

   - resolve.alias
   - или аналоги, согласованные с tsconfig

3. Настройте runtime (Node.js) при необходимости:

   - tsconfig-paths или другие решения

4. Настройте ESLint:

   - import/resolver для понимания алиасов
   - правила, ограничивающие неконтролируемые относительные импорты

Если все три уровня (компилятор, сборщик, линтер) смотрят на одну и ту же схему alias, вы получаете удобную, предсказуемую систему импорта, которая облегчает поддержку и развитие проекта.

## Частозадаваемые технические вопросы

### 1. Как сделать, чтобы Jest понимал абсолютные импорты и алиасы

В Jest нужно настроить параметр moduleNameMapper.

Пример для TypeScript проекта с алиасами "@/":

```js
// jest.config.js
module.exports = {
  // ...
  moduleNameMapper: {
    // Соответствие алиаса "@/..." папке <rootDir>/src/...
    "^@/(.*)$": "<rootDir>/src/$1",
    "^shared/(.*)$": "<rootDir>/src/shared/$1"
  }
}
```

Комментарий: здесь мы говорим Jest, что все импорты, которые начинаются с "@/...", нужно искать в src. Аналогично с "shared/".

### 2. Как настроить абсолютные импорты в монорепозитории с несколькими пакетами

В монорепо лучше использовать подход с workspace-пакетами:

1. Каждому пакету дать свое имя (например, "@app/shared").
2. В tsconfig.paths сослаться на эти пакеты:

```jsonc
"paths": {
  "@app/shared/*": ["packages/shared/src/*"],
  "@app/ui/*": ["packages/ui/src/*"]
}
```

3. В bundler/Node использовать обычное разрешение пакетов через node_modules, так как workspace будет линковать их автоматически.

Так вы получаете абсолютные импорты, совместимые с экосистемой npm.

### 3. Как запретить абсолютные импорты между "нижними" слоями (например, shared не может импортировать features)

Используйте ESLint с плагином для архитектурных ограничений, например eslint-plugin-boundaries.

Пример правила:

```js
// .eslintrc.js
module.exports = {
  settings: {
    "boundaries/elements": [
      { type: "shared", pattern: "shared/*" },
      { type: "features", pattern: "features/*" }
    ]
  },
  rules: {
    "boundaries/element-types": [
      "error",
      {
        default: "allow",
        rules: [
          {
            from: "shared",
            disallow: ["features"]
          }
        ]
      }
    ]
  }
}
```

Теперь, если в shared кто-то попытается импортировать из features, ESLint покажет ошибку.

### 4. Как заставить VS Code правильно подсказывать пути с алиасами

Убедитесь, что:

1. В корне проекта есть tsconfig.json или jsconfig.json с baseUrl и paths.
2. VS Code использует именно эту конфигурацию (проверьте "TypeScript: Select TypeScript Version" и workspace).
3. Если конфиг не в корне, задайте путь к нему в настройках VS Code или через специальные параметры плагинов.

После этого автодополнение импортов начнет предлагать пути с учетом алиасов.

### 5. Можно ли комбинировать абсолютные и относительные импорты

Можно и часто нужно:

- относительные импорты — для "локальных" файлов в пределах одной маленькой области, где путь очевиден (./LocalComponent).
- абсолютные — для переходов между слоями или крупными модулями (entities/user, shared/ui).

Практическая рекомендация: внутри "маленького модуля" допускайте относительные импорты, а при выходе наружу — используйте только абсолютные, чтобы не запутывать архитектуру.
---
metaTitle: Инициализация FSD проекта - init
metaDescription: Подробное руководство по инициализации FSD проекта на фронтенде - структура слоев настройка алиасов кодогенерация и типовые команды init
author: Олег Марков
title: Инициализация FSD проекта - init
preview: Разбор шага инициализации FSD проекта - init - какие файлы и директории создаются как настроить сборку алиасы и проверки чтобы комфортно разработывать в FSD архитектуре
---

## Введение

Инициализация FSD проекта (часто называемая init) — это первый шаг перед тем, как вы начнете писать реальный функционал. От того, как вы настроите проект на старте, зависит удобство разработки, масштабируемость и то, насколько легко в проекте будет соблюдать Feature-Sliced Design.

Здесь я покажу вам, как подойти к инициализации FSD проекта системно. Мы пройдемся по типичному процессу init:

- разберем базовую структуру слоев;
- создадим каркас проекта;
- настроим алиасы и модульные пути;
- добавим базовые правила линтеров и архитектурных проверок;
- подготовим шаблоны для новых сущностей;
- настроим команды в package менеджере для повторного init и автогенерации.

Я буду опираться на типичный стек фронтенда (React + TypeScript + Vite или Webpack), но подход можно адаптировать и под другие технологии.

---

## Что такое init в контексте FSD

### Цель шага инициализации

Init в FSD — это не просто установка зависимостей. Это:

- создание каркаса слоев (app, processes, pages, widgets, features, entities, shared);
- фиксация договоренностей по структуре проекта;
- настройка путей и алиасов под FSD слои;
- подключение инструментов, которые будут следить за соблюдением архитектуры;
- подготовка типовых генераторов (скриптов), чтобы новые модули создавались по единым правилам.

Смотрите, здесь важный момент: если этот шаг пропустить или сделать формально, дальше вы начнете «ломать» архитектуру, потому что проект технически не помогает вам ее соблюдать.

### Как FSD влияет на init

FSD диктует:

- где живет конкретный код (в каком слое);
- кто может импортировать кого;
- как именуются директории и файлы;
- как лучше организовать общие библиотеки, переиспользуемые модули и изолированные фичи.

Поэтому init — это, по сути, настройка инструментария под эти правила.

---

## Базовая структура FSD проекта после init

### Стандартные слои и директории

После шага init вы обычно хотите получить примерно такую структуру:

```bash
src/
  app/
    index.tsx        # Точка входа приложения
    providers/       # Провайдеры контекста, роутера, стейт менеджера
    styles/          # Глобальные стили (если нужны)
  processes/
    # Долгоживущие процессы - авторизация, онбординг и т.п.
  pages/
    # Страницы, завязанные на роуты
  widgets/
    # Крупные композиции фич и сущностей
  features/
    # Функциональные возможности с понятной пользовательской ценностью
  entities/
    # Бизнес-сущности домена - User, Product и т.п.
  shared/
    config/          # Конфигурация проекта
    lib/             # Утилиты и хелперы
    ui/              # Базовые переиспользуемые UI компоненты
    api/             # Клиенты API, если они общие
    assets/          # Статические ресурсы
```

Это каркас, который init должен создать автоматически (скриптом, CLI или шаблоном репозитория), чтобы вы не собирали его вручную каждый раз.

### Наименования и принципы

Несколько важных правил, которые стоит заложить именно на этапе init:

- все слои пишутся в одной форме: `features`, `entities`, `widgets`, а не вперемешку вроде `feature`, `entity`;
- в каждом слое вы придерживаетесь однотипной структуры:  
  например, в `features` каждая фича — это отдельная директория с единым входным файлом `index.ts`;
- не помещаете код напрямую в корень `src`, кроме точки входа и минимальных конфигов;
- не добавляете общие «мусорные» директории вроде `components` в корень — лучше распределять их по слоям.

---

## Точка входа и слой app

### Минимальный набор файлов в app

После init в слое `app` обычно создается:

```bash
src/app/
  index.tsx        # Рендер приложения
  App.tsx          # Корневой компонент
  providers/       # Обертки для контекстов
  routes/          # Конфигурация маршрутов
  styles/          # Глобальные стили
```

Теперь вы увидите, как это выглядит в коде.

```tsx
// src/app/index.tsx
import React from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"

// Здесь мы получаем DOM-узел, куда будем монтировать приложение
const container = document.getElementById("root")

if (!container) {
  throw new Error("Root container not found")
}

// Здесь мы создаем корневой React-рендерер
const root = createRoot(container)

// Рендерим корневой компонент App
root.render(<App />)
```

```tsx
// src/app/App.tsx
import React from "react"
import { withProviders } from "./providers"
import { AppRouter } from "./routes"

// Здесь мы описываем базовую компоновку приложения
function AppComponent() {
  return (
    <div>
      {/* AppRouter отвечает за отрисовку страниц по маршрутам */}
      <AppRouter />
    </div>
  )
}

// Оборачиваем AppComponent в общие провайдеры
export const App = withProviders(AppComponent)
```

### Провайдеры и маршрутизация

Давайте разберемся на примере, как можно оформить провайдеры.

```tsx
// src/app/providers/index.tsx
import React from "react"
import { BrowserRouter } from "react-router-dom"
// import { StoreProvider } from "./StoreProvider" // Пример провайдера стора

// HOC для оборачивания приложения в провайдеры
export function withProviders(Component: React.ComponentType) {
  return function AppWithProviders() {
    return (
      // BrowserRouter обеспечивает маршрутизацию
      <BrowserRouter>
        {/* Здесь можно добавить другие провайдеры контекстов */}
        {/* <StoreProvider> */}
        <Component />
        {/* </StoreProvider> */}
      </BrowserRouter>
    )
  }
}
```

```tsx
// src/app/routes/index.tsx
import React from "react"
import { Routes, Route } from "react-router-dom"
// Здесь мы будем импортировать страницы из слоя pages
import { HomePage } from "@/pages/home"
import { NotFoundPage } from "@/pages/not-found"

// Компонент, отвечающий за конфигурацию роутов
export function AppRouter() {
  return (
    <Routes>
      {/* Главная страница */}
      <Route path="/" element={<HomePage />} />
      {/* Страница 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
```

Здесь уже видно, что нам нужны алиасы вида `@/pages/...`. Давайте теперь настроим их в конфигурации сборщика и TypeScript.

---

## Настройка алиасов под FSD (tsconfig, Vite, Webpack)

### Зачем нужны алиасы

Алиасы позволяют:

- не писать длинные относительные пути вроде `../../../entities/user/model`;
- запретить импорты «мимо» слоев за счет архитектурных ограничений;
- быстрее ориентироваться, откуда что импортируется.

На этапе init вы задаете основную схему алиасов, например:

- `@/app`        → `src/app`
- `@/processes`  → `src/processes`
- `@/pages`      → `src/pages`
- `@/widgets`    → `src/widgets`
- `@/features`   → `src/features`
- `@/entities`   → `src/entities`
- `@/shared`     → `src/shared`

### Пример настройки в tsconfig.json

Смотрите, я размещаю пример для TypeScript.

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    // Базовая директория для относительных путей
    "baseUrl": "src",
    // Здесь мы описываем алиасы под слои FSD
    "paths": {
      "@/*": ["*"],
      "@/app/*": ["app/*"],
      "@/processes/*": ["processes/*"],
      "@/pages/*": ["pages/*"],
      "@/widgets/*": ["widgets/*"],
      "@/features/*": ["features/*"],
      "@/entities/*": ["entities/*"],
      "@/shared/*": ["shared/*"]
    }
  }
}
```

Комментарии:

- `"baseUrl": "src"` говорит компилятору, что `@/` будет начинаться от `src`;
- `"@/*": ["*"]` позволяет импортировать напрямую из `src` при необходимости, но лучше все же использовать конкретные алиасы по слоям.

### Пример настройки для Vite

Теперь давайте перейдем к конфигу Vite.

```ts
// vite.config.ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [
    // Плагин для поддержки React
    react(),
  ],
  resolve: {
    alias: {
      // Здесь мы сопоставляем алиасы с реальными путями
      "@": path.resolve(__dirname, "src"),
      "@/app": path.resolve(__dirname, "src/app"),
      "@/processes": path.resolve(__dirname, "src/processes"),
      "@/pages": path.resolve(__dirname, "src/pages"),
      "@/widgets": path.resolve(__dirname, "src/widgets"),
      "@/features": path.resolve(__dirname, "src/features"),
      "@/entities": path.resolve(__dirname, "src/entities"),
      "@/shared": path.resolve(__dirname, "src/shared"),
    },
  },
})
```

Обратите внимание, что алиасы в Vite и в `tsconfig.json` должны совпадать, иначе редактор и сборщик будут по-разному понимать пути.

### Пример настройки для Webpack

Если вы используете Webpack, конфиг может выглядеть так:

```js
// webpack.config.js
const path = require("path")

module.exports = {
  // Точка входа в приложение
  entry: "./src/app/index.tsx",
  resolve: {
    // Здесь мы указываем расширения, которые можно не писать при импорте
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@/app": path.resolve(__dirname, "src/app"),
      "@/processes": path.resolve(__dirname, "src/processes"),
      "@/pages": path.resolve(__dirname, "src/pages"),
      "@/widgets": path.resolve(__dirname, "src/widgets"),
      "@/features": path.resolve(__dirname, "src/features"),
      "@/entities": path.resolve(__dirname, "src/entities"),
      "@/shared": path.resolve(__dirname, "src/shared"),
    },
  },
  // Остальная конфигурация опущена для краткости
}
```

---

## Шаблоны модулей и barrel файлы

### Зачем нужны barrel файлы при init

Barrel файлы (например, `index.ts` в директории модуля) решают две задачи:

- упрощают импорт — вместо множества путей вы импортируете из одного;
- позволяют контролировать публичное API слоя или модуля.

На этапе init имеет смысл сразу заложить правило:

- у каждой фичи, сущности, виджета есть свой `index.ts`, который экспортирует только публичные элементы.

### Пример структуры фичи после init

Давайте посмотрим, что происходит в следующем примере.

```bash
src/features/
  auth-by-email/
    ui/
      AuthForm.tsx
    model/
      types.ts
      useAuthByEmail.ts
    api/
      authApi.ts
    index.ts
```

```ts
// src/features/auth-by-email/index.ts
// Здесь мы явно описываем публичное API фичи

// Экспортируем только форму авторизации
export { AuthForm } from "./ui/AuthForm"

// Экспортируем хук, который можно использовать снаружи
export { useAuthByEmail } from "./model/useAuthByEmail"

// При необходимости экспортируем типы
export type { AuthByEmailFormValues } from "./model/types"
```

Комментарии:

- код внутри фичи может быть как угодно организован, но наружу выходит только то, что указано в `index.ts`;
- это особенно важно для контроля зависимостей между слоями: другие слои работают не с внутренностями модуля, а с его публичным API.

### Шаблонные генераторы (скрипты init)

Хорошая практика — в init сразу добавить генераторы, которые будут создавать заготовки для фич, сущностей и т.п.

Например, вы можете добавить простой Node-скрипт:

```ts
// scripts/generateFeature.ts
import fs from "fs"
import path from "path"

// Здесь мы получаем имя фичи из аргументов командной строки
const featureName = process.argv[2]

if (!featureName) {
  console.error("Укажите имя фичи")
  process.exit(1)
}

// Путь к директории фичи
const featureDir = path.resolve("src/features", featureName)

// Создаем директории ui, model, api
fs.mkdirSync(path.join(featureDir, "ui"), { recursive: true })
fs.mkdirSync(path.join(featureDir, "model"), { recursive: true })
fs.mkdirSync(path.join(featureDir, "api"), { recursive: true })

// Создаем базовый index.ts
fs.writeFileSync(
  path.join(featureDir, "index.ts"),
  `// Публичное API фичи ${featureName}\n`
)

// Здесь можно добавить дополнительные файлы по шаблону
console.log(`Фича ${featureName} успешно создана`)
```

После этого в `package.json` вы можете добавить команду:

```jsonc
{
  "scripts": {
    "gen:feature": "ts-node scripts/generateFeature.ts"
  }
}
```

Теперь вы можете вызвать:

```bash
npm run gen:feature auth-by-email
```

и получить фичу с заранее определенной структурой.

---

## Линтеры и архитектурные ограничения при init

### ESLint и базовые правила

На этапе init имеет смысл подключить ESLint и сразу задать:

- базовые правила для качества кода;
- правила для импортов (например, порядок, отсутствие относительных путей выше уровня модуля).

Пример `.eslintrc.cjs`:

```js
// .eslintrc.cjs
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    // Указываем ECMAScript модули
    sourceType: "module",
    // Включаем поддержку JSX
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    // Настройки для импорта модулей
    "import/resolver": {
      typescript: {
        project: "./tsconfig.json",
      },
    },
  },
  env: {
    browser: true,
    es2021: true,
  },
  plugins: [
    "react",
    "@typescript-eslint",
    "import",
  ],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    // Пример правила - запрет неиспользуемых переменных
    "@typescript-eslint/no-unused-vars": ["warn"],
    // Пример правила - единый стиль импорта
    "import/order": [
      "warn",
      {
        "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
        "alphabetize": { "order": "asc", "caseInsensitive": true }
      }
    ]
  }
}
```

### Архитектурные правила для FSD

Отдельная тема — ограничения между слоями. Инициализация проекта — удобный момент, чтобы сразу добавить правила:

- `app` может импортировать все;
- `pages` могут импортировать `widgets`, `features`, `entities`, `shared`;
- `widgets` могут импортировать `features`, `entities`, `shared`;
- `features` могут импортировать `entities`, `shared`;
- `entities` могут импортировать `shared`;
- `shared` не должен импортировать ничего из остальных слоев.

Смотрите, я покажу вам, как это можно реализовать с помощью `eslint-plugin-boundaries` или собственного правила. Здесь приведен общий пример с `import/no-restricted-paths`:

```js
// .eslintrc.cjs (фрагмент)
rules: {
  // ...
  "no-restricted-imports": [
    "error",
    {
      // Здесь вы ограничиваете доступ к внутренностям слоев
      "patterns": [
        {
          // Запрещаем импортировать из src/features напрямую через относительные пути
          group: ["../features/*", "../../features/*"],
          message: "Импортируйте фичи через алиас @/features",
        }
      ]
    }
  ]
}
```

Если вы хотите более строгий контроль по слоям, можно вынести архитектуру в отдельный ESLint-плагин или воспользоваться готовыми решениями. На этапе init достаточно заложить базовые ограничения и не позволять «ходить по дереву» с помощью относительных путей через `../..`.

---

## Базовые модули по слоям: что создать на init

### Слой shared

Слой `shared` часто нуждается в минимальном наполнении уже на init, чтобы другие слои могли его использовать с самого начала.

Структура:

```bash
src/shared/
  config/
    index.ts
  lib/
    classNames.ts
  ui/
    Button/
      Button.tsx
      index.ts
  api/
    httpClient.ts
  assets/
    index.ts
```

Пример простого хелпера:

```ts
// src/shared/lib/classNames.ts
type ClassValue = string | undefined | null | false

// Функция для объединения CSS-классов
export function classNames(...classes: ClassValue[]): string {
  // Фильтруем ложные значения и объединяем в строку
  return classes.filter(Boolean).join(" ")
}
```

Пример базовой кнопки:

```tsx
// src/shared/ui/Button/Button.tsx
import React from "react"
import { classNames } from "@/shared/lib/classNames"

// Описываем пропсы кнопки
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary"
}

// Базовый компонент кнопки
export function Button(props: ButtonProps) {
  const { variant = "primary", className, children, ...otherProps } = props

  // Собираем CSS-классы с помощью хелпера classNames
  const classes = classNames(
    "button",
    variant === "primary" && "button--primary",
    variant === "secondary" && "button--secondary",
    className
  )

  return (
    <button className={classes} {...otherProps}>
      {children}
    </button>
  )
}
```

```ts
// src/shared/ui/Button/index.ts
// Публичный экспорт кнопки
export { Button } from "./Button"
```

Таким образом, сразу после init вы можете использовать базовые элементы интерфейса.

### Слой entities

Для `entities` на этапе init достаточно одного-двух примерных модулей, чтобы показать стиль.

```bash
src/entities/
  user/
    model/
      types.ts
    index.ts
```

```ts
// src/entities/user/model/types.ts
// Описываем доменную сущность User
export interface User {
  id: string
  email: string
  name: string
}
```

```ts
// src/entities/user/index.ts
// Публичное API сущности User
export type { User } from "./model/types"
```

Обратите внимание: мы не создаем UI в `entities` без необходимости. Обычно визуальную часть лучше держать во `features` или `widgets`, а `entities` отвечает за доменные данные и логику.

### Слой pages

Слой `pages` можно настроить так, чтобы каждая страница имела свой корневой компонент и `index.ts`.

```bash
src/pages/
  home/
    ui/
      HomePage.tsx
    index.ts
  not-found/
    ui/
      NotFoundPage.tsx
    index.ts
```

```tsx
// src/pages/home/ui/HomePage.tsx
import React from "react"

// Простая стартовая страница
export function HomePage() {
  return (
    <div>
      <h1>Главная страница</h1>
    </div>
  )
}
```

```ts
// src/pages/home/index.ts
// Публичный экспорт компонента страницы
export { HomePage } from "./ui/HomePage"
```

Так вы сразу задаете стиль, как оформляются страницы и как они подключаются в роутер.

---

## Сценарий init: последовательность действий

### Шаг 1. Создание проекта через шаблон

Чаще всего вы начинаете с CLI фреймворка:

- `npm create vite@latest` — для Vite;
- `create-react-app` — если нужно CRA;
- собственный шаблон репозитория.

На этом этапе важно:

- выбрать TypeScript;
- включить React (если это ваш стек);
- настроить структуру `src` под FSD.

### Шаг 2. Создание структуры FSD директорий

Теперь вы создаете директории слоев. Можно сделать это один раз вручную или скриптом.

```bash
mkdir -p src/app src/processes src/pages src/widgets src/features src/entities src/shared
mkdir -p src/shared/{config,lib,ui,api,assets}
```

Здесь вы сразу подготавливаете места под будущий код, а не создаете их по мере необходимости.

### Шаг 3. Настройка алиасов

Далее вы:

- обновляете `tsconfig.json` с алиасами;
- настраиваете алиасы в Vite/Webpack/другом сборщике;
- перезапускаете dev-сервер, чтобы убедиться, что все работает.

Важно сразу проверить импорт из каждого слоя, например:

```ts
// Пример: импорт доменной сущности
import { User } from "@/entities/user"
// Пример: импорт базового UI
import { Button } from "@/shared/ui/Button"
```

Если редактор подсвечивает ошибки или сборка падает, лучше исправить это сейчас, пока проект пустой.

### Шаг 4. Добавление ESLint и архитектурных правил

Затем вы:

- устанавливаете ESLint и нужные плагины;
- настраиваете базовые правила;
- добавляете ограничение на импорт через алиасы и относительные пути;
- добавляете команду в `package.json`:

```jsonc
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

Теперь можно запустить:

```bash
npm run lint
```

и убедиться, что ошибок нет.

### Шаг 5. Создание примерных модулей по слоям

Чтобы разработчики понимали, как пользоваться FSD структурой, хорошо создать:

- одну-две простые страницы;
- одну сущность;
- один простой UI компонент в `shared`;
- одну фичу «заготовку».

Это даст ориентиры, как оформлять модули дальше.

### Шаг 6. Подготовка генераторов (опционально, но желательно)

Дальше можно добавить скрипты:

- `gen:feature` — создание новой фичи;
- `gen:entity` — создание новой сущности;
- `gen:widget` — создание нового виджета.

Смотрите, я показал вам пример генератора фичи выше. Генераторы экономят время и поддерживают единый стиль по проекту.

---

## Как работать с init в командной разработке

### Документация по init внутри репозитория

Хорошая практика — добавить в корень проекта файл, например `ARCHITECTURE.md` или `FSD_GUIDE.md`, где:

- описаны слои;
- объяснены правила импорта;
- дан пример именования модулей;
- описаны команды генерации.

Это все тоже часть init. Файлы кода — не единственное, что формирует архитектуру. Важно, чтобы новые участники команды могли зайти в репозиторий и понять, как здесь все устроено.

### Pull Requests и соблюдение init-договоренностей

После init стоит договориться:

- новые директории создаются только в рамках слоев FSD;
- при добавлении новой фичи/сущности — используется генератор или используется уже заданная структура;
- PR, нарушающие структуру слоев или алиасы, не принимаются, пока не будут приведены к стандарту.

Такие договоренности лучше прописать в `CONTRIBUTING.md`. Это не чисто технический шаг, но он напрямую связан с инициализацией архитектуры проекта.

---

## Заключение

Инициализация FSD проекта — это не разовая «техническая» операция, а формализация архитектуры на уровне кода, инструментов и договоренностей команды. На этапе init вы:

- создаете каркас слоев и директив;
- задаете единый стиль именования и структурирования модулей;
- настраиваете алиасы и сборку под FSD;
- включаете линтеры и архитектурные проверки;
- добавляете шаблоны и генераторы для новых модулей.

Чем тщательнее вы подойдете к этому шагу, тем меньше архитектурных конфликтов, «случайных» импортов и неструктурированного кода появится в будущем. В итоге FSD перестает быть просто идеей и превращается в практику, поддерживаемую инструментами и самим проектом.

---

## Частозадаваемые технические вопросы

### Как организовать тесты при FSD init чтобы они не мешали структуре

Обычно тесты кладут рядом с кодом слоя. Например  
`src/features/auth-by-email/ui/AuthForm.test.tsx`.  
Главное правило — не смешивать тесты одного слоя с кодом другого. Если вы хотите отделить тесты, можно использовать подпапку `__tests__` внутри конкретного модуля фичи или сущности. При конфигурации тестраннера (Jest Vitest) убедитесь, что пути и алиасы совпадают с настройками `tsconfig`.

### Как подключить Storybook так чтобы он понимал FSD слои

В конфиге Storybook (`main.ts`) добавьте те же алиасы что и в Vite или Webpack через поле `webpackFinal` или `viteFinal`. Важно чтобы Storybook использовал тот же `tsconfig` или чтобы вы явно описали `paths`. Тогда Stories смогут импортировать компоненты из `@/shared/ui` или `@/features/...` без дублирования путей.

### Как на init учесть SSR или Next js с FSD

В Next.js структура `pages` уже зарезервирована фреймворком. Обычно слои `features` `entities` `shared` остаются стандартными а вместо FSD-слоя `pages` используется директория `pages` Next. Внутри файлов страниц вы просто импортируете нужные фичи и виджеты. Алиасы настраиваются в `jsconfig.json` или `tsconfig.json` аналогично обычному проекту.

### Что делать если часть кода уже написана без FSD а нужно ввести init

Лучше всего выделить отдельный слой `shared/legacy` или `legacy/` на верхнем уровне и постепенно переносить код в правильные слои. На этапе «позднего init» вы создаете FSD каркас и начинаете миграцию модулей по мере доработок. В линтерах можно временно ослабить часть архитектурных правил для legacy-кода и постепенно их ужесточать.

### Как обрабатывать кросс-сеченные вещи вроде analytics или feature flags

Такие технические сервисы обычно размещают в `shared` например `shared/lib/analytics` или `shared/lib/featureFlags`. Слои могут использовать их напрямую потому что это инфраструктурный код. Главное не тянуть доменные сущности внутрь этих модулей чтобы не нарушать направленность зависимостей.
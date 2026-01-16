---
metaTitle: Конфигурация Vite - vite config
metaDescription: Подробное руководство по настройке конфигурации Vite - vite config - разбор основных полей примеры и лучшие практики
author: Олег Марков
title: Конфигурация Vite - vite config
preview: Разбор файла конфигурации Vite - vite config - от базовых настроек до продвинутых сценариев для реальных проектов
---

## Введение

Файл конфигурации Vite — это центральное место, где вы управляете поведением сборщика: указываете корневую директорию проекта, настраиваете алиасы, подключаете плагины, меняете порт dev-сервера, настраиваете сборку и многие другие вещи.  

Смотрите, я покажу вам, как сделать конфигурацию понятной, предсказуемой и управляемой. В этой статье мы пройдемся по основным возможностям vite.config, разберем, как его организовывать в реальных проектах и как не запутаться в десятках опций.

## Базовое устройство vite.config

### Где лежит конфиг и как он подхватывается

По умолчанию Vite ищет конфиг в корне проекта. Поддерживаются разные форматы:

- vite.config.js
- vite.config.mjs
- vite.config.ts
- vite.config.cjs

На практике чаще всего вы будете использовать TypeScript-конфиг:

```ts
// vite.config.ts
import { defineConfig } from "vite"

// Функция defineConfig улучшает подсказки типов и проверку
export default defineConfig({
  // Здесь будут ваши настройки
})
```

Обратите внимание: можно обойтись и без `defineConfig`, просто экспортируя объект, но с ним редактор кода даст вам более точные подсказки.

### Структура объекта конфигурации

Конфиг — это один объект с несколькими крупными разделами:

- root — корневая директория проекта
- base — базовый публичный путь
- resolve — настройки модулей и алиасов
- server — параметры dev-сервера
- build — параметры продакшн-сборки
- preview — настройки preview-сервера
- plugins — плагины Vite
- define — глобальные константы на этапе сборки
- css — настройка обработки CSS
- optimizeDeps — предоптимизация зависимостей
- envDir, envPrefix — работа с env-переменными

Давайте разбираться по шагам.

## Базовые настройки проекта

### root и base

#### root — корень проекта

Если ваш фронтенд-код лежит не в корне репозитория, а, например, в папке `frontend`, можно явно указать корневую директорию для Vite:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  // Указываем корень проекта для Vite
  root: resolve(__dirname, "frontend"),
})
```

Так Vite будет считать точкой входа именно эту папку: искать index.html, относительные пути и т. д.

#### base — базовый путь для ассетов

Параметр base задает "префикс" для всех импортируемых ресурсов (JS, CSS, картинки). Это важно, если приложение размещается не в корне домена.

```ts
// vite.config.ts
import { defineConfig } from "vite"

export default defineConfig({
  // Приложение будет доступно, например, по /my-app/
  base: "/my-app/",
})
```

В dev-режиме base влияет на пути в HTML и модулях, а при сборке на то, как будут генерироваться ссылки в итоговых файлах.  

Если вы деплоите SPA в поддиректорию, не забудьте настроить base корректно, иначе ассеты "потеряются".

### envDir и envPrefix

#### envDir — откуда брать .env файлы

По умолчанию Vite ищет `.env` файлы в корне конфигурации. Если вам нужно хранить их отдельно, можно указать каталог:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  // Все .env файлы ищем в папке config/env
  envDir: resolve(__dirname, "config", "env"),
})
```

#### envPrefix — фильтрация переменных окружения

Для безопасности Vite по умолчанию экспортирует в клиент только переменные с префиксом `VITE_`. Этот префикс можно изменить или расширить:

```ts
// vite.config.ts
import { defineConfig } from "vite"

export default defineConfig({
  // Будут доступны переменные VITE_* и FRONT_*
  envPrefix: ["VITE_", "FRONT_"],
})
```

В коде вы будете получать их так:

```ts
// main.ts
// Здесь мы читаем переменную окружения, которая попала в клиент
const apiUrl = import.meta.env.VITE_API_URL
```

## Разрешение модулей и алиасы

### resolve.alias — удобные пути к модулям

Чтобы вам не приходилось писать длинные относительные пути вроде `../../../components/Button`, лучше настроить алиасы.

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  resolve: {
    alias: {
      // Здесь мы создаем алиас @ для src
      "@": resolve(__dirname, "src"),
      "@components": resolve(__dirname, "src/components"),
    },
  },
})
```

Теперь вы можете писать:

```ts
// Здесь мы используем алиас @components вместо относительного пути
import Button from "@components/Button"
```

Это делает код понятнее, а рефакторинг — проще.

### resolve.extensions и dedupe

Дополнительно можно задать расширения по умолчанию и "объединить" несколько копий одной зависимости.

```ts
// vite.config.ts
import { defineConfig } from "vite"

export default defineConfig({
  resolve: {
    // Расширения, которые Vite будет подставлять автоматически
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
    // Здесь мы говорим Vite использовать одну копию react и react-dom
    dedupe: ["react", "react-dom"],
  },
})
```

Это полезно при работе с monorepo или локально линкованными пакетами, чтобы не получить две разные копии React.

## Конфигурация dev-сервера

### Базовые опции server

Здесь вы управляете тем, как ведет себя Vite во время разработки: на каком порту работает, изменять ли файлы на диске, нужно ли HTTPS и так далее.

```ts
// vite.config.ts
import { defineConfig } from "vite"

export default defineConfig({
  server: {
    // Порт dev-сервера
    port: 3000,
    // Автоматически открывать браузер
    open: true,
    // Разрешать доступ не только с localhost
    host: true, // или "0.0.0.0"
    // Включить строгую проверку порта
    strictPort: true,
  },
})
```

- host: true позволяет открыть приложение на мобильном устройстве в локальной сети
- strictPort: если порт 3000 занят, Vite не будет искать следующий свободный, а завершит работу с ошибкой. Это удобно для стабильных окружений.

### HTTPS и сертификаты

Если вам нужно проверить работу приложения по HTTPS (например, для OAuth или сервис-воркеров), вы можете включить его в dev-сервере:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import fs from "fs"
import path from "path"

export default defineConfig({
  server: {
    https: {
      // Здесь мы читаем самоподписанный сертификат
      cert: fs.readFileSync(path.resolve(__dirname, "certs", "dev.crt")),
      key: fs.readFileSync(path.resolve(__dirname, "certs", "dev.key")),
    },
  },
})
```

Браузер может ругаться на самоподписанный сертификат, но для локальной разработки это обычно приемлемо.

### Прокси для бэкенда

Очень частый сценарий — Vite обслуживает фронтенд, а API работает на другом порту (или домене). Чтобы не мучиться с CORS в dev-режиме, настройте прокси.

```ts
// vite.config.ts
import { defineConfig } from "vite"

export default defineConfig({
  server: {
    proxy: {
      // Все запросы, начинающиеся с /api, будут проксироваться
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        // Здесь мы переписываем путь, убирая /api
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
})
```

Теперь в коде вы можете обращаться к `/api/users`, а фактически запрос уйдет на `http://localhost:8080/users`.

## Настройка сборки (build)

### Главные параметры build

Смотрите, я покажу вам типичный блок build-конфигурации:

```ts
// vite.config.ts
import { defineConfig } from "vite"

export default defineConfig({
  build: {
    // Выходная директория
    outDir: "dist",
    // Очищать ли директорию перед сборкой
    emptyOutDir: true,
    // Включить/отключить sourcemap
    sourcemap: true,
    // Минификация (esbuild или terser)
    minify: "esbuild",
    // Цель компиляции
    target: "es2017",
  },
})
```

Пояснения:

- outDir — папка, куда Vite положит результат сборки
- sourcemap — полезно включать на stage/staging окружениях
- minify — можно выключить (`false`) для отладки или заменить на `"terser"`, если нужен более тонкий контроль минификации
- target — указывает, под какой JS-движок вы собираете проект (например, `es2015`, `es2017`, `esnext`)

### Настройка Rollup через rollupOptions

Под капотом Vite использует Rollup для продакшн-сборки. Вы можете тонко управлять этим процессом через `build.rollupOptions`.

```ts
// vite.config.ts
import { defineConfig } from "vite"

export default defineConfig({
  build: {
    rollupOptions: {
      // Здесь мы определяем множественные точки входа
      input: {
        main: "index.html",
        admin: "admin/index.html",
      },
      output: {
        // Шаблон имен файлов
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
})
```

Так вы можете собрать несколько страниц или приложений одним запуском Vite.

### Library mode

Если вы пишете библиотеку, а не SPA, Vite тоже можно настроить под это.

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  build: {
    lib: {
      // Здесь мы указываем основной файл библиотеки
      entry: resolve(__dirname, "src/index.ts"),
      // Имя глобальной переменной для UMD/IIFE
      name: "MyLib",
      // Имена выходных файлов
      fileName: (format) => `my-lib.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          // Здесь мы говорим Rollup, как зовут externals в глобальном scope
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
})
```

Такой режим удобен, если вы публикуете npm-пакет.

## Работа с плагинами

### Подключение плагинов

Плагины — один из ключевых инструментов Vite. Они позволяют расширять поведение сборки: поддерживать фреймворки, оптимизировать ассеты, добавлять автогенерацию и многое другое.

Простейший пример — подключение плагина для React:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [
    // Здесь мы подключаем плагин React
    react(),
  ],
})
```

Для Vue будет аналогично:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  plugins: [
    // Здесь мы подключаем поддержку файлов .vue
    vue(),
  ],
})
```

### Собственный плагин Vite

Давайте разберемся на примере небольшого кастомного плагина. Например, вам нужно логировать все загружаемые модули.

```ts
// vite.config.ts
import { defineConfig, Plugin } from "vite"

function logImportsPlugin(): Plugin {
  return {
    name: "log-imports",
    // Этот хук вызывается для каждого импортируемого модуля
    load(id) {
      // Здесь мы выводим путь к модулю в консоль
      console.log("[log-imports]", id)
      // Возвращаем null, чтобы Vite продолжил обычную загрузку
      return null
    },
  }
}

export default defineConfig({
  plugins: [
    logImportsPlugin(),
  ],
})
```

Это очень простой пример, но он показывает, как вы можете вмешиваться в процесс сборки и делать дополнительные действия.

## Глобальные константы: define

### Подстановка значений на этапе сборки

Секция `define` позволяет подменять выражения в коде на конкретные строковые значения. Это делается чисто на этапе сборки.

```ts
// vite.config.ts
import { defineConfig } from "vite"

export default defineConfig({
  define: {
    // Здесь мы создаем глобальную константу __BUILD_DATE__
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    // Переписываем process.env.NODE_ENV
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
})
```

Теперь вы можете использовать это в коде:

```ts
// appInfo.ts
// Здесь мы выводим дату сборки
console.log("Build date:", __BUILD_DATE__)
```

Важно: `define` заменяет текст в коде, поэтому почти всегда значения нужно оборачивать в `JSON.stringify`, чтобы получить корректный JavaScript‑литерал.

## Конфигурация CSS

### Общие настройки css

В конфиге Vite есть отдельный раздел css, который управляет препроцессорами, модулями и пост-обработкой.

```ts
// vite.config.ts
import { defineConfig } from "vite"

export default defineConfig({
  css: {
    // Включаем CSS-модули по умолчанию только для файлов *.module.css
    modules: {
      scopeBehaviour: "local",
      // Здесь мы настраиваем формат локального имени класса
      generateScopedName: "[name]__[local]___[hash:base64:5]",
    },
  },
})
```

### Препроцессоры: Sass, Less, Stylus

Допустим, вы используете Sass и вам нужно передавать в каждый файл общие переменные.

```ts
// vite.config.ts
import { defineConfig } from "vite"

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        // Здесь мы автоматически добавляем импорт переменных в каждый scss-файл
        additionalData: `@import "src/styles/variables.scss";`,
      },
    },
  },
})
```

Теперь вам не нужно вручную импортировать `variables.scss` в каждом файле.

### PostCSS

Если вы используете Tailwind CSS, Autoprefixer или другие PostCSS-плагины, их можно настроить через `postcss.config` или прямо в vite.config.

```ts
// vite.config.ts
import { defineConfig } from "vite"
import autoprefixer from "autoprefixer"
import tailwindcss from "tailwindcss"

export default defineConfig({
  css: {
    postcss: {
      // Здесь мы подключаем плагины PostCSS
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
})
```

Так вы получите единый контроль над всей обработкой стилей.

## Оптимизация зависимостей: optimizeDeps

### Зачем нужна предоптимизация

Vite использует ES-модули в dev-режиме. Однако многие пакеты из npm до сих пор публикуются в формате CommonJS или с тяжелым деревом зависимостей. Чтобы ускорить запуск dev-сервера, такие пакеты "предсобираются" с помощью esbuild.

Этим управляет секция `optimizeDeps`.

### include и exclude

Если какая-то зависимость загружается медленно или странно, вы можете явно указать Vite, как с ней обращаться.

```ts
// vite.config.ts
import { defineConfig } from "vite"

export default defineConfig({
  optimizeDeps: {
    // Здесь мы явно просим Vite предоптимизировать эти зависимости
    include: [
      "lodash-es",
      "date-fns",
    ],
    // А эти, наоборот, исключаем из предоптимизации
    exclude: [
      "some-large-lib",
    ],
  },
})
```

Чаще всего вам это не понадобится, но при работе с "нестандартными" пакетами это может спасти время.

## Конфигурация preview-сервера

После сборки Vite может запустить локальный сервер, который будет отдавать уже собранную версию приложения (а не dev‑версию). Это удобно для локального теста продакшн-сборки.

```ts
// vite.config.ts
import { defineConfig } from "vite"

export default defineConfig({
  preview: {
    // Порт preview-сервера
    port: 5000,
    // Разрешаем доступ из сети
    host: true,
  },
})
```

Вы запускаете его командой:

```bash
# Здесь мы запускаем preview-сервер
npm run build
npm run preview
```

Так вы увидите приложение максимально близко к тому, что будет на продакшене.

## Конфиг как функция и режимы (mode)

### Конфигурация в зависимости от режима

Очень часто настройки для dev, test и prod отличаются. В Vite вы можете экспортировать не объект, а функцию, которая получит контекст.

```ts
// vite.config.ts
import { defineConfig } from "vite"

export default defineConfig(({ command, mode }) => {
  // Здесь мы определяем, собираем ли мы приложение
  const isBuild = command === "build"
  // Здесь мы определяем, в каком режиме мы находимся
  const isProduction = mode === "production"

  return {
    base: isProduction ? "/app/" : "/",
    build: {
      sourcemap: !isProduction,
      minify: isProduction ? "esbuild" : false,
    },
    server: {
      port: isProduction ? 4000 : 3000,
    },
  }
})
```

- command — "serve" или "build"
- mode — текущий режим (по умолчанию: "development" для dev и "production" для build, но вы можете задавать свои)

### Свои режимы и .env файлы

Режим можно указать явно:

```bash
# Здесь мы запускаем dev-сервер в режиме staging
vite --mode staging
```

Тогда Vite подхватит файлы:

- .env.staging
- .env.staging.local

И `mode` в конфиге будет `"staging"`. Это позволяет делать тонкие настройки под конкретные окружения.

## Организация конфигурации в крупных проектах

### Разделение конфига на модули

Когда конфиг растет, становится удобно разбить его на несколько файлов. Давайте посмотрим, как это может выглядеть.

```ts
// vite.config.ts
import { defineConfig } from "vite"
import baseConfig from "./config/vite.base"
import devConfig from "./config/vite.dev"
import prodConfig from "./config/vite.prod"

export default defineConfig(({ command, mode }) => {
  // Здесь мы выбираем нужный конфиг в зависимости от режима
  const envConfig = mode === "production" ? prodConfig : devConfig

  // Объединяем базовый конфиг с env-специфичным
  return {
    ...baseConfig,
    ...envConfig,
    // При необходимости вы можете докинуть что-то поверх
  }
})
```

Внутри `vite.base.ts` вы можете держать общие настройки: алиасы, плагины, CSS. В `vite.dev.ts` и `vite.prod.ts` — dev/production-специфику (порт, минификация, прокси).

### Использование TypeScript для типовой безопасности

Чтобы не запутаться в полях конфига, удобно использовать типы из Vite:

```ts
// config/vite.base.ts
import type { UserConfig } from "vite"
import { resolve } from "path"

const baseConfig: UserConfig = {
  resolve: {
    alias: {
      "@": resolve(__dirname, "../src"),
    },
  },
}

export default baseConfig
```

Тип `UserConfig` поможет вам избежать опечаток в названиях полей и подскажет возможные опции.

---

Конфигурация Vite — это гибкий инструмент, который можно подстроить под практически любой фронтенд-проект: от маленького SPA до сложного монорепозитория или библиотеки. Вы можете управлять корнем проекта, путями, dev-сервером, сборкой, CSS, плагинами и даже поведением на разных окружениях.  

Как только вы начнете осознанно использовать vite.config, устраивать деплой под разные среды и оптимизировать сборку, Vite перестанет быть "черной коробкой" и станет предсказуемым инструментом в вашей инфраструктуре.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как сделать разные настройки base для dev и prod без ручного изменения конфига

Используйте конфигурацию как функцию и режимы:

```ts
// vite.config.ts
import { defineConfig } from "vite"

export default defineConfig(({ mode }) => {
  // Здесь мы меняем base в зависимости от режима
  const isProd = mode === "production"

  return {
    base: isProd ? "/my-app/" : "/",
  }
})
```

Далее:

```bash
# Для dev
vite

# Для prod
vite build --mode production
```

Vite сам подставит нужное значение base.

---

### Как использовать разные .env файлы для dev, staging и prod

Создайте файлы:

- .env.development
- .env.staging
- .env.production  

Запускайте с указанием режима:

```bash
# Dev
vite --mode development

# Staging
vite --mode staging

# Prod build
vite build --mode production
```

В конфиге вы сможете ориентироваться по `mode`, а в коде использовать `import.meta.env`, куда попадут переменные из соответствующих .env файлов.

---

### Как настроить alias на общую папку в монорепозитории (pnpm workspace или Yarn workspaces)

Используйте абсолютный путь и, при необходимости, укажите `preserveSymlinks`:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "../shared/src"),
    },
    // Здесь мы сохраняем симлинки, если это необходимо
    preserveSymlinks: true,
  },
})
```

Теперь вы можете импортировать общий код:

```ts
// Здесь мы используем общий код из монорепозитория
import { utils } from "@shared/utils"
```

---

### Как выключить HMR для определенных файлов или модулей

Используйте хук `handleHotUpdate` в плагине:

```ts
// vite.config.ts
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    {
      name: "disable-hmr-for-json",
      // Здесь мы перехватываем обновления файлов
      handleHotUpdate({ file, server }) {
        if (file.endsWith(".json")) {
          // Перезапускаем полную перезагрузку страницы
          server.ws.send({ type: "full-reload" })
          // Возвращаем пустой массив, чтобы отключить HMR для этого файла
          return []
        }
      },
    },
  ],
})
```

Так вы можете выборочно управлять HMR и, например, всегда перезагружать страницу при изменении конфигурационных файлов.

---

### Как настроить кэширование статических файлов (cache control) на preview или prod

Vite сам по себе не управляет HTTP-заголовками на продакшне, этим занимается сервер (Nginx, CDN и т. д.). Но на preview-сервере можно прокинуть нужные заголовки через middleware:

```ts
// vite.config.ts
import { defineConfig } from "vite"

export default defineConfig({
  preview: {
    // Здесь мы добавляем middleware, который выставляет заголовки
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith("/assets/")) {
          // Устанавливаем заголовок кэширования для ассетов
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
        }
        next()
      })
    },
  },
})
```

На боевом сервере аналогичные заголовки нужно настроить в конфиге вашего веб-сервера или CDN.
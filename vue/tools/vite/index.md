---
metaTitle: Vite и Vue - современный стек для быстрого фронтенда
metaDescription: Подробное руководство по использованию Vite с Vue - от установки и настройки до оптимизации сборки и работы с окружениями
author: Олег Марков
title: Vite с Vue - практическое руководство для разработчиков
preview: Разберитесь как настроить и эффективно использовать Vite с Vue - быстрый дев-сервер, HMR, конфигурация плагинов и оптимизация под продакшн
---

## Введение

Vite и Vue сегодня часто идут в паре, когда речь заходит о современном фронтенд‑стеке. Vite решает боль медленных сборок и долгого старта дев‑сервера, а Vue дает удобный и понятный способ строить интерфейсы. В итоге вы получаете среду разработки, где изменения видны почти мгновенно, а сборка для продакшена остается гибкой и управляемой.

Здесь вы увидите, как шаг за шагом собрать проект на Vite и Vue, какие настройки действительно важны, где чаще всего возникают проблемы и как их решать. Я буду опираться на практические примеры и разбирать самые полезные возможности, а не только базовый стартовый шаблон.

---

## Что такое Vite и чем он отличается от классических сборщиков

### Архитектура разработки и сборки

Давайте коротко сравним подход Vite с привычными инструментами вроде Webpack:

- В режиме разработки Vite:
  - использует нативные ES‑модули в браузере;
  - не делает полноценную бандлинг‑сборку перед стартом;
  - отдает исходный код почти как есть, дополняя его небольшими обертками;
  - подгружает модули по запросу браузера.

- В режиме продакшена Vite:
  - собирает проект с помощью Rollup;
  - делает классические бандлы, чанки, минификацию, tree shaking;
  - позволяет тонко настраивать конфигурацию через один файл.

За счет этого дев‑сервер стартует за доли секунды даже на больших проектах, а HMR (горячая перезагрузка модулей) работает заметно быстрее.

### Почему Vite особенно хорошо сочетается с Vue

Vue и Vite фактически развиваются параллельно и оптимизированы друг под друга:

- есть официальный плагин @vitejs/plugin-vue;
- поддержка .vue‑файлов встроена через этот плагин;
- HMR учитывает особенности реактивности Vue;
- поддерживаются Vue 3 и, при необходимости, Vue 2 (через дополнительный плагин).

Смотрите, я покажу вам дальше, как это проявляется на практике при запуске и настройке проекта.

---

## Быстрый старт проекта Vite + Vue

### Установка с помощью npm create vite@latest

Сейчас стандартный способ — использовать create‑скрипт Vite. Откройте терминал и выполните:

```bash
npm create vite@latest my-vue-app
# Далее мастер предложит выбрать шаблон
# Выбираем:
# - Framework: Vue
# - Variant: JavaScript или TypeScript
```

После этого заходите в папку проекта и устанавливайте зависимости:

```bash
cd my-vue-app
npm install
npm run dev  # запуск дев-сервера
```

Vite поднимет сервер (по умолчанию на http://localhost:5173), и вы сразу увидите стартовую страницу Vue.

### Структура проекта на Vite + Vue

Давайте разберемся, какие файлы сгенерированы по умолчанию и что они делают.

Типичная структура:

```text
my-vue-app/
  index.html           # корневой HTML, с которым работает Vite
  vite.config.js       # конфигурация Vite
  package.json         # скрипты и зависимости
  src/
    main.js            # входная точка приложения Vue
    App.vue            # корневой компонент
    assets/            # статические ресурсы
```

Разберем main.js:

```js
// main.js
import { createApp } from 'vue'          // Импортируем фабрику приложения из Vue
import App from './App.vue'             // Импортируем корневой компонент
import './assets/main.css'              // Подключаем глобальные стили

// Создаем приложение Vue и монтируем его в элемент с id "app" в index.html
createApp(App).mount('#app')
```

В index.html Vite автоматически внедряет нужные скрипты:

```html
<!-- index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Vite + Vue</title>
  </head>
  <body>
    <!-- Здесь Vue смонтирует корневой компонент -->
    <div id="app"></div>
    <!-- Vite сам подставит корректный путь к main.js -->
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

Обратите внимание, что index.html здесь — полноценный шаблон, а не просто результат сборки. Vite работает именно с этим файлом во время разработки.

---

## Конфигурация Vite для Vue

### Базовый vite.config.js с плагином Vue

Когда вы создаете проект со стандартным шаблоном Vue, Vite уже настраивает плагин. Посмотрим:

```js
// vite.config.js
import { defineConfig } from 'vite'            // Хелпер для типизированной конфигурации
import vue from '@vitejs/plugin-vue'          // Официальный плагин для Vue

// Экспортируем конфигурацию Vite
export default defineConfig({
  plugins: [
    vue()                                     // Подключаем поддержку .vue-файлов и HMR
  ]
})
```

Этот базовый конфиг уже достаточно хорош для большинства случаев. Но чаще всего вам нужно будет добавить ресурсы, алиасы, окружения и т.п.

### Настройка алиасов (paths)

Вам, вероятно, захочется писать импорты вроде:

```js
import MyComponent from '@/components/MyComponent.vue'
```

Для этого удобно ввести алиас @, указывающий на папку src:

```js
// vite.config.js
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Здесь мы задаем алиас "@" как путь к src
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

Теперь вы можете использовать:

```js
// src/main.js
import App from '@/App.vue'             // Вместо относительного пути './App.vue'
```

Такой подход заметно упрощает навигацию в больших проектах, где относительные пути становятся громоздкими.

### Настройка базового пути (base)

Если приложение будет развернуто не в корне домена, а, например, по адресу /app/, нужно настроить base:

```js
// vite.config.js
export default defineConfig({
  plugins: [vue()],
  base: '/app/'    // Все пути к ресурсам будут начинаться с /app/
})
```

Это особенно важно, если вы собираете статику для размещения в подкаталоге на nginx или GitHub Pages.

---

## Работа с .vue‑компонентами во Vite

### Поддержка Single File Components

Плагин @vitejs/plugin-vue включает поддержку SFC (Single File Components). Структура стандартная:

```vue
<!-- App.vue -->
<template>
  <div class="app">
    <!-- Выводим сообщение из реактивных данных -->
    <h1>{{ message }}</h1>
    <!-- Добавляем кнопку, обрабатываем клик -->
    <button @click="increment">
      Счетчик - {{ count }}
    </button>
  </div>
</template>

<script setup>
// Импортируем реактивные примитивы Vue
import { ref } from 'vue'

// Создаем реактивные переменные
const message = ref('Приложение на Vite и Vue')
const count = ref(0)

// Функция, которая увеличивает счетчик
function increment() {
  count.value++
}
</script>

<style scoped>
/* Локальный стиль только для этого компонента */
.app {
  font-family: system-ui, sans-serif;
  padding: 16px;
}
</style>
```

Как видите, здесь нет ничего специфического для Vite. Главное — Vite очень быстро пересобирает и обновляет именно те части компонента, которые вы меняете.

### HMR (горячая перезагрузка модулей)

Когда вы меняете шаблон, стили или скрипт в .vue‑файле:

- Vite не перезагружает страницу целиком;
- пересчитывается только измененный модуль;
- состояние приложения чаще всего сохраняется (особенно при изменении стилей или шаблона).

Это особенно заметно при разработке форм или сложных интерфейсов, где перезагрузка страницы мешала бы.

---

## Работа с CSS и препроцессорами

### Импорт стилей в компонентах и глобально

Вариант 1 — глобальные стили:

```js
// main.js
import './assets/main.css'   // Подключаем один раз для всего приложения
```

Вариант 2 — локальные стили в компонентах:

```vue
<style scoped>
/* Эти стили будут применяться только внутри текущего компонента */
.button {
  background-color: #42b883;
}
</style>
```

Vite автоматически обрабатывает CSS, минифицирует их в продакшене и поддерживает HMR для стилей.

### Подключение Sass или других препроцессоров

Если вы хотите использовать Sass (SCSS), достаточно установить зависимости:

```bash
npm install -D sass
```

Теперь вы можете писать:

```vue
<style scoped lang="scss">
$primary: #42b883;

.button {
  background-color: $primary;
  &:hover {
    opacity: 0.9;
  }
}
</style>
```

Если вы хотите глобально подключать общие переменные, можно воспользоваться полем css.preprocessorOptions:

```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Эта строка будет добавлена в каждый SCSS-файл автоматически
        additionalData: `@use "@/styles/variables.scss" as *;`
      }
    }
  }
})
```

Так вы избавляетесь от повторяющихся импортов в каждом компонента.

---

## Статические файлы и assets

### Папка public и импорт из src

В Vite есть два основных способа работать с ресурсами.

1. Папка public (копируется как есть):

   - размещаете, например, public/logo.png;
   - доступно по пути /logo.png без импорта в JS;
   - хорошо подходит для фавиконок, манифестов, больших статичных файлов.

2. Импорт из src:

```vue
<script setup>
// Импортируем изображение как модуль
import logoUrl from '@/assets/logo.svg'
</script>

<template>
  <img :src="logoUrl" alt="Логотип" />
</template>
```

Vite при сборке оптимизирует такие ресурсы: может инлайнить мелкие, хешировать имена файлов, раскладывать по чанкам.

### Динамические импорты ресурсов

Если нужен динамический путь, вы можете использовать new URL:

```js
// main.js или в компоненте
const imageUrl = new URL('./assets/photo.png', import.meta.url).href
// imageUrl будет содержать корректный путь к файлу в дев-режиме и продакшене
```

Этот подход удобен, когда вы формируете путь к ресурсу не через прямой импорт.

---

## Окружения и переменные среды в Vite + Vue

### Файлы .env.* и их приоритет

Vite из коробки поддерживает разные файлы окружений:

- .env — общие переменные для всех режимов;
- .env.development — только для dev;
- .env.production — только для продакшена;
- .env.local, .env.development.local — для локальных секретов (не коммитятся).

Важно: переменные, которые должны быть доступны в клиентском коде (в Vue), обязаны начинаться с VITE_.

Пример .env.development:

```
VITE_API_URL=http://localhost:3000
VITE_FEATURE_X_ENABLED=true
```

### Использование переменных окружения в коде Vue

В коде вы обращаетесь к переменным через import.meta.env:

```js
// src/services/api.js
// Здесь мы читаем переменную окружения, заданную в файлах .env.*
const API_URL = import.meta.env.VITE_API_URL

export function fetchUsers() {
  // Используем базовый URL из окружения
  return fetch(`${API_URL}/users`)
    .then((res) => res.json())
}
```

Или в компоненте:

```vue
<script setup>
// Получаем доступ к окружению
const apiUrl = import.meta.env.VITE_API_URL
</script>

<template>
  <p>API URL - {{ apiUrl }}</p>
</template>
```

Если вы укажете переменную без префикса VITE_, она будет видна только в конфиге Vite (vite.config.js), но не в клиентском коде.

---

## Оптимизация разработки и продакшена

### Настройка дев‑сервера

Если у вас нестандартный порт или нужно пробросить хост, вы можете настроить devServer:

```js
// vite.config.js
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,           // Порт дев-сервера
    host: '0.0.0.0',      // Позволяет заходить по IP в локальной сети
    open: true            // Автоматически открывать браузер
  }
})
```

Для работы в Docker или на удаленной машине часто используют host: '0.0.0.0'.

### Прокси для бэкенда

Частая задача — настроить прокси для API, чтобы не писать длинные урлы и обойти CORS в дев‑режиме.

```js
// vite.config.js
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // Все запросы, начинающиеся с /api, будут проксироваться на указанный адрес
      '/api': {
        target: 'http://localhost:4000', // Адрес бэкенда
        changeOrigin: true,              // Подменяет Origin, чтобы обойти CORS
        rewrite: (path) => path.replace(/^\/api/, '') 
        // Переписываем путь /api/users -> /users
      }
    }
  }
})
```

Теперь в коде вы можете писать:

```js
// src/services/api.js
export function fetchUsers() {
  // Делает запрос на /api/users, который Vite проксирует на бэкенд
  return fetch('/api/users').then((res) => res.json())
}
```

### Настройки сборки (build)

Для продакшена можно управлять размером чанков, именами файлов и т.п.:

```js
// vite.config.js
export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',           // Папка для сборки
    sourcemap: true,          // Включаем source map для отладки
    rollupOptions: {
      output: {
        manualChunks: {
          // Выносим Vue и связанные библиотеки в отдельный чанк vendor
          vendor: ['vue', 'vue-router', 'pinia']
        }
      }
    }
  }
})
```

Sourcemap удобно включать на staging‑окружении, но в продакшене иногда отключают по соображениям безопасности и размера.

---

## Интеграция Vue Router и Pinia во Vite‑проекте

### Добавление Vue Router

Установите зависимость:

```bash
npm install vue-router
```

Создадим файл маршрутизатора:

```js
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
// Импортируем компоненты для маршрутов
import HomeView from '@/views/HomeView.vue'
import AboutView from '@/views/AboutView.vue'

// Определяем массив маршрутов
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView  // Компонент для главной страницы
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView // Компонент для страницы "О нас"
  }
]

// Создаем экземпляр роутера с HTML5-историей
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
```

Теперь подключим роутер к приложению:

```js
// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'     // Импортируем роутер

import './assets/main.css'

const app = createApp(App)

// Подключаем роутер к приложению
app.use(router)

// Монтируем приложение
app.mount('#app')
```

И скорректируем App.vue:

```vue
<!-- App.vue -->
<template>
  <div>
    <!-- Ссылки между страницами -->
    <nav>
      <!-- RouterLink рисует ссылки без перезагрузки страницы -->
      <RouterLink to="/">Главная</RouterLink>
      <RouterLink to="/about">О нас</RouterLink>
    </nav>

    <!-- RouterView рендерит активный маршрут -->
    <RouterView />
  </div>
</template>

<script setup>
// В режиме auto импортов Vite может сам подтягивать компоненты роутера,
// но в базовой конфигурации их лучше импортировать явно:
import { RouterLink, RouterView } from 'vue-router'
</script>
```

Теперь вы увидите, как разные компоненты подставляются в <RouterView> при навигации.

### Подключение Pinia для управления состоянием

Pinia — это рекомендуемый стейт‑менеджер для Vue 3. Установим его:

```bash
npm install pinia
```

Создадим хранилище:

```js
// src/stores/counter.js
import { defineStore } from 'pinia'

// Создаем стор "counter" с состоянием и действиями
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0    // Храним текущее значение счетчика
  }),
  actions: {
    increment() {
      this.count++
    }
  }
})
```

Подключим Pinia в main.js:

```js
// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia' // Импортируем функцию для создания хранилища
import App from './App.vue'
import router from './router'

import './assets/main.css'

const app = createApp(App)

// Создаем экземпляр Pinia и подключаем его
app.use(createPinia())
app.use(router)

app.mount('#app')
```

Теперь давайте используем стор в компоненте:

```vue
<!-- src/components/CounterPanel.vue -->
<template>
  <div>
    <p>Значение счетчика - {{ counter.count }}</p>
    <button @click="counter.increment">
      Увеличить
    </button>
  </div>
</template>

<script setup>
// Импортируем хук для работы с хранилищем
import { useCounterStore } from '@/stores/counter'

// Получаем экземпляр стора
const counter = useCounterStore()
</script>
```

Обратите внимание, что состояние хранится в одном месте, а компонент только подписывается на него и вызывает действия.

---

## Плагины и расширение возможностей Vite + Vue

### Использование официальных и сторонних плагинов Vite

Vite устроен так, что большая часть функциональности расширяется через плагины. Для Vue‑проекта вам может пригодиться:

- @vitejs/plugin-vue-jsx — поддержка JSX/TSX;
- vite-plugin-pages — автоматическая генерация маршрутов на основе файловой системы;
- unplugin-auto-import — автоматический импорт часто используемых функций;
- unplugin-vue-components — автоматическая регистрация компонентов.

Пример подключения нескольких плагинов:

```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  plugins: [
    vue(),      // Основная поддержка Vue
    vueJsx()    // Поддержка JSX в компонентах
  ]
})
```

Теперь вы можете создавать компоненты в стиле JSX, если это удобно вам или команде.

### Автоимпорты Vue‑функций и компонентов

Чтобы не писать каждый раз import { ref, computed } from 'vue', можно настроить автоимпорт.

Установим плагины:

```bash
npm install -D unplugin-auto-import unplugin-vue-components
```

И настроим конфиг:

```js
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  plugins: [
    vue(),
    // Автоматически импортировать функции из Vue, Vue Router, Pinia и т.п.
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      dts: 'src/auto-imports.d.ts' // Файл для типов (актуально для TS)
    }),
    // Автоматически регистрировать компоненты
    Components({
      dirs: ['src/components'],     // Каталоги, где искать компоненты
      dts: 'src/components.d.ts'    // Генерация типов
    })
  ]
})
```

После этого вы можете в SFC использовать ref, computed, defineComponent, RouterLink и т.д. без явных импортов, а компоненты из src/components будут доступны по имени.

---

## Тестирование в проектах Vite + Vue

### Настройка Vitest с Vue

Vitest — это тест‑раннер, ориентированный под Vite. Давайте подключим его к Vue‑проекту.

Установка:

```bash
npm install -D vitest @vitejs/plugin-vue @vue/test-utils jsdom
```

Создадим vitest.config.js:

```js
// vitest.config.js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],          // Поддержка .vue в тестах
  test: {
    environment: 'jsdom',    // Эмулируем браузер
    globals: true,           // Включаем глобальные функции describe, it, expect
    setupFiles: './tests/setup.js' // Опциональный файл с инициализацией
  }
})
```

Теперь сделаем простой тест компонента:

```vue
<!-- src/components/HelloMessage.vue -->
<template>
  <h1>Hello {{ name }}</h1>
</template>

<script setup>
// Описываем входной проп "name"
defineProps({
  name: {
    type: String,
    required: true
  }
})
</script>
```

Тест:

```js
// tests/HelloMessage.test.js
import { mount } from '@vue/test-utils'
import HelloMessage from '@/components/HelloMessage.vue'

test('рендерит имя в заголовке', () => {
  // Монтируем компонент с пропом name
  const wrapper = mount(HelloMessage, {
    props: {
      name: 'Vite'
    }
  })

  // Проверяем, что текст заголовка содержит нужное значение
  expect(wrapper.text()).toContain('Hello Vite')
})
```

Запуск тестов:

```bash
npx vitest
```

Или добавить в package.json:

```json
{
  "scripts": {
    "test": "vitest"
  }
}
```

Так вы получите быструю среду тестирования, тесно интегрированную с конфигом Vite.

---

## Типичные проблемы и отладка Vite + Vue проектов

### Ошибки с путями и base при деплое

Распространенная ситуация — локально все работает, а после деплоя ресурсы не находятся (404). Часто причина в неправильном base.

Порядок действий:

1. Уточните, по какому пути открывается приложение (например, /, /app/ или /my/project/).
2. Установите base в vite.config.js:

   ```js
   export default defineConfig({
     base: '/my/project/',
     plugins: [vue()]
   })
   ```

3. Пересоберите проект и заново задеплойте статику.

Так Vite сгенерирует корректные пути к скриптам и стилям.

### Конфликты с CORS при работе с API

Если вы обращаетесь к внешнему API в дев‑режиме и получаете CORS‑ошибки, сначала имеет смысл настроить proxy на дев‑сервере Vite (как выше). Если это невозможно, проверяйте:

- настроены ли на сервере CORS‑заголовки (Access-Control-Allow-Origin);
- совпадает ли схема (http/https) и порт;
- нет ли лишних заголовков, которые сервер не разрешает.

Для начальной отладки удобно использовать прокси в server.proxy, а уже потом настраивать CORS на реальном бэкенде.

### Ошибки при импорте .vue в тестах или скриптах

Если вы пытаетесь импортировать .vue‑файлы вне дев‑сервера Vite (например, в Vitest или скриптах Node), почти всегда нужно:

- использовать @vitejs/plugin-vue в конфигурации (vite.config.js или vitest.config.js);
- запускать код через Vite/Vitest, а не через чистый Node.

Если вы видите ошибку вида Unexpected token < в .vue‑файле, значит, код обрабатывается без плагина Vue.

---

## Заключение

Vite в связке с Vue дает удобный и быстрый рабочий процесс: дев‑сервер практически мгновенно стартует, изменения в компонентах сразу же видны в браузере, а сборка продакшена остается прозрачной и настраиваемой. Важный плюс — то, что Vite не навязывает сложную структуру: вы работаете с обычным index.html, стандартными .vue‑компонентами и можете постепенно добавлять плагины и инструменты по мере роста проекта.

Если резюмировать практические моменты, которые особенно стоит удержать:

- используйте официальный @vitejs/plugin-vue и настраивайте алиасы для удобных импортов;
- правильно работайте с окружениями через .env.* и import.meta.env с префиксом VITE_;
- настраивайте server.proxy для комфортной разработки с бэкендом;
- подключайте Vue Router и Pinia через привычные createRouter и createPinia — Vite с ними отлично работает из коробки;
- для тестов удобно использовать Vitest, который понимает конфиг Vite и .vue‑компоненты.

Дальше вы можете углубляться в оптимизацию (разбиение чанков, анализ размера бандла), интеграцию SSR или micro‑frontend подходов. Но даже базовая конфигурация Vite + Vue уже дает вам современный, быстрый и простой в поддержке фронтенд‑проект.

---

## Частозадаваемые технические вопросы по Vite с Vue

### Как настроить абсолютные импорты в TypeScript вместе с алиасами Vite

1. В vite.config.ts добавьте алиас @ на src.
2. В tsconfig.json в разделе compilerOptions пропишите:

   ```json
   {
     "baseUrl": ".",
     "paths": {
       "@/*": ["src/*"]
     }
   }
   ```

3. Перезапустите дев‑сервер, чтобы IDE и Vite подхватили настройки.

### Как сделать несколько точек входа (multi page) во Vite + Vue

1. В vite.config.js добавьте в build.rollupOptions.input несколько HTML‑файлов:

   ```js
   build: {
     rollupOptions: {
       input: {
         main: 'index.html',
         admin: 'admin.html'
       }
     }
   }
   ```

2. Создайте admin.html по аналогии с index.html и укажите в нем свой main‑скрипт.
3. Каждый HTML будет иметь свою Vue‑инициализацию.

### Как настроить код‑сплиттинг по маршрутам (lazy loading компонентов)

1. В конфигурации роутера используйте динамический импорт:

   ```js
   const AboutView = () => import('@/views/AboutView.vue')
   ```

2. Vue Router и Vite автоматически создадут отдельный чанк для AboutView.
3. Такой чанк загрузится только при переходе на соответствующий маршрут.

### Как подключить глобальные переменные окружения без префикса VITE_ в Vue коде

Напрямую нельзя — это ограничение безопасности. Обходной путь:

1. В vite.config.js прочитайте нужные переменные process.env.*.
2. Передайте их в define:

   ```js
   define: {
     __BUILD_ENV__: JSON.stringify(process.env.BUILD_ENV)
   }
   ```

3. В Vue‑коде используйте глобальную константу __BUILD_ENV__.

### Как использовать алиасы и import.meta.env в Jest, если проект мигрирует на Vite

1. Для Jest нужно вручную настроить moduleNameMapper в jest.config:
   - сопоставьте ^@/(.*)$ -> <rootDir>/src/$1.
2. Переменные окружения import.meta.env в Jest не работают напрямую:
   - создайте shim, где замените import.meta.env на process.env или объект‑мок;
   - используйте babel‑ или ts‑преобразование с плагином, подменяющим import.meta.env.
---
metaTitle: Использование Vite для быстрого старта и сборки проектов на Vue 3
metaDescription: Ознакомьтесь с тем как Vite ускоряет разработку и сборку Vue 3 проектов - настройка, примеры, особенности работы с плагинами и деплоем
author: Олег Марков
title: Использование Vite для быстрого старта и сборки проектов на Vue 3
preview: Разберите практику применения Vite в современных Vue 3 приложениях - запуск среды, сборка, настройка и масштабирование на реальных примерах
---

## Введение

Современная разработка фронтенд-приложений требует инструментов, которые делают процессы запуска и сборки быстрыми и простыми. Если вы работали с Vue CLI или webpack, то наверняка сталкивались с длительной сборкой, сложной настройкой и долгим запуском dev-сервера. С выходом Vite разработка и сборка проектов на Vue 3 стали значительно удобнее.

Vite — это инструмент для сборки проектов следующего поколения. Он изначально проектировался, чтобы быть максимально быстрым при разработке, мгновенно запускать dev-серверы, а также давать современный подход к сборке финальных версий. Vite идеально совместим с Vue 3 благодаря специальным плагинам и интеграциям.  
В этой статье вы разберётесь, как с помощью Vite можно быстро стартовать разработку на Vue 3, настроить проект, расширить его, запускать и собирать для продакшена.

## Что такое Vite и почему он так популярен

Vite расшифровывается как "быстрый" на французском языке. Его основной принцип — использовать современные возможности браузеров (ES-модули), чтобы ускорить запуск и организацию разработки. Для сборки финальной версии Vite использует Rollup, что даёт оптимизированный итоговый бандл.

Среди основных фишек Vite:
- Мгновенный запуск dev-сервера без необходимости пересобирать проект.
- Быстрая горячая перезагрузка (HMR).
- Простая настройка под любой стек.
- Отличная поддержка Vue 3 — отдельный @vitejs/plugin-vue.
- Нативная поддержка TypeScript, CSS Pre-processors и PostCSS.
- Лёгкая интеграция плагинов, как официальных, так и сообществом.

Теперь давайте разберём, как стартовать с Vite для Vue 3 буквально за считанные минуты.

Vite — это современный инструмент сборки, который значительно ускоряет разработку Vue 3 проектов. Чтобы эффективно использовать Vite, важно понимать не только его возможности, но и принципы работы с плагинами, настройки и деплоя. Если вы хотите освоить Vite и применять его для повышения скорости разработки Vue 3 проектов, приходите на наш большой курс [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=ispolzovanie-vite-dlya-bystrogo-starta-i-sborki-proektov-na-vue-3). На курсе 173 урока и 21 упражнение, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Быстрый старт проекта Vue 3 с помощью Vite

### Установка и создание нового проекта

Посмотрите, насколько просто запустить современный Vue 3 проект с Vite. Всё, что вам нужно — NodeJS версии 16+.

Выполните команду (выберите npm, yarn или pnpm — что вам удобнее):

```bash
npm create vite@latest my-vue-app -- --template vue
# Или с помощью yarn
yarn create vite my-vue-app --template vue
# Для pnpm
pnpm create vite my-vue-app -- --template vue
```

- `my-vue-app` — это название вашего будущего проекта.
- `--template vue` сообщает Vite, что нужен проект с настроенным Vue 3.

После этого переходите в созданную папку и устанавливайте зависимости:

```bash
cd my-vue-app
npm install
```

Готово! Проект уже настроен. Теперь для запуска используйте:

```bash
npm run dev
# Проект будет доступен по адресу http://localhost:5173/
```

Вы увидите стартовую страницу Vue 3. Dev-сервер запускается практически мгновенно — это именно то, чем Vite завоёвывает симпатии разработчиков.

### Структура начального проекта

После создания проекта с шаблоном Vue, структура будет следующей:

```
my-vue-app/
├── node_modules/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── App.vue
│   ├── main.js
│   └──...
├── index.html
├── package.json
├── vite.config.js
└── ...
```

- `public/` для общих файлов (например, иконок, favicons).
- `src/` — весь исходный код (компоненты, стили, логика).
- `index.html` — корневой HTML-файл для старта приложения.
- `vite.config.js` — файл с конфигурацией Vite. Давайте подробнее разберём этот файл.

### Конфигурация Vite для Vue 3

Откройте файл `vite.config.js`. В автоматически сгенерированном проекте этот файл выглядит так:

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Вы можете тут добавлять свои настройки, например, alias или переменные среды
})
```

- Vite определяет плагины через массив `plugins`. Здесь уже подключён плагин для Vue.
- Если хотите использовать алиасы (например, `@` для `src/`), добавьте настройку:

```js
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src') // Теперь импорт руками: import x from '@/components/x.vue'
    }
  }
})
```

Эта настройка часто используется для сокращения длинных путей и удобной работы с импортами.

#### Работа с переменными среды (Environment Variables)

Если нужны переменные среды, вы можете создавать файлы `.env`, `.env.development`, `.env.production` в корне проекта. Например:

```
VITE_API_URL=https://api.site.com
```

В коде их можно использовать через `import.meta.env`:

```js
console.log(import.meta.env.VITE_API_URL) // Выведет переменную из .env
```

Все переменные должны начинаться с `VITE_`, иначе Vite их не подхватит.

### Основные возможности Vite в разработке Vue 3

#### Горячая перезагрузка (HMR)

Одна из ярких "фишек" Vite — это lightning-fast горячая перезагрузка. При изменении кода страницы обновляются практически мгновенно, а не полностью перезагружаются. Это сильно ускоряет разработку, особенно в больших проектах.

#### Импортирование файлов и поддержка стилей

В Vite поддерживаются различные типы файлов "из коробки" — JavaScript, TypeScript, CSS, LESS, SCSS, YAML и т.д. Вот пример, как можно импортировать стили и использовать их в проекте:

```js
// main.js
import './assets/main.css'
```

В компоненте Vue можно подключить scoped-стили:

```vue
<template>
  <div class="hello">Привет, мир!</div>
</template>

<style scoped>
.hello {
  color: #333;
}
</style>
```

#### Работа с TypeScript

Проект изначально можно создать с помощью шаблона `vue-ts`, тогда Vite сразу подготавливает всё необходимое:

```bash
npm create vite@latest my-vue-ts-app -- --template vue-ts
```

Если TypeScript нужен после, просто добавьте его как зависимость (`npm install --save-dev typescript @types/node`) и начните использовать `.ts` файлы. Vite автоматически подхватит их.

#### Работа с компонентами Vue 3 и структура проекта

Смотрите, пример добавления нового компонента:

Создайте файл `src/components/HelloWorld.vue`:

```vue
<template>
  <div>
    <h1>{{ msg }}</h1>
  </div>
</template>

<script setup>
defineProps({
  msg: String
})
</script>
```

Добавьте его в `App.vue`:

```vue
<template>
  <HelloWorld msg="Добро пожаловать в мой первый проект на Vite + Vue 3!" />
</template>

<script setup>
import HelloWorld from './components/HelloWorld.vue'
</script>
```

Теперь на главной странице появится новое приветствие. Как видите, всё максимально просто и быстро.

### Установка и настройка дополнительных плагинов

#### Добавление Vue Router

Vue Router — это стандартный роутинг для Vue-приложений. Установка максимально простая:

```bash
npm install vue-router@4
```

Дальше создавайте файл `src/router/index.js`:

```js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // история браузера
  routes,
})

export default router
```

В `main.js` подключите роутер:

```js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
```

Теперь приложение поддерживает маршрутизацию.

#### Добавление Pinia (стейт менеджер)

Pinia — современный менеджер состояния для Vue. С ним легко управлять данными на всем протяжении приложения.

```bash
npm install pinia
```

В `main.js` подключаете:

```js
import { createPinia } from 'pinia'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

Теперь создайте стор:

```js
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  actions: {
    increment() {
      this.count++
    }
  }
})
```

Используйте в компонентах:

```js
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
counter.increment()
console.log(counter.count) // Выведет 1
```

### Настройка сборки для продакшена

Для продакшен-сборки используется команда:

```bash
npm run build
```

- Весь скомпилированный код появится в папке `dist`.
- По умолчанию включена минификация, оптимизация, code-splitting.
- Вы можете изменить настройки выходной папки через параметр `build.outDir` в `vite.config.js`:

```js
export default defineConfig({
  build: {
    outDir: 'build-folder', // Например, папка 'build-folder'
    sourcemap: true, // Если нужны карты исходников
  }
})
```

#### Импорт статических файлов

Любые файлы из папки `public/` будут скопированы в папку с итоговой сборкой и доступны по URL, соответствующему их имени.

### Использование пользовательских плагинов и расширение Vite

Vite поддерживает создание собственных плагинов, что актуально для расширения функционала. Вот пример, как добавить плагин для работы со специфичными файлами:

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// Допустим, нужен плагин для env variables
import dotenv from 'dotenv'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'my-custom-plugin',
      config() {
        dotenv.config() // Импортировать env переменные из .env файла
      }
    }
  ]
})
```

С помощью массива `plugins` вы можете добавлять сторонние или свои плагины — например, для SVG-иконок, автоимпорта компонентов и прочего.

### Пример полного рабочего процесса

- Создаёте проект через `npm create vite@latest`.
- Настраиваете роутер и менеджер состояния.
- Добавляете плагины по необходимости.
- Разрабатываете с удобной горячей перезагрузкой.
- Собираете финальный билд через `npm run build`.
- Результат отправляете на хостинг (например, Netlify, Vercel, или собственный сервер).

#### Типичный workflow:

```bash
npm create vite@latest my-vue-app -- --template vue
cd my-vue-app
npm install
npm run dev # Разработка

# После окончания
npm run build # Финальная сборка
```

## Деплой готового проекта

Готовый проект после сборки (`dist/`) можно деплоить почти на любой современный фронтенд-хостинг: Vercel, Netlify, GitHub Pages, Surge и др.

Например, для Netlify:
- Зарегистрируйтесь.
- Создайте новый сайт через импорт репозитория.
- В настройках Build укажите:  
  - Build command: `npm run build`
  - Publish directory: `dist`

После этого при каждом пуше в репозиторий сайт будет автоматически пересобираться и публиковаться.

Для Vercel и других сервисов процесс похожий — настройка почти идентична.

## Возможные проблемы и пути их решения

- Если проект не стартует, проверьте, что NodeJS обновлён до актуальной версии (16+).
- Ошибки при импорте файлов часто связаны с неправильной настройкой alias или отсутствием соответствующих зависимостей.
- Специфические плагины для Vite/webpack несовместимы, убедитесь, что используете только плагины, рассчитанные на Vite.
- Если в составе проекта много медленных библиотек — попробуйте добавить их через CDN или динамический импорт.

В целом, переход на Vite облегчает старт и развитие проектов на Vue 3. Всё дополнительное расширение делается быстро, а большинство плагинов уже существует для всех стандартных задач.

Понимание Vite позволяет значительно ускорить разработку Vue 3 проектов. Для глубокого изучения Vite, его преимуществ и оптимизации сборки проектов, рекомендуем наш курс [Vue.js 3, Vue Router и Pinia](https://purpleschool.ru/course/vuejs?utm_source=knowledgebase&utm_medium=article&utm_campaign=ispolzovanie-vite-dlya-bystrogo-starta-i-sborki-proektov-na-vue-3). В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в мир Vue и Vite уже сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

#### Как добавить поддержку SCSS, Less или других CSS-препроцессоров в проект на Vite?

Для SCSS:
```bash
npm install -D sass
```
Дальше используйте:
```vue
<style lang="scss">
// ваш SCSS-код
</style>
```
Для Less:
```bash
npm install -D less
```
И используйте:
```vue
<style lang="less">
// Less-стили здесь
</style>
```

#### Как в Vite настроить абсолютные импорты из любой папки проекта?

Добавьте в `vite.config.js`:
```js
import path from 'path'
export default {
  resolve: {
    alias: {
      '@foo': path.resolve(__dirname, 'src/foo')
    }
  }
}
```
Теперь можно импортировать через `@foo/SomeComponent`.

#### Как правильно подключить иконки SVG как компоненты Vue?

Установите [vite-plugin-svg-icons](https://github.com/vbenjs/vite-plugin-svg-icons):
```bash
npm install vite-plugin-svg-icons -D
```
Добавьте в plugins:
```js
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

createSvgIconsPlugin({
  iconDirs: [path.resolve(process.cwd(), 'src/icons')],
  symbolId: '[name]'
})
```
Теперь можно использовать `<svg-icon name="icon-name" />`.

#### Почему Vite не работает с некоторыми плагинами webpack?

Vite не совместим с webpack-плагинами, так как имеет другую архитектуру. Ищите аналоги с префиксом `vite-plugin-` или используйте стандартные возможности Vite/ESBuild.

#### Как использовать внешние глобальные библиотеки (например, через CDN)?

Добавьте их в `index.html` с помощью `<script src="..."></script>`, затем используйте как глобальные переменные через window. Либо настройте externals с помощью vite-plugin-externals если библиотеку не хочется бандлить в проект.

---
metaTitle: Гайд по Nuxt JS для начинающих
metaDescription: Полное руководство по Nuxt JS - разбор структуры проекта, основных возможностей, настройки маршрутизации и SSR, объяснения для новичков
author: Олег Марков
title: Гайд по Nuxt JS для начинающих
preview: Освойте основы работы с Nuxt JS - получите подробные объяснения структуры, рендеринга, маршрутизации и API на практических примерах
---

## Введение

Nuxt JS — это фреймворк для разработки веб-приложений на базе Vue JS, который значительно упрощает создание серверных и одностраничных приложений. Nuxt — один из самых популярных инструментов для ускорения разработки, улучшения SEO и оптимизации пользовательского опыта благодаря поддержке серверного рендеринга (SSR), статической генерации (SSG) и гибкой конфигурации. В этом гайде вы узнаете, как устроен Nuxt JS, как организовать структуру вашего первого проекта, какие возможности инструмент предоставляет и как эффективно их применять.

## Установка и создание проекта

### Предварительная подготовка

Перед началом потребуется, чтобы у вас были установлены Node.js и менеджер пакетов npm или yarn. Для проверки выполните в терминале:

```bash
node -v
npm -v
```
Если версия Node.js ниже 14, обновите Node для корректной работы современного Nuxt.

### Установка с помощью создания нового проекта Nuxt

Самый простой способ начать — использовать утилиту create-nuxt-app. Смотрите, как это делается:

```bash
npx nuxi init my-nuxt-app
cd my-nuxt-app
npm install
npm run dev
```
- `npx nuxi init` — инициализация шаблона.
- `npm install` — установка зависимостей.
- `npm run dev` — запуск проекта в режиме разработки.

Когда команда завершится, откройте браузер и перейдите по адресу http://localhost:3000. Вы увидите стартовую страницу Nuxt-проекта.

## Структура проекта Nuxt JS

Nuxt поощряет определенную структуру проекта, что облегчает как начало разработки, так и масштабирование решения.

```
my-nuxt-app/
  ├─ assets/         // Статические ресурсы (например, изображения, шрифты, стили)
  ├─ components/     // Компоненты Vue
  ├─ layouts/        // Макеты страниц
  ├─ middleware/     // Мидлвары (логика между запросом и обработкой страницы)
  ├─ pages/          // Все страницы приложения, маршруты формируются автоматически
  ├─ plugins/        // Подключаемые плагины
  ├─ public/         // Публичные файлы, загружаемые как есть
  ├─ nuxt.config.ts  // Главная конфигурация Nuxt
```

Давайте разберём каждую папку и возможную логику их применения.

### pages/

Все файлы в `pages` автоматически становятся страницами вашего приложения. Например, если создать файл `about.vue`, то страница будет доступна по адресу `/about`. Это делает настройку маршрутизации очень простой.

```vue
<!-- pages/about.vue -->
<template>
  <div>
    <h1>О нас</h1>
    <p>Добро пожаловать на страницу О нас!</p>
  </div>
</template>
```
В данном примере автоматически появится маршрут `/about`.

### layouts/

Макеты (layouts) позволяют определить общий шаблон для страницы или группы страниц. Например, можно сделать основной макет с “шапкой” и “подвалом” сайта.

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <Header />
    <main>
      <NuxtPage /> <!-- Здесь рендерится содержимое страницы -->
    </main>
    <Footer />
  </div>
</template>

<script setup>
// Импорт компонентов для хедера и футера
import Header from '../components/Header.vue'
import Footer from '../components/Footer.vue'
</script>
```
Чтобы изменить макет для конкретной страницы, пропишите:

```vue
<script setup>
definePageMeta({
  layout: 'custom' // Используем макет custom.vue
})
</script>
```

### components/

В эту папку помещаются все Vue-компоненты, которые будут использоваться внутри страниц и макетов. Nuxt поддерживает автоматическое подключение компонентов — не нужно явно их импортировать внутри каждой страницы.

```vue
<!-- components/Button.vue -->
<template>
  <button class="my-btn"><slot /></button>
</template>
```
Теперь `<Button />` можно использовать в любом месте без импорта.

### assets/ и public/

- `assets` используются для препроцессируемых файлов (например, SCSS, изображения для статической сборки).
- `public` — для файлов, которые размещаются без изменений (например, favicon, robots.txt).

### plugins/

Папка для подключения сторонних библиотек и ваших собственных плагинов. Здесь удобно регистрировать фильтры, миксины или сторонние пакеты.

### nuxt.config.ts

Файл конфигурации для настройки работы всего приложения. Сюда попадают такие параметры, как имя и режим приложения, настройки роутера, подключаемые модули и плагины.

Пример минимального конфига:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      title: 'Мой Nuxt сайт'
    }
  },
  css: [
    '~/assets/main.css'
  ]
})
```

Здесь вы указываете глобальный заголовок и подключаете глобальные стили.

## Рендеринг: SSR, SSG, SPA

Одно из ключевых преимуществ Nuxt — поддержка различных стратегий рендеринга.

- SSR (Server-Side Rendering) — страница обрабатывается на сервере и приходит уже готовой. Это полезно для SEO и ускоряет первую отрисовку.
- SSG (Static Site Generation) — генерируются статические HTML-файлы при сборке.
- SPA (Single Page Application) — классическое одностраничное приложение; Nuxt позволяет запускать проект и в таком режиме.

В Nuxt 3 по умолчанию включён серверный рендеринг на Node.js, но вы можете указать тип рендеринга в конфиге:

```ts
export default defineNuxtConfig({
  ssr: true // Включён SSR (по умолчанию)
})
```

Или собрать только статические файлы:

```bash
npx nuxi generate
```
Генерация создаст готовые статические страницы в папке `.output/public`.

## Работа с маршрутизацией

Nuxt использует file-based routing — маршруты создаются автоматически на основе структуры папки `pages`.

- `pages/index.vue` становится `/`
- `pages/about.vue` — `/about`
- `pages/blog/index.vue` — `/blog`
- `pages/blog/[id].vue` — динамический маршрут `/blog/любое_значение`

#### Пример динамического маршрута:

```vue
<!-- pages/posts/[id].vue -->
<template>
  <div>
    <h1>Пост №{{ id }}</h1>
  </div>
</template>

<script setup>
const route = useRoute()
// Получаем параметр из маршрута
const id = route.params.id
</script>
```
В этом примере Nuxt создаёт страницу для каждого id, который попадёт в URL.

### Навигация по страницам

Для навигации используйте компонент `<NuxtLink>` (аналоги router-link из Vue Router):

```vue
<NuxtLink to="/about">О нас</NuxtLink>
```
Он позволяет делать переходы между страницами без перезагрузки.

## Использование API и данных

Nuxt поддерживает работу с сервером и API-запросы через специальные хуки.

### Функция useAsyncData

С помощью `useAsyncData` вы можете получать данные при загрузке страницы. Давайте рассмотрим пример, где мы получаем список пользователей с тестового API:

```vue
<template>
  <div>
    <h2>Пользователи</h2>
    <ul>
      <li v-for="user in data" :key="user.id">{{ user.name }}</li>
    </ul>
  </div>
</template>

<script setup>
const { data, pending, error } = await useAsyncData('users', () =>
  $fetch('https://jsonplaceholder.typicode.com/users')
)
// data — ответ API
// pending — загрузка данных
// error — возможная ошибка
</script>
```
Если данные долго грузятся, можно использовать `pending` для отображения прелоадера.

### Подключение ENV переменных

Nuxt позволяет безопасно хранить ключи API и другие переменные окружения в файле `.env`, используя модуль @nuxtjs/dotenv.

Пример переменной в `.env`:
```
API_URL=https://api.example.com
```
Для доступа к переменным используйте `useRuntimeConfig`:

```ts
const config = useRuntimeConfig()
const apiUrl = config.public.API_URL
```

## Стилизация и работа с CSS

В Nuxt вы можете использовать как классические CSS/SCSS/LESS файлы, так и CSS-фреймворки вроде Tailwind или Bootstrap.

### Глобальные стили

Глобальные файлы подключаются через блок `css` в nuxt.config.ts:

```ts
export default defineNuxtConfig({
  css: [
    '~/assets/styles/main.scss'
  ]
})
```

### Scoped-стили

Внутри любого компонента вы можете использовать `<style scoped>`, чтобы стили применялись только к текущему компоненту.

```vue
<template>
  <div class="card">Контент</div>
</template>

<style scoped>
.card {
  box-shadow: 0 2px 8px #c3c3c3;
}
</style>
```

## Плагины и модули Nuxt

Плагины позволяют расширять возможности приложения. Вы можете добавить сторонние библиотеки или собственные методы.

### Регистрация собственного плагина

Создайте файл, например, `plugins/myPlugin.ts`:

```ts
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('hello', (name: string) => `Привет, ${name}!`)
})
```
Теперь этот метод доступен во всех компонентах:

```vue
<script setup>
const { $hello } = useNuxtApp()
console.log($hello('Вася')) // Выведет: Привет, Вася!
</script>
```

### Использование модулей

Nuxt поддерживает множество модулей, например, для интеграции с Axios, TailwindCSS, PWA и т.д. Установить модуль можно через npm.

Пример добавления TailwindCSS:

```bash
npm install -D @nuxtjs/tailwindcss
```
В конфиге добавить:

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss']
})
```

## Продвинутая работа с данными: Store и Pinia

В Nuxt 3 Vuex больше не используется по умолчанию, вместо этого рекомендуется Pinia — новый удобный стейт-менеджер.

### Добавление Pinia

Установите пакет:

```bash
npm install @pinia/nuxt
```
Добавьте в модули nuxt.config.ts:

```ts
export default defineNuxtConfig({
  modules: ['@pinia/nuxt']
})
```

#### Пример store

Создаем новый store:

```ts
// stores/useCounter.ts
import { defineStore } from 'pinia'

export const useCounter = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    increment() {
      this.count++
    }
  }
})
```

Используем в компоненте:

```vue
<script setup>
const counter = useCounter()
</script>

<template>
  <button @click="counter.increment">{{ counter.count }}</button>
</template>
```
Pinia отлично интегрируется с Nuxt, позволяя управлять состоянием приложения просто и прозрачно.

## Взаимодействие с сервером: серверные маршруты (API routes)

Nuxt умеет создавать простые API прямо в папке `server/api`. Можно создать любой файл, например, `server/api/hello.ts`:

```ts
export default defineEventHandler(() => {
  return { message: 'Привет из Nuxt API!' }
})
```
Этот API-эндпоинт будет доступен по адресу `/api/hello`.

Для получения ответа внутри компонента используйте fetch:

```ts
const { data } = await useFetch('/api/hello')
console.log(data.value.message) // Привет из Nuxt API!
```

## Деплой Nuxt-приложения

Nuxt можно деплоить как SSR-приложение, SSG или SPA почти на любые современные хостинги: Vercel, Netlify, Heroku, Render или на свой VPS.

Простейший способ для SSR — сборка и запуск:

```bash
npm run build
npm run start
```
В режиме SSG после `npx nuxi generate` загрузите содержимое `.output/public` на любой статиеский хостинг.

## Заключение

Nuxt JS — это мощный инструмент для создания современных, SEO-оптимизированных и быстроработающих приложений на Vue. Используя автоматическую маршрутизацию, SSR, SSG и новые возможности Pinia, вы быстро развернете проект любого масштаба. Вы познакомились с основными возможностями, структурой, стратегиями работы с данными, подключением модулей и даже созданием API на стороне Nuxt.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

**Вопрос 1. Как сделать редирект между страницами в Nuxt?**  
Внутри компонента используйте useRouter:  
```js
const router = useRouter()
router.push('/new-path') // Редирект на другую страницу
```
В мидлваре или серверном коде используйте `sendRedirect`:
```ts
export default defineNuxtRouteMiddleware((to, from) => {
  if (условие) {
    return navigateTo('/login')
  }
})
```

**Вопрос 2. Как реализовать авторизацию и хранить токен?**  
Для авторизации сохраните токен в cookies (например, через useCookie) или localStorage, а потом передавайте в заголовках запросов:
```js
const token = useCookie('auth_token')
await useFetch('/api/protected', { headers: { Authorization: `Bearer ${token.value}` } })
```

**Вопрос 3. Как подключить стороннюю JS-библиотеку только на клиенте?**  
Создайте плагин в папке plugins с указанием { client: true }:
```ts
export default defineNuxtPlugin(() => {
  if (process.client) {
    // Подключение библиотеки
  }
})
```

**Вопрос 4. Как делать глобальную обработку ошибок в Nuxt?**  
Используйте error middleware или глобальный layout с обработкой error:
```vue
<template>
  <div>
    <NuxtErrorBoundary>
      <slot />
    </NuxtErrorBoundary>
  </div>
</template>
```

**Вопрос 5. Как добавить поддержку PWA в Nuxt?**  
Установите модуль:  
```bash
npm i @vite-pwa/nuxt
```
Добавьте в `nuxt.config.ts`:
```ts
export default defineNuxtConfig({
  modules: ['@vite-pwa/nuxt']
})
```
Так приложение сразу становится `Progressive Web App` с поддержкой установки на устройства.
---
metaTitle: Генерация статического сайта с помощью Nuxt
metaDescription: Научитесь генерировать статические сайты с помощью Nuxt - узнайте тонкости настройки, сборки и размещения, а также оптимизации производительности вашего статического проекта на Vue
author: Олег Марков
title: Генерация статического сайта с помощью Nuxt
preview: Разберитесь как собрать быстрый статический сайт с помощью Nuxt - инструкции, примеры кода и практические советы для эффективного статического рендера
---

## Введение

Статические сайты снова становятся востребованными благодаря своей скорости, безопасности и простоте эксплуатации. Nuxt — современный фреймворк на базе Vue, который позволяет не только создавать приложения с server-side rendering, но и легко собирать полностью статические сайты. Генерация статических страниц в Nuxt считается одним из лучших способов поддержки SEO, повышения скорости загрузки и упрощения размещения сайта.

В этом материале вы узнаете, как переходить к статической генерации, как настраивать ваш проект, генерировать файлы, публиковать и оптимизировать статический сайт. Я покажу примеры кода и помогу разобраться с главными особенностями.

## Как работает статическая генерация в Nuxt

В Nuxt есть небольшой, но важный termin: вот что значит "генерация статического сайта" — это процесс сборки, при котором результатом работы является папка с готовыми HTML, CSS и JS файлами. Все страницы такого сайта доступны без обращения к серверу приложений — их можно расставить на любой хостинг статики (например, на GitHub Pages, Vercel, Netlify или S3).

Nuxt берет ваши .vue-компоненты, роуты, данные (даже асинхронные) и в момент генерации превращает их в готовый результат. Дальнейшая работа сайта не требует Node.js — только статику.

### Основные отличия режима static от SSR и SPA

- **SSR (Server Side Rendering):** Каждая страница рендерится на сервере при запросе. Требуется сервер с Node.js.
- **SPA (Single Page Application):** Генерируется только пустой HTML-шаблон, всё остальное делается на клиенте.
- **SSG (Static Site Generation):** Все страницы генерируются при билде; после публикации сервер уже не нужен.

## Начало работы: базовая настройка Nuxt под статику

Давайте разберёмся, какие настройки требуются.

### Инициализация нового проекта

Сначала создайте проект, если у вас его ещё нет. Советуем использовать шаблон Nuxt 3, так как генерация статики больше "из коробки".

```bash
npx nuxi init my-static-site
cd my-static-site
npm install
```

### Выбор режима генерации

В файле `nuxt.config.ts` либо `nuxt.config.js` укажите, что вы хотите статическую сборку. Это достигается через настройку `ssr` и опцию target.

Nuxt 3 (новая версия):

```js
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false, // Это значит "SPA или статика"
  nitro: {
    preset: 'static', // указывает на статическую сборку
  }
});
```

Nuxt 2 (более старая версия):

```js
// nuxt.config.js
export default {
  target: 'static', // активирует режим статической генерации
}
```

### Важно! 
С Nuxt 3 (и Nitro) вам надо указывать именно preset static для правильной генерации статики — эта опция появилась в более новых версиях Nuxt.

## Генерация сайта

После настройки вы можете приступить к сборке проекта.

Выполните команду:

```bash
npm run generate
# или аналогично:
npx nuxi generate
```

По умолчанию весь итоговый сайт окажется в папке `.output/public` (Nuxt 3) или `dist` (Nuxt 2).

### Что происходит во время генерации?

- Nuxt находит все страницы (то есть все файлы в папке pages).
- Для каждой страницы собирается свой HTML-файл.
- Автоматически копируется статика, ассеты, происходит минификация.
- Если используются асинхронные запросы данных (например, через useAsyncData или asyncData), то данные загружаются и вставляются напрямую в HTML на этапе генерации.

## Пример проекта — простая генерация всех страниц

Давайте построим базовую структуру с парой страниц. Для начала создайте следующие файлы:

```bash
pages/
  index.vue
  about.vue
```

**pages/index.vue**

```vue
<template>
  <div>
    <h1>Главная страница</h1>
    <NuxtLink to="/about">О нас</NuxtLink>
  </div>
</template>
```

**pages/about.vue**

```vue
<template>
  <div>
    <h1>О сайте</h1>
    <NuxtLink to="/">На главную</NuxtLink>
  </div>
</template>
```

Теперь сгенерируйте сайт:

```bash
npm run generate
```

В папке `.output/public` или `dist` вы найдете файлы `index.html`, `about/index.html` — это и есть ваши статические страницы.

## Работа с динамическими роутами

Что если у вас есть файл с динамическим роутом, например `[slug].vue`?

### Пример

**pages/posts/[slug].vue**

```vue
<script setup>
const route = useRoute()
</script>

<template>
  <div>
    <h1>Пост: {{ route.params.slug }}</h1>
  </div>
</template>
```

Стандартный генератор Nuxt не знает, какие значения бывают у slug. Вам потребуется явно указать их в настройках генерации (Nuxt 2) либо через endpoints (Nuxt 3, Nitro).

Nuxt 2 пример (generate.routes):

```js
// nuxt.config.js
export default {
  target: 'static',
  generate: {
    routes: [
      '/posts/hello-world',
      '/posts/my-second-post'
    ]
  }
}
```

Nuxt 3 пример (nitro prerender routes):

```js
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: [
        '/posts/hello-world',
        '/posts/my-second-post'
      ]
    }
  }
})
```

Теперь Nuxt сгенерирует статические страницы для указанных роутов.

## Асинхронные данные и SSG

Один из плюсов SSG — данные из API попадают прямо в сгенерированный HTML. Но важно понимать, как и когда они подгружаются.

Например, страница статей тянет список постов из API:

**pages/blog.vue**

```vue
<script setup>
// Здесь мы загружаем список постов до сборки страницы
const { data: posts } = await useAsyncData('posts', () =>
  $fetch('https://myapi.example.com/posts')
)
</script>

<template>
  <ul>
    <li v-for="post in posts" :key="post.id">{{ post.title }}</li>
  </ul>
</template>
```

Во время команды generate Nuxt сделает запрос к API, получит список постов и сразу запишет результат в HTML.

**Важно!** Если ваш API запаролен или недоступен извне в момент билда, Nuxt не сможет подтянуть данные. В таком случае варианты:
- Предварительно выставить переменные окружения, mock-данные;
- Использовать fallback или generate dynamic routes только там, где это доступно.

## Использование Nuxt Content и markdown

Если ваши статьи хранятся в виде markdown-файлов, попробуйте пакет `@nuxt/content`, который работает напрямую с файлами, а не API.

Установка:

```bash
npm install @nuxt/content
```

Добавьте плагин в конфиг:

```js
// nuxt.config.js/ts
export default defineNuxtConfig({
  modules: [
    '@nuxt/content'
  ]
})
```

Создайте папку content и разместите файлы:

```bash
content/
  hello-world.md
  my-second-post.md
```

Далее используйте компоненты `ContentList` или `queryContent()`:

```vue
<script setup>
const { data: articles } = await useAsyncData(() =>
  queryContent().find()
)
</script>

<template>
  <ul>
    <li v-for="a in articles" :key="a._path">
      <NuxtLink :to="a._path">{{ a.title }}</NuxtLink>
    </li>
  </ul>
</template>
```

Такой подход удобен для блогов, FAQ и другой информации, которую вы не хотите хранить во внешней базе.

## Настройка путей и baseURL

Если ваш сайт размещается не в корне домена, а, допустим, в `https://site.ru/project/`, укажите baseURL:

```js
export default defineNuxtConfig({
  app: {
    baseURL: '/project/'
  }
})
```

Это важно для корректной генерации ссылок, статики и роутинга.

## Работа c assets, статикой и favicon

Все файлы из статичной папки `public/` автоматически попадают в билд. В Nuxt 2 — папка `static/`.

```bash
public/
  robots.txt
  favicon.ico
  images/
    logo.png
```

Вы можете обращаться к ним прямо из шаблонов:

```html
<img src="/images/logo.png" alt="Logo">
```

## Хостинг и деплой статического сайта

Готовый сайт можно загрузить на любой сервис, поддерживающий простую отдачу файлов: Netlify, Vercel, GitHub Pages, Firebase Hosting, S3.

Например, деплой на Netlify:

1. Зарегистрируйтесь в Netlify.
2. Укажите в настройках репозитория команду сборки:  
   - "npm run generate" (или npx nuxi generate)
3. Папку публикации — `.output/public` или `dist` (зависит от Nuxt версии).

Для Vercel аналогично — можно просто отправить проект через CLI.

## Оптимизация статики в Nuxt

### Минификация и оптимизация ресурсов

- Все ресурсы минифицируются автоматически при билде.
- Используйте оптимизированные картинки, форматы webp, AVIF.
- Настройте lazy loading для изображений, например:

```html
<img src="/images/photo.jpg" loading="lazy" alt="Фото">
```

### Code splitting

Nuxt автоматически разбивает код на чанки — каждая страница подгружает только нужный ей JavaScript. Это ускоряет загрузку страниц.

### SEO мета-теги

Старайтесь задавать уникальные title, description для каждой страницы.

```vue
<script setup>
useHead({
  title: 'Название страницы',
  meta: [
    { name: 'description', content: 'Описание страницы' }
  ]
})
</script>
```

### Prefetch и preloading ссылок

Nuxt предзагружает страницы при появлении ссылок в viewport, используя `<NuxtLink prefetch>`. Обычно это работает "из коробки".

## Типичные проблемы и их решения

- **Проблема с динамическими путями:** генератор не знает, какие параметры бывают для динамических роутов — их надо явно указать (см. раздел выше).
- **API недоступен при генерации:** используйте мок-данные или перегенерируйте сайт позже.
- **Изменения не подтягиваются при статической генерации:** после каждого обновления данных или контента перегенерируйте сайт заново.

## Заключение

Генерация статического сайта с помощью Nuxt — современное и гибкое решение, подходящее для интернет-магазинов, блогов, лендингов и корпоративных сайтов. Весь рабочий процесс строится вокруг одной простой идеи: собрать HTML заранее и разместить сайт как обычные файлы. Это делает ваш проект невероятно быстрым и легким для поддержки, а благодаря гибкости Nuxt вы сможете интегрировать любые источники данных, гибко настраивать роутинг и разворачивать свой сайт где угодно.

---

## Частозадаваемые технические вопросы по теме

### Как добавить sitemap для статического сайта на Nuxt?

Используйте модуль `@nuxtjs/sitemap`:

1. Установите пакет:  
   `npm install @nuxtjs/sitemap`
2. Добавьте модуль в `nuxt.config.js`/`ts`.
3. Опишите путь к статически сгенерированным страницам:
   ```js
     sitemap: {
       hostname: 'https://ваш-домен.ру',
       routes: ['/about', '/posts/hello-world']
     }
   ```

### Можно ли использовать динамические environment variables в процессе сборки?

Для статики переменные окружения считываются только во время команды generate. Если вам нужно разместить разные версии сайта — собирайте под каждую из них отдельно с разными переменными.

### Как организовать редиректы на статическом Nuxt?

Для "чистых" редиректов используйте мета-тэг в HTML или создайте файл _redirects (поддерживается Netlify). Для client-side редиректов — пишите логику в хуке onMounted:

```js
if (process.client && нужно_перенаправить) {
  navigateTo('/новый-url')
}
```

### Как обновлять сайт при появлении новых данных?

После появления новых данных перегенерируйте сайт и залейте новую версию на хостинг. Автоматизация возможна через CI/CD.

### Как добавить fallback для несуществующих страниц (404.html)?

Создайте страницу `pages/404.vue` — Nuxt сам сгенерирует корректный 404.html файл в папке публикации.
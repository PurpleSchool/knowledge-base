---
metaTitle: Создание и использование Nuxt modules
metaDescription: Изучите создание и использование Nuxt modules - как они облегчают расширение функционала Nuxt проектов, процесс их разработки, настройки и интеграции
author: Олег Марков
title: Создание и использование Nuxt modules
preview: Разберитесь, как создавать и использовать Nuxt modules — мощный инструмент для масштабирования и организации вашего Nuxt приложения
---

## Введение

Nuxt.js — это современный фреймворк для создания серверных и клиентских приложений на основе Vue. Одно из сильнейших преимуществ Nuxt — его модульность. Благодаря этому Nuxt предоставляет мощный механизм для подключения, расширения и кастомизации функциональности без глубоких изменений в проекте. Такой инструмент называется — Nuxt module.

Nuxt modules позволяют вам подключать сторонние библиотеки, внедрять код прямо на этапе сборки, автоматически создавать middleware, изменять маршрутизацию, подключать плагины, управлять окружением и делать множество других вещей. При этом модули легко переиспользовать, делиться ими с командой или публиковать для сообщества.

В этой статье вы узнаете, как создавать собственные Nuxt modules, подключать сторонние, конфигурировать их и использовать все возможности модульной архитектуры Nuxt. Я покажу, как работают основные элементы модуля, и проиллюстрирую практические сценарии, чтобы вы могли не только подключать готовые решения, но и проектировать свои модули под любые задачи.

## Что такое Nuxt modules и зачем они нужны

Если описывать на пальцах — Nuxt module это обычный JavaScript (или TypeScript) модуль, который может подключаться к Nuxt на самых ранних этапах сборки. Он может вмешиваться в процесс генерации роутов, подключать плагины, менять настройки webpack и vite, добавлять настройки к приложению и даже генерировать свои файлы.

### Задачи, которые удобно решать с помощью Nuxt modules

- **Подключение глобальных плагинов**, например, для i18n, axios, tailwind и других.
- **Генерация дополнительных страниц или маршрутов**.
- **Внесение изменений в конфигурацию сборщика (webpack, vite)**.
- **Подключение собственного middleware, хуков, компонентов**, либо расширение возможностей Nuxt.
- **Переиспользование готовых решений для разных проектов** через npm-пакеты.

### Чем отличается Nuxt module от Nuxt plugin

Стандартный плагин работает уже внутри вашего приложения, а модуль загружается на этапе сборки и может влиять на весь процесс разработки и сборки — добавлять энтити, генерировать коды, внедрять хук и т.д.

## Как подключать Nuxt modules

В Nuxt модули можно подключать двумя способами: через `nuxt.config` и через установку npm-пакетов.

### Установка и подключение стороннего модуля

Рассмотрим подключение популярного модуля, например, `@nuxtjs/axios`:

#### 1. Установка пакета

Выполните команду:

```bash
npm install @nuxtjs/axios
```

#### 2. Добавление в nuxt.config

```js
export default {
  modules: [
    '@nuxtjs/axios' // Подключаем модуль
  ],
  axios: {
    // Здесь можно указывать настройки для модуля
    baseURL: 'https://api.example.com',
  }
}
```

Модули можно подключать как строками, так и объектами с параметрами:

```js
export default {
  modules: [
    ['@nuxtjs/axios', { baseURL: 'https://api.example.com' }]
  ]
}
```

#### Пример использования

После этого у вас появляется переменная `$axios` во всех компонентах и файлах вашего Nuxt проекта.

### Локальные и кастомные модули

Модуль можно подключить из собственного файла:

```js
// В nuxt.config
export default {
  modules: [
    '~/modules/my-module.js'
  ]
}
```

## Как создать собственный Nuxt module

Давайте перейдем к созданию простого кастомного модуля и подробно рассмотрим его структуру.

### Шаг 1. Создайте папку modules и файл модуля

Обычно кастомные модули выносят в отдельную директорию `modules`. Например: `modules/hello.js`.

### Шаг 2. Определите функцию модуля

В базовой форме Nuxt module — это функция, которая принимает два параметра: `moduleOptions` (параметры переданные при подключении) и `nuxt` (инстанс Nuxt).

#### Пример простейшего модуля

```js
// modules/hello.js

export default function (moduleOptions) {
  // moduleOptions - настройки, переданные при подключении модуля
  // this - это контекст Nuxt (важно, если используете commonjs function)

  // Простейший пример: добавить новый плагин
  this.addPlugin({
    src: this.resolve(__dirname, 'hello-plugin.js'),
    fileName: 'hello-plugin.js',
    options: moduleOptions
  })
}
```

Здесь мы используем `addPlugin` для автоматического подключения `hello-plugin.js` к вашему Nuxt проекту.

### Шаг 3. Пример кода плагина

```js
// modules/hello-plugin.js

export default (context, inject) => {
  // inject позволяет добавить глобальную переменную во все компоненты и сторы проекта
  inject('hello', (name='World') => `Hello, ${name}!`)
}
```

### Шаг 4. Подключаем модуль и используем

В `nuxt.config`:

```js
export default {
  modules: [
    ['~/modules/hello.js', { greeting: 'Hi' }]
  ]
}
```

Теперь во всех компонентах можно вызывать метод `this.$hello('Nuxt')`

```vue
<template>
  <div>{{ message }}</div>
</template>

<script>
export default {
  computed: {
    message() {
      return this.$hello('Nuxt') // Выведет "Hello, Nuxt!"
    },
  }
}
</script>
```

## Встроенные методы и возможности внутри модуля

Nuxt предоставляет множество вспомогательных методов и хуков внутри модуля:

### Основные методы в контексте модуля (`this`)

- `this.nuxt`: объект инстанса Nuxt
- `this.options`: вся конфигурация nuxt.config.js
- `this.addPlugin(options)`: добавить плагин
- `this.addTemplate(options)`: сгенерировать кастомный шаблон или файл во время сборки
- `this.addServerMiddleware(middleware)`: подключить серверный middleware
- `this.extendBuild(cb)`: изменить настройки сборщика (например, webpack, vite)
- `this.extendRoutes(cb)`: изменить или добавить маршруты

Давайте попробуем использовать несколько из них на практике.

### Добавление шаблона с помощью addTemplate

`addTemplate` используется, когда вам нужно динамически сгенерировать файл при запуске Nuxt на базе шаблона.

```js
// modules/create-template.js

export default function() {
  this.addTemplate({
    src: this.resolve(__dirname, 'my-template.js'), // исходный шаблон
    fileName: 'my-generated.js', // итоговый файл в .nuxt
    options: { someParam: 123 }
  })
}
```

В вашем шаблоне вы можете использовать плейсхолдер `<%= options.someParam %>`.

```js
// modules/my-template.js
export default {
  value: <%= options.someParam %>
}
```

### Динамическое расширение маршрутов

Вам нужно добавить динамический роут? Подключаем в модуле:

```js
export default function () {
  this.extendRoutes((routes, resolve) => {
    routes.push({
      name: 'custom',
      path: '/custom',
      component: resolve(__dirname, 'pages/custom.vue')
    })
  })
}
```

Теперь переход по `/custom` будет работать даже если страницы нет в папке `pages`.

### Добавление серверного middleware

Иногда требуется реализовать серверную функцию (например, mini-API внутри Nuxt):

```js
export default function () {
  this.addServerMiddleware({
    path: '/api/hello',
    handler(req, res, next) {
      res.end('Hello from API!')
    }
  })
}
```

Переход по `/api/hello` отдаст строку.

### Работа с настройками модуля

В модуле можно обрабатывать собственные настройки:

```js
export default function (moduleOptions) {
  const options = {
    ...this.options.myModule, // настройки из nuxt.config
    ...moduleOptions           // настройки из подключения
  }
  // Используем options для кастомизации поведения
}
```

## Структурирование сложного модуля

Чем крупнее ваш модуль — тем лучше его располагать как npm-пакет с собственной структурой:

```
my-nuxt-module/
  └─ src/
      ├─ module.js
      ├─ plugin.js
      └─ templates/
           └─ my-template.js
  ├─ package.json
  ├─ README.md
```

### Пример package.json для Nuxt3

```json
{
  "name": "my-nuxt3-module",
  "version": "0.1.0",
  "main": "src/module.js"
}
```

### Пример index файла модуля

```js
// src/module.js
export default function myModule (moduleOptions) {
  // Ваша логика модуля
  this.addPlugin({
    src: this.resolve(__dirname, 'plugin.js'),
    fileName: 'my-plugin.js'
  })
}
```

Теперь вы можете устанавливать этот пакет через npm и использовать во всех своих проектах.

## Основные best practices при разработке модулей

### - Используйте TypeScript и JSDoc для документации

Это поможет другим быстрее понять структуру и типы ваших опций.

### - Проверяйте совместимость версий

Nuxt 2 и Nuxt 3 имеют разные API модулей, обращайте внимание на используемую версию.

### - Используйте хуки для расширения функциональности

Nuxt предоставляет обширную систему хуков, например:

```js
export default function () {
  this.nuxt.hook('build:done', () => {
    // Ваш код по завершении сборки
  })
}
```

### - Делайте настройки явными и прокидывайте параметры через опции

Это позволит другим пользователям гибко переопределять поведение модуля.

### - Оформляйте readme для собственного модуля

Документируйте публичные API, ожидаемые опции и типичные сценарии использования.

## Большой пример: модуль для автоматического подключения svg-иконок

Давайте реализуем модуль, который автоматически подключает все SVG-иконки из папки `~/assets/icons` как глобальные компоненты Nuxt.

### Шаг 1. Структура папок

```
modules/
  auto-icons.js
assets/
  icons/
    user.svg
    home.svg
```

### Шаг 2. Код модуля

```js
// modules/auto-icons.js
import fs from 'fs'
import path from 'path'

export default function () {
  // Находим все svg файлы в assets/icons
  const iconsDir = path.resolve(this.options.srcDir, 'assets/icons')
  const icons = fs.readdirSync(iconsDir).filter(f => f.endsWith('.svg'))

  // Для каждого svg создаем шаблон компонента
  icons.forEach(name => {
    const componentName = 'Icon' + name.replace('.svg', '').replace(/(^\w|-\w)/g, c => c.replace('-', '').toUpperCase())
    this.addTemplate({
      src: path.resolve(__dirname, 'svg-component.template.js'),
      fileName: `components/${componentName}.js`,
      options: {
        svg: fs.readFileSync(path.join(iconsDir, name), 'utf-8')
      }
    })
  })

  // Регистрируем компоненты как глобальные
  this.nuxt.hook('components:extend', components => {
    icons.forEach(name => {
      components.push({
        path: `~/.nuxt/components/Icon${name.replace('.svg', '')}.js`,
        name: `Icon${name.replace('.svg', '')}`
      })
    })
  })
}
```

### Шаг 3. Шаблон компонента

```js
// modules/svg-component.template.js
import Vue from 'vue'

export default Vue.component('<%= name %>', {
  functional: true,
  render(h) {
    return <%= options.svg %>
  }
})
```

### Итог: теперь везде доступны компоненты `IconUser`, `IconHome` без ручной регистрации.

## Особенности создания Nuxt модулей под Nuxt 3

Nuxt 3 постепенно переходит к ESM (ECMAScript modules) и использует немного отличающуюся структуру:

- Модули пишутся на ESM (`export default defineNuxtModule({ ... })`)
- Вместо this используйте параметры функций и context

### Пример модуля на Nuxt 3

```js
// modules/my-module.ts
import { defineNuxtModule, addPlugin } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'my-module',
    configKey: 'myModule'
  },
  defaults: {
    greeting: 'Hello'
  },
  setup(options, nuxt) {
    addPlugin({
      src: path.resolve(__dirname, 'plugin.js'),
      options
    })
  }
})
```

## Заключение

Nuxt modules — один из самых мощных инструментов для архитектуры и масштабирования приложений на Nuxt. Они позволяют интегрировать сторонние решения, делать кастомные надстройки, создавать собственные плагин-паки и автоматизировать рутинные задачи в проекте. Четко понимая, как устроены Nuxt modules, вы сможете проектировать более гибкие, масштабируемые и поддерживаемые приложения, а также вносить вклад в открытое сообщество, публикуя собственные решения в виде npm-пакетов.

---

## Частозадаваемые технические вопросы по теме Nuxt modules

### Как передавать сложные опции из nuxt.config в модуль?

Передавайте объект опций как вторым параметром в массиве:
```js
modules: [
  ['~/modules/my-module', { option1: '...', nested: { field: 42 } }]
]
```
Внутри модуля объединяйте с `this.options.myModule` и `moduleOptions`.

### Как добавить новый публичный путь (`publicPath`) для сервировки статики модулем?

Внутри модуля используйте:
```js
this.options.publicRuntimeConfig = this.options.publicRuntimeConfig || {}
this.options.publicRuntimeConfig.assetsURL = '/_my-assets/'
this.addServerMiddleware({
  path: '/_my-assets/',
  handler: require('serve-static')(path.join(__dirname, 'public'))
})
```

### Как правильно осуществлять условное подключение плагинов только для клиента или сервера?

При использовании метода addPlugin указывайте опцию mode:
```js
this.addPlugin({
  src: this.resolve(__dirname, 'client-only.js'),
  mode: 'client'
})
```
Такой плагин подключится только на клиенте.

### Как расширять список компонентов через модуль?

В версии Nuxt 3 воспользуйтесь хуком:
```js
nuxt.hook('components:extend', (components) => {
  components.push({ name: 'MyComponent', filePath: ... })
})
```

### Почему мой модуль не видит новые файлы/директории после запуска дев-сервера?

Nuxt загружает модули только во время начальной инициализации. Для загрузки новых файлов требуется перезапустить сервер разработки, либо использовать хуки watch, чтобы отслеживать изменения и корректно пересобрать проект.
---
metaTitle: Руководство по использованию Middleware в Nuxt
metaDescription: Изучите подробное руководство по работе с Middleware в Nuxt - как создавать, подключать и использовать промежуточные обработчики для управления маршрутами и авторизацией
author: Олег Марков
title: Руководство по использованию Middleware в Nuxt
preview: Подробно о Middleware в Nuxt - что это такое, зачем нужны промежуточные функции и как реализовать контроль доступа, редиректы и другие задачи на практике
---

## Введение

Middleware в Nuxt — мощный инструмент, который позволяет выполнять определенные действия при переходах между страницами вашего приложения. С его помощью вы можете реализовать аутентификацию, проверки прав доступа, динамические редиректы, устанавливать параметры или логировать посещения определённых маршрутов. Всё это происходит до отрисовки страницы, что даёт вам полный контроль над пользовательским опытом.

Этот инструмент особенно ценен, если требуется ограничить или настроить доступ к ряду маршрутов, а также упростить интеграцию с различными внешними сервисами и API. В разных версиях Nuxt детали реализации и использования middleware могут отличаться, поэтому в статье будут рассмотрены все нюансы их правильного применения.

Давайте пошагово разберёмся, для чего нужны middleware, как их создавать, где подключать и как извлекать максимум пользы от этих промежуточных функций.

## Что такое Middleware в Nuxt

Прежде чем перейти к практическим примерам, важно понять, что такое middleware в контексте Nuxt.

Middleware — это специальная функция, которая выполняется перед загрузкой компонента страницы или во время перехода между страницами. Она может отменять переход, выполнять редиректы, проводить проверки (например, авторизацию) и изменять поведение рендеринга страницы.

В зависимости от версии, Nuxt предоставляет несколько способов подключения middleware:
- Глобально (`nuxt.config.js` или отдельная папка)
- На уровне страницы (через опции компонента)
- На уровне маршрута (через файлы и настройки маршрутов)

Давайте детально рассмотрим эти способы и их особенности.

## Как работает Middleware

Nuxt выполняет middleware в определенном порядке:
1. **Глобальные middleware** (объявленные в файле или папке `middleware/` и подключенные через `nuxt.config.js`)
2. **Middleware, назначенные страницам** (через опции компонента или директории)
3. **Middleware, определённые для конкретных маршрутов**

Когда пользователь переходит на другую страницу, Nuxt последовательно выполняет соответствующие middleware. Если хотя бы одно из них вызывает редирект или останавливает переход, последующий рендер страницы не происходит.

### Виды Middleware в Nuxt

- **Глобальные** — работают для всех страниц приложения.
- **Локальные (страничные)** — подключаются к определённым страницам или маршрутам.
- **Динамически назначаемые** — можно подключать по условиям на клиенте или сервере, изменяя логику поведения приложения в зависимости от сценария.

Теперь посмотрим, как создавать middleware и использовать его во всех трёх случаях.

## Создание собственного Middleware

В Nuxt middleware обычно реализуются как отдельные файлы с экспортируемой функцией. Эти файлы располагаются в папке `middleware` на корне проекта или, начиная с Nuxt 3, в папке `server/middleware` для серверных обработчиков.

Давайте посмотрим на простой пример middleware, который проверяет, авторизован ли пользователь:

```js
// middleware/auth.js

export default function ({ store, redirect }) {
  // Проверяем: если пользователь не авторизован, делаем редирект на страницу логина
  if (!store.state.auth.loggedIn) {
    return redirect('/login')
  }
}
```
Здесь используется объект с параметрами контекста Nuxt:
- `store` — доступ к состоянию Vuex
- `redirect` — метод для выполнения перенаправления пользователя

Это базовый вариант, но его можно усложнять, добавляя работу с куками, localStorage и даже сторонними сервисами.

Middleware - это мощный инструмент для управления запросами и ответами в Nuxt-приложениях. Но для эффективного использования middleware необходимо понимать, как работает жизненный цикл Nuxt, как создавать собственные middleware и как интегрировать их с другими частями вашего приложения. Если вы хотите стать экспертом в использовании middleware в Nuxt, приходите на наш большой курс [Nuxt - fullstack Vue фреймворк](https://purpleschool.ru/course/nuxt?utm_source=knowledgebase&utm_medium=article&utm_campaign=rukovodstvo-po-ispolzovaniyu-middleware-v-nuxt). На курсе 129 уроков и 13 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

### Синтаксис middleware в Nuxt 3

В Nuxt версии 3 синтаксис изменился. Вместо функции по умолчанию вы будете использовать функцию `defineNuxtRouteMiddleware`:

```js
// middleware/auth.global.js

export default defineNuxtRouteMiddleware((to, from) => {
  // Здесь проверяем условие авторизации (например, из пиньи)
  const user = useAuthStore()
  if (!user.isLoggedIn) {
    // Для редиректа используем navigateTo
    return navigateTo('/login')
  }
})
```
В Nuxt 3 middleware может быть:
- **Глобальным** (`.global.js`), чтобы работало на всех маршрутах,
- **На уровне страницы** (подключается внутри компонента страницы),
- **Серверным** (`server/middleware`), если требуется обработka на сервере (например, API middleware).

Обратите внимание, что для редиректов теперь применяется функция `navigateTo`.

## Подключение Middleware: глобально и локально

### Глобальное Middleware

Для применения middleware ко всему приложению, его подключают глобально. В Nuxt 2 и 3 это делается по-разному.

#### Nuxt 2

1. Поместите файл middleware в папку `middleware/`.
2. В `nuxt.config.js` добавьте имя middleware (без расширения) в массив `router.middleware`.

```js
// nuxt.config.js

export default {
  router: {
    middleware: ['auth']
  }
}
```

Теперь функция `auth` будет вызываться при каждом переходе.

#### Nuxt 3

В Nuxt 3 любой файл с суффиксом `.global.js` в папке `middleware/` становится глобальным.

```js
// middleware/logger.global.js

export default defineNuxtRouteMiddleware((to, from) => {
  // Логируем каждый переход
  console.log(`Navigating from ${from.fullPath} to ${to.fullPath}`)
})
```

Нет необходимости подключать middleware в конфиг — он сработает автоматически.

### Локальное Middleware (на уровне страницы)

Если вам нужно использовать middleware только на одной странице, действуйте так:

#### Nuxt 2

В файле страницы объявите опцию middleware:

```js
// pages/profile.vue

export default {
  middleware: 'auth'
  // Остальной код страницы
}
```

Если middleware несколько, укажите массив:

```js
export default {
  middleware: ['auth', 'log']
}
```

#### Nuxt 3

В Nuxt 3 вы подключаете middleware с помощью хука внутри компонента:

```js
// pages/profile.vue

<script setup>
definePageMeta({
  middleware: 'auth'
})
</script>
```

Для нескольких middleware:

```js
definePageMeta({
  middleware: ['auth', 'log']
})
```

## Работа с параметрами контекста в Middleware

Middleware получает специальный объект контекста, который содержит важные параметры:

- `route` — объект текущего маршрута,
- `store` — доступ к Vuex хранилищу (Nuxt 2),
- `redirect` — функция для перенаправления,
- `req`/`res` — доступ к объектам запроса/ответа на сервере,
- методы Nuxt 3: `useRoute`, `useRouter`, `navigateTo` и др.

Пример использования:

```js
export default function ({ route, redirect }) {
  // Если пользователь пытается попасть на /dashboard, но не прошёл проверку
  if (route.path === '/dashboard' && !isAllowed()) {
    return redirect('/not-allowed')
  }
}
```

В Nuxt 3:

```js
export default defineNuxtRouteMiddleware((to, from) => {
  if (to.path === '/admin' && !checkAdmin()) {
    return navigateTo('/login')
  }
})
```

Здесь `to` и `from` — объекты соответствующих маршрутов.

## Использование Async Middleware

Если вашему middleware требуется выполнить асинхронный запрос (например, к внешнему API), просто объявите функцию async:

### Nuxt 2

```js
export default async function ({ store, redirect }) {
  const isValid = await store.dispatch('checkValid')
  if (!isValid) {
    return redirect('/unauthorized')
  }
}
```

### Nuxt 3

```js
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { status } = await $fetch('/api/check')
  if (status !== 'ok') {
    return navigateTo('/error')
  }
})
```

Главное — вернуть редирект или ошибку через `return` (или `throw` в случае ошибки).

## Примеры популярных сценариев использования Middleware

Давайте рассмотрим, как middleware позволяет решать типовые задачи в Nuxt.

### Реализация контроля доступа

Допустим, вам требуется защитить часть сайта авторизацией:

```js
// middleware/auth.js

export default function ({ store, redirect }) {
  if (!store.state.auth.user) {
    // Неавторизованный пользователь не попадет в личный кабинет
    return redirect('/login')
  }
}
```

Или в Nuxt 3 c использованием Pinia:

```js
// middleware/auth.global.js

export default defineNuxtRouteMiddleware((to, from) => {
  const user = useUserStore()
  if (!user.isLoggedIn && to.path.startsWith('/dashboard')) {
    return navigateTo('/login')
  }
})
```

### Ограничение доступа к админке

```js
// middleware/admin.js

export default function ({ store, redirect }) {
  if (!store.state.user.isAdmin) {
    return redirect('/not-authorized')
  }
}
```

Вариант для Nuxt 3:

```js
// middleware/admin.global.js

export default defineNuxtRouteMiddleware((to, from) => {
  const user = useUserStore()
  if (!user.isAdmin) {
    return navigateTo('/not-authorized')
  }
})
```

### Динамический редирект в зависимости от параметров

```js
export default function ({ query, redirect }) {
  // Если к запросу не добавлен нужный параметр — редиректим на главную
  if (!query.ref) {
    return redirect('/')
  }
}
```

В Nuxt 3:

```js
export default defineNuxtRouteMiddleware((to, from) => {
  if (!to.query.ref) {
    return navigateTo('/')
  }
})
```

### Логирование переходов между страницами

```js
// middleware/logger.js

export default function ({ route }) {
  console.log(`[MIDDLEWARE] User visits ${route.fullPath}`)
}
```
Nuxt 3:

```js
export default defineNuxtRouteMiddleware((to, from) => {
  console.log(`[MIDDLEWARE] ${from.path} -> ${to.path}`)
})
```

### Middleware только на сервере

В Nuxt 3 вы можете создавать server-only middleware для обработки API-запросов (например, заголовков или cookies):

```js
// server/middleware/auth.js

export default defineEventHandler(async (event) => {
  // Здесь идет обработка только на сервере, например, проверка cookie
  const token = getCookie(event, 'session')
  if (!token) {
    // Можно возвращать ошибку или редирект
    return sendRedirect(event, '/login')
  }
})
```

Это удобно использовать для защиты server-side маршрутов и API-эндпойнтов.

## Особенности и лучшие практики

Чтобы middleware работало эффективно, придерживайтесь следующих подходов:
- Не перегружайте middleware тяжелыми вычислениями — это замедлит навигацию.
- Группируйте общие проверки и выносите повторяющийся код в отдельные middleware.
- Используйте асинхронность только когда действительно нужно ждать результат (например, данных с сервера).
- Тестируйте работу middleware на сервере и на клиенте — поведение может отличаться.
- Пишите читаемый и сопровождаемый код с понятными условиями возврата и редиректов.
- Используйте глобальные middleware для базовой логики авторизации/логирования, а локальные — для узких задач на отдельных роутах.

## Заключение

Middleware в Nuxt — это универсальный механизм для реализации промежуточной логики при переходах между страницами и обработке данных. Он идеально подходит для проверки прав доступа, организации редиректов, логирования и других задач, связанных с контролем за маршрутизацией и поведением пользователя в приложении.

Понимание того, как, где и когда использовать middleware, сильно упрощает управление доступом, организацию бизнес-логики на стороне клиента и сервера и интеграцию с внешними сервисами. Не забывайте проверять актуальность подходов для вашей версии Nuxt — это поможет избежать ошибок на этапе разработки.

Middleware - это всего лишь один из инструментов, доступных в Nuxt. Чтобы создавать действительно мощные и масштабируемые приложения, необходимо освоить все аспекты фреймворка, включая работу с сервером, базами данных и API. На нашем курсе [Nuxt - fullstack Vue фреймворк](https://purpleschool.ru/course/nuxt?utm_source=knowledgebase&utm_medium=article&utm_campaign=rukovodstvo-po-ispolzovaniyu-middleware-v-nuxt) вы найдете все необходимые знания и навыки для достижения успеха. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в Nuxt прямо сегодня.

## Частозадаваемые технические вопросы по теме и инструкции

### Как отработать middleware только на стороне клиента или только на сервере?

В Nuxt 2 используйте серверные переменные (`process.server`/`process.client`) внутри middleware. В Nuxt 3 разделите обработчики: файлы в `server/middleware` работают только на сервере, а файлы в `middleware/` — на обеих сторонах.

### Как получить доступ к cookies в middleware Nuxt 2 и Nuxt 3?

В Nuxt 2 используйте свойства контекста `req`/`res` на сервере, анализируя заголовки cookie. В Nuxt 3 на сервере используйте `useCookies` или методы из `h3` (`getCookie(event, name)` для `defineEventHandler` middleware).

### Как передавать параметры в middleware?

В middleware параметры передаются через query-string или параметры маршрута. Внутри middleware обращайтесь к `route.params` или `to.params` (Nuxt 3). Передавать параметры напрямую нельзя — используйте роут и query.

### Как отменить переход или выбросить ошибку из middleware?

В Nuxt 2 для ошибки — вызовите `error({ statusCode: 401, message: "Unauthorized" })`. В Nuxt 3 выбросьте исключение: `throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })`.

### Middleware не срабатывает — как отследить проблему?

Проверьте правильное подключение файла (имя, расширение, место), корректность опций страницы или конфига, отсутствие опечаток. Для отладки добавьте `console.log` в начало middleware, чтобы убедиться в его запуске. Если не работает на сервере, проверьте путь файла и структуру экспорта.

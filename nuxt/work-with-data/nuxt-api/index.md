---
metaTitle: Как создавать API-маршруты в Nuxt
metaDescription: Практическое руководство по созданию API-маршрутов в Nuxt - разберитесь в настройке, особенностях и возможностях серверных маршрутов вашего проекта
author: Олег Марков
title: Как создавать API-маршруты в Nuxt
preview: Освойте создание API-маршрутов в Nuxt - инструкция с примерами, объяснениями и советами для вашего первого собственного серверного API
---

## Введение

Nuxt — это современный фреймворк на базе Vue, который помогает создавать универсальные приложения с SSR, статической генерацией и поддержкой клиентской и серверной логики “из коробки”. Одной из его сильнейших сторон стало появление в версии Nuxt 3 функции server API routes. Теперь вы можете разрабатывать серверные части прямо внутри проекта, не поднимая отдельный backend.

В этой статье вы узнаете, как создавать и настраивать API-маршруты в Nuxt, увидите реальные примеры и получите понимание, где и зачем это применять. Здесь я подробно расскажу про организацию структуры, работу с обработчиками, передачу данных, объясню нюансы и покажу best practices.

## Как работает серверный API в Nuxt

С выходом Nuxt 3 появилась возможность создавать серверные эндпоинты внутри папки проекта. Это реализовано через Nitro — универсальный рантайм, который поддерживает множество адаптеров для разных серверных и серверлесс платформ (например, vercel, netlify, node-server и др).

API-маршруты сочетают простоту написания с прозрачным роутингом: файлы, размещенные в `server/api`, автоматически становятся REST эндпоинтами.

### Краткая схема работы

1. Внутри Nuxt проекта создается папка `server/api`.
2. В эту папку помещаются JS/TS-файлы — каждый файл и его имя преобразуется в путь API.
3. Пример: `server/api/hello.js` становится маршрутом `/api/hello`.
4. Маршруты автоматически подхватываются системой без ручного указания пути.
5. Поддерживаются методы (GET, POST и др.) и параметры.

Создание API-маршрутов позволяет расширить функциональность Nuxt-приложений и создавать собственные бэкенд-сервисы. Чтобы делать это правильно, необходимо понимать, как работает Nuxt server routes, как обрабатывать запросы и как обеспечить безопасность API. Если вы хотите научиться создавать API-маршруты в Nuxt, приходите на наш большой курс [Nuxt - fullstack Vue фреймворк](https://purpleschool.ru/course/nuxt?utm_source=knowledgebase&utm_medium=article&utm_campaign=kak-sozdavat-api-marshruty-v-nuxt). На курсе 129 уроков и 13 упражнений, AI-тренажеры для безлимитной практики с кодом и задачами 24/7, решение задач с живым ревью наставника, еженедельные встречи с менторами.

## Создание первого API-маршрута

### Шаг 1. Создайте нужную структуру

Убедитесь, что у вас есть папка `server/api`. Если она отсутствует — создайте ее в корне проекта:

```
my-nuxt-app/
  server/
    api/
  pages/
  ...
```

### Шаг 2. Напишите первый endpoint

Создайте файл `hello.js` внутри `server/api`:

```js
// server/api/hello.js

export default defineEventHandler((event) => {
  // Возвращаем простое сообщение
  return { message: 'Привет из Nuxt API!' }
})
```

Здесь `defineEventHandler` — это функция из Nitro, которая оборачивает обработчик любого маршрута в едином стиле.

После перезапуска сервера Nuxt по адресу `http://localhost:3000/api/hello` (по умолчанию) вы увидите JSON-ответ:

```json
{
  "message": "Привет из Nuxt API!"
}
```

### Как это работает?

- Каждый файл внутри `server/api` — отдельный endpoint.
- Если используется подпапка, вложенные маршруты становятся частью пути: файл `server/api/user/info.js` маппит на `/api/user/info`.

Давайте рассмотрим этот момент чуть подробнее.

#### Пример: вложенные маршруты

Допустим, у вас есть файл:

```
server/api/user/tickets.js
```

Это будет обращаться как endpoint `/api/user/tickets`.

Внутри:

```js
// server/api/user/tickets.js

export default defineEventHandler((event) => {
  // Имитация ответа с массивом тикетов
  return [
    { id: 1, title: 'Ticket 1' },
    { id: 2, title: 'Ticket 2' }
  ]
})
```

Теперь вы знаете принцип работы вложенных маршрутов.

## Обработка HTTP-методов

API Nuxt по умолчанию принимает все методы — GET, POST, PUT, DELETE и др. Определять, какой именно метод пришел, нужно внутри обработчика.

Давайте посмотрим, как это реализовать:

```js
// server/api/echo.js

export default defineEventHandler(async (event) => {
  if (event.req.method === 'POST') {
    // Получаем тело запроса
    const body = await readBody(event)
    // Возвращаем его обратно
    return { youSent: body }
  } else {
    // Любой другой метод
    return { error: 'Метод не поддерживается' }
  }
})
```

- Стандартная функция `readBody` (импортируется из 'h3' или autoimport в Nuxt 3) получает body запроса.
- Здесь проверяется, что пришел POST, и обрабатывается только он.

## Получение параметров запроса и роут-параметры

Nuxt автоматически парсит query string и параметры в URL.

### Параметры строки запроса (query)

```js
// server/api/greet.js

export default defineEventHandler((event) => {
  const { name } = getQuery(event) // Автоматически получаем параметры
  return { message: `Привет, ${name || 'гость'}!` }
})
```

Запрос к `/api/greet?name=Alex` вернет:

```json
{ "message": "Привет, Alex!" }
```

### Динамические роут-параметры

Файлы внутри API могут быть динамическими — достаточно назвать файл с квадратными скобками.

Пример:

```
server/api/user/[id].js
```

Код будет выглядеть так:

```js
// server/api/user/[id].js

export default defineEventHandler((event) => {
  const { id } = event.context.params  // Получаем id из URL
  return { userId: id }
})
```

Запрос к `/api/user/123` вернет:

```json
{ "userId": "123" }
```

## Работа с POST, PATCH, PUT, DELETE

Обработка разных методов аналогична приведенному выше примеру с POST.

### Пример: обработка PUT и DELETE

```js
// server/api/items/[id].js

export default defineEventHandler(async (event) => {
  const { id } = event.context.params

  switch (event.req.method) {
    case 'GET':
      return { item: { id, name: "Sample" } }
    case 'PUT': {
      const body = await readBody(event)
      // Здесь можно обновить "item"
      return { updated: true, id, newData: body }
    }
    case 'DELETE':
      // Здесь типично идет удаление
      return { deleted: true, id }
    default:
      return { error: 'Метод не поддерживается' }
  }
})
```

Эта структура встречается во многих CRUD API.

## Как передавать данные из клиента

На фронте, внутри компонента Vue, вы можете обращаться к серверным маршрутам Nuxt так же, как к внешним REST API.

### Пример: fetch внутри компонента

```js
<script setup>
import { ref, onMounted } from 'vue'

const result = ref(null)

onMounted(async () => {
  // Запрос к API-маршруту (будет работать локально и после сборки)
  const res = await fetch('/api/hello')
  result.value = await res.json()
})
</script>
```

- Маршрут доступен сразу после запуска dev сервера, не требует изменения baseURL.
- Если вызываете с фронта/клиента, используйте относительный путь (`/api/...`).
- Если сервер делает вызов серверу — используйте абсолютный путь.

## Использование TypeScript

Nuxt 3 прекрасно поддерживает TypeScript и автотипизацию endpoints.

### Добавляем TS-обработчик

```ts
// server/api/status.ts

export default defineEventHandler((event) => {
  return { status: 'ok', timestamp: Date.now() }
})
```

Типизация будет автоматически подхвачена средой разработки.

Если вы хотите более явно описывать входящие или исходящие данные, просто опишите их через типы:

```ts
// server/api/task/[id].ts

type Task = {
  id: string
  title: string
  completed: boolean
}

export default defineEventHandler<Task>((event) => {
  const task: Task = {
    id: event.context.params.id,
    title: 'Задача',
    completed: false
  }
  return task
})
```

## Использование внешних библиотек, базы данных, cookies

В обработчике server/api доступны все возможности Node.js, то есть вы можете:

- Работать с файлами
- Подключать базы данных (например, Prisma, Mongoose)
- Использовать любые npm-модули

Пример с cookies, которые доступны из объекта event:

```js
// server/api/withcookies.js

export default defineEventHandler((event) => {
  // Получаем cookie из запроса
  const cookies = parseCookies(event)
  return { myCookie: cookies['my-cookie'] || 'куки не найден' }
})
```

Аналогично, можно отправить cookie обратно с помощью функции setCookie.

## Защищенные API, middleware и аутентификация

Часто требуется, чтобы некоторые маршруты были закрыты для неавторизованных пользователей.

### Использование middleware для проверки прав

Создайте middleware-файл в `server/middleware`:

```js
// server/middleware/auth.js

export default defineEventHandler((event) => {
  const cookies = parseCookies(event)
  if (!cookies.token) {
    // Бросаем ошибку, если нет токена
    throw createError({ statusCode: 401, statusMessage: 'Не авторизован' })
  }
  // Логика проверки токена/прав...
})
```

А потом добавьте его в нужный endpoint:

```js
// server/api/secret.js

import auth from '../middleware/auth.js'

export default defineEventHandler((event) => {
  auth(event) // вызов middleware
  return { message: 'Секретные данные' }
})
```

Важно! Для более продвинутых сценариев используйте server plugins или кастомные мидлвари, подключаемые глобально в проект.

## Особенности деплоя и различие локального и продакшн режима

### Ядро работы

- В режиме dev и prod сервер Nitro обрабатывает server/api единообразно.
- Для SSR и стастической сборки endpoint'ы будут работать как serverless-функции, вы можете деплоить их на Vercel, Netlify, Cloudflare без изменений.

### Ограничения

- Все handler-файлы должны быть самодостаточными — не используйте специфичные для браузера API.
- При деплое на stateless платформы нельзя держать глобальное состояние в памяти.

## Дополнительные возможности и best practices

### Общие принципы:

- Не храните чувствительные данные в коде; используйте переменные окружения.
- Валидируйте данные, приходящие от клиента.
- Структурируйте API в едином стиле (например, `/api/users`, `/api/orders`).
- Используйте динамические файлы `[id].js` для однотипных операций.
- Для крупных проектов удобно подключать отдельный data access слой (например, через service-файлы).

### Рекомендации по оптимизации

1. **Используйте кэширование** — для часто запрашиваемых данных.
2. **Error handling** — обрабатывайте и возвращайте прозрачные ошибки.
3. **Логирование** — выводите key-факты о запросах для отладки.
4. **Отдавайте минимальный набор данных** — никогда не возвращайте пароли, токены и служебную информацию.

## Интеграция с внешними сервисами

Вы можете выполнять запросы к внешним API прямо внутри server/api, используя fetch или любую другую http-библиотеку.

```js
// server/api/weather.js

export default defineEventHandler(async (event) => {
  const data = await $fetch('https://api.open-meteo.com/...') // Получить прогноз погоды
  return data
})
```

- `$fetch` — это функция Nitro, работает во всех handler'ах как fetch, но удобнее в Node.

## Заключение

API-маршруты в Nuxt открывают возможности создавать “бекенд” рядом с фронтендом без отдельного сервера. Это особенно удобно для создания прототипов, внутренних сервисов, а также для приложений, где бэкенд прост. Концепция файлового роутинга, универсальные методы и встроенные помощники делают процесс разработки быстрым и наглядным. Используйте API-маршруты Nuxt для реализации авторизации, интеграции внешних сервисов и динамической генерации данных прямо на сервере без лишних зависимостей и сложности.

Создание API-маршрутов — это важный шаг к созданию полноценных fullstack-приложений на Nuxt. Чтобы создавать гибкие и масштабируемые приложения, необходимо освоить все возможности фреймворка, включая работу с сервером, базами данных и API. На нашем курсе [Nuxt - fullstack Vue фреймворк](https://purpleschool.ru/course/nuxt?utm_source=knowledgebase&utm_medium=article&utm_campaign=kak-sozdavat-api-marshruty-v-nuxt) вы найдете все необходимые знания и навыки для достижения успеха. В первых 3 модулях уже доступно бесплатное содержание — начните погружаться в Nuxt прямо сегодня.

## Частозадаваемые технические вопросы по теме статьи и ответы на них

### Как можно использовать Environment Variables внутри API-маршрута?

Чтобы получить значения env переменных, воспользуйтесь методом useRuntimeConfig(). Пример:

```js
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  // Получаем, например, config.apiSecret
  return { secret: config.apiSecret }
})
```
Важно: значения, начинающиеся с "public", будут доступны и на клиенте, остальные — только на сервере.

### Могу ли я использовать middleware глобально для всех server/api endpoints?

Да, объявите middleware в `server/middleware` и используйте его с помощью опции router в nuxt.config. Однако чаще всего проще добавить вызов middleware в каждый нужный handler вручную.

### Как выполнять валидацию данных, приходящих в POST запросах?

Используйте любую npm-библиотеку для валидации (например, yup или zod). Пример c zod:

```js
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const schema = z.object({ name: z.string() })
  const body = await readBody(event)
  schema.parse(body) // выбросит ошибку, если невалидно
  return { ok: true }
})
```

### Как логировать запросы или ошибки внутри server/api?

Можно использовать console.log или любую библиотеку для логирования (например, pino или winston). Рекомендуется логировать как входящие запросы, так и ошибки для отладки.

### Как вернуть другой статус-код HTTP?

С помощью функции setResponseStatus из пакета h3:

```js
export default defineEventHandler((event) => {
  setResponseStatus(event, 404, 'Not Found')
  return { error: 'Страница не найдена' }
})
```
